from django.conf import settings
from django.db import models


class PaymentMasterDetail(models.Model):
    class Status(models.TextChoices):
        INITIATED = "INITIATED", "Initiated"
        SUCCESS = "SUCCESS", "Success"
        FAILED = "FAILED", "Failed"

    class PaymentFor(models.TextChoices):
        INITIAL = "INITIAL", "Initial premium"
        RENEWAL = "RENEWAL", "Renewal premium"

    auto_id = models.AutoField(primary_key=True)
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="insurance_payments")
    policy_registration = models.ForeignKey("applications.PolicyRegistrationMaster", null=True, blank=True, on_delete=models.PROTECT, related_name="payments")
    renewal = models.ForeignKey("renewals.RenewalMasterDetail", null=True, blank=True, on_delete=models.PROTECT, related_name="payments")
    payment_for = models.CharField(max_length=10, choices=PaymentFor.choices)
    policy_no = models.CharField(max_length=32, blank=True)
    payment_amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_type = models.CharField(max_length=50)
    transaction_reference = models.CharField(max_length=64, unique=True)
    receipt_no = models.CharField(max_length=32, unique=True, null=True, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.INITIATED)
    failure_reason = models.CharField(max_length=255, blank=True)
    date_of_payment = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "payment_master_detail"
        ordering = ("-created_at",)

    def __str__(self):
        return self.receipt_no or self.transaction_reference


class CreditCardTransactionDetail(models.Model):
    payment = models.OneToOneField(PaymentMasterDetail, on_delete=models.CASCADE, related_name="card_detail")
    cardholder_name = models.CharField(max_length=100)
    card_network = models.CharField(max_length=20)
    last_four = models.CharField(max_length=4)

    class Meta:
        db_table = "credit_card_transaction_detail"


class DemandDraftTransactionDetail(models.Model):
    payment = models.OneToOneField(PaymentMasterDetail, on_delete=models.CASCADE, related_name="draft_detail")
    draft_number = models.CharField(max_length=40)
    bank_name = models.CharField(max_length=100)
    issue_date = models.DateField()

    class Meta:
        db_table = "demand_draft_transaction_detail"


class InternetBankingTransactionDetail(models.Model):
    payment = models.OneToOneField(PaymentMasterDetail, on_delete=models.CASCADE, related_name="banking_detail")
    bank_name = models.CharField(max_length=100)
    account_holder = models.CharField(max_length=100)
    account_last_four = models.CharField(max_length=4)

    class Meta:
        db_table = "internet_banking_transaction_detail"
