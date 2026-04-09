use async_graphql::{Context, Object};
use sqlx::PgPool;

use crate::auth::AuthUser;
use crate::auth::jwt::generate_token;
use crate::auth::password::verify_password;

// New models
use crate::models::classification::{Classification, CreateClassificationInput, UpdateClassificationInput};
use crate::models::unit_type::{UnitType, CreateUnitTypeInput, UpdateUnitTypeInput};
use crate::models::unit::{Unit, UnitWithRelations, CreateUnitInput, UpdateUnitInput};
use crate::models::bay::{Bay, BayWithRelations, CreateBayInput, UpdateBayInput};
use crate::models::beban_record::{BebanRecord, CreateBebanRecordInput, UpdateBebanRecordInput};
use crate::models::user::{AdminCreateUserInput, AdminUpdateUserInput, AuthPayload, CreateUserInput, User};

// New repositories
use crate::repositories::classification_repository::ClassificationRepository;
use crate::repositories::unit_type_repository::UnitTypeRepository;
use crate::repositories::unit_repository::UnitRepository;
use crate::repositories::bay_repository::BayRepository;
use crate::repositories::beban_record_repository::BebanRecordRepository;

use crate::repositories::user_repository::UserRepository;

pub struct MutationRoot;

fn require_auth(ctx: &Context<'_>) -> async_graphql::Result<AuthUser> {
    ctx.data_opt::<AuthUser>()
        .copied()
        .ok_or_else(|| "Unauthorized".into())
}

async fn require_admin(ctx: &Context<'_>) -> async_graphql::Result<AuthUser> {
    let auth_user = require_auth(ctx)?;
    let pool = ctx.data::<PgPool>()?;
    let user = UserRepository::find_by_id(pool, auth_user.user_id).await?;
    if !user.is_admin {
        return Err("Forbidden".into());
    }

    Ok(auth_user)
}

#[Object]
impl MutationRoot {
    // Auth mutations
    async fn signup(
        &self,
        ctx: &Context<'_>,
        input: CreateUserInput,
    ) -> async_graphql::Result<AuthPayload> {
        let pool = ctx.data::<PgPool>()?;
        let secret = std::env::var("JWT_SECRET").map_err(|_| "JWT_SECRET is missing")?;
        let is_first_user = UserRepository::count_all(pool).await? == 0;
        let user = UserRepository::create_with_role(
            pool,
            AdminCreateUserInput {
                email: input.email,
                password: input.password,
                is_admin: is_first_user,
            },
        )
        .await?;
        let token = generate_token(user.id, user.is_admin, &secret)?;

        Ok(AuthPayload { token, user })
    }

    async fn login(
        &self,
        ctx: &Context<'_>,
        email: String,
        password: String,
    ) -> async_graphql::Result<AuthPayload> {
        let pool = ctx.data::<PgPool>()?;
        let secret = std::env::var("JWT_SECRET").map_err(|_| "JWT_SECRET is missing")?;

        let user_row = UserRepository::login(pool, &email).await?;
        let password_hash = user_row.password.clone();

        let is_valid = tokio::task::spawn_blocking(move || {
            verify_password(&password_hash, &password)
        })
        .await
        .map_err(|_| "Password verification failed")?;

        if !is_valid {
            return Err("Invalid email or password".into());
        }

        let user = User::from(user_row);
        let token = generate_token(user.id, user.is_admin, &secret)?;

        Ok(AuthPayload { token, user })
    }

    async fn create_user(
        &self,
        ctx: &Context<'_>,
        input: AdminCreateUserInput,
    ) -> async_graphql::Result<User> {
        let _ = require_admin(ctx).await?;
        let pool = ctx.data::<PgPool>()?;
        Ok(UserRepository::create_with_role(pool, input).await?)
    }

    async fn update_user(
        &self,
        ctx: &Context<'_>,
        input: AdminUpdateUserInput,
    ) -> async_graphql::Result<User> {
        let auth_user = require_admin(ctx).await?;

        if auth_user.user_id == input.id && matches!(input.is_admin, Some(false)) {
            return Err("Admin cannot remove own admin role".into());
        }

        let pool = ctx.data::<PgPool>()?;
        Ok(UserRepository::update_with_role(pool, input).await?)
    }

    async fn delete_user(&self, ctx: &Context<'_>, id: i32) -> async_graphql::Result<bool> {
        let auth_user = require_admin(ctx).await?;
        if auth_user.user_id == id {
            return Err("Admin cannot delete own account".into());
        }

        let pool = ctx.data::<PgPool>()?;
        Ok(UserRepository::delete(pool, id).await?)
    }

    // Classification mutations
    async fn create_classification(
        &self,
        ctx: &Context<'_>,
        input: CreateClassificationInput,
    ) -> async_graphql::Result<Classification> {
        let _ = require_admin(ctx).await?;
        let pool = ctx.data::<PgPool>()?;
        Ok(ClassificationRepository::create(pool, input).await?)
    }

    async fn update_classification(
        &self,
        ctx: &Context<'_>,
        input: UpdateClassificationInput,
    ) -> async_graphql::Result<Classification> {
        let _ = require_admin(ctx).await?;
        let pool = ctx.data::<PgPool>()?;
        Ok(ClassificationRepository::update(pool, input).await?)
    }

    async fn delete_classification(&self, ctx: &Context<'_>, id: i32) -> async_graphql::Result<bool> {
        let _ = require_admin(ctx).await?;
        let pool = ctx.data::<PgPool>()?;
        
        // Check if classification has unit_types
        if ClassificationRepository::has_unit_types(pool, id).await? {
            return Err("Cannot delete classification with existing unit types".into());
        }
        
        Ok(ClassificationRepository::delete(pool, id).await?)
    }

    // Unit Type mutations
    async fn create_unit_type(
        &self,
        ctx: &Context<'_>,
        input: CreateUnitTypeInput,
    ) -> async_graphql::Result<UnitType> {
        let _ = require_admin(ctx).await?;
        let pool = ctx.data::<PgPool>()?;
        Ok(UnitTypeRepository::create(pool, input).await?)
    }

    async fn update_unit_type(
        &self,
        ctx: &Context<'_>,
        input: UpdateUnitTypeInput,
    ) -> async_graphql::Result<UnitType> {
        let _ = require_admin(ctx).await?;
        let pool = ctx.data::<PgPool>()?;
        Ok(UnitTypeRepository::update(pool, input).await?)
    }

    async fn delete_unit_type(&self, ctx: &Context<'_>, id: i32) -> async_graphql::Result<bool> {
        let _ = require_admin(ctx).await?;
        let pool = ctx.data::<PgPool>()?;
        
        // Check if unit_type has units
        if UnitTypeRepository::has_units(pool, id).await? {
            return Err("Cannot delete unit type with existing units".into());
        }
        
        Ok(UnitTypeRepository::delete(pool, id).await?)
    }

    // Unit mutations
    async fn create_unit(
        &self,
        ctx: &Context<'_>,
        input: CreateUnitInput,
    ) -> async_graphql::Result<Unit> {
        let _ = require_admin(ctx).await?;
        let pool = ctx.data::<PgPool>()?;
        Ok(UnitRepository::create(pool, input).await?)
    }

    async fn update_unit(
        &self,
        ctx: &Context<'_>,
        input: UpdateUnitInput,
    ) -> async_graphql::Result<Unit> {
        let _ = require_admin(ctx).await?;
        let pool = ctx.data::<PgPool>()?;
        Ok(UnitRepository::update(pool, input).await?)
    }

    async fn delete_unit(&self, ctx: &Context<'_>, id: i32) -> async_graphql::Result<bool> {
        let _ = require_admin(ctx).await?;
        let pool = ctx.data::<PgPool>()?;
        
        // Check if unit has bays
        if UnitRepository::has_bays(pool, id).await? {
            return Err("Cannot delete unit with existing bays".into());
        }
        
        Ok(UnitRepository::delete(pool, id).await?)
    }

    // Bay mutations
    async fn create_bay(
        &self,
        ctx: &Context<'_>,
        input: CreateBayInput,
    ) -> async_graphql::Result<Bay> {
        let _ = require_admin(ctx).await?;
        let pool = ctx.data::<PgPool>()?;
        Ok(BayRepository::create(pool, input).await?)
    }

    async fn update_bay(
        &self,
        ctx: &Context<'_>,
        input: UpdateBayInput,
    ) -> async_graphql::Result<Bay> {
        let _ = require_admin(ctx).await?;
        let pool = ctx.data::<PgPool>()?;
        Ok(BayRepository::update(pool, input).await?)
    }

    async fn delete_bay(&self, ctx: &Context<'_>, id: i32) -> async_graphql::Result<bool> {
        let _ = require_admin(ctx).await?;
        let pool = ctx.data::<PgPool>()?;
        
        // Check if bay has beban_records
        if BayRepository::has_beban_records(pool, id).await? {
            return Err("Cannot delete bay with existing beban records".into());
        }
        
        Ok(BayRepository::delete(pool, id).await?)
    }

    // Beban Record mutations
    async fn create_beban_record(
        &self,
        ctx: &Context<'_>,
        input: CreateBebanRecordInput,
    ) -> async_graphql::Result<BebanRecord> {
        let auth_user = require_auth(ctx)?;
        let pool = ctx.data::<PgPool>()?;
        Ok(BebanRecordRepository::create(pool, auth_user.user_id, input).await?)
    }

    async fn update_beban_record(
        &self,
        ctx: &Context<'_>,
        input: UpdateBebanRecordInput,
    ) -> async_graphql::Result<BebanRecord> {
        let _ = require_auth(ctx)?;
        let pool = ctx.data::<PgPool>()?;
        Ok(BebanRecordRepository::update(pool, input).await?)
    }

    async fn delete_beban_record(&self, ctx: &Context<'_>, id: i32) -> async_graphql::Result<bool> {
        let _ = require_auth(ctx)?;
        let pool = ctx.data::<PgPool>()?;
        Ok(BebanRecordRepository::delete(pool, id).await?)
    }

}
