export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export interface ProductVariant {
  id: number;
  size: string;
  color_name: string;
  color_hex: string;
  sku: string;
  stock_quantity: number;
  price_adjustment: string;
  final_price: string;
  is_in_stock: boolean;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: string;
  sale_price?: string | null;
  current_price: string;
  weight?: string | null;
  category: Category;
  brand: Brand;
  sku: string;
  is_featured: boolean;
  primary_image?: string | null;
  images?: Array<{
    id: number;
    image: string;
    alt_text: string;
    is_primary: boolean;
    order: number;
  }>;
  variants?: ProductVariant[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface CartItem {
  id: number;
  variant_id: number;
  product_name: string;
  product_slug: string;
  size: string;
  color_name: string;
  color_hex: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  stock_quantity: number;
}

export interface Cart {
  id: number;
  items: CartItem[];
  subtotal: string;
  stock_reserved_until: string | null;
}

export interface ApiError {
  detail?: string;
  [key: string]: unknown;
}
