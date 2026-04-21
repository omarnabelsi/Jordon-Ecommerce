from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.products.models import Brand, Category, Product, ProductVariant, ProductImage


class Command(BaseCommand):
    help = "Seeds the database with Nike-style sample products"

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Creating categories...")
        
        # Categories
        mens_cat = Category.objects.get_or_create(
            slug="men",
            defaults={"name": "Men", "description": "Men's footwear and apparel"}
        )[0]
        
        womens_cat = Category.objects.get_or_create(
            slug="women",
            defaults={"name": "Women", "description": "Women's footwear and apparel"}
        )[0]
        
        kids_cat = Category.objects.get_or_create(
            slug="kids",
            defaults={"name": "Kids", "description": "Children's footwear and apparel"}
        )[0]

        self.stdout.write("Creating brands...")
        
        # Brands
        nike = Brand.objects.get_or_create(
            slug="nike",
            defaults={"name": "Nike", "description": "Nike - Just Do It"}
        )[0]
        
        jordan = Brand.objects.get_or_create(
            slug="jordan",
            defaults={"name": "Air Jordan", "description": "Air Jordan - Legend"}
        )[0]

        self.stdout.write("Creating products...")

        # Product data with variants
        products_data = [
            {
                "name": "Air Jordan 1 Retro High",
                "slug": "air-jordan-1-retro-high",
                "description": "The Air Jordan 1 Retro High OG is inspired by the original 1985 release that started a legacy. This product emphasizes its classic colorways and premium construction.",
                "short_description": "Classic high-top basketball shoe with iconic silhouette",
                "price": Decimal("170.00"),
                "sale_price": Decimal("119.99"),
                "category": mens_cat,
                "brand": jordan,
                "sku": "AJ1RH-001",
                "weight": Decimal("0.45"),
                "is_featured": True,
                "images": [
                    {"image": "https://images.pexels.com/photos/1456706/pexels-photo-1456706.jpeg?auto=compress&cs=tinysrgb&w=900", "alt_text": "Front view", "is_primary": True, "order": 0},
                    {"image": "https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=900", "alt_text": "Side view", "is_primary": False, "order": 1},
                ],
                "variants": [
                    {"size": "7", "color_name": "Black/Red", "color_hex": "#1a1a1a", "sku": "AJ1RH-BR-7", "stock_quantity": 5, "price_adjustment": Decimal("0")},
                    {"size": "8", "color_name": "Black/Red", "color_hex": "#1a1a1a", "sku": "AJ1RH-BR-8", "stock_quantity": 8, "price_adjustment": Decimal("0")},
                    {"size": "9", "color_name": "Black/Red", "color_hex": "#1a1a1a", "sku": "AJ1RH-BR-9", "stock_quantity": 10, "price_adjustment": Decimal("0")},
                    {"size": "10", "color_name": "Black/Red", "color_hex": "#1a1a1a", "sku": "AJ1RH-BR-10", "stock_quantity": 6, "price_adjustment": Decimal("0")},
                    {"size": "7", "color_name": "White/Gold", "color_hex": "#ffffff", "sku": "AJ1RH-WG-7", "stock_quantity": 3, "price_adjustment": Decimal("10.00")},
                    {"size": "8", "color_name": "White/Gold", "color_hex": "#ffffff", "sku": "AJ1RH-WG-8", "stock_quantity": 5, "price_adjustment": Decimal("10.00")},
                    {"size": "9", "color_name": "Purple", "color_hex": "#6b21a8", "sku": "AJ1RH-PU-9", "stock_quantity": 2, "price_adjustment": Decimal("20.00")},
                ]
            },
            {
                "name": "Nike Air Max 90",
                "slug": "nike-air-max-90",
                "description": "The Nike Air Max 90 combines a smooth-stepping Max Air unit with a track-inspired tread pattern. Heritage design and all-day comfort make it a classic.",
                "short_description": "Legendary sneaker with visible Air cushioning",
                "price": Decimal("130.00"),
                "sale_price": None,
                "category": mens_cat,
                "brand": nike,
                "sku": "NMAX90-001",
                "weight": Decimal("0.42"),
                "is_featured": True,
                "images": [
                    {"image": "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=900", "alt_text": "Front view", "is_primary": True, "order": 0},
                ],
                "variants": [
                    {"size": "6", "color_name": "White", "color_hex": "#ffffff", "sku": "NMAX90-W-6", "stock_quantity": 4, "price_adjustment": Decimal("0")},
                    {"size": "7", "color_name": "White", "color_hex": "#ffffff", "sku": "NMAX90-W-7", "stock_quantity": 7, "price_adjustment": Decimal("0")},
                    {"size": "8", "color_name": "White", "color_hex": "#ffffff", "sku": "NMAX90-W-8", "stock_quantity": 9, "price_adjustment": Decimal("0")},
                    {"size": "6", "color_name": "Black", "color_hex": "#000000", "sku": "NMAX90-B-6", "stock_quantity": 2, "price_adjustment": Decimal("0")},
                    {"size": "7", "color_name": "Black", "color_hex": "#000000", "sku": "NMAX90-B-7", "stock_quantity": 5, "price_adjustment": Decimal("0")},
                ]
            },
            {
                "name": "Nike React Infinity Run",
                "slug": "nike-react-infinity-run",
                "description": "Designed for comfort and performance, the Nike React Infinity Run features Nike's React foam for responsive cushioning.",
                "short_description": "Modern running shoe with responsive cushioning",
                "price": Decimal("160.00"),
                "sale_price": Decimal("99.99"),
                "category": womens_cat,
                "brand": nike,
                "sku": "NREACT-001",
                "weight": Decimal("0.35"),
                "is_featured": True,
                "images": [
                    {"image": "https://images.pexels.com/photos/19090/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=900", "alt_text": "Front view", "is_primary": True, "order": 0},
                ],
                "variants": [
                    {"size": "5", "color_name": "Pink", "color_hex": "#ec4899", "sku": "NREACT-P-5", "stock_quantity": 6, "price_adjustment": Decimal("0")},
                    {"size": "6", "color_name": "Pink", "color_hex": "#ec4899", "sku": "NREACT-P-6", "stock_quantity": 8, "price_adjustment": Decimal("0")},
                    {"size": "7", "color_name": "Pink", "color_hex": "#ec4899", "sku": "NREACT-P-7", "stock_quantity": 5, "price_adjustment": Decimal("0")},
                    {"size": "5", "color_name": "Blue", "color_hex": "#3b82f6", "sku": "NREACT-BL-5", "stock_quantity": 3, "price_adjustment": Decimal("0")},
                ]
            },
            {
                "name": "Jordan XXXVII",
                "slug": "jordan-xxxvii",
                "description": "The Air Jordan XXXVII represents the latest in basketball innovation, honoring the legacy while pushing performance forward.",
                "short_description": "Next-generation basketball performance shoe",
                "price": Decimal("185.00"),
                "sale_price": None,
                "category": mens_cat,
                "brand": jordan,
                "sku": "J37-001",
                "weight": Decimal("0.48"),
                "is_featured": False,
                "images": [
                    {"image": "https://images.pexels.com/photos/2529157/pexels-photo-2529157.jpeg?auto=compress&cs=tinysrgb&w=900", "alt_text": "Front view", "is_primary": True, "order": 0},
                ],
                "variants": [
                    {"size": "8", "color_name": "Black/Gold", "color_hex": "#1a1a1a", "sku": "J37-BG-8", "stock_quantity": 4, "price_adjustment": Decimal("0")},
                    {"size": "9", "color_name": "Black/Gold", "color_hex": "#1a1a1a", "sku": "J37-BG-9", "stock_quantity": 6, "price_adjustment": Decimal("0")},
                ]
            },
            {
                "name": "Nike Force 1 Low",
                "slug": "nike-force-1-low",
                "description": "The radiance lives on in the Nike Force 1. This kid's shoe carries on the legacy with the same clean lines you've come to love.",
                "short_description": "Classic kids shoe with timeless design",
                "price": Decimal("70.00"),
                "sale_price": None,
                "category": kids_cat,
                "brand": nike,
                "sku": "NF1K-001",
                "weight": Decimal("0.28"),
                "is_featured": False,
                "images": [
                    {"image": "https://images.pexels.com/photos/267202/pexels-photo-267202.jpeg?auto=compress&cs=tinysrgb&w=900", "alt_text": "Front view", "is_primary": True, "order": 0},
                ],
                "variants": [
                    {"size": "2", "color_name": "White/Red", "color_hex": "#ffffff", "sku": "NF1K-WR-2", "stock_quantity": 5, "price_adjustment": Decimal("0")},
                    {"size": "2.5", "color_name": "White/Red", "color_hex": "#ffffff", "sku": "NF1K-WR-25", "stock_quantity": 7, "price_adjustment": Decimal("0")},
                    {"size": "3", "color_name": "White/Red", "color_hex": "#ffffff", "sku": "NF1K-WR-3", "stock_quantity": 6, "price_adjustment": Decimal("0")},
                ]
            },
            {
                "name": "Nike Dunk Low Retro",
                "slug": "nike-dunk-low-retro",
                "description": "A streetwear icon returns with crisp overlays and a padded low-cut collar for all-day comfort.",
                "short_description": "Low-profile classic with everyday comfort",
                "price": Decimal("125.00"),
                "sale_price": Decimal("109.99"),
                "category": mens_cat,
                "brand": nike,
                "sku": "NDLR-001",
                "weight": Decimal("0.39"),
                "is_featured": True,
                "images": [
                    {"image": "https://images.pexels.com/photos/1032110/pexels-photo-1032110.jpeg?auto=compress&cs=tinysrgb&w=900", "alt_text": "Front view", "is_primary": True, "order": 0},
                ],
                "variants": [
                    {"size": "7", "color_name": "White/Black", "color_hex": "#f8f8f8", "sku": "NDLR-WB-7", "stock_quantity": 9, "price_adjustment": Decimal("0")},
                    {"size": "8", "color_name": "White/Black", "color_hex": "#f8f8f8", "sku": "NDLR-WB-8", "stock_quantity": 8, "price_adjustment": Decimal("0")},
                    {"size": "9", "color_name": "Navy", "color_hex": "#1e3a8a", "sku": "NDLR-NV-9", "stock_quantity": 5, "price_adjustment": Decimal("5.00")},
                ]
            },
            {
                "name": "Air Jordan 4 Midnight",
                "slug": "air-jordan-4-midnight",
                "description": "The AJ4 blends iconic court heritage with premium materials and a supportive fit.",
                "short_description": "Premium mid-top with heritage details",
                "price": Decimal("210.00"),
                "sale_price": None,
                "category": mens_cat,
                "brand": jordan,
                "sku": "AJ4M-001",
                "weight": Decimal("0.47"),
                "is_featured": False,
                "images": [
                    {"image": "https://images.pexels.com/photos/2529159/pexels-photo-2529159.jpeg?auto=compress&cs=tinysrgb&w=900", "alt_text": "Front view", "is_primary": True, "order": 0},
                ],
                "variants": [
                    {"size": "8", "color_name": "Midnight", "color_hex": "#0f172a", "sku": "AJ4M-MD-8", "stock_quantity": 4, "price_adjustment": Decimal("0")},
                    {"size": "9", "color_name": "Midnight", "color_hex": "#0f172a", "sku": "AJ4M-MD-9", "stock_quantity": 6, "price_adjustment": Decimal("0")},
                    {"size": "10", "color_name": "Crimson", "color_hex": "#dc2626", "sku": "AJ4M-CR-10", "stock_quantity": 3, "price_adjustment": Decimal("15.00")},
                ]
            },
            {
                "name": "Nike Pegasus Trail 4",
                "slug": "nike-pegasus-trail-4",
                "description": "From pavement to path, Pegasus Trail 4 offers responsive cushioning and dependable grip.",
                "short_description": "Trail runner built for mixed terrain",
                "price": Decimal("145.00"),
                "sale_price": Decimal("119.00"),
                "category": womens_cat,
                "brand": nike,
                "sku": "NPTR4-001",
                "weight": Decimal("0.36"),
                "is_featured": True,
                "images": [
                    {"image": "https://images.pexels.com/photos/6311605/pexels-photo-6311605.jpeg?auto=compress&cs=tinysrgb&w=900", "alt_text": "Front view", "is_primary": True, "order": 0},
                ],
                "variants": [
                    {"size": "6", "color_name": "Sage", "color_hex": "#84a98c", "sku": "NPTR4-SG-6", "stock_quantity": 7, "price_adjustment": Decimal("0")},
                    {"size": "7", "color_name": "Sage", "color_hex": "#84a98c", "sku": "NPTR4-SG-7", "stock_quantity": 5, "price_adjustment": Decimal("0")},
                    {"size": "8", "color_name": "Sand", "color_hex": "#d6c2a1", "sku": "NPTR4-SD-8", "stock_quantity": 5, "price_adjustment": Decimal("0")},
                ]
            },
            {
                "name": "Jordan Luka 2 Kids",
                "slug": "jordan-luka-2-kids",
                "description": "Built for young hoopers, Luka 2 delivers stability and spring for quick moves.",
                "short_description": "Performance basketball shoe for kids",
                "price": Decimal("95.00"),
                "sale_price": None,
                "category": kids_cat,
                "brand": jordan,
                "sku": "JLK2K-001",
                "weight": Decimal("0.30"),
                "is_featured": False,
                "images": [
                    {"image": "https://images.pexels.com/photos/6311641/pexels-photo-6311641.jpeg?auto=compress&cs=tinysrgb&w=900", "alt_text": "Front view", "is_primary": True, "order": 0},
                ],
                "variants": [
                    {"size": "3", "color_name": "Volt", "color_hex": "#84cc16", "sku": "JLK2K-VT-3", "stock_quantity": 6, "price_adjustment": Decimal("0")},
                    {"size": "3.5", "color_name": "Volt", "color_hex": "#84cc16", "sku": "JLK2K-VT-35", "stock_quantity": 4, "price_adjustment": Decimal("0")},
                    {"size": "4", "color_name": "Royal", "color_hex": "#1d4ed8", "sku": "JLK2K-RY-4", "stock_quantity": 5, "price_adjustment": Decimal("0")},
                ]
            },
        ]

        for product_data in products_data:
            images = product_data.pop("images")
            variants = product_data.pop("variants")

            product, created = Product.objects.get_or_create(
                slug=product_data["slug"],
                defaults=product_data
            )

            if created:
                self.stdout.write(f"  Created: {product.name}")

                # Create images
                for image_data in images:
                    ProductImage.objects.create(product=product, **image_data)

                # Create variants
                for variant_data in variants:
                    ProductVariant.objects.create(product=product, **variant_data)
            else:
                self.stdout.write(f"  Updated images: {product.name} (already exists)")
                product.images.all().delete()
                for image_data in images:
                    ProductImage.objects.create(product=product, **image_data)

        self.stdout.write(self.style.SUCCESS("Successfully seeded database with sample products!"))
