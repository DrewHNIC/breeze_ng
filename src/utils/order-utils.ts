// utils/order-utils.ts
import { supabase } from "@/utils/supabase";

// Points awarded per order
const POINTS_PER_ORDER = 1;
// Points needed for 50% discount
const POINTS_THRESHOLD = 10;
// Discount percentage when redeeming points
const DISCOUNT_PERCENTAGE = 50;

export async function calculateOrderTotal(
  subtotal: number,
  deliveryFee: number,
  serviceFee: number,
  vat: number,
  redeemPoints: boolean,
  customerId: string
) {
  // Get customer's current loyalty points
  const { data: customer, error } = await supabase
    .from("customers")
    .select("loyalty_points")
    .eq("id", customerId)
    .single();

  if (error || !customer) {
    console.error("Error fetching customer loyalty points:", error);
    return {
      subtotal,
      deliveryFee,
      serviceFee,
      vat,
      discount: 0,
      total: subtotal + deliveryFee + serviceFee + vat,
      pointsRedeemed: 0,
      canRedeemPoints: false,
    };
  }

  const availablePoints = customer.loyalty_points || 0;
  const canRedeemPoints = availablePoints >= POINTS_THRESHOLD;
  
  let discount = 0;
  let pointsRedeemed = 0;
  
  // Apply discount if customer wants to redeem points and has enough
  if (redeemPoints && canRedeemPoints) {
    discount = (subtotal * DISCOUNT_PERCENTAGE) / 100;
    pointsRedeemed = POINTS_THRESHOLD;
  }
  
  const total = subtotal + deliveryFee + serviceFee + vat - discount;
  
  return {
    subtotal,
    deliveryFee,
    serviceFee,
    vat,
    discount,
    total,
    pointsRedeemed,
    canRedeemPoints,
  };
}

export async function awardLoyaltyPoints(customerId: string, pointsToAward: number = POINTS_PER_ORDER) {
  try {
    // Get current points
    const { data: customer, error: fetchError } = await supabase
      .from("customers")
      .select("loyalty_points")
      .eq("id", customerId)
      .single();
    
    if (fetchError || !customer) {
      console.error("Error fetching customer for loyalty points:", fetchError);
      return false;
    }
    
    const currentPoints = customer.loyalty_points || 0;
    const newPoints = currentPoints + pointsToAward;
    
    // Update points
    const { error: updateError } = await supabase
      .from("customers")
      .update({ loyalty_points: newPoints })
      .eq("id", customerId);
    
    if (updateError) {
      console.error("Error updating loyalty points:", updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in awardLoyaltyPoints:", error);
    return false;
  }
}

export async function redeemLoyaltyPoints(customerId: string, pointsToRedeem: number) {
  try {
    // Get current points
    const { data: customer, error: fetchError } = await supabase
      .from("customers")
      .select("loyalty_points")
      .eq("id", customerId)
      .single();
    
    if (fetchError || !customer) {
      console.error("Error fetching customer for loyalty points redemption:", fetchError);
      return false;
    }
    
    const currentPoints = customer.loyalty_points || 0;
    
    // Ensure customer has enough points
    if (currentPoints < pointsToRedeem) {
      return false;
    }
    
    const newPoints = currentPoints - pointsToRedeem;
    
    // Update points
    const { error: updateError } = await supabase
      .from("customers")
      .update({ loyalty_points: newPoints })
      .eq("id", customerId);
    
    if (updateError) {
      console.error("Error updating loyalty points after redemption:", updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in redeemLoyaltyPoints:", error);
    return false;
  }
}