import json
import uuid
from datetime import timedelta

from django.db import IntegrityError
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt

from apps.accounts.helpers import user_has_role
from apps.applications.models import PolicyRegistrationMaster
from apps.common.helpers.auth_helper import get_authenticated_user, require_role
from apps.common.helpers.response_helper import error_response, success_response
from apps.reminders.models import ReminderGeneratorDetail
from .models import RenewalMasterDetail


def serialize(row):
    policy = row.policy_registration
    return {"id": row.pk, "renewal_no": row.renewal_no, "customer_id": policy.customer_id,
            "customer_name": policy.customer.username, "policy_no": policy.policy_no,
            "policy_name": policy.policy.policy_name, "renewal_amount": str(row.renewal_amount),
            "payment_mode": policy.policy.payment_mode,
            "due_date": row.due_date.isoformat(), "date_of_renew": row.date_of_renew.isoformat() if row.date_of_renew else None,
            "payment_type": row.payment_type, "status": row.status}


@method_decorator(csrf_exempt, name="dispatch")
class RenewalView(View):
    http_method_names = ["get", "post"]

    def dispatch(self, request, *args, **kwargs):
        if request.method not in ("GET", "POST"):
            return error_response("Only GET and POST methods are allowed.", status_code=405)
        return super().dispatch(request, *args, **kwargs)

    def get(self, request):
        user, error = get_authenticated_user(request)
        if error:
            return error
        rows = RenewalMasterDetail.objects.select_related("policy_registration", "policy_registration__customer", "policy_registration__policy")
        if not user_has_role(user, "ADMIN"):
            if not user_has_role(user, "CUSTOMER"):
                return error_response("You are not authorized to view renewals.", status_code=403)
            rows = rows.filter(policy_registration__customer=user)
        action = request.GET.get("fun_call")
        if action in ("get_all", "get_my_renewals", "get_due"):
            if action == "get_due":
                rows = rows.filter(status=RenewalMasterDetail.Status.DUE)
            return success_response("Renewals fetched successfully.", [serialize(row) for row in rows])
        if action == "get_by_id":
            try:
                row = rows.get(pk=request.GET.get("id"))
            except (RenewalMasterDetail.DoesNotExist, ValueError, TypeError):
                return error_response("Renewal not found.", status_code=404)
            return success_response("Renewal fetched successfully.", serialize(row))
        return error_response("Invalid fun_call.")

    def post(self, request):
        if request.GET.get("fun_call") != "create":
            return error_response("Renewal payments are completed through the payment endpoint.")
        user, error = require_role(request, "CUSTOMER")
        if error:
            return error
        try:
            payload = json.loads(request.body or b"{}")
        except (json.JSONDecodeError, UnicodeDecodeError):
            return error_response("Invalid JSON.")
        try:
            policy = PolicyRegistrationMaster.objects.get(pk=payload.get("policy_id"), customer=user, status=PolicyRegistrationMaster.Status.ISSUED)
        except (PolicyRegistrationMaster.DoesNotExist, ValueError, TypeError):
            return error_response("Active policy not found.", status_code=404)
        due_date = policy.next_due_date
        today = timezone.localdate()
        reminder_sent = due_date and ReminderGeneratorDetail.objects.filter(
            policy_registration=policy, due_date=due_date, status=ReminderGeneratorDetail.Status.SENT,
        ).exists()
        in_renewal_window = due_date and due_date <= today + timedelta(days=30)
        if due_date is None or due_date > policy.coverage_end or (not in_renewal_window and not reminder_sent):
            return error_response("This policy is not currently within its renewal window.", status_code=400)
        try:
            row, created = RenewalMasterDetail.objects.get_or_create(
                policy_registration=policy, due_date=due_date,
                defaults={"renewal_no": f"REN-{uuid.uuid4().hex[:12].upper()}", "renewal_amount": policy.premium_amount,
                          "status": RenewalMasterDetail.Status.OVERDUE if due_date < today else RenewalMasterDetail.Status.DUE},
            )
        except IntegrityError:
            return error_response("A renewal already exists for this due date.", status_code=409)
        return success_response("Renewal ready for payment.", serialize(row), status_code=201 if created else 200)
