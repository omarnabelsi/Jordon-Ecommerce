from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.products.models import Brand, Category, Product, ProductVariant

User = get_user_model()


class CartApiTests(APITestCase):
    def setUp(self):
        category = Category.objects.create(name="Basketball")
        brand = Brand.objects.create(name="Jordan")
        product = Product.objects.create(
            name="Jordan One",
            description="Desc",
            short_description="Short",
            price=Decimal("120.00"),
            category=category,
            brand=brand,
            sku="SKU-100",
        )
        self.variant = ProductVariant.objects.create(
            product=product,
            size="42",
            color_name="Red",
            color_hex="#DC2626",
            sku="SKU-100-R-42",
            stock_quantity=20,
        )

    def test_add_and_update_cart(self):
        add_response = self.client.post(
            reverse("cart-add"),
            {"product_variant_id": self.variant.id, "quantity": 2},
            format="json",
        )
        self.assertEqual(add_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(add_response.data["items"]), 1)

        item_id = add_response.data["items"][0]["id"]
        update_response = self.client.put(
            reverse("cart-update", kwargs={"item_id": item_id}),
            {"quantity": 3},
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data["items"][0]["quantity"], 3)
