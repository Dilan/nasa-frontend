import React, { useEffect, useState } from 'react';
import { Clock, Zap, AlertTriangle } from 'lucide-react';

interface PerformanceMonitorProps {
  images: any[];
  imageLoadStatus: { [key: string]: 'loading' | 'loaded' | 'error' };
  loading: boolean;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ images, imageLoadStatus, loading }) => {
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [metrics, setMetrics] = useState({
    timeToFirstImage: 0,
    timeToAllImages: 0,
    totalImages: 0,
    loadedImages: 0,
    errorImages: 0,
    loadingImages: 0
  });

  useEffect(() => {
    if (images.length > 0) {
      setStartTime(Date.now());
    }
  }, [images]);

  useEffect(() => {
    if (images.length === 0) return;

    const loadedCount = Object.values(imageLoadStatus).filter(status => status === 'loaded').length;
    const errorCount = Object.values(imageLoadStatus).filter(status => status === 'error').length;
    const loadingCount = Object.values(imageLoadStatus).filter(status => status === 'loading').length;

    const currentTime = Date.now();
    const timeToFirstImage = loadedCount > 0 ? currentTime - startTime : 0;
    const timeToAllImages = loadedCount === images.length ? currentTime - startTime : 0;

    setMetrics({
      timeToFirstImage,
      timeToAllImages,
      totalImages: images.length,
      loadedImages: loadedCount,
      errorImages: errorCount,
      loadingImages: loadingCount
    });
  }, [images, imageLoadStatus, startTime]);

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white text-xs max-w-xs z-50">
      <div className="flex items-center space-x-2 mb-3">
        <Zap className="h-4 w-4 text-yellow-400" />
        <span className="font-semibold">Performance Monitor</span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Total Images:</span>
          <span className="font-mono">{metrics.totalImages}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Loaded:</span>
          <span className="font-mono text-green-400">{metrics.loadedImages}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Loading:</span>
          <span className="font-mono text-yellow-400">{metrics.loadingImages}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Errors:</span>
          <span className="font-mono text-red-400">{metrics.errorImages}</span>
        </div>
        
        <div className="border-t border-white/20 pt-2 mt-2">
          <div className="flex justify-between">
            <span>First Image:</span>
            <span className="font-mono">
              {metrics.timeToFirstImage > 0 ? `${metrics.timeToFirstImage}ms` : '-'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span>All Images:</span>
            <span className="font-mono">
              {metrics.timeToAllImages > 0 ? `${metrics.timeToAllImages}ms` : '-'}
            </span>
          </div>
        </div>

        {loading && (
          <div className="flex items-center space-x-2 text-yellow-400 mt-2">
            <AlertTriangle className="h-3 w-3" />
            <span>API Loading...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceMonitor; 