from django.urls import path

from apps.accounts.views import AddressDetailView, AddressListCreateView, AddressSetDefaultView

urlpatterns = [
    path("", AddressListCreateView.as_view(), name="address-list-create"),
    path("<int:pk>/", AddressDetailView.as_view(), name="address-detail"),
    path("<int:pk>/default/", AddressSetDefaultView.as_view(), name="address-default"),
]
