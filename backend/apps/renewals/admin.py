from django.contrib import admin
from .models import RenewalMasterDetail


@admin.register(RenewalMasterDetail)
class RenewalMasterDetailAdmin(admin.ModelAdmin):
    list_display = ("renewal_no", "policy_registration", "renewal_amount", "due_date", "status")
    list_filter = ("status",)
