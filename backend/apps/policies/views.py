import json
from decimal import Decimal, InvalidOperation

from django.db import IntegrityError
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt

from apps.common.helpers.auth_helper import get_authenticated_user, require_role
from apps.common.helpers.response_helper import error_response, success_response
from .models import PolicyDetailMaster


def body(request):
    try:
        value = json.loads(request.body or b"{}")
        return (value, None) if isinstance(value, dict) else (None, error_response("JSON body must be an object."))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None, error_response("Invalid JSON.")


def policy_data(policy):
    return {"id": policy.pk, "auto_id": policy.pk, "category": policy.category, "policy_name": policy.policy_name,
            "plan_no": policy.plan_no, "description": policy.description, "features": policy.features,
            "terms_and_conditions": policy.terms_and_conditions, "policy_premium": str(policy.policy_premium),
            "policy_term": policy.policy_term, "payment_mode": policy.payment_mode, "payment_type": policy.payment_type,
            "minimum_age": policy.minimum_age, "maximum_age": policy.maximum_age, "is_active": policy.is_active}


@method_decorator(csrf_exempt, name="dispatch")
class PolicyView(View):
    http_method_names = ["get", "post"]

    def dispatch(self, request, *args, **kwargs):
        if request.method not in ("GET", "POST"):
            return error_response("Only GET and POST methods are allowed.", status_code=405)
        return super().dispatch(request, *args, **kwargs)

    def get(self, request):
        action = request.GET.get("fun_call")
        user, auth_error = get_authenticated_user(request)
        admin = bool(user and (user.is_superuser or user.groups.filter(name="ADMIN").exists()))
        # Customer/public catalog remains readable. Admin can additionally request inactive plans.
        if not admin:
            from apps.accounts.helpers import user_has_role
            admin = bool(user and user_has_role(user, "ADMIN"))
        queryset = PolicyDetailMaster.objects.filter(is_delete=False)
        if not admin:
            queryset = queryset.filter(is_active=True)
        if action == "get_all":
            category = request.GET.get("category")
            search = request.GET.get("search", "").strip()
            if category in PolicyDetailMaster.Category.values:
                queryset = queryset.filter(category=category)
            if search:
                queryset = queryset.filter(policy_name__icontains=search) | queryset.filter(description__icontains=search)
            return success_response("Policies fetched successfully.", [policy_data(item) for item in queryset])
        if action == "get_by_id":
            try:
                item = queryset.get(pk=request.GET.get("id"))
            except (PolicyDetailMaster.DoesNotExist, ValueError, TypeError):
                return error_response("Policy not found.", status_code=404)
            return success_response("Policy fetched successfully.", policy_data(item))
        return error_response("Invalid fun_call.")

    def post(self, request):
        user, error = require_role(request, "ADMIN")
        if error:
            return error
        action = request.GET.get("fun_call")
        payload, error = body(request)
        if error:
            return error
        if action in ("create", "update"):
            fields = ("category", "policy_name", "plan_no", "description", "features", "terms_and_conditions",
                      "policy_premium", "policy_term", "payment_mode", "payment_type", "minimum_age", "maximum_age")
            required = ("category", "policy_name", "plan_no", "policy_premium", "policy_term")
            missing = [key for key in required if payload.get(key) in (None, "")]
            if missing:
                return error_response("Complete all required policy fields.", {key: ["This field is required."] for key in missing})
            if payload.get("category") not in PolicyDetailMaster.Category.values:
                return error_response("Category must be LIFE or HEALTH.")
            try:
                if action == "create":
                    item = PolicyDetailMaster(created_by=user)
                else:
                    item = PolicyDetailMaster.objects.get(pk=payload.get("id"), is_delete=False)
                    item.updated_by = user
                for key in fields:
                    if key in payload:
                        setattr(item, key, payload[key])
                item.plan_no = int(item.plan_no)
                item.policy_premium = Decimal(str(item.policy_premium))
                item.policy_term = int(item.policy_term)
                item.minimum_age = int(item.minimum_age or 0)
                if item.payment_mode not in PolicyDetailMaster.PaymentMode.values:
                    return error_response("Choose Monthly or Annual premium billing.")
                if item.maximum_age in ("", None):
                    item.maximum_age = None
                else:
                    item.maximum_age = int(item.maximum_age)
                if item.policy_premium <= 0 or item.policy_term <= 0 or (item.maximum_age and item.maximum_age < item.minimum_age):
                    return error_response("Premium and term must be positive and age limits must be valid.")
                item.save()
            except PolicyDetailMaster.DoesNotExist:
                return error_response("Policy not found.", status_code=404)
            except (IntegrityError, InvalidOperation, ValueError, TypeError):
                return error_response("Plan number must be unique and numeric; check the policy values.", status_code=409)
            return success_response("Policy saved successfully.", policy_data(item), status_code=201 if action == "create" else 200)
        if action in ("deactivate", "set_status"):
            try:
                item = PolicyDetailMaster.objects.get(pk=payload.get("id"), is_delete=False)
            except (PolicyDetailMaster.DoesNotExist, ValueError, TypeError):
                return error_response("Policy not found.", status_code=404)
            active = False if action == "deactivate" else payload.get("is_active")
            if not isinstance(active, bool):
                return error_response("is_active must be true or false.")
            item.is_active = active
            item.updated_by = user
            item.save(update_fields=("is_active", "updated_by", "updated_at"))
            return success_response("Policy status updated.", policy_data(item))
        return error_response("Invalid fun_call.")
