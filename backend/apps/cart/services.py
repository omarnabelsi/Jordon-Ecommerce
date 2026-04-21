from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from apps.cart.models import Cart, CartItem


GUEST_CART_TTL_DAYS = 30


def _get_session_id(request) -> str:
    if not request.session.session_key:
        request.session.save()
    return request.session.session_key


@transaction.atomic
def get_or_create_cart(request):
    session_id = _get_session_id(request)

    Cart.objects.filter(
        user__isnull=True,
        updated_at__lt=timezone.now() - timedelta(days=GUEST_CART_TTL_DAYS),
    ).delete()

    if request.user.is_authenticated:
        user_cart, _ = Cart.objects.get_or_create(user=request.user, defaults={"session_id": session_id})
        guest_cart = Cart.objects.filter(user__isnull=True, session_id=session_id).exclude(pk=user_cart.pk).first()
        if guest_cart:
            _merge_carts(source_cart=guest_cart, target_cart=user_cart)
        return user_cart

    guest_cart, _ = Cart.objects.get_or_create(user=None, session_id=session_id)
    return guest_cart


@transaction.atomic
def _merge_carts(source_cart: Cart, target_cart: Cart):
    for item in source_cart.items.select_related("product_variant"):
        merged_item, created = CartItem.objects.get_or_create(
            cart=target_cart,
            product_variant=item.product_variant,
            defaults={"quantity": item.quantity},
        )
        if not created:
            merged_item.quantity += item.quantity
            merged_item.save(update_fields=["quantity"])
    source_cart.delete()
