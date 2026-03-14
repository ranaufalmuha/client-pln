pub mod jwt;
pub mod password;

#[derive(Debug, Clone, Copy)]
pub struct AuthUser {
    pub user_id: i32,
}
