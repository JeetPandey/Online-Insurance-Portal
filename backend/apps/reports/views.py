import json
import uuid
from datetime import date, timedelta
from decimal import Decimal

from django.db.models import Sum
from django.http import HttpResponse
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


def report_pdf(data):
    lines = [
        f"Online Insurance Portal - Monthly Report ({data['month']})",
        f"Premium received: Rs. {data['payment_received']}",
        f"Successful payments: {data['payments_total']}",
        f"Policies issued: {data['policies_total']}",
        f"Renewals paid: {data['renewals_total']}",
        f"Next month renewals: {data['next_month_renewals']}",
        f"Reminders generated: {data['total_reminders']}",
        "",
        "Upcoming renewals (customer | policy | policy no. | due date):",
    ]
    lines.extend(f"{row['customer_name']} | {row['policy_name']} | {row['policy_no']} | Due {row['due_date']}" for row in data["upcoming_renewals"][:12])
    lines.extend(["", "Successful payments (customer | policy | receipt | amount | date | method):"])
    lines.extend(f"{row['customer_name']} | {row['policy_name']} | {row['receipt_no']} | Rs. {row['amount']} | {row['date'][:10]} | {row['payment_type']}" for row in data["payments"][:12])

    commands = ["BT", "/F1 16 Tf", "50 750 Td"]
    for index, line in enumerate(lines[:48]):
        safe_line = line.encode("ascii", "replace").decode("ascii").replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
        if index == 1:
            commands.append("/F1 10 Tf")
            commands.append("0 -28 Td")
        elif index:
            commands.append("0 -14 Td")
        commands.append(f"({safe_line[:105]}) Tj")
    commands.append("ET")
    stream = "\n".join(commands).encode("ascii")
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Length " + str(len(stream)).encode("ascii") + b" >>\nstream\n" + stream + b"\nendstream",
    ]
    pdf = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]
    for number, content in enumerate(objects, 1):
        offsets.append(len(pdf))
        pdf.extend(f"{number} 0 obj\n".encode("ascii") + content + b"\nendobj\n")
    xref = len(pdf)
    pdf.extend(f"xref\n0 {len(offsets)}\n0000000000 65535 f \n".encode("ascii"))
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
    pdf.extend(f"trailer\n<< /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF".encode("ascii"))
    return bytes(pdf)


def report_payload(month):
    start = date.fromisoformat(f"{month}-01")
    next_month_start = (start.replace(day=28) + timedelta(days=4)).replace(day=1)
    end = next_month_start - timedelta(days=1)
    following_start = next_month_start
    following_end = (following_start.replace(day=28) + timedelta(days=4)).replace(day=1)
    payments = PaymentMasterDetail.objects.filter(status=PaymentMasterDetail.Status.SUCCESS, date_of_payment__date__gte=start, date_of_payment__date__lte=end).select_related("customer", "customer__customer_profile", "policy_registration__policy")
    payment_sum = payments.aggregate(total=Sum("payment_amount"))["total"] or Decimal("0.00")
    issued = PolicyRegistrationMaster.objects.filter(status=PolicyRegistrationMaster.Status.ISSUED, issued_at__date__gte=start, issued_at__date__lte=end)
    renewals = RenewalMasterDetail.objects.filter(status=RenewalMasterDetail.Status.PAID, date_of_renew__gte=start, date_of_renew__lte=end)
    due_next = PolicyRegistrationMaster.objects.filter(status=PolicyRegistrationMaster.Status.ISSUED, next_due_date__gte=following_start, next_due_date__lt=following_end)
    reminders = ReminderGeneratorDetail.objects.filter(date_of_generate__gte=start, date_of_generate__lte=end)
    return {"month": month, "payment_received": str(payment_sum), "payments_total": payments.count(), "policies_total": issued.count(),
            "renewals_total": renewals.count(), "next_month_renewals": due_next.count(),
            "total_reminders": reminders.count(),
            "payments": [{"receipt_no": row.receipt_no, "customer_id": row.customer_id, "customer_name": (f"{row.customer.customer_profile.first_name} {row.customer.customer_profile.last_name}".strip() if hasattr(row.customer, "customer_profile") else row.customer.get_full_name() or row.customer.username), "customer_email": (row.customer.customer_profile.email_id if hasattr(row.customer, "customer_profile") and row.customer.customer_profile.email_id else row.customer.email), "policy_no": row.policy_no, "policy_name": row.policy_registration.policy.policy_name if row.policy_registration_id else "Renewal", "amount": str(row.payment_amount), "date": row.date_of_payment.isoformat(), "payment_type": row.payment_type} for row in payments],
            "upcoming_renewals": [{"policy_no": row.policy_no, "customer": row.customer.username, "customer_name": (f"{row.customer.customer_profile.first_name} {row.customer.customer_profile.last_name}".strip() if hasattr(row.customer, "customer_profile") else row.customer.get_full_name() or row.customer.username), "customer_email": (row.customer.customer_profile.email_id if hasattr(row.customer, "customer_profile") and row.customer.customer_profile.email_id else row.customer.email), "policy_name": row.policy.policy_name, "due_date": row.next_due_date.isoformat()} for row in due_next.select_related("customer", "customer__customer_profile", "policy") ]}


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
        action = request.GET.get("fun_call")
        if action not in ("get", "download_pdf"):
            return error_response("Invalid fun_call.")
        if not (user_has_role(user, "ADMIN") or user_has_role(user, "AGENT")):
            return error_response("You are not authorized to view reports.", status_code=403)
        month = request.GET.get("month", timezone.localdate().strftime("%Y-%m"))
        try:
            data = report_payload(month)
        except ValueError:
            return error_response("month must use YYYY-MM format.")
        if action == "download_pdf":
            response = HttpResponse(report_pdf(data), content_type="application/pdf")
            response["Content-Disposition"] = f'attachment; filename="insurance-report-{month}.pdf"'
            return response
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
