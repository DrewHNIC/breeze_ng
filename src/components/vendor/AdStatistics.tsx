"use client"

import type React from "react"

import type { Advertisement } from "@/types/advertisement"
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

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement)

interface AdStatisticsProps {
  ad: Advertisement
}

const AdStatistics: React.FC<AdStatisticsProps> = ({ ad }) => {
  // Data for Charts
  const pieData = {
    labels: ["Impressions", "Clicks", "Conversions"],
    datasets: [
      {
        data: [ad.impressions, ad.clicks, ad.conversions],
        backgroundColor: ["#b9c6c8", "#8f8578", "#1d2c36"],
        hoverBackgroundColor: ["#8f8578", "#b9c6c8", "#243642"],
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
        backgroundColor: ["rgba(185, 198, 200, 0.7)", "rgba(143, 133, 120, 0.7)", "rgba(29, 44, 54, 0.7)"],
        borderColor: ["#b9c6c8", "#8f8578", "#1d2c36"],
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
        labels: {
          color: "#8f8578",
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#8f8578",
        },
        grid: {
          color: "rgba(185, 198, 200, 0.2)",
        },
      },
      y: {
        ticks: {
          color: "#8f8578",
        },
        grid: {
          color: "rgba(185, 198, 200, 0.2)",
        },
      },
    },
  }

  // Performance Metrics
  const clickThroughRate = ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0
  const conversionRate = ad.clicks > 0 ? (ad.conversions / ad.clicks) * 100 : 0
  const costPerClick = ad.clicks > 0 ? `₦${(ad.package_price / ad.clicks).toFixed(2)}` : "N/A"
  const costPerConversion = ad.conversions > 0 ? `₦${(ad.package_price / ad.conversions).toFixed(2)}` : "N/A"

  // Stat Cards
  const statCards = [
    { title: "Impressions", value: ad.impressions, icon: Eye, color: "bg-gradient-to-r from-[#b9c6c8] to-[#8f8578]" },
    {
      title: "Clicks",
      value: ad.clicks,
      icon: MousePointer,
      color: "bg-gradient-to-r from-[#8f8578] to-[#b9c6c8]",
    },
    {
      title: "Conversions",
      value: ad.conversions,
      icon: ShoppingCart,
      color: "bg-gradient-to-r from-[#1d2c36] to-[#243642]",
    },
    {
      title: "CTR",
      value: `${clickThroughRate.toFixed(2)}%`,
      icon: TrendingUp,
      color: "bg-gradient-to-r from-[#b9c6c8] to-[#8f8578]",
    },
    {
      title: "Cost Per Click",
      value: costPerClick,
      icon: DollarSign,
      color: "bg-gradient-to-r from-[#8f8578] to-[#b9c6c8]",
    },
    {
      title: "Cost Per Conversion",
      value: costPerConversion,
      icon: DollarSign,
      color: "bg-gradient-to-r from-[#1d2c36] to-[#243642]",
    },
  ]

  return (
    <div className="bg-gradient-to-br from-[#1d2c36] to-[#243642] rounded-xl shadow-xl overflow-hidden border border-[#b9c6c8]/20">
      {/* Campaign Header */}
      <div className="p-6 bg-gradient-to-r from-[#b9c6c8] to-[#8f8578] text-[#1d2c36] text-center">
        <h2 className="text-2xl font-bold">Campaign Performance</h2>
        <p className="text-[#1d2c36]/80">Track your ad performance and ROI</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-gradient-to-r from-[#b9c6c8]/10 to-transparent rounded-lg shadow p-4 flex items-center border border-[#b9c6c8]/20 hover:scale-105 transition-transform duration-200"
          >
            <div className={`${stat.color} p-3 rounded-lg mr-4`}>
              <stat.icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-[#8f8578] text-sm">{stat.title}</p>
              <p className="text-2xl font-bold text-[#b9c6c8]">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        <div className="bg-gradient-to-r from-[#b9c6c8]/10 to-transparent rounded-lg shadow p-4 border border-[#b9c6c8]/20 hover:scale-102 transition-transform duration-200">
          <h3 className="text-xl font-semibold mb-4 text-[#b9c6c8]">Engagement Breakdown</h3>
          <div className="h-64">
            <Pie data={pieData} options={chartOptions} />
          </div>
        </div>
        <div className="bg-gradient-to-r from-[#b9c6c8]/10 to-transparent rounded-lg shadow p-4 border border-[#b9c6c8]/20 hover:scale-102 transition-transform duration-200">
          <h3 className="text-xl font-semibold mb-4 text-[#b9c6c8]">Performance Trends</h3>
          <div className="h-64">
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Campaign Details */}
      <div className="p-6 bg-gradient-to-r from-[#b9c6c8]/5 to-transparent border-t border-[#b9c6c8]/20">
        <h3 className="text-xl font-semibold mb-4 text-[#b9c6c8]">Campaign Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-[#8f8578] mb-2">
              Package: <span className="font-semibold text-[#b9c6c8]">{ad.package_name}</span>
            </p>
            <p className="text-[#8f8578] mb-2">
              Daily Cost: <span className="font-semibold text-[#b9c6c8]">₦{ad.package_price.toLocaleString()}</span>
            </p>
            <p className="text-[#8f8578] mb-2">
              Start Date:{" "}
              <span className="font-semibold text-[#b9c6c8]">{new Date(ad.start_date).toLocaleDateString()}</span>
            </p>
            <p className="text-[#8f8578] mb-2">
              End Date:{" "}
              <span className="font-semibold text-[#b9c6c8]">{new Date(ad.end_date).toLocaleDateString()}</span>
            </p>
          </div>
          <div>
            <p className="text-[#8f8578] mb-2">
              Click-through Rate: <span className="font-semibold text-[#b9c6c8]">{clickThroughRate.toFixed(2)}%</span>
            </p>
            <p className="text-[#8f8578] mb-2">
              Conversion Rate: <span className="font-semibold text-[#b9c6c8]">{conversionRate.toFixed(2)}%</span>
            </p>
            <p className="text-[#8f8578] mb-2">
              Cost per Click: <span className="font-semibold text-[#b9c6c8]">{costPerClick}</span>
            </p>
            <p className="text-[#8f8578] mb-2">
              Cost per Conversion: <span className="font-semibold text-[#b9c6c8]">{costPerConversion}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdStatistics
