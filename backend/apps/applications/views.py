import json
import uuid
from datetime import date

from django.db import transaction
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt

from apps.accounts.helpers import get_user_profile, user_has_role
from apps.accounts.models import CustomerProfile
from apps.common.helpers.auth_helper import get_authenticated_user, require_role
from apps.common.helpers.response_helper import error_response, success_response
from apps.policies.models import PolicyDetailMaster
from .models import PolicyRegistrationMaster


def parse_body(request):
    try:
        payload = json.loads(request.body or b"{}")
        return (payload, None) if isinstance(payload, dict) else (None, error_response("JSON body must be an object."))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None, error_response("Invalid JSON.")


def serialize(row):
    customer = getattr(row.customer, "customer_profile", None)
    return {"id": row.pk, "auto_id": row.pk, "application_no": row.application_no,
            "customer_id": row.customer_id, "customer_name": f"{customer.first_name} {customer.last_name}" if customer else row.customer.username,
            "policy_id": row.policy_id, "policy_name": row.policy.policy_name, "plan_no": row.policy.plan_no,
            "assigned_agent_id": row.assigned_agent_id,
            "policy_no": row.policy_no, "proposal_no": row.proposal_no,
            "proposal_date": row.proposal_date.isoformat() if row.proposal_date else None,
            "premium_amount": str(row.premium_amount), "payment_type": row.payment_type,
            "status": row.status, "decision_reason": row.decision_reason,
            "submitted_at": row.submitted_at.isoformat(), "coverage_start": row.coverage_start.isoformat() if row.coverage_start else None,
            "coverage_end": row.coverage_end.isoformat() if row.coverage_end else None,
            "next_due_date": row.next_due_date.isoformat() if row.next_due_date else None}


@method_decorator(csrf_exempt, name="dispatch")
class ApplicationView(View):
    http_method_names = ["get", "post"]

    def dispatch(self, request, *args, **kwargs):
        if request.method not in ("GET", "POST"):
            return error_response("Only GET and POST methods are allowed.", status_code=405)
        return super().dispatch(request, *args, **kwargs)

    def get(self, request):
        user, error = get_authenticated_user(request)
        if error:
            return error
        action = request.GET.get("fun_call")
        rows = PolicyRegistrationMaster.objects.filter(is_delete=False).select_related("customer", "policy", "reviewer")
        if user_has_role(user, "ADMIN"):
            pass
        elif user_has_role(user, "AGENT"):
            rows = rows.filter(assigned_agent=user)
        elif user_has_role(user, "CUSTOMER"):
            rows = rows.filter(customer=user)
        else:
            return error_response("You are not authorized to view applications.", status_code=403)
        if action == "get_all":
            status = request.GET.get("status")
            if status in PolicyRegistrationMaster.Status.values:
                rows = rows.filter(status=status)
            return success_response("Applications fetched successfully.", [serialize(row) for row in rows])
        if action == "get_by_id":
            try:
                row = rows.get(pk=request.GET.get("id"))
            except (PolicyRegistrationMaster.DoesNotExist, ValueError, TypeError):
                return error_response("Application not found.", status_code=404)
            return success_response("Application fetched successfully.", serialize(row))
        return error_response("Invalid fun_call.")

    def post(self, request):
        action = request.GET.get("fun_call")
        payload, error = parse_body(request)
        if error:
            return error
        if action == "create":
            user, error = require_role(request, "CUSTOMER")
            if error:
                return error
            try:
                profile = CustomerProfile.objects.get(customer=user)
                policy = PolicyDetailMaster.objects.get(pk=payload.get("policy_id"), is_active=True, is_delete=False)
            except (CustomerProfile.DoesNotExist, PolicyDetailMaster.DoesNotExist, ValueError, TypeError):
                return error_response("Customer profile or active policy was not found.", status_code=404)
            age = (date.today() - profile.date_of_birth).days // 365
            if age < policy.minimum_age or (policy.maximum_age and age > policy.maximum_age):
                return error_response("You are not eligible for this policy based on its age limits.", status_code=400)
            payment_type = str(payload.get("payment_type", "")).strip()
            allowed = policy.payment_type or ["Credit Card", "Debit Card", "Demand Draft", "Internet Banking"]
            if payment_type not in allowed:
                return error_response("Select a payment type supported by this policy.")
            row = PolicyRegistrationMaster.objects.create(
                customer=user, policy=policy, application_no=f"APP-{uuid.uuid4().hex[:12].upper()}",
                premium_amount=policy.policy_premium, payment_type=payment_type,
            )
            return success_response("Application submitted for review.", serialize(row), status_code=201)
        if action in ("approve", "reject", "assign_agent"):
            user, error = require_role(request, "ADMIN")
            if error:
                return error
            try:
                with transaction.atomic():
                    row = PolicyRegistrationMaster.objects.select_for_update().get(pk=payload.get("id"), is_delete=False)
                    if action == "assign_agent":
                        if row.status != PolicyRegistrationMaster.Status.PENDING:
                            return error_response("Only pending applications can be assigned.", status_code=409)
                        from apps.accounts.helpers import user_has_role
                        from django.contrib.auth import get_user_model
                        agent = get_user_model().objects.filter(pk=payload.get("agent_id"), is_active=True).first()
                        if not agent or not user_has_role(agent, "AGENT"):
                            return error_response("Select an active Agent account.")
                        row.assigned_agent = agent
                        row.save(update_fields=("assigned_agent",))
                        return success_response("Application assigned to Agent.", serialize(row))
                    if row.status != PolicyRegistrationMaster.Status.PENDING:
                        return error_response("Only pending applications can be reviewed.", status_code=409)
                    row.reviewer = user
                    row.reviewed_at = timezone.now()
                    row.decision_reason = str(payload.get("reason", "")).strip()
                    if action == "approve":
                        row.status = PolicyRegistrationMaster.Status.APPROVED
                        row.proposal_no = f"PROP-{uuid.uuid4().hex[:12].upper()}"
                        row.proposal_date = timezone.localdate()
                    else:
                        if not row.decision_reason:
                            return error_response("Provide a reason when rejecting an application.")
                        row.status = PolicyRegistrationMaster.Status.REJECTED
                    row.save()
            except (PolicyRegistrationMaster.DoesNotExist, ValueError, TypeError):
                return error_response("Application not found.", status_code=404)
            message = "Application approved successfully." if action == "approve" else "Application rejected successfully."
            return success_response(message, serialize(row))
        return error_response("Invalid fun_call.")
