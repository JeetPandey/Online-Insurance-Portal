from django.core.management.base import BaseCommand

from apps.reminders.views import generate_due_reminders


class Command(BaseCommand):
    help = "Generate and send reminders for policies due within 30 days. Schedule daily with Windows Task Scheduler/cron."

    def handle(self, *args, **options):
        reminders = generate_due_reminders()
        self.stdout.write(self.style.SUCCESS(f"Processed {len(reminders)} reminder(s)."))
