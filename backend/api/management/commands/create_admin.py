from django.core.management.base import BaseCommand
from api.models import User
from api.serializers import _hash_password
import uuid

class Command(BaseCommand):
    help = 'Create an admin user'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, help='Admin email', required=True)
        parser.add_argument('--password', type=str, help='Admin password', required=True)
        parser.add_argument('--name', type=str, help='Admin full name', default='Admin')

    def handle(self, *args, **options):
        email = options['email'].lower()
        password = options['password']
        name = options['name']

        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.ERROR(f'User with email {email} already exists'))
            return

        password_hash = _hash_password(password)
        
        user = User.objects.create(
            email=email,
            full_name=name,
            password_hash=password_hash,
            is_active=True,
            is_admin=True,
            email_verified=True
        )

        self.stdout.write(self.style.SUCCESS(f'Successfully created admin user: {user.email}'))
