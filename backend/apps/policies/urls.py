from django.urls import path
from .views import PolicyView

urlpatterns = [path("", PolicyView.as_view(), name="policies")]
