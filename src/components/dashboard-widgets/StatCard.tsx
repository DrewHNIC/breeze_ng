import type React from "react"
import { ArrowDown, ArrowUp } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  change: number
  trend: "up" | "down"
  metric?: string
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, trend, metric }) => {
  return (
    <div className="bg-gradient-to-br from-[#1d2c36] to-[#243642] rounded-lg p-6 hover:from-[#243642] hover:to-[#2a3f4a] transition-all duration-300 border border-[#b9c6c8]/20 backdrop-blur-sm">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-[#8f8578] text-sm font-medium">{title}</h3>
        <div className={`p-1 rounded-full ${trend === "up" ? "bg-green-500/20" : "bg-red-500/20"}`}>
          {trend === "up" ? (
            <ArrowUp className="w-4 h-4 text-green-400" />
          ) : (
            <ArrowDown className="w-4 h-4 text-red-400" />
          )}
        </div>
      </div>
      <div className="flex items-baseline">
        <p className="text-2xl font-semibold bg-gradient-to-r from-[#b9c6c8] to-[#8f8578] bg-clip-text text-transparent">
          {value}
        </p>
        {metric && <span className="ml-2 text-sm text-[#8f8578]/60">{metric}</span>}
      </div>
      <p className={`mt-2 text-sm font-medium ${trend === "up" ? "text-green-400" : "text-red-400"}`}>
        {change > 0 ? "+" : ""}
        {change}% from last month
      </p>
    </div>
  )
}

export default StatCard
