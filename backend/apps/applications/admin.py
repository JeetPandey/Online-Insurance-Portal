from django.contrib import admin
from .models import PolicyRegistrationMaster


@admin.register(PolicyRegistrationMaster)
class PolicyRegistrationMasterAdmin(admin.ModelAdmin):
    list_display = ("application_no", "customer", "policy", "status", "proposal_no", "submitted_at")
    list_filter = ("status",)
    search_fields = ("application_no", "proposal_no", "customer__username")
