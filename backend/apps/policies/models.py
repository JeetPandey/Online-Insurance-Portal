from django.conf import settings
from django.db import models


class PolicyDetailMaster(models.Model):
    class Category(models.TextChoices):
        LIFE = "LIFE", "Life Insurance"
        HEALTH = "HEALTH", "Health Insurance"

    class PaymentMode(models.TextChoices):
        MONTHLY = "Monthly", "Monthly"
        ANNUAL = "Annual", "Annual"

    auto_id = models.AutoField(primary_key=True)
    category = models.CharField(max_length=10, choices=Category.choices)
    policy_name = models.CharField(max_length=50)
    plan_no = models.PositiveIntegerField(unique=True)
    description = models.TextField(blank=True)
    features = models.JSONField(default=list, blank=True)
    terms_and_conditions = models.TextField(blank=True)
    policy_premium = models.DecimalField(max_digits=12, decimal_places=2)
    policy_term = models.PositiveSmallIntegerField(help_text="Term in years")
    payment_mode = models.CharField(max_length=50, choices=PaymentMode.choices, default=PaymentMode.ANNUAL)
    payment_type = models.JSONField(default=list, blank=True)
    minimum_age = models.PositiveSmallIntegerField(default=18)
    maximum_age = models.PositiveSmallIntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_delete = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="policies_created")
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="policies_updated")

    class Meta:
        db_table = "policy_detail_master"
        ordering = ("policy_name",)

    def __str__(self):
        return f"{self.plan_no} - {self.policy_name}"
