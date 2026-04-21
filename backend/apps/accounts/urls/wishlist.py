from django.urls import path

from apps.accounts.views import WishlistAddView, WishlistListView, WishlistRemoveView

urlpatterns = [
    path("", WishlistListView.as_view(), name="wishlist-list"),
    path("add/", WishlistAddView.as_view(), name="wishlist-add"),
    path("remove/<int:id>/", WishlistRemoveView.as_view(), name="wishlist-remove"),
]
