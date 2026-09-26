import json
import uuid
from datetime import date, timedelta
from decimal import Decimal

from django.db.models import Sum
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt

from apps.accounts.helpers import user_has_role
from apps.applications.models import PolicyRegistrationMaster
from apps.common.helpers.auth_helper import get_authenticated_user, require_role
from apps.common.helpers.response_helper import error_response, success_response
from apps.payments.models import PaymentMasterDetail
from apps.reminders.models import ReminderGeneratorDetail
from apps.renewals.models import RenewalMasterDetail
from .models import ReportMaster


def report_payload(month):
    start = date.fromisoformat(f"{month}-01")
    next_month_start = (start.replace(day=28) + timedelta(days=4)).replace(day=1)
    end = next_month_start - timedelta(days=1)
    following_start = next_month_start
    following_end = (following_start.replace(day=28) + timedelta(days=4)).replace(day=1)
    payments = PaymentMasterDetail.objects.filter(status=PaymentMasterDetail.Status.SUCCESS, date_of_payment__date__gte=start, date_of_payment__date__lte=end)
    payment_sum = payments.aggregate(total=Sum("payment_amount"))["total"] or Decimal("0.00")
    issued = PolicyRegistrationMaster.objects.filter(status=PolicyRegistrationMaster.Status.ISSUED, issued_at__date__gte=start, issued_at__date__lte=end)
    renewals = RenewalMasterDetail.objects.filter(status=RenewalMasterDetail.Status.PAID, date_of_renew__gte=start, date_of_renew__lte=end)
    due_next = PolicyRegistrationMaster.objects.filter(status=PolicyRegistrationMaster.Status.ISSUED, next_due_date__gte=following_start, next_due_date__lt=following_end)
    reminders = ReminderGeneratorDetail.objects.filter(date_of_generate__gte=start, date_of_generate__lte=end)
    return {"month": month, "payment_received": str(payment_sum), "policies_total": issued.count(),
            "renewals_total": renewals.count(), "next_month_renewals": due_next.count(),
            "total_reminders": reminders.count(),
            "payments": [{"receipt_no": row.receipt_no, "amount": str(row.payment_amount), "date": row.date_of_payment.isoformat(), "payment_type": row.payment_type} for row in payments.select_related("customer")],
            "upcoming_renewals": [{"policy_no": row.policy_no, "customer": row.customer.username, "due_date": row.next_due_date.isoformat()} for row in due_next.select_related("customer")]}


@method_decorator(csrf_exempt, name="dispatch")
class ReportView(View):
    http_method_names = ["get", "post"]

    def dispatch(self, request, *args, **kwargs):
        if request.method not in ("GET", "POST"):
            return error_response("Only GET and POST methods are allowed.", status_code=405)
        return super().dispatch(request, *args, **kwargs)

    def get(self, request):
        user, error = get_authenticated_user(request)
        if error:
            return error
        if request.GET.get("fun_call") != "get":
            return error_response("Invalid fun_call.")
        if not (user_has_role(user, "ADMIN") or user_has_role(user, "AGENT")):
            return error_response("You are not authorized to view reports.", status_code=403)
        month = request.GET.get("month", timezone.localdate().strftime("%Y-%m"))
        try:
            data = report_payload(month)
        except ValueError:
            return error_response("month must use YYYY-MM format.")
        return success_response("Monthly report generated.", data)

    def post(self, request):
        user, error = require_role(request, "ADMIN")
        if error:
            return error
        if request.GET.get("fun_call") != "save":
            return error_response("Invalid fun_call.")
        try:
            payload = json.loads(request.body or b"{}")
            month = payload.get("month", timezone.localdate().strftime("%Y-%m"))
            data = report_payload(month)
        except (json.JSONDecodeError, UnicodeDecodeError, ValueError):
            return error_response("Provide a valid month in YYYY-MM format.")
        snapshot = ReportMaster.objects.create(generated_by=user, report_id=f"RPT-{uuid.uuid4().hex[:12].upper()}", report_month=month,
            payment_received=data["payment_received"], policies_total=data["policies_total"], renewals_total=data["renewals_total"],
            next_month_renewals=data["next_month_renewals"], total_reminders=data["total_reminders"], report_data=data)
        data["report_id"] = snapshot.report_id
        return success_response("Monthly report snapshot saved.", data, status_code=201)
