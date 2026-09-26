from django.contrib import admin
from .models import StaffMasterDetail


@admin.register(StaffMasterDetail)
class StaffMasterDetailAdmin(admin.ModelAdmin):
    list_display = ("staff_name", "user", "designation", "date_of_joining", "is_active")
    list_filter = ("designation", "is_active")
    search_fields = ("staff_name", "user__username")
