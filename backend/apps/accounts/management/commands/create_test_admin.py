import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Create or update a test admin account from env vars or command options"

    def add_arguments(self, parser):
        parser.add_argument(
            "--email",
            default=os.getenv("TEST_ADMIN_EMAIL", "admin@test.local"),
            help="Admin email (default: TEST_ADMIN_EMAIL or admin@test.local)",
        )
        parser.add_argument(
            "--password",
            default=os.getenv("TEST_ADMIN_PASSWORD", "TestAdmin123!"),
            help="Admin password (default: TEST_ADMIN_PASSWORD or TestAdmin123!)",
        )
        parser.add_argument(
            "--first-name",
            default=os.getenv("TEST_ADMIN_FIRST_NAME", "Test"),
            help="Admin first name (default: TEST_ADMIN_FIRST_NAME or Test)",
        )
        parser.add_argument(
            "--last-name",
            default=os.getenv("TEST_ADMIN_LAST_NAME", "Admin"),
            help="Admin last name (default: TEST_ADMIN_LAST_NAME or Admin)",
        )
        parser.add_argument(
            "--update-password",
            action="store_true",
            help="Update password if the user already exists",
        )

    def handle(self, *args, **options):
        User = get_user_model()

        email = (options["email"] or "").strip().lower()
        password = options["password"] or ""
        first_name = (options["first_name"] or "").strip()
        last_name = (options["last_name"] or "").strip()
        update_password = options["update_password"]

        if not email:
            raise CommandError("Email is required")
        if not password:
            raise CommandError("Password is required")

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
                "first_name": first_name,
                "last_name": last_name,
            },
        )

        if created:
            user.set_password(password)
            user.save(update_fields=["password"])
            self.stdout.write(self.style.SUCCESS(f"Created test admin: {email}"))
            return

        changed = False
        if not user.is_staff:
            user.is_staff = True
            changed = True
        if not user.is_superuser:
            user.is_superuser = True
            changed = True
        if not user.is_active:
            user.is_active = True
            changed = True

        if first_name and user.first_name != first_name:
            user.first_name = first_name
            changed = True
        if last_name and user.last_name != last_name:
            user.last_name = last_name
            changed = True

        if update_password:
            user.set_password(password)
            changed = True

        if changed:
            user.save()

        if update_password:
            self.stdout.write(self.style.SUCCESS(f"Updated test admin: {email} (password updated)"))
        else:
            self.stdout.write(
                self.style.WARNING(
                    f"Test admin already exists: {email}. Use --update-password to rotate password."
                )
            )
