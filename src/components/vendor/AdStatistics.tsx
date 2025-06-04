// components/vendor/AdStatistics.tsx
import React from "react"
import { Advertisement } from "@/types/advertisement"
import { Pie, Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
} from "chart.js"
import { TrendingUp, MousePointer, ShoppingCart, Eye, DollarSign } from "lucide-react"
import { motion } from "framer-motion"

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement)

interface AdStatisticsProps {
  ad: Advertisement
}

const AdStatistics: React.FC<AdStatisticsProps> = ({ ad }) => {
  // 💡 Data for Charts
  const pieData = {
    labels: ["Impressions", "Clicks", "Conversions"],
    datasets: [
      {
        data: [ad.impressions, ad.clicks, ad.conversions],
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b"],
        hoverBackgroundColor: ["#2563eb", "#059669", "#d97706"],
        borderWidth: 0,
      },
    ],
  }

  const barData = {
    labels: ["Impressions", "Clicks", "Conversions"],
    datasets: [
      {
        label: "Campaign Performance",
        data: [ad.impressions, ad.clicks, ad.conversions],
        backgroundColor: ["rgba(59, 130, 246, 0.7)", "rgba(16, 185, 129, 0.7)", "rgba(245, 158, 11, 0.7)"],
        borderColor: ["#3b82f6", "#10b981", "#f59e0b"],
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
    },
  }

  // 💡 Performance Metrics
  const clickThroughRate = ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0
  const conversionRate = ad.clicks > 0 ? (ad.conversions / ad.clicks) * 100 : 0
  const costPerClick = ad.clicks > 0 ? `₦${(ad.package_price / ad.clicks).toFixed(2)}` : "N/A"
  const costPerConversion = ad.conversions > 0 ? `₦${(ad.package_price / ad.conversions).toFixed(2)}` : "N/A"

  // 🔥 Stat Cards
  const statCards = [
    { title: "Impressions", value: ad.impressions, icon: Eye, color: "bg-blue-500" },
    { title: "Clicks", value: ad.clicks, icon: MousePointer, color: "bg-green-500" },
    { title: "Conversions", value: ad.conversions, icon: ShoppingCart, color: "bg-yellow-500" },
    { title: "CTR", value: `${clickThroughRate.toFixed(2)}%`, icon: TrendingUp, color: "bg-purple-500" },
    { title: "Cost Per Click", value: costPerClick, icon: DollarSign, color: "bg-indigo-500" },
    { title: "Cost Per Conversion", value: costPerConversion, icon: DollarSign, color: "bg-teal-500" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden"
    >
      {/* 📊 Campaign Header */}
      <div className="p-6 bg-gradient-to-r from-red-600 to-red-800 text-white text-center">
        <h2 className="text-2xl font-bold">Campaign Performance</h2>
        <p className="text-gray-200">Track your ad performance and ROI</p>
      </div>

      {/* 🔥 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 flex items-center"
          >
            <div className={`${stat.color} p-3 rounded-lg mr-4`}>
              <stat.icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{stat.title}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 📈 Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.3 }} className="bg-white dark:bg-gray-900 rounded-lg shadow p-4">
          <h3 className="text-xl font-semibold mb-4">Engagement Breakdown</h3>
          <div className="h-64">
            <Pie data={pieData} options={chartOptions} />
          </div>
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.3 }} className="bg-white dark:bg-gray-900 rounded-lg shadow p-4">
          <h3 className="text-xl font-semibold mb-4">Performance Trends</h3>
          <div className="h-64">
            <Bar data={barData} options={chartOptions} />
          </div>
        </motion.div>
      </div>

      {/* 📅 Campaign Details */}
      <div className="p-6 bg-gray-50 dark:bg-gray-900">
        <h3 className="text-xl font-semibold mb-4">Campaign Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-2">Package: <span className="font-semibold text-gray-900 dark:text-white">{ad.package_name}</span></p>
            <p className="text-gray-600 dark:text-gray-400 mb-2">Daily Cost: <span className="font-semibold text-gray-900 dark:text-white">₦{ad.package_price.toLocaleString()}</span></p>
            <p className="text-gray-600 dark:text-gray-400 mb-2">Start Date: <span className="font-semibold text-gray-900 dark:text-white">{new Date(ad.start_date).toLocaleDateString()}</span></p>
            <p className="text-gray-600 dark:text-gray-400 mb-2">End Date: <span className="font-semibold text-gray-900 dark:text-white">{new Date(ad.end_date).toLocaleDateString()}</span></p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-2">Click-through Rate: <span className="font-semibold text-gray-900 dark:text-white">{clickThroughRate.toFixed(2)}%</span></p>
            <p className="text-gray-600 dark:text-gray-400 mb-2">Conversion Rate: <span className="font-semibold text-gray-900 dark:text-white">{conversionRate.toFixed(2)}%</span></p>
            <p className="text-gray-600 dark:text-gray-400 mb-2">Cost per Click: <span className="font-semibold text-gray-900 dark:text-white">{costPerClick}</span></p>
            <p className="text-gray-600 dark:text-gray-400 mb-2">Cost per Conversion: <span className="font-semibold text-gray-900 dark:text-white">{costPerConversion}</span></p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default AdStatistics
