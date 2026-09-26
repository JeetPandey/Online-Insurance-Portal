from django.conf import settings
from django.db import models


class StaffMasterDetail(models.Model):
    auto_id = models.AutoField(primary_key=True)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="staff_record")
    staff_name = models.CharField(max_length=50)
    address = models.CharField(max_length=250)
    designation = models.CharField(max_length=50, default="AGENT")
    salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    date_of_joining = models.DateField()
    is_active = models.BooleanField(default=True)
    is_delete = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "staff_master_detail"
        ordering = ("staff_name",)

    @property
    def years_of_service(self):
        from django.utils import timezone
        today = timezone.localdate()
        return max(0, today.year - self.date_of_joining.year - ((today.month, today.day) < (self.date_of_joining.month, self.date_of_joining.day)))
