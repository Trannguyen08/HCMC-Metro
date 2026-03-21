from apps.users.repositories.user_repository import UserRepository

class UserService:
    def __init__(self):
        self.user_repo = UserRepository()

    def get_users_for_admin(self, limit=100):
        # We can optimize this later
        users = self.user_repo.get_all(skip=0, limit=limit)
        return [{
            "id": str(user.id),
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone or "",
            "avatar_url": user.avatar_url or "",
            "email_verified": user.email_verified,
            "is_admin": user.is_admin,
        } for user in users]
