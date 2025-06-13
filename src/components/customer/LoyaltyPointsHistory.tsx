import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Loader2, TrendingUp, TrendingDown, Bug } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  useEffect(() => {
    const fetchPointsHistory = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log("Fetching points history for customer:", customerId);
        
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
          setError("Failed to load earned points history.");
          setLoading(false);
          return;
        }
        
        console.log("Earned points data:", earnedData);
        
        // Fetch orders with points redeemed
        const { data: redeemedData, error: redeemedError } = await supabase
          .from("orders")
          .select("id, created_at, loyalty_points_redeemed")
          .eq("customer_id", customerId)
          .gt("loyalty_points_redeemed", 0)
          .order("created_at", { ascending: false });
        
        if (redeemedError) {
          console.error("Error fetching redeemed points history:", redeemedError);
          setError("Failed to load redeemed points history.");
          setLoading(false);
          return;
        }
        
        console.log("Redeemed points data:", redeemedData);
        
        // Save debug info
        setDebugInfo({
          customerId,
          earnedData,
          redeemedData,
          timestamp: new Date().toISOString()
        });
        
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
        
        console.log("Combined history:", combinedHistory);
        setHistory(combinedHistory);
      } catch (error) {
        console.error("Error in fetchPointsHistory:", error);
        setError("An unexpected error occurred. Please try again.");
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
        <Loader2 className="h-8 w-8 animate-spin text-[#b9c6c8]" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-8 text-[#1d2c36]">
        <p>{error}</p>
        
        {/* Debug section - only visible in development */}
        {process.env.NODE_ENV !== 'production' && debugInfo && (
          <div className="mt-4 p-4 border border-[#b9c6c8] rounded-lg bg-[#f5f5f5] text-left">
            <div className="flex items-center mb-2">
              <Bug className="h-5 w-5 mr-2 text-[#1d2c36]" />
              <h3 className="font-bold text-[#1d2c36]">Debug Information</h3>
            </div>
            <pre className="text-xs overflow-auto p-2 bg-[#1d2c36] text-[#8f8578] rounded">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }
  
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-[#1d2c36]">
        <p>No loyalty points activity yet.</p>
        
        {/* Debug section - only visible in development */}
        {process.env.NODE_ENV !== 'production' && debugInfo && (
          <div className="mt-4 p-4 border border-[#b9c6c8] rounded-lg bg-[#f5f5f5] text-left">
            <div className="flex items-center mb-2">
              <Bug className="h-5 w-5 mr-2 text-[#1d2c36]" />
              <h3 className="font-bold text-[#1d2c36]">Debug Information</h3>
            </div>
            <pre className="text-xs overflow-auto p-2 bg-[#1d2c36] text-[#8f8578] rounded">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg text-[#1d2c36]">Points Activity</h3>
      <div className="space-y-2">
        {history.map((item) => (
          <div 
            key={item.id} 
            className="flex items-center justify-between p-3 bg-gradient-to-r from-[#8f8578]/10 to-[#b9c6c8]/10 rounded-lg border border-[#b9c6c8] shadow-sm"
          >
            <div className="flex items-center">
              {item.type === "earned" ? (
                <div className="bg-[#b9c6c8]/30 p-2 rounded-full mr-3">
                  <TrendingUp className="h-5 w-5 text-[#1d2c36]" />
                </div>
              ) : (
                <div className="bg-yellow-100 p-2 rounded-full mr-3">
                  <TrendingDown className="h-5 w-5 text-yellow-600" />
                </div>
              )}
              <div>
                <p className="font-medium text-[#1d2c36]">
                  {item.type === "earned" ? "Earned Points" : "Redeemed Points"}
                </p>
                <p className="text-sm text-[#1d2c36]/70">
                  Order #{item.order_id.substring(0, 8)} • {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className={`font-bold ${item.type === "earned" ? "text-[#1d2c36]" : "text-yellow-600"}`}>
              {item.type === "earned" ? "+" : "-"}{item.points}
            </div>
          </div>
        ))}
      </div>
      
      {/* Debug section - only visible in development */}
      {process.env.NODE_ENV !== 'production' && debugInfo && (
        <div className="mt-8 p-4 border border-[#b9c6c8] rounded-lg bg-[#f5f5f5]">
          <div className="flex items-center mb-2">
            <Bug className="h-5 w-5 mr-2 text-[#1d2c36]" />
            <h3 className="font-bold text-[#1d2c36]">Debug Information</h3>
          </div>
          <pre className="text-xs overflow-auto p-2 bg-[#1d2c36] text-[#8f8578] rounded">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}