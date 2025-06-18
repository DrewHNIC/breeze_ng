"use client"

import { useState } from "react"
import { supabase } from "@/utils/supabase"
import { Star, MessageSquare, Send, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface RiderRatingProps {
  orderId: string
  riderId: string
  customerId: string
  onRatingSubmitted: () => void
}

const RiderRating = ({ orderId, riderId, customerId, onRatingSubmitted }: RiderRatingProps) => {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStarClick = (starRating: number) => {
    setRating(starRating)
  }

  const handleStarHover = (starRating: number) => {
    setHoveredRating(starRating)
  }

  const handleStarLeave = () => {
    setHoveredRating(0)
  }

  const submitRating = async () => {
    if (rating === 0) {
      setError("Please select a rating")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const { error: insertError } = await supabase.from("rider_ratings").insert({
        order_id: orderId,
        customer_id: customerId,
        rider_id: riderId,
        rating: rating,
        comment: comment.trim() || null,
      })

      if (insertError) {
        console.error("Error submitting rating:", insertError)
        setError("Failed to submit rating. Please try again.")
        return
      }

      setIsSubmitted(true)
      onRatingSubmitted()
    } catch (error) {
      console.error("Error in submitRating:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRatingText = (ratingValue: number) => {
    switch (ratingValue) {
      case 1:
        return "Poor"
      case 2:
        return "Fair"
      case 3:
        return "Good"
      case 4:
        return "Very Good"
      case 5:
        return "Excellent"
      default:
        return "Select a rating"
    }
  }

  if (isSubmitted) {
    return (
      <Card className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 shadow-lg">
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-green-700 mb-2">Thank You!</h3>
          <p className="text-green-600">Your rating has been submitted successfully.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-r from-[#8f8578] to-[#7a7066] border-none shadow-lg">
      <CardHeader className="p-6 border-b border-[#b9c6c8]/30">
        <h3 className="font-bold text-lg text-[#1d2c36]">Rate Your Delivery Experience</h3>
        <p className="text-sm text-[#1d2c36]/70">How was your delivery? Your feedback helps us improve our service.</p>
      </CardHeader>
      <CardContent className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Star Rating */}
          <div className="text-center">
            <p className="text-sm font-medium text-[#1d2c36] mb-3">Rate your delivery experience</p>
            <div className="flex justify-center space-x-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => handleStarHover(star)}
                  onMouseLeave={handleStarLeave}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300 hover:text-yellow-200"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-[#1d2c36]/70">{getRatingText(hoveredRating || rating)}</p>
          </div>

          {/* Comment Section */}
          <div>
            <label className="block text-sm font-medium text-[#1d2c36] mb-2">
              <MessageSquare className="h-4 w-4 inline mr-1" />
              Additional Comments (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your delivery experience..."
              className="w-full px-4 py-3 border border-[#b9c6c8]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b9c6c8] focus:border-[#b9c6c8] bg-[#b9c6c8]/10 text-[#1d2c36] placeholder:text-[#1d2c36]/50 resize-none"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-[#1d2c36]/60 mt-1">{comment.length}/500 characters</p>
          </div>

          {/* Submit Button */}
          <Button
            onClick={submitRating}
            disabled={rating === 0 || isSubmitting}
            className="w-full bg-gradient-to-r from-[#b9c6c8] to-[#a8b5b8] text-[#1d2c36] hover:from-[#a8b5b8] hover:to-[#97a4a7] border-none font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1d2c36] mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Rating
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default RiderRating
