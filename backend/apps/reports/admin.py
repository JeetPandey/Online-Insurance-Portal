from django.contrib import admin
from .models import ReportMaster


@admin.register(ReportMaster)
class ReportMasterAdmin(admin.ModelAdmin):
    list_display = ("report_id", "report_month", "generated_by", "generated_at", "payment_received")
    list_filter = ("report_month",)
