import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.accounts.helpers import assign_user_role
from apps.accounts.models import UserProfile


class Command(BaseCommand):
    help = "Create or promote the initial Admin account using environment variables."

    def handle(self, *args, **options):
        username = os.getenv("PORTAL_ADMIN_USERNAME")
        email = os.getenv("PORTAL_ADMIN_EMAIL")
        password = os.getenv("PORTAL_ADMIN_PASSWORD")
        if not all((username, email, password)):
            raise CommandError("Set PORTAL_ADMIN_USERNAME, PORTAL_ADMIN_EMAIL, and PORTAL_ADMIN_PASSWORD first.")
        User = get_user_model()
        with transaction.atomic():
            user, created = User.objects.get_or_create(username=username, defaults={"email": email})
            if not created and user.email.lower() != email.lower():
                raise CommandError("Existing Admin username has a different email; update it explicitly first.")
            user.email = email
            user.is_active = True
            user.is_staff = True
            user.is_superuser = True
            user.set_password(password)
            user.save()
            UserProfile.objects.get_or_create(user=user, defaults={"created_by": user, "updated_by": user})
            assign_user_role(user, "ADMIN", assigned_by=user)
        self.stdout.write(self.style.SUCCESS(f"Admin account ready for user ID: {username}"))
