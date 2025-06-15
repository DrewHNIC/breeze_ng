import type React from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { format } from "date-fns"

interface RevenueChartProps {
  data: Array<{
    date: string
    revenue: number
  }>
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  return (
    <div className="bg-gradient-to-br from-[#1d2c36] to-[#243642] rounded-lg p-6 border border-[#b9c6c8]/20 backdrop-blur-sm">
      <h3 className="text-[#b9c6c8] text-lg font-semibold mb-6">Revenue Overview</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#b9c6c8" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#b9c6c8" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#b9c6c8" strokeOpacity={0.2} />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => format(new Date(date), "MMM dd")}
              stroke="#8f8578"
              fontSize={12}
            />
            <YAxis stroke="#8f8578" fontSize={12} tickFormatter={(value) => `₦${value.toLocaleString()}`} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(29, 44, 54, 0.95)",
                border: "1px solid rgba(185, 198, 200, 0.3)",
                borderRadius: "8px",
                color: "#b9c6c8",
                backdropFilter: "blur(10px)",
              }}
              labelStyle={{ color: "#b9c6c8" }}
              formatter={(value: number) => [`₦${value.toLocaleString()}`, "Revenue"]}
              labelFormatter={(date) => format(new Date(date), "MMM dd, yyyy")}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#b9c6c8"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default RevenueChart
