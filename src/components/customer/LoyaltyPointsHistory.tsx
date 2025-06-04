// components/customer/LoyaltyPointsHistory.tsx
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';

interface PointsHistoryItem {
  id: string;
  created_at: string;
  order_id: string;
  points: number;
  type: "earned" | "redeemed";
}

export default function LoyaltyPointsHistory({ customerId }: { customerId: string }) {
  const [history, setHistory] = useState<PointsHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Added error state
  
  useEffect(() => {
    const fetchPointsHistory = async () => {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      try {
        // Fetch orders with points earned (no redemption)
        const { data: earnedData, error: earnedError } = await supabase
          .from("orders")
          .select("id, created_at")
          .eq("customer_id", customerId)
          .eq("loyalty_points_redeemed", 0)
          .order("created_at", { ascending: false })
          .limit(10);
        
        if (earnedError) {
          console.error("Error fetching earned points history:", earnedError);
          setError("Failed to load earned points history."); // Set error message
          setLoading(false);
          return;
        }
        
        // Fetch orders with points redeemed
        const { data: redeemedData, error: redeemedError } = await supabase
          .from("orders")
          .select("id, created_at, loyalty_points_redeemed")
          .eq("customer_id", customerId)
          .gt("loyalty_points_redeemed", 0)
          .order("created_at", { ascending: false });
        
        if (redeemedError) {
          console.error("Error fetching redeemed points history:", redeemedError);
          setError("Failed to load redeemed points history."); // Set error message
          setLoading(false);
          return;
        }
        
        // Format earned points
        const earnedPoints = earnedData.map(order => ({
          id: `earned-${order.id}`,
          created_at: order.created_at,
          order_id: order.id,
          points: 1, // 1 point per order
          type: "earned" as const
        }));
        
        // Format redeemed points
        const redeemedPoints = redeemedData.map(order => ({
          id: `redeemed-${order.id}`,
          created_at: order.created_at,
          order_id: order.id,
          points: order.loyalty_points_redeemed,
          type: "redeemed" as const
        }));
        
        // Combine and sort by date
        const combinedHistory = [...earnedPoints, ...redeemedPoints].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        setHistory(combinedHistory);
      } catch (error) {
        console.error("Error in fetchPointsHistory:", error);
        setError("An unexpected error occurred. Please try again."); // Set generic error message
      } finally {
        setLoading(false);
      }
    };
    
    if (customerId) {
      fetchPointsHistory();
    }
  }, [customerId]);
  
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>{error}</p> {/* Display error message */}
      </div>
    );
  }
  
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No loyalty points activity yet.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg">Points Activity</h3>
      <div className="space-y-2">
        {history.map((item) => (
          <div 
            key={item.id} 
            className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 shadow-sm"
          >
            <div className="flex items-center">
              {item.type === "earned" ? (
                <div className="bg-green-100 p-2 rounded-full mr-3">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              ) : (
                <div className="bg-yellow-100 p-2 rounded-full mr-3">
                  <TrendingDown className="h-5 w-5 text-yellow-600" />
                </div>
              )}
              <div>
                <p className="font-medium">
                  {item.type === "earned" ? "Earned Points" : "Redeemed Points"}
                </p>
                <p className="text-sm text-gray-500">
                  Order #{item.order_id.substring(0, 8)} • {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className={`font-bold ${item.type === "earned" ? "text-green-600" : "text-yellow-600"}`}>
              {item.type === "earned" ? "+" : "-"}{item.points}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}