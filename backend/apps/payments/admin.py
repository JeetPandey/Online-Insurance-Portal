from django.contrib import admin
from .models import PaymentMasterDetail


@admin.register(PaymentMasterDetail)
class PaymentMasterDetailAdmin(admin.ModelAdmin):
    list_display = ("receipt_no", "customer", "payment_amount", "payment_type", "status", "date_of_payment")
    list_filter = ("status", "payment_for", "payment_type")
    search_fields = ("receipt_no", "transaction_reference", "customer__username")
