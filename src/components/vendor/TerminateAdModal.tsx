"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { AlertTriangle, Loader } from "lucide-react"

interface TerminateAdModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  packageName: string
}

const TerminateAdModal: React.FC<TerminateAdModalProps> = ({ isOpen, onClose, onConfirm, packageName }) => {
  const [confirmText, setConfirmText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      setConfirmText("")
      setTimeout(() => inputRef.current?.focus(), 100) // Autofocus input on open
    }
  }, [isOpen])

  const handleConfirm = async () => {
    if (confirmText !== "TERMINATE") return
    setIsLoading(true)
    try {
      await onConfirm()
    } finally {
      setIsLoading(false)
      setConfirmText("")
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-[#1d2c36] to-[#243642] border border-[#b9c6c8]/20 rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 p-4 flex items-center">
          <AlertTriangle className="h-6 w-6 text-white mr-2" />
          <h3 className="text-xl font-bold text-white">Terminate Campaign</h3>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="mb-4 text-[#8f8578]">
            You are about to <span className="font-semibold text-red-400">terminate</span> your{" "}
            <strong className="text-[#b9c6c8]">{packageName}</strong> advertisement campaign. This action is{" "}
            <strong className="text-red-400">irreversible</strong> and <span className="text-red-400">no refunds</span>{" "}
            will be provided.
          </p>

          <p className="mb-6 text-[#8f8578]">
            Type <strong className="text-red-400">TERMINATE</strong> to confirm:
          </p>

          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full p-3 border border-[#b9c6c8]/20 rounded-lg bg-gradient-to-r from-[#1d2c36] to-[#243642] text-[#b9c6c8] placeholder-[#8f8578] focus:ring-2 focus:ring-red-500 outline-none transition-all duration-200"
            placeholder="Type TERMINATE"
            disabled={isLoading}
          />

          {/* Actions */}
          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gradient-to-r from-[#8f8578] to-[#b9c6c8] text-[#1d2c36] rounded-lg hover:from-[#b9c6c8] hover:to-[#8f8578] transition-all duration-200"
              disabled={isLoading}
            >
              Cancel
            </button>

            <button
              onClick={handleConfirm}
              disabled={confirmText !== "TERMINATE" || isLoading}
              className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-center ${
                confirmText === "TERMINATE" && !isLoading
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-[#8f8578]/50 text-[#8f8578] cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <>
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Processing...
                </>
              ) : (
                "Terminate Campaign"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TerminateAdModal
