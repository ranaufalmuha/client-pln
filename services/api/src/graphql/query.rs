use async_graphql::{Context, Object};
use sqlx::PgPool;

use crate::auth::AuthUser;
use crate::models::bay::Bay;
use crate::models::beban::Beban;
use crate::models::unit::Unit;
use crate::models::unit_category::UnitCategory;
use crate::models::user::User;
use crate::repositories::bay_repository::BayRepository;
use crate::repositories::beban_repository::BebanRepository;
use crate::repositories::unit_category_repository::UnitCategoryRepository;
use crate::repositories::unit_repository::UnitRepository;
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

    async fn units(&self, ctx: &Context<'_>) -> async_graphql::Result<Vec<Unit>> {
        let _ = require_auth(ctx)?;
        let pool = ctx.data::<PgPool>()?;
        Ok(UnitRepository::find_all(pool).await?)
    }

    async fn unit(&self, ctx: &Context<'_>, id: i32) -> async_graphql::Result<Unit> {
        let _ = require_auth(ctx)?;
        let pool = ctx.data::<PgPool>()?;
        Ok(UnitRepository::find_by_id(pool, id).await?)
    }

    async fn unit_categories(&self, ctx: &Context<'_>) -> async_graphql::Result<Vec<UnitCategory>> {
        let _ = require_auth(ctx)?;
        let pool = ctx.data::<PgPool>()?;
        Ok(UnitCategoryRepository::find_all(pool).await?)
    }

    async fn unit_category(
        &self,
        ctx: &Context<'_>,
        id: i32,
    ) -> async_graphql::Result<UnitCategory> {
        let _ = require_auth(ctx)?;
        let pool = ctx.data::<PgPool>()?;
        Ok(UnitCategoryRepository::find_by_id(pool, id).await?)
    }

    async fn bays(
        &self,
        ctx: &Context<'_>,
        unit_id: Option<i32>,
    ) -> async_graphql::Result<Vec<Bay>> {
        let _ = require_auth(ctx)?;
        let pool = ctx.data::<PgPool>()?;
        Ok(BayRepository::find_all(pool, unit_id).await?)
    }

    async fn bay(&self, ctx: &Context<'_>, id: i32) -> async_graphql::Result<Bay> {
        let _ = require_auth(ctx)?;
        let pool = ctx.data::<PgPool>()?;
        Ok(BayRepository::find_by_id(pool, id).await?)
    }

    async fn bebans(&self, ctx: &Context<'_>) -> async_graphql::Result<Vec<Beban>> {
        let _ = require_auth(ctx)?;
        let pool = ctx.data::<PgPool>()?;
        Ok(BebanRepository::find_all(pool).await?)
    }

    async fn beban(&self, ctx: &Context<'_>, id: i32) -> async_graphql::Result<Beban> {
        let _ = require_auth(ctx)?;
        let pool = ctx.data::<PgPool>()?;
        Ok(BebanRepository::find_by_id(pool, id).await?)
    }
}
