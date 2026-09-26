from django.contrib import admin
from .models import ReminderGeneratorDetail


@admin.register(ReminderGeneratorDetail)
class ReminderGeneratorDetailAdmin(admin.ModelAdmin):
    list_display = ("reminder_no", "policy_registration", "due_date", "status", "date_of_sending")
    list_filter = ("status",)
