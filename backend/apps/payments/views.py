import json
import uuid
from calendar import monthrange
from datetime import date

from django.db import transaction
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt

from apps.accounts.helpers import user_has_role
from apps.applications.models import PolicyRegistrationMaster
from apps.common.helpers.auth_helper import get_authenticated_user, require_role
from apps.common.helpers.response_helper import error_response, success_response
from .models import (
    CreditCardTransactionDetail,
    DemandDraftTransactionDetail,
    InternetBankingTransactionDetail,
    PaymentMasterDetail,
)


def add_years(value, years):
    try:
        return value.replace(year=value.year + years)
    except ValueError:
        return value.replace(month=2, day=28, year=value.year + years)


def next_premium_date(value, policy):
    if policy.payment_mode.lower() in ("monthly", "per month"):
        month = value.month % 12 + 1
        year = value.year + (value.month == 12)
        return value.replace(year=year, month=month, day=min(value.day, monthrange(year, month)[1]))
    return add_years(value, 1)


def parse_body(request):
    try:
        payload = json.loads(request.body or b"{}")
        return (payload, None) if isinstance(payload, dict) else (None, error_response("Please send payment details in the expected format."))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None, error_response("We could not read the payment form. Please review it and try again.")


def validate_payment_detail(method, payload):
    if method in ("Credit Card", "Debit Card"):
        card = payload.get("card", {})
        number = "".join(character for character in str(card.get("number", "")) if character.isdigit())
        holder = str(card.get("holder", "")).strip()
        cvv = str(card.get("cvv", "")).strip()
        expiry = str(card.get("expiry", "")).strip()
        if not holder or len(holder) > 100:
            return None, "Enter the name shown on the card."
        if not 13 <= len(number) <= 19 or not valid_card_number(number):
            return None, "Enter a valid 13 to 19 digit card number. For testing, use 4111 1111 1111 1111."
        if len(cvv) not in (3, 4) or not cvv.isdigit():
            return None, "Enter the 3 or 4 digit security code."
        try:
            month, year = expiry.split("/")
            month = int(month)
            year = int(year)
            year = year + 2000 if year < 100 else year
            if not 1 <= month <= 12 or (year, month) < (date.today().year, date.today().month):
                raise ValueError
        except (ValueError, TypeError):
            return None, "Enter a valid future expiry date in MM/YY format."
        if number.startswith("4"):
            network = "Visa"
        elif number[:2] in {"51", "52", "53", "54", "55"}:
            network = "Mastercard"
        elif number[:2] in {"34", "37"}:
            network = "American Express"
        else:
            network = "Other"
        return {"holder": holder, "last_four": number[-4:], "network": network}, None

    if method == "Demand Draft":
        draft = payload.get("demand_draft", {})
        number = str(draft.get("number", "")).strip()
        bank = str(draft.get("bank_name", "")).strip()
        try:
            issue_date = date.fromisoformat(str(draft.get("issue_date", "")))
        except ValueError:
            issue_date = None
        if not number or len(number) > 40:
            return None, "Enter the demand draft number."
        if not bank or len(bank) > 100:
            return None, "Select or enter the bank that issued the draft."
        if not issue_date or issue_date > timezone.localdate():
            return None, "Enter a valid draft issue date that is not in the future."
        return {"number": number, "bank_name": bank, "issue_date": issue_date}, None

    if method == "Internet Banking":
        bank = payload.get("internet_banking", {})
        bank_name = str(bank.get("bank_name", "")).strip()
        holder = str(bank.get("account_holder", "")).strip()
        last_four = str(bank.get("account_last_four", "")).strip()
        if not bank_name or len(bank_name) > 100:
            return None, "Choose your bank to continue."
        if not holder or len(holder) > 100:
            return None, "Enter the account holder name."
        if len(last_four) != 4 or not last_four.isdigit():
            return None, "Enter the last four digits of the account used for this demo."
        return {"bank_name": bank_name, "account_holder": holder, "account_last_four": last_four}, None

    return {}, None


def valid_card_number(number):
    digits = [int(value) for value in number[::-1]]
    total = sum(value if index % 2 == 0 else (value * 2 - 9 if value * 2 > 9 else value * 2) for index, value in enumerate(digits))
    return total % 10 == 0


def payment_data(row):
    profile = getattr(row.customer, "customer_profile", None)
    customer_name = " ".join(value for value in (profile.first_name, profile.last_name) if value).strip() if profile else row.customer.get_full_name()
    details = None
    if row.payment_type in ("Credit Card", "Debit Card"):
        try:
            card = row.card_detail
            details = {"cardholder_name": card.cardholder_name, "card_network": card.card_network, "last_four": card.last_four}
        except CreditCardTransactionDetail.DoesNotExist:
            pass
    elif row.payment_type == "Demand Draft":
        try:
            draft = row.draft_detail
            details = {"draft_number": draft.draft_number, "bank_name": draft.bank_name, "issue_date": draft.issue_date.isoformat()}
        except DemandDraftTransactionDetail.DoesNotExist:
            pass
    elif row.payment_type == "Internet Banking":
        try:
            bank = row.banking_detail
            details = {"bank_name": bank.bank_name, "account_holder": bank.account_holder, "account_last_four": bank.account_last_four}
        except InternetBankingTransactionDetail.DoesNotExist:
            pass
    return {"id": row.pk, "auto_id": row.pk, "customer_id": row.customer_id,
            "customer_name": customer_name or row.customer.username,
            "customer_email": (profile.email_id if profile and profile.email_id else row.customer.email),
            "policy_name": row.policy_registration.policy.policy_name if row.policy_registration_id else "Renewal",
            "application_id": row.policy_registration_id, "renewal_id": row.renewal_id,
            "policy_no": row.policy_no, "payment_for": row.payment_for,
            "amount": str(row.payment_amount), "payment_amount": str(row.payment_amount),
            "payment_type": row.payment_type, "payment_detail": details,
            "transaction_reference": row.transaction_reference, "receipt_no": row.receipt_no,
            "status": row.status, "failure_reason": row.failure_reason,
            "date_of_payment": row.date_of_payment.isoformat() if row.date_of_payment else None}


def save_method_detail(payment, method, detail):
    if method in ("Credit Card", "Debit Card"):
        CreditCardTransactionDetail.objects.create(payment=payment, cardholder_name=detail["holder"], card_network=detail["network"], last_four=detail["last_four"])
    elif method == "Demand Draft":
        DemandDraftTransactionDetail.objects.create(payment=payment, draft_number=detail["number"], bank_name=detail["bank_name"], issue_date=detail["issue_date"])
    elif method == "Internet Banking":
        InternetBankingTransactionDetail.objects.create(payment=payment, bank_name=detail["bank_name"], account_holder=detail["account_holder"], account_last_four=detail["account_last_four"])


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
        rows = PaymentMasterDetail.objects.select_related("customer", "customer__customer_profile", "policy_registration__policy", "renewal")
        if not user_has_role(user, "ADMIN"):
            if not user_has_role(user, "CUSTOMER"):
                return error_response("You are not authorized to view payments.", status_code=403)
            rows = rows.filter(customer=user)
        action = request.GET.get("fun_call")
        if action in ("get_all", "get_my_payments"):
            return success_response("Payments fetched successfully.", [payment_data(row) for row in rows])
        if action in ("get_by_id", "get_receipt"):
            try:
                row = rows.get(pk=request.GET.get("id")) if action == "get_by_id" else rows.get(receipt_no=request.GET.get("receipt_no"))
            except (PaymentMasterDetail.DoesNotExist, ValueError, TypeError):
                return error_response("We could not find that payment or receipt.", status_code=404)
            return success_response("Payment fetched successfully.", payment_data(row))
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
        method = str(payload.get("payment_type", "")).strip()
        allowed_methods = {"Credit Card", "Debit Card", "Demand Draft", "Internet Banking"}
        if method not in allowed_methods:
            return error_response("Choose a supported payment method.")
        method_detail, message = validate_payment_detail(method, payload)
        if message:
            return error_response(message)
        payment_for = payload.get("payment_for", "INITIAL")
        try:
            with transaction.atomic():
                renewal = None
                if payment_for == "INITIAL":
                    application = PolicyRegistrationMaster.objects.select_for_update().select_related("policy").get(
                        pk=payload.get("application_id"), customer=user, status=PolicyRegistrationMaster.Status.APPROVED, is_delete=False)
                    if application.payments.filter(status=PaymentMasterDetail.Status.SUCCESS).exists():
                        return error_response("This proposal has already been paid.", status_code=409)
                    amount = application.premium_amount
                elif payment_for == "RENEWAL":
                    from apps.renewals.models import RenewalMasterDetail
                    renewal = RenewalMasterDetail.objects.select_for_update().select_related("policy_registration__policy").get(
                        pk=payload.get("renewal_id"), policy_registration__customer=user,
                        status__in=(RenewalMasterDetail.Status.DUE, RenewalMasterDetail.Status.OVERDUE))
                    if renewal.payments.filter(status=PaymentMasterDetail.Status.SUCCESS).exists():
                        return error_response("This renewal has already been paid.", status_code=409)
                    amount = renewal.renewal_amount
                    application = renewal.policy_registration
                else:
                    return error_response("We could not identify this payment. Please return to your policy and try again.")

                payment = PaymentMasterDetail.objects.create(
                    customer=user, policy_registration=application, renewal=renewal,
                    payment_for=payment_for, policy_no=application.policy_no or "",
                    payment_amount=amount, payment_type=method,
                    transaction_reference=f"DEMO-{uuid.uuid4().hex[:16].upper()}",
                    status=PaymentMasterDetail.Status.INITIATED,
                )
                save_method_detail(payment, method, method_detail)
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
                    application.next_due_date = next_premium_date(start, application.policy)
                    application.issued_at = now
                    payment.policy_no = application.policy_no
                    application.save(update_fields=("policy_no", "status", "coverage_start", "coverage_end", "next_due_date", "issued_at"))
                else:
                    from apps.renewals.models import RenewalMasterDetail
                    renewal.status = RenewalMasterDetail.Status.PAID
                    renewal.date_of_renew = timezone.localdate()
                    renewal.payment_type = method
                    renewal.save(update_fields=("status", "date_of_renew", "payment_type"))
                    application.next_due_date = next_premium_date(renewal.due_date, application.policy)
                    application.coverage_end = next_premium_date(application.coverage_end or renewal.due_date, application.policy)
                    application.save(update_fields=("next_due_date", "coverage_end"))
                    from apps.reminders.models import ReminderGeneratorDetail
                    ReminderGeneratorDetail.objects.filter(policy_registration=application, due_date=renewal.due_date).exclude(status="CANCELLED").update(status=ReminderGeneratorDetail.Status.CLEARED)
                payment.save()
        except (PolicyRegistrationMaster.DoesNotExist, ValueError, TypeError):
            return error_response("We could not find an approved proposal or payable renewal for your account.", status_code=404)
        return success_response("Payment completed successfully. Your receipt is ready.", payment_data(payment), status_code=201)
