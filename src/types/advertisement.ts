// types/advertisement.ts
export interface Advertisement {
  id: string;
  vendor_id: string;
  package_name: string;
  package_price: number;
  start_date: string;
  end_date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  created_at: string;
  updated_at: string;
}