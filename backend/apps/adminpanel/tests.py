from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.orders.models import Order
from apps.products.models import Brand, Category, Product, ProductVariant

User = get_user_model()


class AdminPanelApiTests(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            email="admin@example.com",
            password="StrongPass123",
            is_staff=True,
            is_superuser=True,
        )
        self.customer = User.objects.create_user(
            email="customer@example.com",
            password="StrongPass123",
        )

        category = Category.objects.create(name="Basketball")
        brand = Brand.objects.create(name="Jordan")
        self.product = Product.objects.create(
            name="Jordan Admin Sneaker",
            description="Product for admin tests",
            short_description="Admin test product",
            price=Decimal("200.00"),
            category=category,
            brand=brand,
            sku="ADMIN-SNK-001",
        )
        self.variant = ProductVariant.objects.create(
            product=self.product,
            size="42",
            color_name="Red",
            color_hex="#ff0000",
            sku="ADMIN-SNK-001-RED-42",
            stock_quantity=6,
        )

        self.order = Order.objects.create(
            user=self.customer,
            order_number=Order.next_order_number(),
            total_amount=Decimal("200.00"),
            shipping_amount=Decimal("0.00"),
            tax_amount=Decimal("16.00"),
            grand_total=Decimal("216.00"),
            shipping_address={"city": "New York"},
            billing_address={"city": "New York"},
            payment_method="mock",
        )

    def test_dashboard_requires_admin(self):
        self.client.force_authenticate(self.customer)
        response = self.client.get(reverse("admin-dashboard"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_dashboard_for_admin(self):
        self.client.force_authenticate(self.admin_user)
        response = self.client.get(reverse("admin-dashboard"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("kpis", response.data)

    def test_admin_can_update_order_status(self):
        self.client.force_authenticate(self.admin_user)
        response = self.client.patch(
            reverse("admin-order-status-update", kwargs={"id": self.order.id}),
            {"status": Order.STATUS_PROCESSING, "payment_status": Order.PAYMENT_PAID},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, Order.STATUS_PROCESSING)

    def test_admin_can_create_product(self):
        self.client.force_authenticate(self.admin_user)
        response = self.client.post(
            reverse("admin-products"),
            {
                "name": "Jordan New Admin Product",
                "description": "New product",
                "short_description": "New product short",
                "price": "175.00",
                "sale_price": "150.00",
                "category": self.product.category_id,
                "brand": self.product.brand_id,
                "sku": "ADMIN-SNK-NEW",
                "is_active": True,
                "is_featured": False,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
