from decimal import Decimal

from django.db import models
from django.utils.text import slugify


class Category(models.Model):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True, blank=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="categories/", blank=True, null=True)
    parent = models.ForeignKey(
        "self",
        related_name="children",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Brand(models.Model):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True, blank=True)
    logo = models.ImageField(upload_to="brands/", blank=True, null=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=220)
    slug = models.SlugField(max_length=240, unique=True, blank=True)
    description = models.TextField()
    short_description = models.CharField(max_length=300)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    category = models.ForeignKey("products.Category", related_name="products", on_delete=models.PROTECT)
    brand = models.ForeignKey("products.Brand", related_name="products", on_delete=models.PROTECT)
    sku = models.CharField(max_length=64, unique=True)
    weight = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    @property
    def current_price(self) -> Decimal:
        return self.sale_price if self.sale_price else self.price

    def __str__(self):
        return self.name


class ProductImage(models.Model):
    product = models.ForeignKey("products.Product", related_name="images", on_delete=models.CASCADE)
    image = models.ImageField(upload_to="products/")
    alt_text = models.CharField(max_length=255, blank=True)
    is_primary = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"{self.product.name} image #{self.id}"


class ProductVariant(models.Model):
    product = models.ForeignKey("products.Product", related_name="variants", on_delete=models.CASCADE)
    size = models.CharField(max_length=20)
    color_name = models.CharField(max_length=60)
    color_hex = models.CharField(max_length=7)
    sku = models.CharField(max_length=80, unique=True)
    stock_quantity = models.PositiveIntegerField(default=0)
    price_adjustment = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("0.00"))

    class Meta:
        unique_together = ("product", "size", "color_name")
        ordering = ["product", "size", "color_name"]

    @property
    def final_price(self) -> Decimal:
        return self.product.current_price + self.price_adjustment

    @property
    def is_in_stock(self) -> bool:
        return self.stock_quantity > 0

    def __str__(self):
        return f"{self.product.name} - {self.size} - {self.color_name}"
