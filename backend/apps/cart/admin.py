from django.contrib import admin

from apps.cart.models import Cart, CartItem


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "session_id", "updated_at", "stock_reserved_until")
    list_filter = ("updated_at",)
    search_fields = ("user__email", "session_id")
    inlines = [CartItemInline]


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ("cart", "product_variant", "quantity", "added_at")
    search_fields = ("product_variant__sku", "product_variant__product__name")
