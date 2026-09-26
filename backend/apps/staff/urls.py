from django.urls import path
from .views import StaffView

urlpatterns = [path("", StaffView.as_view(), name="staff")]
