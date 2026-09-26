from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomerProfile, Role, User, UserProfile, UserRole


@admin.register(User)
class PortalUserAdmin(UserAdmin):
    add_fieldsets = UserAdmin.add_fieldsets + (("Contact", {"fields": ("email", "first_name", "last_name")}),)
    list_display = ("username", "email", "is_active", "is_staff")


@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ("customer", "first_name", "last_name", "city", "mobile_number")
    search_fields = ("customer__username", "first_name", "last_name", "city", "mobile_number")


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("role_id", "role_name", "is_active", "is_delete", "created_at")
    search_fields = ("role_name",)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("profile_id", "user", "mobile_no", "is_active", "is_delete")
    search_fields = ("user__username", "mobile_no")


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ("user_role_id", "user", "role", "is_active", "is_delete")
    list_filter = ("role", "is_active", "is_delete")
