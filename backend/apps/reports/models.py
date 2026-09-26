from django.conf import settings
from django.db import models


class ReportMaster(models.Model):
    auto_id = models.AutoField(primary_key=True)
    generated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="insurance_reports")
    report_id = models.CharField(max_length=32, unique=True)
    report_month = models.CharField(max_length=7)
    generated_at = models.DateTimeField(auto_now_add=True)
    payment_received = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    policies_total = models.PositiveIntegerField(default=0)
    renewals_total = models.PositiveIntegerField(default=0)
    next_month_renewals = models.PositiveIntegerField(default=0)
    total_reminders = models.PositiveIntegerField(default=0)
    report_data = models.JSONField(default=dict)

    class Meta:
        db_table = "report_master"
        ordering = ("-generated_at",)
