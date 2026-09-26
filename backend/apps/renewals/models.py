from django.db import models


class RenewalMasterDetail(models.Model):
    class Status(models.TextChoices):
        DUE = "DUE", "Due"
        PAID = "PAID", "Paid"
        OVERDUE = "OVERDUE", "Overdue"

    auto_id = models.AutoField(primary_key=True)
    policy_registration = models.ForeignKey("applications.PolicyRegistrationMaster", on_delete=models.PROTECT, related_name="renewals")
    renewal_no = models.CharField(max_length=32, unique=True)
    renewal_amount = models.DecimalField(max_digits=12, decimal_places=2)
    due_date = models.DateField()
    date_of_renew = models.DateField(null=True, blank=True)
    payment_type = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DUE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "renewal_master_detail"
        constraints = [models.UniqueConstraint(fields=("policy_registration", "due_date"), name="unique_policy_due_renewal")]
        ordering = ("due_date",)

    def __str__(self):
        return self.renewal_no
