import json
import uuid
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt

from apps.accounts.helpers import user_has_role
from apps.applications.models import PolicyRegistrationMaster
from apps.common.helpers.auth_helper import get_authenticated_user, require_role
from apps.common.helpers.response_helper import error_response, success_response
from .models import ReminderGeneratorDetail


def serialize(row):
    policy = row.policy_registration
    profile = getattr(policy.customer, "customer_profile", None)
    return {"id": row.pk, "reminder_no": row.reminder_no, "policy_id": policy.pk, "customer_id": policy.customer_id,
            "customer_name": f"{profile.first_name} {profile.last_name}" if profile else policy.customer.username,
            "email": policy.customer.email, "policy_no": policy.policy_no, "policy_name": policy.policy.policy_name,
            "date_of_generate": row.date_of_generate.isoformat(), "date_of_sending": row.date_of_sending.isoformat() if row.date_of_sending else None,
            "due_date": row.due_date.isoformat(), "status": row.status}


def send_policy_reminder(policy):
    reminder, _ = ReminderGeneratorDetail.objects.get_or_create(
        policy_registration=policy,
        due_date=policy.next_due_date,
        defaults={"reminder_no": f"REM-{policy.pk}-{policy.next_due_date:%Y%m%d}"},
    )
    if reminder.status == ReminderGeneratorDetail.Status.SENT:
        return reminder, False
    sent = send_mail(
        subject="Insurance premium reminder",
        message=(f"Your premium for policy {policy.policy_no} is due on "
                 f"{policy.next_due_date:%d %B %Y}. You can sign in to review or pay the renewal early."),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[policy.customer.email],
        fail_silently=False,
    )
    if not sent:
        raise RuntimeError("Email backend did not accept the reminder.")
    reminder.status = ReminderGeneratorDetail.Status.SENT
    reminder.date_of_sending = timezone.localdate()
    reminder.save(update_fields=("status", "date_of_sending"))
    return reminder, True


def generate_due_reminders(today=None):
    today = today or timezone.localdate()
    end_date = today + timedelta(days=30)
    policies = PolicyRegistrationMaster.objects.filter(status=PolicyRegistrationMaster.Status.ISSUED,
                                                        next_due_date__gte=today, next_due_date__lte=end_date)
    reminders = []
    for policy in policies:
        reminder, _ = send_policy_reminder(policy)
        reminders.append(reminder)
    return reminders


@method_decorator(csrf_exempt, name="dispatch")
class ReminderView(View):
    http_method_names = ["get", "post"]

    def dispatch(self, request, *args, **kwargs):
        if request.method not in ("GET", "POST"):
            return error_response("Only GET and POST methods are allowed.", status_code=405)
        return super().dispatch(request, *args, **kwargs)

    def get(self, request):
        user, error = get_authenticated_user(request)
        if error:
            return error
        rows = ReminderGeneratorDetail.objects.select_related("policy_registration", "policy_registration__customer", "policy_registration__policy")
        if not user_has_role(user, "ADMIN"):
            if not user_has_role(user, "CUSTOMER"):
                return error_response("You are not authorized to view reminders.", status_code=403)
            rows = rows.filter(policy_registration__customer=user)
        if request.GET.get("fun_call") in ("get_all", "get_my_reminders"):
            return success_response("Reminders fetched successfully.", [serialize(row) for row in rows])
        return error_response("Invalid fun_call.")

    def post(self, request):
        _, error = require_role(request, "ADMIN")
        if error:
            return error
        action = request.GET.get("fun_call")
        if action not in ("generate", "send_policy_reminder"):
            return error_response("Invalid fun_call.")
        try:
            if action == "generate":
                reminders = generate_due_reminders()
                return success_response("Due reminders were generated.", {"count": len(reminders), "reminders": [serialize(row) for row in reminders]})
            payload = json.loads(request.body or b"{}")
            policy = PolicyRegistrationMaster.objects.get(
                pk=payload.get("policy_id"), status=PolicyRegistrationMaster.Status.ISSUED,
                is_delete=False, next_due_date__isnull=False,
            )
            reminder, sent = send_policy_reminder(policy)
        except PolicyRegistrationMaster.DoesNotExist:
            return error_response("We could not find an active customer policy to remind.", status_code=404)
        except (json.JSONDecodeError, UnicodeDecodeError, AttributeError):
            return error_response("Choose a valid customer policy to remind.")
        except Exception:
            return error_response("We could not send that reminder. Check that the customer has an email address, then try again.", status_code=502)
        message = "Reminder sent to the customer. Early renewal payment is now available." if sent else "A reminder has already been sent for this due date."
        return success_response(message, serialize(reminder))
