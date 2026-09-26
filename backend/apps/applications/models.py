from django.conf import settings
from django.db import models


class PolicyRegistrationMaster(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending review"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
        ISSUED = "ISSUED", "Policy issued"

    auto_id = models.AutoField(primary_key=True)
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="policy_applications")
    policy = models.ForeignKey("policies.PolicyDetailMaster", on_delete=models.PROTECT, related_name="applications")
    application_no = models.CharField(max_length=32, unique=True)
    policy_no = models.CharField(max_length=32, unique=True, null=True, blank=True)
    proposal_no = models.CharField(max_length=32, unique=True, null=True, blank=True)
    proposal_date = models.DateField(null=True, blank=True)
    premium_amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_type = models.CharField(max_length=50)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)
    decision_reason = models.TextField(blank=True)
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="applications_reviewed")
    assigned_agent = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="applications_assigned")
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    coverage_start = models.DateField(null=True, blank=True)
    coverage_end = models.DateField(null=True, blank=True)
    next_due_date = models.DateField(null=True, blank=True)
    issued_at = models.DateTimeField(null=True, blank=True)
    is_delete = models.BooleanField(default=False)

    class Meta:
        db_table = "policy_registration_master"
        ordering = ("-submitted_at",)

    def __str__(self):
        return self.application_no
