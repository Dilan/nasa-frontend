import React from 'react';
import { Satellite, Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  progress: number;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ progress }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-96 space-y-6">
      {/* Animated satellite icon */}
      <div className="relative">
        <div className="absolute inset-0 animate-ping">
          <Satellite className="h-16 w-16 text-blue-400/30" />
        </div>
        <Satellite className="h-16 w-16 text-blue-400 relative z-10" />
      </div>

      {/* Loading text and spinner */}
      <div className="text-center space-y-3">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
          <h2 className="text-2xl font-bold text-white">Fetching Earth Images</h2>
        </div>
        <p className="text-blue-200">
          Loading high-resolution images from NASA's EPIC camera...
        </p>
        <p className="text-blue-300 text-sm">
          Each image is approximately 2.5MB • This may take a moment
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-blue-200">Progress</span>
          <span className="text-sm text-white font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
          <div 
            className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Loading stages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl text-center">
        <div className={`p-3 rounded-lg transition-all duration-300 ${
          progress > 20 ? 'bg-green-500/20 text-green-200' : 'bg-white/5 text-blue-200'
        }`}>
          <div className="font-medium">1. Fetching Data</div>
          <div className="text-xs">Requesting image metadata</div>
        </div>
        <div className={`p-3 rounded-lg transition-all duration-300 ${
          progress > 50 ? 'bg-green-500/20 text-green-200' : 'bg-white/5 text-blue-200'
        }`}>
          <div className="font-medium">2. Loading Images</div>
          <div className="text-xs">Downloading 2.5MB files</div>
        </div>
        <div className={`p-3 rounded-lg transition-all duration-300 ${
          progress > 90 ? 'bg-green-500/20 text-green-200' : 'bg-white/5 text-blue-200'
        }`}>
          <div className="font-medium">3. Preparing Slideshow</div>
          <div className="text-xs">Creating Earth rotation</div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;