import json
import uuid
from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt

from apps.accounts.helpers import user_has_role
from apps.applications.models import PolicyRegistrationMaster
from apps.common.helpers.auth_helper import get_authenticated_user, require_role
from apps.common.helpers.response_helper import error_response, success_response
from .models import PaymentMasterDetail


def add_years(value, years):
    try:
        return value.replace(year=value.year + years)
    except ValueError:
        # A Feb 29 policy anniversary falls on Feb 28 in a non-leap year.
        return value.replace(month=2, day=28, year=value.year + years)


def parse_body(request):
    try:
        payload = json.loads(request.body or b"{}")
        return (payload, None) if isinstance(payload, dict) else (None, error_response("JSON body must be an object."))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None, error_response("Invalid JSON.")


def data(row):
    return {"id": row.pk, "auto_id": row.pk, "customer_id": row.customer_id,
            "application_id": row.policy_registration_id, "renewal_id": row.renewal_id,
            "policy_no": row.policy_no, "payment_for": row.payment_for,
            "amount": str(row.payment_amount), "payment_amount": str(row.payment_amount),
            "payment_type": row.payment_type, "transaction_reference": row.transaction_reference,
            "receipt_no": row.receipt_no, "status": row.status,
            "failure_reason": row.failure_reason, "date_of_payment": row.date_of_payment.isoformat() if row.date_of_payment else None}


@method_decorator(csrf_exempt, name="dispatch")
class PaymentView(View):
    http_method_names = ["get", "post"]

    def dispatch(self, request, *args, **kwargs):
        if request.method not in ("GET", "POST"):
            return error_response("Only GET and POST methods are allowed.", status_code=405)
        return super().dispatch(request, *args, **kwargs)

    def get(self, request):
        user, error = get_authenticated_user(request)
        if error:
            return error
        rows = PaymentMasterDetail.objects.select_related("customer", "policy_registration", "renewal")
        if not user_has_role(user, "ADMIN"):
            if not user_has_role(user, "CUSTOMER"):
                return error_response("You are not authorized to view payments.", status_code=403)
            rows = rows.filter(customer=user)
        action = request.GET.get("fun_call")
        if action in ("get_all", "get_my_payments"):
            return success_response("Payments fetched successfully.", [data(row) for row in rows])
        if action in ("get_by_id", "get_receipt"):
            try:
                row = rows.get(pk=request.GET.get("id")) if action == "get_by_id" else rows.get(receipt_no=request.GET.get("receipt_no"))
            except (PaymentMasterDetail.DoesNotExist, ValueError, TypeError):
                return error_response("Payment or receipt not found.", status_code=404)
            return success_response("Payment fetched successfully.", data(row))
        return error_response("Invalid fun_call.")

    def post(self, request):
        user, error = require_role(request, "CUSTOMER")
        if error:
            return error
        if request.GET.get("fun_call") != "pay":
            return error_response("Invalid fun_call.")
        payload, error = parse_body(request)
        if error:
            return error
        payment_for = payload.get("payment_for", "INITIAL")
        method = str(payload.get("payment_type", "")).strip()
        allowed_methods = {"Credit Card", "Debit Card", "Demand Draft", "Internet Banking"}
        if method not in allowed_methods:
            return error_response("Choose a supported demo payment method.")
        outcome = payload.get("demo_result", "SUCCESS")
        if outcome not in ("SUCCESS", "FAILED"):
            return error_response("demo_result must be SUCCESS or FAILED.")
        try:
            with transaction.atomic():
                renewal = None
                application = None
                if payment_for == "INITIAL":
                    application = PolicyRegistrationMaster.objects.select_for_update().select_related("policy").get(
                        pk=payload.get("application_id"), customer=user, status=PolicyRegistrationMaster.Status.APPROVED, is_delete=False)
                    if application.payments.filter(status=PaymentMasterDetail.Status.SUCCESS).exists():
                        return error_response("This proposal has already been paid.", status_code=409)
                    amount = application.premium_amount
                elif payment_for == "RENEWAL":
                    from apps.renewals.models import RenewalMasterDetail
                    renewal = RenewalMasterDetail.objects.select_for_update().select_related("policy_registration").get(
                        pk=payload.get("renewal_id"), policy_registration__customer=user,
                        status__in=(RenewalMasterDetail.Status.DUE, RenewalMasterDetail.Status.OVERDUE))
                    if renewal.payments.filter(status=PaymentMasterDetail.Status.SUCCESS).exists():
                        return error_response("This renewal has already been paid.", status_code=409)
                    amount = renewal.renewal_amount
                    application = renewal.policy_registration
                else:
                    return error_response("payment_for must be INITIAL or RENEWAL.")
                payment = PaymentMasterDetail.objects.create(
                    customer=user, policy_registration=application, renewal=renewal,
                    payment_for=payment_for, policy_no=application.policy_no or "",
                    payment_amount=amount, payment_type=method,
                    transaction_reference=f"DEMO-{uuid.uuid4().hex[:16].upper()}",
                    status=PaymentMasterDetail.Status.INITIATED,
                )
                if outcome == "FAILED":
                    payment.status = PaymentMasterDetail.Status.FAILED
                    payment.failure_reason = "The simulated payment was declined."
                    payment.save(update_fields=("status", "failure_reason"))
                    return success_response("Demo payment failed; no policy changes were made.", data(payment), status_code=200)
                now = timezone.now()
                payment.status = PaymentMasterDetail.Status.SUCCESS
                payment.date_of_payment = now
                payment.receipt_no = f"RCT-{uuid.uuid4().hex[:12].upper()}"
                if payment_for == "INITIAL":
                    start = timezone.localdate()
                    application.policy_no = f"POL-{uuid.uuid4().hex[:12].upper()}"
                    application.status = PolicyRegistrationMaster.Status.ISSUED
                    application.coverage_start = start
                    application.coverage_end = add_years(start, application.policy.policy_term)
                    application.next_due_date = add_years(start, 1)
                    application.issued_at = now
                    payment.policy_no = application.policy_no
                    application.save(update_fields=("policy_no", "status", "coverage_start", "coverage_end", "next_due_date", "issued_at"))
                else:
                    from apps.renewals.models import RenewalMasterDetail
                    renewal.status = RenewalMasterDetail.Status.PAID
                    renewal.date_of_renew = timezone.localdate()
                    renewal.payment_type = method
                    renewal.save(update_fields=("status", "date_of_renew", "payment_type"))
                    next_due = add_years(renewal.due_date, 1)
                    application.next_due_date = next_due
                    application.coverage_end = add_years(application.coverage_end or renewal.due_date, 1)
                    application.save(update_fields=("next_due_date", "coverage_end"))
                    from apps.reminders.models import ReminderGeneratorDetail
                    ReminderGeneratorDetail.objects.filter(policy_registration=application, due_date=renewal.due_date).exclude(status="CANCELLED").update(status=ReminderGeneratorDetail.Status.CLEARED)
                payment.save()
        except (PolicyRegistrationMaster.DoesNotExist, ValueError, TypeError):
            return error_response("Approved application or due renewal not found.", status_code=404)
        return success_response("Demo payment completed successfully.", data(payment), status_code=201)
