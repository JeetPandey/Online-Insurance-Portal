import json

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.forms import PasswordResetForm
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import IntegrityError, transaction
from django.http import JsonResponse
from django.utils import timezone
from django.utils.dateparse import parse_date
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.helpers import (
    assign_user_role,
    ensure_user_profile,
    generate_tokens,
    get_user_profile,
    get_user_roles,
)
from apps.accounts.models import CustomerProfile, Role, UserProfile, UserRole
from apps.common.helpers.auth_helper import get_authenticated_user, require_role
from apps.common.helpers.response_helper import error_response, success_response

User = get_user_model()


def read_json_body(request):
    try:
        payload = json.loads(request.body or b"{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None, error_response("Invalid JSON", status_code=400)
    if not isinstance(payload, dict):
        return None, error_response("JSON body must be an object", status_code=400)
    return payload, None


def get_customer_details(user):
    try:
        profile = user.customer_profile
    except CustomerProfile.DoesNotExist:
        return None
    return {
        "first_name": profile.first_name,
        "middle_name": profile.middle_name,
        "last_name": profile.last_name,
        "date_of_birth": profile.date_of_birth.isoformat(),
        "gender": profile.gender,
        "address": profile.address,
        "city": profile.city,
        "email_id": profile.email_id,
        "phone_number": profile.phone_number,
        "mobile_number": profile.mobile_number,
    }


def get_user_data(user, profile=None):
    profile = profile or get_user_profile(user)
    roles = get_user_roles(user)
    customer = get_customer_details(user)
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": customer["first_name"] if customer else user.first_name,
        "last_name": customer["last_name"] if customer else user.last_name,
        "mobile_no": profile.mobile_no if profile else None,
        "roles": roles,
        "role": roles[0] if roles else None,
        "customer_profile": customer,
    }


def validate_registration(payload):
    required = (
        "username", "email", "password", "password_confirm", "first_name", "last_name",
        "date_of_birth", "gender", "address", "city", "phone_number", "mobile_number",
    )
    missing = [field for field in required if not str(payload.get(field, "")).strip()]
    if missing:
        return None, error_response(
            "Complete all required fields.",
            data={field: ["This field is required."] for field in missing},
            status_code=400,
        )

    values = {key: str(payload.get(key, "")).strip() for key in required}
    values["middle_name"] = str(payload.get("middle_name", "")).strip()
    username = values["username"]
    email = values["email"].lower()
    if len(username) > 150:
        return None, error_response("User ID must be 150 characters or fewer.", status_code=400)
    if any(len(values[name]) > 50 for name in ("first_name", "middle_name", "last_name")):
        return None, error_response("Each name field must be 50 characters or fewer.", status_code=400)
    if len(values["address"]) > 250 or len(values["city"]) > 50:
        return None, error_response("Address or city is longer than the allowed length.", status_code=400)
    if len(email) > 254:
        return None, error_response("Email ID must be 254 characters or fewer.", status_code=400)
    try:
        validate_email(email)
        User._meta.get_field("username").run_validators(username)
    except ValidationError as error:
        return None, error_response("Check your user ID and email address.", data=error.messages, status_code=400)
    if User.objects.filter(username__iexact=username).exists():
        return None, error_response("This user ID is already taken.", data={"username": ["Choose another user ID."]}, status_code=409)
    if User.objects.filter(email__iexact=email).exists():
        return None, error_response("An account with this email already exists.", data={"email": ["Use another email address."]}, status_code=409)
    if values["password"] != values["password_confirm"]:
        return None, error_response("Passwords do not match.", data={"password_confirm": ["Passwords do not match."]}, status_code=400)
    try:
        validate_password(values["password"], User(username=username, email=email))
    except ValidationError as error:
        details = error.messages
        if any("too similar" in message.lower() for message in details):
            message = "Choose a password that does not contain or closely resemble your user ID."
        elif any("common password" in message.lower() for message in details):
            message = "Choose a less common password."
        elif any("too short" in message.lower() for message in details):
            message = "Choose a password with at least 8 characters."
        elif any("entirely numeric" in message.lower() for message in details):
            message = "Your password cannot contain only numbers."
        else:
            message = "Choose a stronger password."
        return None, error_response(message, data={"password": details}, status_code=400)

    date_of_birth = parse_date(values["date_of_birth"])
    if not date_of_birth or date_of_birth >= timezone.localdate():
        return None, error_response("Enter a valid date of birth in the past.", data={"date_of_birth": ["Enter a valid date of birth in the past."]}, status_code=400)
    if values["gender"] not in CustomerProfile.Gender.values:
        return None, error_response("Select a valid gender.", data={"gender": ["Select Female, Male, or Other."]}, status_code=400)
    for field_name, max_length in (("mobile_number", 15), ("phone_number", 20)):
        number = values[field_name]
        digit_count = len("".join(character for character in number if character.isdigit()))
        if not 7 <= digit_count <= 15 or len(number) > max_length:
            return None, error_response(
                f"Enter a valid {field_name.replace('_', ' ')}.",
                data={field_name: ["Use a phone number with 7 to 15 digits."]},
                status_code=400,
            )
    values["email"] = email
    values["date_of_birth"] = date_of_birth
    return values, None


@method_decorator(csrf_exempt, name="dispatch")
class AccountView(View):
    http_method_names = ["get", "post"]

    def dispatch(self, request, *args, **kwargs):
        if request.method not in ("GET", "POST"):
            return error_response("Only GET and POST methods are allowed.", status_code=405)
        return super().dispatch(request, *args, **kwargs)

    def get(self, request):
        fun_call = request.GET.get("fun_call")
        if fun_call == "current_user":
            return self.current_user(request)
        if fun_call == "admin_test":
            user, error = require_role(request, "ADMIN")
            if error:
                return error
            return success_response(
                "ADMIN access granted",
                {"username": user.username, "roles": get_user_roles(user)},
            )
        if fun_call == "customers_list":
            return self.customers_list(request)
        if fun_call == "customer_detail":
            return self.customer_detail(request)
        return error_response("Invalid fun_call", status_code=400)

    def post(self, request):
        fun_call = request.GET.get("fun_call")
        if fun_call == "register":
            return self.register(request)
        if fun_call == "login":
            return self.login(request)
        if fun_call == "refresh_token":
            return self.refresh_token(request)
        if fun_call == "logout":
            return self.logout(request)
        if fun_call == "password_reset":
            return self.password_reset(request)
        if fun_call == "password_reset_confirm":
            return self.password_reset_confirm(request)
        if fun_call == "customer_status":
            return self.customer_status(request)
        return error_response("Invalid fun_call", status_code=400)

    def customers_list(self, request):
        admin, error = require_role(request, "ADMIN")
        if error:
            return error
        customers = CustomerProfile.objects.select_related("customer").all()
        search = request.GET.get("search", "").strip()
        status = request.GET.get("status", "")
        if search:
            from django.db.models import Q
            customers = customers.filter(
                Q(first_name__icontains=search) | Q(middle_name__icontains=search)
                | Q(last_name__icontains=search) | Q(customer__username__icontains=search)
                | Q(email_id__icontains=search) | Q(mobile_number__icontains=search)
            )
        if status == "active":
            customers = customers.filter(customer__is_active=True)
        elif status == "inactive":
            customers = customers.filter(customer__is_active=False)
        data = []
        for item in customers:
            user = item.customer
            data.append({
                "id": item.pk, "customer_id": user.pk, "username": user.username,
                "first_name": item.first_name, "middle_name": item.middle_name,
                "last_name": item.last_name, "full_name": " ".join(x for x in (item.first_name, item.middle_name, item.last_name) if x),
                "date_of_birth": item.date_of_birth.isoformat(), "gender": item.gender,
                "address": item.address, "city": item.city, "email": item.email_id,
                "phone_number": item.phone_number, "mobile_number": item.mobile_number,
                "is_active": user.is_active,
            })
        return success_response("Customers fetched successfully.", data)

    def customer_detail(self, request):
        _, error = require_role(request, "ADMIN")
        if error:
            return error
        try:
            item = CustomerProfile.objects.select_related("customer").get(pk=request.GET.get("id"))
        except (CustomerProfile.DoesNotExist, ValueError, TypeError):
            return error_response("Customer not found.", status_code=404)
        user = item.customer
        return success_response("Customer fetched successfully.", {
            "id": item.pk, "customer_id": user.pk, "username": user.username,
            "first_name": item.first_name, "middle_name": item.middle_name,
            "last_name": item.last_name, "date_of_birth": item.date_of_birth.isoformat(),
            "gender": item.gender, "address": item.address, "city": item.city,
            "email": item.email_id, "phone_number": item.phone_number,
            "mobile_number": item.mobile_number, "is_active": user.is_active,
        })

    def customer_status(self, request):
        admin, error = require_role(request, "ADMIN")
        if error:
            return error
        payload, error = read_json_body(request)
        if error:
            return error
        try:
            customer = CustomerProfile.objects.select_related("customer").get(pk=payload.get("id"))
        except (CustomerProfile.DoesNotExist, ValueError, TypeError):
            return error_response("Customer not found.", status_code=404)
        active = payload.get("is_active")
        if not isinstance(active, bool):
            return error_response("is_active must be true or false.")
        customer.customer.is_active = active
        customer.customer.save(update_fields=("is_active",))
        return success_response("Customer status updated.", {"id": customer.pk, "is_active": active})

    def register(self, request):
        payload, error = read_json_body(request)
        if error:
            return error
        values, error = validate_registration(payload)
        if error:
            return error
        customer_role, _ = Role.objects.get_or_create(role_name="CUSTOMER")
        if not customer_role.is_active or customer_role.is_delete:
            return error_response("Customer registration is currently unavailable.", status_code=403)
        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    username=values["username"],
                    email=values["email"],
                    password=values["password"],
                    first_name=values["first_name"],
                    last_name=values["last_name"],
                )
                UserProfile.objects.create(
                    user=user,
                    mobile_no=values["mobile_number"],
                    created_by=user,
                    updated_by=user,
                )
                UserRole.objects.create(
                    user=user,
                    role=customer_role,
                    created_by=user,
                    updated_by=user,
                )
                CustomerProfile.objects.create(
                    customer=user,
                    first_name=values["first_name"],
                    middle_name=values["middle_name"],
                    last_name=values["last_name"],
                    date_of_birth=values["date_of_birth"],
                    gender=values["gender"],
                    address=values["address"],
                    city=values["city"],
                    email_id=values["email"],
                    phone_number=values["phone_number"],
                    mobile_number=values["mobile_number"],
                )
                tokens = generate_tokens(user)
                user_data = get_user_data(user, get_user_profile(user))
        except IntegrityError:
            return error_response("An account with that user ID or email already exists.", status_code=409)
        return success_response(
            "Your customer account is ready.",
            {**tokens, "user": user_data},
            status_code=201,
        )

    def login(self, request):
        payload, error = read_json_body(request)
        if error:
            return error
        username = str(payload.get("username", payload.get("user_id", ""))).strip()
        password = str(payload.get("password", ""))
        if not username or not password:
            return error_response("User ID and password are required.", status_code=400)
        user = authenticate(request=request, username=username, password=password)
        if user is None and "@" in username:
            account = User.objects.filter(email__iexact=username).first()
            if account:
                user = authenticate(request=request, username=account.username, password=password)
        if user is None:
            return error_response("Invalid user ID or password.", status_code=401)
        if not user.is_active:
            return error_response("User account is inactive.", status_code=403)
        if user.is_superuser:
            assign_user_role(user, "ADMIN", assigned_by=user)
        profile = ensure_user_profile(user)
        if profile is None:
            return error_response("User profile is inactive.", status_code=403)
        roles = get_user_roles(user)
        if not roles:
            return error_response("No active role is assigned to this user.", status_code=403)
        return success_response(
            "Login successful",
            {**generate_tokens(user), "user": get_user_data(user, profile)},
        )

    def current_user(self, request):
        user, error = get_authenticated_user(request)
        if error:
            return error
        profile = get_user_profile(user)
        if profile is None:
            return error_response("User profile not found.", status_code=404)
        return success_response("Current user fetched successfully", get_user_data(user, profile))

    def refresh_token(self, request):
        payload, error = read_json_body(request)
        if error:
            return error
        token_value = payload.get("refresh")
        if not token_value:
            return error_response("Refresh token is required.", status_code=400)
        try:
            old_refresh = RefreshToken(str(token_value))
            user = User.objects.get(id=old_refresh["user_id"])
            if not user.is_active:
                return error_response("User account is inactive.", status_code=403)
            old_refresh.blacklist()
            tokens = generate_tokens(user)
            return success_response("Token refreshed successfully", tokens)
        except (TokenError, User.DoesNotExist, KeyError, TypeError, ValueError):
            return error_response("Invalid or expired refresh token.", status_code=401)

    def logout(self, request):
        payload, error = read_json_body(request)
        if error:
            return error
        token_value = payload.get("refresh")
        if not token_value:
            return error_response("Refresh token is required.", status_code=400)
        try:
            RefreshToken(str(token_value)).blacklist()
        except TokenError:
            return error_response("Invalid or expired refresh token.", status_code=401)
        return success_response("Logout successful")

    def password_reset(self, request):
        payload, error = read_json_body(request)
        if error:
            return error
        form = PasswordResetForm(data={"email": payload.get("email", "")})
        if not form.is_valid():
            return error_response("Enter a valid email address.", status_code=400)
        form.save(
            request=request,
            use_https=request.is_secure(),
            from_email=settings.DEFAULT_FROM_EMAIL,
            email_template_name="registration/password_reset_email.html",
            subject_template_name="registration/password_reset_subject.txt",
            domain_override=settings.FRONTEND_URL.removeprefix("http://").removeprefix("https://"),
            extra_email_context={"frontend_url": settings.FRONTEND_URL},
        )
        return success_response("If an account exists for that email, a reset link is on its way.")

    def password_reset_confirm(self, request):
        payload, error = read_json_body(request)
        if error:
            return error
        uidb64, token = payload.get("uid"), payload.get("token")
        password = str(payload.get("password", ""))
        if password != str(payload.get("password_confirm", "")):
            return error_response("Passwords do not match.", status_code=400)
        try:
            if not uidb64 or not token:
                raise ValueError
            user_id = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=user_id, is_active=True)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return error_response("This password reset link is invalid or has expired.", status_code=400)
        if not default_token_generator.check_token(user, token):
            return error_response("This password reset link is invalid or has expired.", status_code=400)
        try:
            validate_password(password, user)
        except ValidationError as validation_error:
            return error_response(validation_error.messages[0], status_code=400)
        user.set_password(password)
        user.save(update_fields=("password",))
        return success_response("Password updated. You can now sign in.")
