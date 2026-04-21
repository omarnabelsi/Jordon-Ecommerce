import { PaginatedResponse } from "@/types";

export interface AdminLookupData {
  categories: Array<{ id: number; name: string }>;
  brands: Array<{ id: number; name: string }>;
  order_statuses: string[];
  payment_statuses: string[];
}

export interface AdminDashboardData {
  kpis: {
    total_revenue: number;
    revenue_growth: number;
    total_orders: number;
    orders_today: number;
    avg_order_value: number;
    pending_orders: number;
    total_customers: number;
    new_customers_30d: number;
    low_stock_count: number;
    unread_messages: number;
  };
  revenue_series: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  status_distribution: Array<{
    status: string;
    count: number;
  }>;
  top_products: Array<{
    product_id: number;
    product_name: string;
    sku: string;
    units: number;
    revenue: number;
  }>;
  category_sales: Array<{
    category: string;
    revenue: number;
    units: number;
  }>;
  recent_orders: Array<{
    id: number;
    order_number: string;
    customer_email: string;
    status: string;
    payment_status: string;
    grand_total: string;
    created_at: string;
  }>;
  inventory_alerts: Array<{
    id: number;
    product_id: number;
    product_name: string;
    sku: string;
    size: string;
    color_name: string;
    stock_quantity: number;
  }>;
  monthly_revenue: Array<{
    month: string;
    revenue: number;
  }>;
}

export interface AdminProduct {
  id: number;
  name: string;
  slug: string;
  sku: string;
  price: string;
  sale_price: string | null;
  is_active: boolean;
  is_featured: boolean;
  category: {
    id: number;
    name: string;
  };
  brand: {
    id: number;
    name: string;
  };
  primary_image: string | null;
  total_stock: number;
  created_at: string;
  updated_at: string;
}

export interface AdminProductDetail {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: string;
  sale_price: string | null;
  category: {
    id: number;
    name: string;
  };
  brand: {
    id: number;
    name: string;
  };
  sku: string;
  weight: string | null;
  is_active: boolean;
  is_featured: boolean;
  images: Array<{
    id: number;
    image: string;
    alt_text: string;
    is_primary: boolean;
    order: number;
  }>;
  variants: AdminProductVariant[];
  created_at: string;
  updated_at: string;
}

export interface AdminProductVariant {
  id: number;
  product: number;
  size: string;
  color_name: string;
  color_hex: string;
  sku: string;
  stock_quantity: number;
  price_adjustment: string;
  final_price: string;
}

export interface AdminOrderRow {
  id: number;
  order_number: string;
  customer_email: string;
  customer_name: string;
  status: string;
  payment_status: string;
  grand_total: string;
  tracking_number: string;
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminOrderDetail {
  id: number;
  order_number: string;
  customer_email: string;
  customer_name: string;
  status: string;
  payment_status: string;
  payment_method: string;
  tracking_number: string;
  notes: string;
  total_amount: string;
  shipping_amount: string;
  tax_amount: string;
  grand_total: string;
  shipping_address: Record<string, string>;
  billing_address: Record<string, string>;
  items: Array<{
    id: number;
    product_name: string;
    quantity: number;
    unit_price: string;
    total_price: string;
    variant_sku: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface AdminUserRow {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_active: boolean;
  is_staff: boolean;
  date_joined: string;
  last_login: string | null;
  order_count: number;
  lifetime_value: string;
}

export type AdminPaginatedProducts = PaginatedResponse<AdminProduct>;
export type AdminPaginatedOrders = PaginatedResponse<AdminOrderRow>;
export type AdminPaginatedUsers = PaginatedResponse<AdminUserRow>;
