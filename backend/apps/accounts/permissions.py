from rest_framework.permissions import BasePermission


def require_role(*roles):
    """Return a DRF permission class that enforces one of the supplied account roles."""
    allowed_roles = frozenset(roles)

    class RolePermission(BasePermission):
        message = "You do not have permission to perform this action."

        def has_permission(self, request, view):
            user = request.user
            if not user or not user.is_authenticated:
                return False
            if user.is_superuser and "ADMIN" in allowed_roles:
                return True
            return user.user_roles.filter(
                is_active=True,
                is_delete=False,
                role__role_name__in=allowed_roles,
                role__is_active=True,
                role__is_delete=False,
            ).exists()

    return RolePermission
