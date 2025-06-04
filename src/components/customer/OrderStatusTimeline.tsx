// components/customer/OrderStatusTimeline.tsx
import { CheckCircle, Clock, ChefHat, Package, Truck, Home } from 'lucide-react'

interface OrderStatusTimelineProps {
  status: string
  createdAt: string
}

const OrderStatusTimeline = ({ status, createdAt }: OrderStatusTimelineProps) => {
  // Define the order status steps
  const steps = [
    { id: 'confirmed', label: 'Confirmed', icon: CheckCircle, time: new Date(createdAt) },
    { id: 'preparing', label: 'Preparing', icon: ChefHat, time: null },
    { id: 'ready', label: 'Ready', icon: Package, time: null },
    { id: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, time: null },
    { id: 'delivered', label: 'Delivered', icon: Home, time: null },
  ]

  // Map the current status to the step index
  const statusMap: Record<string, number> = {
    'confirmed': 0,
    'preparing': 1,
    'ready': 2,
    'out_for_delivery': 3,
    'delivered': 4,
    'cancelled': -1, // Special case
  }

  const currentStepIndex = statusMap[status] ?? 0

  return (
    <div className="mt-6">
      <div className="relative">
        {/* Progress Bar */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200">
          <div 
            className="h-full bg-red-500 transition-all duration-500"
            style={{ width: `${Math.max(0, currentStepIndex) * 25}%` }}
          ></div>
        </div>

        {/* Steps */}
        <div className="flex justify-between relative">
          {steps.map((step, index) => {
            const isActive = index <= currentStepIndex
            const isPast = index < currentStepIndex
            
            return (
              <div key={step.id} className="flex flex-col items-center relative z-10">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isActive ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  <step.icon className="h-5 w-5" />
                </div>
                <p className={`mt-2 text-sm font-medium ${isActive ? 'text-black' : 'text-gray-500'}`}>
                  {step.label}
                </p>
                {step.time && (
                  <p className="text-xs text-gray-500">
                    {step.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Special case for cancelled orders */}
      {status === 'cancelled' && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-700 font-medium">This order has been cancelled.</p>
        </div>
      )}
    </div>
  )
}

export default OrderStatusTimeline