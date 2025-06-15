"use client"

import type React from "react"

import { useState, useEffect } from "react"

interface AdCountdownTimerProps {
  endDate: string
}

const AdCountdownTimer: React.FC<AdCountdownTimerProps> = ({ endDate }) => {
  const [days, setDays] = useState<number>(0)
  const [hours, setHours] = useState<number>(0)
  const [minutes, setMinutes] = useState<number>(0)
  const [seconds, setSeconds] = useState<number>(0)
  const [isExpired, setIsExpired] = useState<boolean>(false)

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const end = new Date(endDate).getTime()
      const distance = end - now

      if (distance < 0) {
        clearInterval(timer)
        setIsExpired(true)
      } else {
        setDays(Math.floor(distance / (1000 * 60 * 60 * 24)))
        setHours(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)))
        setMinutes(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)))
        setSeconds(Math.floor((distance % (1000 * 60)) / 1000))
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [endDate])

  // Helper function to format numbers with leading zeros
  const formatNumber = (num: number): string => {
    return num < 10 ? `0${num}` : `${num}`
  }

  return (
    <div className="bg-gradient-to-r from-[#1d2c36] to-[#243642] p-8 flex flex-col items-center justify-center rounded-lg border border-[#b9c6c8]/20 mt-4">
      <h2 className="text-[#b9c6c8] text-xl font-bold mb-4">Campaign Expires In:</h2>

      {isExpired ? (
        <div className="text-red-400 text-4xl font-bold">EXPIRED</div>
      ) : (
        <div className="flex items-center justify-center space-x-2 md:space-x-4 flex-wrap">
          <div className="flex flex-col items-center">
            <div className="bg-gradient-to-r from-[#b9c6c8]/20 to-transparent p-3 rounded-lg border border-[#b9c6c8]/20">
              <div className="text-[#b9c6c8] text-3xl md:text-4xl font-mono font-bold tracking-wider">
                {formatNumber(days)}
              </div>
            </div>
            <span className="text-[#8f8578] text-sm mt-1">DAYS</span>
          </div>

          <div className="text-[#b9c6c8] text-3xl font-bold">:</div>

          <div className="flex flex-col items-center">
            <div className="bg-gradient-to-r from-[#b9c6c8]/20 to-transparent p-3 rounded-lg border border-[#b9c6c8]/20">
              <div className="text-[#b9c6c8] text-3xl md:text-4xl font-mono font-bold tracking-wider">
                {formatNumber(hours)}
              </div>
            </div>
            <span className="text-[#8f8578] text-sm mt-1">HOURS</span>
          </div>

          <div className="text-[#b9c6c8] text-3xl font-bold">:</div>

          <div className="flex flex-col items-center">
            <div className="bg-gradient-to-r from-[#b9c6c8]/20 to-transparent p-3 rounded-lg border border-[#b9c6c8]/20">
              <div className="text-[#b9c6c8] text-3xl md:text-4xl font-mono font-bold tracking-wider">
                {formatNumber(minutes)}
              </div>
            </div>
            <span className="text-[#8f8578] text-sm mt-1">MINUTES</span>
          </div>

          <div className="text-[#b9c6c8] text-3xl font-bold">:</div>

          <div className="flex flex-col items-center">
            <div className="bg-gradient-to-r from-[#b9c6c8]/20 to-transparent p-3 rounded-lg border border-[#b9c6c8]/20">
              <div className="text-[#b9c6c8] text-3xl md:text-4xl font-mono font-bold tracking-wider">
                {formatNumber(seconds)}
              </div>
            </div>
            <span className="text-[#8f8578] text-sm mt-1">SECONDS</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdCountdownTimer
