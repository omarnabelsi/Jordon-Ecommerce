from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.cart.services import get_or_create_cart
from apps.orders.models import Order, OrderItem
from apps.orders.serializers import OrderCreateSerializer, OrderSerializer
from apps.products.models import ProductVariant

User = get_user_model()


class OrderCreateView(APIView):
    permission_classes = [permissions.AllowAny]

    @transaction.atomic
    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart = get_or_create_cart(request)
        cart_items = list(cart.items.select_related("product_variant", "product_variant__product"))

        if not cart_items:
            return Response({"detail": "Cart is empty."}, status=status.HTTP_400_BAD_REQUEST)

        if request.user.is_authenticated:
            order_user = request.user
        else:
            guest_email = serializer.validated_data.get("guest_email")
            if not guest_email:
                return Response(
                    {"guest_email": "guest_email is required for guest checkout."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            existing_user = User.objects.filter(email=guest_email).first()
            if existing_user and (existing_user.has_usable_password() or existing_user.is_staff or existing_user.is_superuser):
                return Response(
                    {"detail": "An account already exists with this email. Please sign in to place this order."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            order_user, created = User.objects.get_or_create(
                email=guest_email,
                defaults={
                    "first_name": "Guest",
                    "last_name": "Checkout",
                },
            )

            if created or order_user.has_usable_password():
                order_user.set_unusable_password()
                order_user.save(update_fields=["password"])

        subtotal = Decimal("0.00")
        locked_variants = {}

        for item in cart_items:
            variant = ProductVariant.objects.select_for_update().get(pk=item.product_variant_id)
            if item.quantity > variant.stock_quantity:
                return Response(
                    {"detail": f"Insufficient stock for {variant.product.name} ({variant.size}/{variant.color_name})."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            locked_variants[item.product_variant_id] = variant
            subtotal += variant.final_price * item.quantity

        shipping_amount = Decimal("0.00") if subtotal >= Decimal("200.00") else Decimal("15.00")
        tax_amount = (subtotal * Decimal("0.08")).quantize(Decimal("0.01"))
        grand_total = subtotal + shipping_amount + tax_amount

        order = Order.objects.create(
            user=order_user,
            order_number=Order.next_order_number(),
            status=Order.STATUS_PENDING,
            total_amount=subtotal,
            shipping_amount=shipping_amount,
            tax_amount=tax_amount,
            grand_total=grand_total,
            shipping_address=serializer.validated_data["shipping_address"],
            billing_address=serializer.validated_data.get("billing_address") or serializer.validated_data["shipping_address"],
            payment_method=serializer.validated_data.get("payment_method", "mock"),
            payment_status=Order.PAYMENT_PENDING,
            notes=serializer.validated_data.get("notes", ""),
        )

        for item in cart_items:
            variant = locked_variants[item.product_variant_id]
            unit_price = variant.final_price
            total_price = unit_price * item.quantity

            OrderItem.objects.create(
                order=order,
                product_variant=variant,
                product_name=variant.product.name,
                quantity=item.quantity,
                unit_price=unit_price,
                total_price=total_price,
            )

            variant.stock_quantity -= item.quantity
            variant.save(update_fields=["stock_quantity"])

        cart.items.all().delete()

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related("items").order_by("-created_at")


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related("items")


class OrderCancelView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, id: int):
        order = get_object_or_404(Order, id=id, user=request.user)

        if order.status in [Order.STATUS_SHIPPED, Order.STATUS_DELIVERED, Order.STATUS_CANCELLED]:
            return Response({"detail": "This order cannot be cancelled."}, status=status.HTTP_400_BAD_REQUEST)

        for item in order.items.select_related("product_variant"):
            variant = ProductVariant.objects.select_for_update().get(pk=item.product_variant_id)
            variant.stock_quantity += item.quantity
            variant.save(update_fields=["stock_quantity"])

        order.status = Order.STATUS_CANCELLED
        order.payment_status = Order.PAYMENT_REFUNDED if order.payment_status == Order.PAYMENT_PAID else order.payment_status
        order.save(update_fields=["status", "payment_status", "updated_at"])

        return Response({"detail": "Order cancelled successfully."}, status=status.HTTP_200_OK)
