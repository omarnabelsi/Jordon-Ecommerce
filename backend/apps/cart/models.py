from datetime import timedelta

from django.conf import settings
from django.db import models
from django.db.models import Q
from django.utils import timezone


class Cart(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="carts",
        on_delete=models.CASCADE,
        blank=True,
        null=True,
    )
    session_id = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    stock_reserved_until = models.DateTimeField(blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user"],
                condition=Q(user__isnull=False),
                name="unique_active_cart_per_user",
            )
        ]

    @property
    def subtotal(self):
        return sum(item.total_price for item in self.items.select_related("product_variant", "product_variant__product"))

    @property
    def reservation_active(self) -> bool:
        if not self.stock_reserved_until:
            return False
        return timezone.now() <= self.stock_reserved_until

    def refresh_reservation(self):
        self.stock_reserved_until = timezone.now() + timedelta(minutes=15)
        self.save(update_fields=["stock_reserved_until", "updated_at"])

    def __str__(self):
        return f"Cart #{self.id}"


class CartItem(models.Model):
    cart = models.ForeignKey("cart.Cart", related_name="items", on_delete=models.CASCADE)
    product_variant = models.ForeignKey("products.ProductVariant", related_name="cart_items", on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("cart", "product_variant")

    @property
    def unit_price(self):
        return self.product_variant.final_price

    @property
    def total_price(self):
        return self.unit_price * self.quantity

    def __str__(self):
        return f"{self.product_variant.sku} x {self.quantity}"
