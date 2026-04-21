from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class ContactApiTests(APITestCase):
    def test_create_contact_message(self):
        response = self.client.post(
            reverse("contact-create"),
            {
                "name": "Support User",
                "email": "support@example.com",
                "subject": "Need help",
                "message": "I need assistance with my order status."
            },
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
