from django.http import JsonResponse
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication

from apps.accounts.helpers import user_has_role

jwt_authentication = JWTAuthentication()


def authenticate_request(request):
    result = jwt_authentication.authenticate(request)
    if result is None:
        raise AuthenticationFailed("Authentication credentials were not provided.")
    user, _validated_token = result
    if not user.is_active:
        raise AuthenticationFailed("User account is inactive.")
    return user


def get_authenticated_user(request):
    try:
        user = authenticate_request(request)
        request.user = user
        return user, None
    except AuthenticationFailed as error:
        return None, JsonResponse(
            {"status": False, "message": str(error.detail), "data": None}, status=401
        )


def check_role(user, required_role):
    return user_has_role(user, required_role)


def require_role(request, required_role):
    user, error = get_authenticated_user(request)
    if error:
        return None, error
    if not check_role(user, required_role):
        return None, JsonResponse(
            {"status": False, "message": "You are not authorized to perform this action.", "data": None},
            status=403,
        )
    return user, None
