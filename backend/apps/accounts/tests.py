from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class AuthApiTests(APITestCase):
    def test_register_and_login(self):
        register_url = reverse("register")
        payload = {
            "email": "test@example.com",
            "first_name": "Test",
            "last_name": "User",
            "phone": "+10000000000",
            "password": "StrongPass123",
            "confirm_password": "StrongPass123",
        }

        register_response = self.client.post(register_url, payload, format="json")
        self.assertEqual(register_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email="test@example.com").exists())

        login_url = reverse("login")
        login_response = self.client.post(
            login_url,
            {"email": "test@example.com", "password": "StrongPass123"},
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", login_response.data)

    def test_profile_requires_auth(self):
        profile_url = reverse("profile")
        response = self.client.get(profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
