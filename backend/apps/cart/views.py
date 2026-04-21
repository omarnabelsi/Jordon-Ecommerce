from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.cart.models import CartItem
from apps.cart.serializers import AddToCartSerializer, CartSerializer, UpdateCartItemSerializer
from apps.cart.services import get_or_create_cart
from apps.products.models import ProductVariant


class CartView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        cart = get_or_create_cart(request)
        cart.refresh_reservation()
        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)


class AddToCartView(APIView):
    permission_classes = [permissions.AllowAny]

    @transaction.atomic
    def post(self, request):
        serializer = AddToCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart = get_or_create_cart(request)
        variant = get_object_or_404(ProductVariant.objects.select_for_update(), pk=serializer.validated_data["product_variant_id"])
        quantity = serializer.validated_data["quantity"]

        cart_item, created = CartItem.objects.select_for_update().get_or_create(
            cart=cart,
            product_variant=variant,
            defaults={"quantity": quantity},
        )

        if not created:
            quantity += cart_item.quantity

        if quantity > variant.stock_quantity:
            return Response({"detail": "Insufficient stock."}, status=status.HTTP_400_BAD_REQUEST)

        cart_item.quantity = quantity
        cart_item.save(update_fields=["quantity"])
        cart.refresh_reservation()

        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)


class UpdateCartItemView(APIView):
    permission_classes = [permissions.AllowAny]

    @transaction.atomic
    def put(self, request, item_id: int):
        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart = get_or_create_cart(request)
        cart_item = get_object_or_404(CartItem.objects.select_related("product_variant"), id=item_id, cart=cart)
        quantity = serializer.validated_data["quantity"]

        if quantity > cart_item.product_variant.stock_quantity:
            return Response({"detail": "Insufficient stock."}, status=status.HTTP_400_BAD_REQUEST)

        cart_item.quantity = quantity
        cart_item.save(update_fields=["quantity"])
        cart.refresh_reservation()

        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)


class RemoveCartItemView(APIView):
    permission_classes = [permissions.AllowAny]

    def delete(self, request, item_id: int):
        cart = get_or_create_cart(request)
        item = get_object_or_404(CartItem, id=item_id, cart=cart)
        item.delete()
        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)


class ClearCartView(APIView):
    permission_classes = [permissions.AllowAny]

    def delete(self, request):
        cart = get_or_create_cart(request)
        cart.items.all().delete()
        cart.refresh_reservation()
        return Response({"detail": "Cart cleared."}, status=status.HTTP_204_NO_CONTENT)
