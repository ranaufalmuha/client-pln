use async_graphql::{Context, Object};
use sqlx::PgPool;

use crate::auth::AuthUser;
use crate::auth::jwt::generate_token;
use crate::auth::password::verify_password;
use crate::models::bay::{Bay, CreateBayInput, UpdateBayInput};
use crate::models::beban::{Beban, CreateBebanInput, UpdateBebanInput};
use crate::models::unit::{CreateUnitInput, Unit, UpdateUnitInput};
use crate::models::unit_category::{
    CreateUnitCategoryInput, UnitCategory, UpdateUnitCategoryInput,
};
use crate::models::user::{
    AdminCreateUserInput, AdminUpdateUserInput, AuthPayload, CreateUserInput, User,
};
use crate::repositories::bay_repository::BayRepository;
use crate::repositories::beban_repository::BebanRepository;
use crate::repositories::unit_category_repository::UnitCategoryRepository;
use crate::repositories::unit_repository::UnitRepository;
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

        if !verify_password(&user_row.password, &password) {
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

    async fn create_unit_category(
        &self,
        ctx: &Context<'_>,
        input: CreateUnitCategoryInput,
    ) -> async_graphql::Result<UnitCategory> {
        let _ = require_admin(ctx).await?;
        let pool = ctx.data::<PgPool>()?;
        Ok(UnitCategoryRepository::create(pool, input).await?)
    }

    async fn update_unit_category(
        &self,
        ctx: &Context<'_>,
        input: UpdateUnitCategoryInput,
    ) -> async_graphql::Result<UnitCategory> {
        let _ = require_admin(ctx).await?;
        let pool = ctx.data::<PgPool>()?;
        Ok(UnitCategoryRepository::update(pool, input).await?)
    }

    async fn delete_unit_category(
        &self,
        ctx: &Context<'_>,
        id: i32,
    ) -> async_graphql::Result<bool> {
        let _ = require_admin(ctx).await?;
        let pool = ctx.data::<PgPool>()?;
        Ok(UnitCategoryRepository::delete(pool, id).await?)
    }

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
        Ok(UnitRepository::delete(pool, id).await?)
    }

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
        Ok(BayRepository::delete(pool, id).await?)
    }

    async fn create_beban(
        &self,
        ctx: &Context<'_>,
        input: CreateBebanInput,
    ) -> async_graphql::Result<Beban> {
        let _ = require_auth(ctx)?;
        let pool = ctx.data::<PgPool>()?;
        Ok(BebanRepository::create(pool, input).await?)
    }

    async fn update_beban(
        &self,
        ctx: &Context<'_>,
        input: UpdateBebanInput,
    ) -> async_graphql::Result<Beban> {
        let _ = require_auth(ctx)?;
        let pool = ctx.data::<PgPool>()?;
        Ok(BebanRepository::update(pool, input).await?)
    }

    async fn delete_beban(&self, ctx: &Context<'_>, id: i32) -> async_graphql::Result<bool> {
        let _ = require_auth(ctx)?;
        let pool = ctx.data::<PgPool>()?;
        Ok(BebanRepository::delete(pool, id).await?)
    }
}
