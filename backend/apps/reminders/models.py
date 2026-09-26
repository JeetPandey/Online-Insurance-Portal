from django.db import models


class ReminderGeneratorDetail(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SENT = "SENT", "Sent"
        CLEARED = "CLEARED", "Cleared by payment"
        CANCELLED = "CANCELLED", "Cancelled"

    auto_id = models.AutoField(primary_key=True)
    policy_registration = models.ForeignKey("applications.PolicyRegistrationMaster", on_delete=models.CASCADE, related_name="reminders")
    renewal = models.ForeignKey("renewals.RenewalMasterDetail", null=True, blank=True, on_delete=models.SET_NULL, related_name="reminders")
    reminder_no = models.CharField(max_length=32, unique=True)
    date_of_generate = models.DateField(auto_now_add=True)
    date_of_sending = models.DateField(null=True, blank=True)
    due_date = models.DateField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)

    class Meta:
        db_table = "reminder_generator_detail"
        constraints = [models.UniqueConstraint(fields=("policy_registration", "due_date"), name="unique_policy_due_reminder")]
        ordering = ("due_date",)
