from apps.users.models import User

class UserRepository:
    def get_by_id(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None

    def get_by_email(self, email):
        try:
            return User.objects.get(email=email)
        except User.DoesNotExist:
            return None

    def create(self, **kwargs):
        return User.objects.create(**kwargs)

    def get_all(self, skip=0, limit=20):
        return User.objects.all()[skip:skip+limit]

    def count(self):
        return User.objects.count()
