from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Role, UserProfile, UserRole

User = get_user_model()


def get_user_roles(user):
    if user.is_superuser:
        roles = list(
            UserRole.objects.filter(
                user=user,
                is_active=True,
                is_delete=False,
                role__is_active=True,
                role__is_delete=False,
            ).values_list("role__role_name", flat=True)
        )
        return roles if "ADMIN" in roles else ["ADMIN", *roles]
    return list(
        UserRole.objects.filter(
            user=user,
            is_active=True,
            is_delete=False,
            role__is_active=True,
            role__is_delete=False,
        ).values_list("role__role_name", flat=True)
    )


def user_has_role(user, role_name):
    if user.is_superuser and role_name == "ADMIN":
        return True
    return UserRole.objects.filter(
        user=user,
        role__role_name=role_name,
        is_active=True,
        is_delete=False,
        role__is_active=True,
        role__is_delete=False,
    ).exists()


def get_user_profile(user):
    try:
        return UserProfile.objects.get(user=user, is_active=True, is_delete=False)
    except UserProfile.DoesNotExist:
        return None


def generate_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


def assign_user_role(user, role_name, assigned_by=None):
    role, _ = Role.objects.get_or_create(role_name=role_name)
    if not role.is_active or role.is_delete:
        return None
    user_role, _ = UserRole.objects.get_or_create(
        user=user,
        role=role,
        defaults={"created_by": assigned_by, "updated_by": assigned_by},
    )
    if not user_role.is_active or user_role.is_delete:
        user_role.is_active = True
        user_role.is_delete = False
        user_role.updated_by = assigned_by
        user_role.save(update_fields=("is_active", "is_delete", "updated_by", "updated_at"))
    return user_role


def ensure_user_profile(user, mobile_no=None):
    profile = UserProfile.objects.filter(user=user).first()
    if profile is None:
        return UserProfile.objects.create(user=user, mobile_no=mobile_no, created_by=user, updated_by=user)
    if not profile.is_active or profile.is_delete:
        return None
    if mobile_no is not None and profile.mobile_no != mobile_no:
        profile.mobile_no = mobile_no
        profile.updated_by = user
        profile.save(update_fields=("mobile_no", "updated_by", "updated_at"))
    return profile
