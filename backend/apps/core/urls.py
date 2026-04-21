from django.urls import path

from apps.core.views import ContactMessageCreateView

urlpatterns = [
    path("", ContactMessageCreateView.as_view(), name="contact-create"),
]
