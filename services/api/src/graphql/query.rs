use async_graphql::{Context, Object};
use sqlx::PgPool;

use crate::auth::AuthUser;
use crate::models::classification::{Classification, ClassificationWithTypeCount};
use crate::models::unit_type::{UnitType, UnitTypeWithRelations};
use crate::models::unit::{Unit, UnitWithRelations};
use crate::models::bay::{Bay, BayWithRelations};
use crate::models::beban_record::{BebanRecordWithRelations, BebanRecordFilter};
use crate::models::user::User;
use crate::repositories::classification_repository::ClassificationRepository;
use crate::repositories::unit_type_repository::UnitTypeRepository;
use crate::repositories::unit_repository::UnitRepository;
use crate::repositories::bay_repository::BayRepository;
use crate::repositories::beban_record_repository::BebanRecordRepository;
use crate::repositories::user_repository::UserRepository;

pub struct QueryRoot;

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
impl QueryRoot {
    // User queries
    async fn me(&self, ctx: &Context<'_>) -> async_graphql::Result<User> {
        let auth_user = require_auth(ctx)?;
        let pool = ctx.data::<PgPool>()?;
        Ok(UserRepository::find_by_id(pool, auth_user.user_id).await?)
    }

    async fn users(&self, ctx: &Context<'_>) -> async_graphql::Result<Vec<User>> {
        let _ = require_admin(ctx).await?;
        let pool = ctx.data::<PgPool>()?;
        Ok(UserRepository::find_all(pool).await?)
    }

    async fn user(&self, ctx: &Context<'_>, id: i32) -> async_graphql::Result<User> {
        let _ = require_admin(ctx).await?;
        let pool = ctx.data::<PgPool>()?;
        Ok(UserRepository::find_by_id(pool, id).await?)
    }

    // Classification queries
    async fn classifications(&self, ctx: &Context<'_>) -> async_graphql::Result<Vec<Classification>> {
        let _ = require_auth(ctx)?;
        let pool = ctx.data::<PgPool>()?;
        Ok(ClassificationRepository::find_all(pool).await?)
    }

    async fn classifications_with_counts(&self, ctx: &Context<'_>) -> async_graphql::Result<Vec<ClassificationWithTypeCount>> {
        let _ = require_admin(ctx).await?;
        let pool = ctx.data::<PgPool>()?;
        Ok(ClassificationRepository::find_all_with_counts(pool).await?)
    }

    async fn classification(&self, ctx: &Context<'_>, id: i32) -> async_graphql::Result<Classification> {
        let _ = require_auth(ctx)?;
        let pool = ctx.data::<PgPool>()?;
        Ok(ClassificationRepository::find_by_id(pool, id).await?)
    }

    // Unit Type queries
    async fn unit_types(&self, ctx: &Context<'_>) -> async_graphql::Result<Vec<UnitTypeWithRelations>> {
        let _ = require_auth(ctx)?;
        let pool = ctx.data::<PgPool>()?;
        Ok(UnitTypeRepository::find_all(pool).await?)
    }

    async fn unit_types_by_classification(&self, ctx: &Context<'_>, classification_id: i32) -> async_graphql::Result<Vec<UnitType>> {
        let _ = require_auth(ctx)?;
        let pool = ctx.data::<PgPool>()?;
        Ok(UnitTypeRepository::find_by_classification(pool, classification_id).await?)
    }

    async fn unit_type(&self, ctx: &Context<'_>, id: i32) -> async_graphql::Result<UnitTypeWithRelations> {
        let _ = require_auth(ctx)?;
        let pool = ctx.data::<PgPool>()?;
        Ok(UnitTypeRepository::find_by_id(pool, id).await?)
    }

    // Unit queries
    async fn units(&self, ctx: &Context<'_>) -> async_graphql::Result<Vec<UnitWithRelations>> {
        let _ = require_auth(ctx)?;
        let pool = ctx.data::<PgPool>()?;
        Ok(UnitRepository::find_all(pool).await?)
    }

    async fn units_by_unit_type(&self, ctx: &Context<'_>, unit_type_id: i32) -> async_graphql::Result<Vec<Unit>> {
        let _ = require_auth(ctx)?;
        let pool = ctx.data::<PgPool>()?;
        Ok(UnitRepository::find_by_unit_type(pool, unit_type_id).await?)
    }

    async fn unit(&self, ctx: &Context<'_>, id: i32) -> async_graphql::Result<UnitWithRelations> {
        let _ = require_auth(ctx)?;
        let pool = ctx.data::<PgPool>()?;
        Ok(UnitRepository::find_by_id(pool, id).await?)
    }

    // Bay queries
    async fn bays(&self, ctx: &Context<'_>) -> async_graphql::Result<Vec<BayWithRelations>> {
        let _ = require_auth(ctx)?;
        let pool = ctx.data::<PgPool>()?;
        Ok(BayRepository::find_all(pool).await?)
    }

    async fn bays_by_unit(&self, ctx: &Context<'_>, unit_id: i32) -> async_graphql::Result<Vec<Bay>> {
        let _ = require_auth(ctx)?;
        let pool = ctx.data::<PgPool>()?;
        Ok(BayRepository::find_by_unit(pool, unit_id).await?)
    }

    async fn bay(&self, ctx: &Context<'_>, id: i32) -> async_graphql::Result<BayWithRelations> {
        let _ = require_auth(ctx)?;
        let pool = ctx.data::<PgPool>()?;
        Ok(BayRepository::find_by_id(pool, id).await?)
    }

    // Beban Record queries
    async fn beban_records(
        &self, 
        ctx: &Context<'_>,
        classification_id: Option<i32>,
        unit_type_id: Option<i32>,
        unit_id: Option<i32>,
        bay_id: Option<i32>,
        recorded_at_from: Option<chrono::DateTime<chrono::Utc>>,
        recorded_at_to: Option<chrono::DateTime<chrono::Utc>>,
    ) -> async_graphql::Result<Vec<BebanRecordWithRelations>> {
        let _ = require_auth(ctx)?;
        let pool = ctx.data::<PgPool>()?;
        
        let filter = if classification_id.is_some() || unit_type_id.is_some() || unit_id.is_some() || 
                       bay_id.is_some() || recorded_at_from.is_some() || recorded_at_to.is_some() {
            Some(BebanRecordFilter {
                classification_id,
                unit_type_id,
                unit_id,
                bay_id,
                recorded_at_from,
                recorded_at_to,
            })
        } else {
            None
        };
        
        Ok(BebanRecordRepository::find_all(pool, filter).await?)
    }

    async fn beban_record(&self, ctx: &Context<'_>, id: i32) -> async_graphql::Result<BebanRecordWithRelations> {
        let _ = require_auth(ctx)?;
        let pool = ctx.data::<PgPool>()?;
        Ok(BebanRecordRepository::find_by_id(pool, id).await?)
    }

}
