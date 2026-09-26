from django.urls import path
from .views import RenewalView

urlpatterns = [path("", RenewalView.as_view(), name="renewals")]
