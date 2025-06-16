export interface Order {
  id: string
  order_code: string
  customer_id: string
  vendor_id: string
  rider_id?: string
  status: OrderStatus
  total_amount: number
  delivery_address: string
  customer_name: string
  customer_phone: string
  contact_number: string
  special_instructions?: string
  created_at: string
  updated_at: string
  estimated_delivery_time?: string
  actual_delivery_time?: string
  payment_method: string
  payment_status: string
  loyalty_points_redeemed: number
  discount_amount: number
  original_amount: number
  delivery_fee: number
  distance_km: number
  delivery_city?: string
  delivery_state?: string
  delivery_zip?: string
  timer_adjustments_count?: number // Add this field
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  menu_item_name: string
  quantity: number
  price_per_item: number
  special_requests?: string
  image_url?: string
}

export type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "picked_up" | "delivered" | "cancelled"
