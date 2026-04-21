from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.products.models import Brand, Category, Product


class ProductApiTests(APITestCase):
    def setUp(self):
        category = Category.objects.create(name="Basketball")
        brand = Brand.objects.create(name="Jordan")
        Product.objects.create(
            name="Jordan Jumpman 2021 PF",
            description="High performance basketball shoe",
            short_description="Premium basketball sneaker",
            price=Decimal("134.00"),
            category=category,
            brand=brand,
            sku="JMP-2021-PF",
            is_featured=True,
        )

    def test_products_list(self):
        response = self.client.get(reverse("products-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_featured_products(self):
        response = self.client.get(reverse("products-featured"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
