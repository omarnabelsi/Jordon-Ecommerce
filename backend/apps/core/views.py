from django.http import JsonResponse
from rest_framework import generics, permissions
from rest_framework.throttling import ScopedRateThrottle

from apps.core.models import ContactMessage
from apps.core.serializers import ContactMessageSerializer


class ContactMessageCreateView(generics.CreateAPIView):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "contact"


def healthcheck(_request):
    return JsonResponse({"status": "ok"})
