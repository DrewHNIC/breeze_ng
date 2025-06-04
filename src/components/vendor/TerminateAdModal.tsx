// components/vendor/TerminateAdModal.tsx
import React, { useState, useEffect, useRef } from "react"
import { AlertTriangle, Loader } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface TerminateAdModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  packageName: string
}

const TerminateAdModal: React.FC<TerminateAdModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  packageName,
}) => {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-red-600 p-4 flex items-center">
              <AlertTriangle className="h-6 w-6 text-white mr-2" />
              <h3 className="text-xl font-bold text-white">Terminate Campaign</h3>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                You are about to <span className="font-semibold text-red-500">terminate</span> your{" "}
                <strong>{packageName}</strong> advertisement campaign. This action is{" "}
                <strong>irreversible</strong> and <span className="text-red-500">no refunds</span>{" "}
                will be provided.
              </p>

              <p className="mb-6 text-gray-700 dark:text-gray-300">
                Type <strong className="text-red-600">TERMINATE</strong> to confirm:
              </p>

              {/* Input Field */}
              <input
                ref={inputRef}
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                placeholder="Type TERMINATE"
                disabled={isLoading}
              />

              {/* Actions */}
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                  disabled={isLoading}
                >
                  Cancel
                </button>

                <button
                  onClick={handleConfirm}
                  disabled={confirmText !== "TERMINATE" || isLoading}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center justify-center ${
                    confirmText === "TERMINATE" && !isLoading
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default TerminateAdModal
