import json

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.utils.dateparse import parse_date
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt

from apps.accounts.helpers import assign_user_role
from apps.accounts.models import UserProfile
from apps.common.helpers.auth_helper import require_role
from apps.common.helpers.response_helper import error_response, success_response
from .models import StaffMasterDetail

User = get_user_model()


def serialized(staff):
    return {"id": staff.pk, "staff_id": staff.pk, "user_id": staff.user_id,
            "username": staff.user.username, "email": staff.user.email,
            "staff_name": staff.staff_name, "address": staff.address,
            "designation": staff.designation, "salary": str(staff.salary),
            "date_of_joining": staff.date_of_joining.isoformat(),
            "years_of_service": staff.years_of_service, "is_active": staff.is_active}


@method_decorator(csrf_exempt, name="dispatch")
class StaffView(View):
    http_method_names = ["get", "post"]

    def dispatch(self, request, *args, **kwargs):
        if request.method not in ("GET", "POST"):
            return error_response("Only GET and POST methods are allowed.", status_code=405)
        return super().dispatch(request, *args, **kwargs)

    def get(self, request):
        _, error = require_role(request, "ADMIN")
        if error:
            return error
        if request.GET.get("fun_call") != "get_all":
            return error_response("Invalid fun_call.")
        queryset = StaffMasterDetail.objects.filter(is_delete=False).select_related("user")
        search = request.GET.get("search", "").strip()
        if search:
            queryset = queryset.filter(staff_name__icontains=search) | queryset.filter(user__username__icontains=search)
        return success_response("Staff fetched successfully.", [serialized(item) for item in queryset])

    def post(self, request):
        admin, error = require_role(request, "ADMIN")
        if error:
            return error
        try:
            payload = json.loads(request.body or b"{}")
        except (json.JSONDecodeError, UnicodeDecodeError):
            return error_response("Invalid JSON.")
        action = request.GET.get("fun_call")
        if action == "create_agent":
            required = ("username", "email", "password", "staff_name", "address", "date_of_joining")
            if any(not str(payload.get(key, "")).strip() for key in required):
                return error_response("Complete all required staff fields.")
            joined = parse_date(str(payload.get("date_of_joining")))
            if not joined:
                return error_response("Enter a valid joining date.")
            try:
                validate_password(str(payload["password"]), User(username=payload["username"], email=payload["email"]))
            except ValidationError as exc:
                return error_response("Choose a stronger password.", {"password": exc.messages})
            try:
                with transaction.atomic():
                    user = User.objects.create_user(username=payload["username"].strip(), email=payload["email"].strip().lower(), password=payload["password"])
                    UserProfile.objects.create(user=user, mobile_no=str(payload.get("mobile_number", ""))[:15] or None, created_by=admin, updated_by=admin)
                    assign_user_role(user, "AGENT", assigned_by=admin)
                    staff = StaffMasterDetail.objects.create(user=user, staff_name=payload["staff_name"].strip(), address=payload["address"].strip(), designation="AGENT", salary=payload.get("salary") or 0, date_of_joining=joined)
            except (IntegrityError, ValueError, TypeError):
                return error_response("The user ID/email may already exist, or the salary is invalid.", status_code=409)
            return success_response("Agent account created.", serialized(staff), status_code=201)
        if action == "set_status":
            try:
                staff = StaffMasterDetail.objects.select_related("user").get(pk=payload.get("id"), is_delete=False)
            except (StaffMasterDetail.DoesNotExist, ValueError, TypeError):
                return error_response("Staff record not found.", status_code=404)
            if not isinstance(payload.get("is_active"), bool):
                return error_response("is_active must be true or false.")
            staff.is_active = payload["is_active"]
            staff.user.is_active = payload["is_active"]
            staff.user.save(update_fields=("is_active",))
            staff.save(update_fields=("is_active",))
            return success_response("Agent status updated.", serialized(staff))
        return error_response("Invalid fun_call.")
