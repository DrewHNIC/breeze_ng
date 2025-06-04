// components/vendor/AdCountdownTimer.tsx
import React, { useState, useEffect } from 'react';

interface AdCountdownTimerProps {
  endDate: string;
}

const AdCountdownTimer: React.FC<AdCountdownTimerProps> = ({ endDate }) => {
  const [days, setDays] = useState<number>(0);
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const distance = end - now;

      if (distance < 0) {
        clearInterval(timer);
        setIsExpired(true);
      } else {
        setDays(Math.floor(distance / (1000 * 60 * 60 * 24)));
        setHours(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
        setMinutes(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)));
        setSeconds(Math.floor((distance % (1000 * 60)) / 1000));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  // Helper function to format numbers with leading zeros
  const formatNumber = (num: number): string => {
    return num < 10 ? `0${num}` : `${num}`;
  };

  return (
    <div className="bg-black p-8 flex flex-col items-center justify-center">
      <h2 className="text-white text-xl font-bold mb-4">Campaign Expires In:</h2>
      
      {isExpired ? (
        <div className="text-red-600 text-4xl font-bold">EXPIRED</div>
      ) : (
        <div className="flex items-center justify-center space-x-4">
          <div className="flex flex-col items-center">
            <div className="bg-gray-900 p-3 rounded-lg">
              <div className="text-red-600 text-4xl md:text-5xl font-mono font-bold tracking-wider">
                {formatNumber(days)}
              </div>
            </div>
            <span className="text-gray-400 text-sm mt-1">DAYS</span>
          </div>
          
          <div className="text-red-600 text-4xl font-bold">:</div>
          
          <div className="flex flex-col items-center">
            <div className="bg-gray-900 p-3 rounded-lg">
              <div className="text-red-600 text-4xl md:text-5xl font-mono font-bold tracking-wider">
                {formatNumber(hours)}
              </div>
            </div>
            <span className="text-gray-400 text-sm mt-1">HOURS</span>
          </div>
          
          <div className="text-red-600 text-4xl font-bold">:</div>
          
          <div className="flex flex-col items-center">
            <div className="bg-gray-900 p-3 rounded-lg">
              <div className="text-red-600 text-4xl md:text-5xl font-mono font-bold tracking-wider">
                {formatNumber(minutes)}
              </div>
            </div>
            <span className="text-gray-400 text-sm mt-1">MINUTES</span>
          </div>
          
          <div className="text-red-600 text-4xl font-bold">:</div>
          
          <div className="flex flex-col items-center">
            <div className="bg-gray-900 p-3 rounded-lg">
              <div className="text-red-600 text-4xl md:text-5xl font-mono font-bold tracking-wider">
                {formatNumber(seconds)}
              </div>
            </div>
            <span className="text-gray-400 text-sm mt-1">SECONDS</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdCountdownTimer;