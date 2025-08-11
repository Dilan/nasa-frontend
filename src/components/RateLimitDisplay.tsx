import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface RateLimitDisplayProps {
  apiLimit: {
    used: number;
    total: number;
  };
}

const RateLimitDisplay: React.FC<RateLimitDisplayProps> = ({ apiLimit }) => {
  const percentage = (apiLimit.used / apiLimit.total) * 100;
  const isLow = percentage > 80;

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          {isLow ? (
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-400" />
          )}
          <span className="text-white font-medium text-sm">API Requests</span>
        </div>
        
        <div className="text-right">
          <div className="text-white font-bold">
            {apiLimit.used.toLocaleString()} / {apiLimit.total.toLocaleString()}
          </div>
          <div className="text-xs text-blue-200">
            {(100 - percentage).toFixed(0)}% remaining
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mt-2 w-full bg-white/10 rounded-full h-1.5">
        <div 
          className={`h-1.5 rounded-full transition-all duration-300 ${
            isLow ? 'bg-amber-500' : 'bg-green-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default RateLimitDisplay;