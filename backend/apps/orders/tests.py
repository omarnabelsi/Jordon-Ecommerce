from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.products.models import Brand, Category, Product, ProductVariant

User = get_user_model()


class OrderApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="buyer@example.com", password="StrongPass123")
        self.client.force_authenticate(self.user)

        category = Category.objects.create(name="Lifestyle")
        brand = Brand.objects.create(name="Nike")
        product = Product.objects.create(
            name="Nike Air",
            description="Desc",
            short_description="Short",
            price=Decimal("150.00"),
            category=category,
            brand=brand,
            sku="NK-001",
        )
        self.variant = ProductVariant.objects.create(
            product=product,
            size="43",
            color_name="Black",
            color_hex="#000000",
            sku="NK-001-BK-43",
            stock_quantity=10,
        )

    def test_create_and_cancel_order(self):
        self.client.post(
            reverse("cart-add"),
            {"product_variant_id": self.variant.id, "quantity": 2},
            format="json",
        )

        create_response = self.client.post(
            reverse("orders-create"),
            {
                "shipping_address": {
                    "first_name": "Buyer",
                    "last_name": "User",
                    "address_line1": "123 Main Street",
                    "city": "New York",
                    "state": "NY",
                    "postal_code": "10001",
                    "country": "US",
                    "phone": "+10000000000",
                },
                "payment_method": "mock",
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)

        order_id = create_response.data["id"]
        cancel_response = self.client.post(reverse("orders-cancel", kwargs={"id": order_id}))
        self.assertEqual(cancel_response.status_code, status.HTTP_200_OK)

    def test_guest_checkout_rejects_existing_account_email(self):
        self.client.force_authenticate(user=None)
        self.client.post(
            reverse("cart-add"),
            {"product_variant_id": self.variant.id, "quantity": 1},
            format="json",
        )

        response = self.client.post(
            reverse("orders-create"),
            {
                "shipping_address": {
                    "first_name": "Guest",
                    "last_name": "Buyer",
                    "address_line1": "123 Main Street",
                    "city": "New York",
                    "state": "NY",
                    "postal_code": "10001",
                    "country": "US",
                    "phone": "+10000000000",
                },
                "payment_method": "mock",
                "guest_email": "buyer@example.com",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Please sign in", response.data["detail"])
