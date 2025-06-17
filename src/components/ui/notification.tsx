"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"

interface Notification {
  id: string
  title: string
  description: string
  type: "success" | "error" | "warning" | "info"
  duration?: number
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, "id">) => void
  removeNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    // Return a fallback for SSR
    return {
      addNotification: () => {},
      removeNotification: () => {},
      notifications: [],
    }
  }
  return context
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((notification: Omit<Notification, "id">) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification = { ...notification, id }

    setNotifications((prev) => [...prev, newNotification])

    // Auto remove after duration (default 5 seconds)
    const duration = notification.duration || 5000
    setTimeout(() => {
      removeNotification(id)
    }, duration)
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }, [])

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  )
}

const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotification()

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  )
}

const NotificationItem: React.FC<{
  notification: Notification
  onRemove: () => void
}> = ({ notification, onRemove }) => {
  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getBgColor = () => {
    switch (notification.type) {
      case "success":
        return "bg-gradient-to-r from-green-50 to-green-100 border-green-200"
      case "error":
        return "bg-gradient-to-r from-red-50 to-red-100 border-red-200"
      case "warning":
        return "bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200"
      case "info":
        return "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200"
    }
  }

  return (
    <div className={`${getBgColor()} border rounded-lg p-4 shadow-lg animate-in slide-in-from-right duration-300`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-gray-900">{notification.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{notification.description}</p>
        </div>
        <button onClick={onRemove} className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// Helper function to replace toast calls
export const notify = {
  success: (title: string, description: string) => ({
    title,
    description,
    type: "success" as const,
  }),
  error: (title: string, description: string) => ({
    title,
    description,
    type: "error" as const,
  }),
  warning: (title: string, description: string) => ({
    title,
    description,
    type: "warning" as const,
  }),
  info: (title: string, description: string) => ({
    title,
    description,
    type: "info" as const,
  }),
}
