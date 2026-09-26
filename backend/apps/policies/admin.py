from django.contrib import admin
from .models import PolicyDetailMaster


@admin.register(PolicyDetailMaster)
class PolicyDetailMasterAdmin(admin.ModelAdmin):
    list_display = ("plan_no", "policy_name", "category", "policy_premium", "policy_term", "is_active")
    list_filter = ("category", "is_active")
    search_fields = ("policy_name", "plan_no")
