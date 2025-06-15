import type React from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface OrdersTimelineProps {
  data: Array<{
    hour: string
    orders: number
  }>
}

const OrdersTimeline: React.FC<OrdersTimelineProps> = ({ data }) => {
  return (
    <div className="bg-gradient-to-br from-[#1d2c36] to-[#243642] rounded-lg p-6 border border-[#b9c6c8]/20 backdrop-blur-sm">
      <h3 className="text-[#b9c6c8] text-lg font-semibold mb-6">Orders by Hour (Today)</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <defs>
              <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#b9c6c8" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#b9c6c8" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#b9c6c8" strokeOpacity={0.2} />
            <XAxis dataKey="hour" stroke="#8f8578" fontSize={12} />
            <YAxis stroke="#8f8578" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(29, 44, 54, 0.95)",
                border: "1px solid rgba(185, 198, 200, 0.3)",
                borderRadius: "8px",
                color: "#b9c6c8",
                backdropFilter: "blur(10px)",
              }}
              labelStyle={{ color: "#b9c6c8" }}
            />
            <Bar dataKey="orders" fill="url(#colorOrders)" radius={[4, 4, 0, 0]} stroke="#b9c6c8" strokeWidth={1} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default OrdersTimeline
