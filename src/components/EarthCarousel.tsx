import React, { useEffect, useState, useCallback } from 'react';
import { SkipBack, SkipForward, Pause, Play } from 'lucide-react';
import { EpicImage } from '../types/';
import LoadingSpinner from './LoadingSpinner';
import PerformanceMonitor from './PerformanceMonitor';

interface EarthCarouselProps {
  loading: boolean;
  images: EpicImage[];
  selectedDate: string;
}

const EarthCarousel: React.FC<EarthCarouselProps> = ({ loading, images, selectedDate }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [preloadedImages, setPreloadedImages] = useState<{ [key: string]: string }>({});
  const [imageLoadStatus, setImageLoadStatus] = useState<{ [key: string]: 'loading' | 'loaded' | 'error' }>({});

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handlePrevious = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  // Reset state when new images are received
  useEffect(() => {
    if (images.length > 0) {
      setCurrentImageIndex(0);
      setPreloadedImages({});
      setImageLoadStatus({});
      
      // Start preloading the first few images immediately
      preloadCriticalImages();
    }
  }, [images]);

  // Stop playing when date changes
  useEffect(() => {
    setIsPlaying(false);
  }, [selectedDate]);

  // Preload critical images (first 3) for immediate display
  const preloadCriticalImages = useCallback(async () => {
    if (images.length === 0) return;

    const criticalImages = images.slice(0, 3);
    
    criticalImages.forEach((image) => {
      preloadSingleImage(image, true);
    });
  }, [images]);

  // Preload a single image
  const preloadSingleImage = useCallback(async (image: EpicImage, isCritical = false) => {
    if (preloadedImages[image.identifier]) return; // Already loaded

    setImageLoadStatus(prev => ({ ...prev, [image.identifier]: 'loading' }));

    return new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const handleLoad = () => {
        setPreloadedImages(prev => ({ ...prev, [image.identifier]: img.src }));
        setImageLoadStatus(prev => ({ ...prev, [image.identifier]: 'loaded' }));
        resolve();
      };

      const handleError = () => {
        console.error(`Failed to preload image ${image.identifier}`);
        // Fallback to direct API URL
        setPreloadedImages(prev => ({ ...prev, [image.identifier]: `/api/v1/epic/image/${image.image}` }));
        setImageLoadStatus(prev => ({ ...prev, [image.identifier]: 'error' }));
        resolve();
      };

      img.onload = handleLoad;
      img.onerror = handleError;
      img.src = `/epic/images/${image.image}.png`;
    });
  }, [preloadedImages]);

  // Progressive preloading in background
  useEffect(() => {
    if (images.length === 0) return;

    const preloadRemainingImages = async () => {
      // Start with critical images (already handled above)
      // Then preload remaining images progressively
      const remainingImages = images.slice(3);
      
      for (const image of remainingImages) {
        await preloadSingleImage(image);
        // Small delay to prevent overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    };

    // Start progressive preloading after a short delay
    const timer = setTimeout(preloadRemainingImages, 500);
    return () => clearTimeout(timer);
  }, [images, preloadSingleImage]);

  // Auto-play functionality - only start when current image is loaded
  useEffect(() => {
    if (!isPlaying || images.length <= 1) return;

    const currentImage = images[currentImageIndex];
    if (!currentImage || imageLoadStatus[currentImage.identifier] !== 'loaded') return;

    console.log('Starting auto-play with', images.length, 'images');
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % images.length;
        return nextIndex;
      });
    }, 600);

    return () => {
      console.log('Clearing auto-play interval');
      clearInterval(interval);
    };
  }, [isPlaying, currentImageIndex, images, imageLoadStatus]);
  
  if (loading) {
    return (
      <div className="relative">
        <LoadingSpinner progress={100} context="initial" />
      </div>
    );
  }

  const currentImage = images[currentImageIndex];
  const currentImageUrl = currentImage ? preloadedImages[currentImage.identifier] : '';
  const isCurrentImageLoaded = currentImage && imageLoadStatus[currentImage.identifier] === 'loaded';

  // Show content immediately if we have images, even if not all are preloaded
  if (!currentImage) {
    return (
      <div className="relative">
        <LoadingSpinner progress={0} context="initial" />
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start animate-fade-in">
      {/* Left Side: Image and Controls */}
      <div className="space-y-6">
        {/* Main Image Display */}
        <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl mx-auto max-w-xl lg:max-w-lg">
          <div className="aspect-square relative">
            {/* Show current image if loaded, otherwise show loading state */}
            {currentImageUrl && isCurrentImageLoaded ? (
              <img
                src={currentImageUrl}
                alt={`Earth from DSCOVR - ${currentImage.caption}`}
                className="w-full h-full object-cover transition-all duration-300 ease-in-out animate-fade-in"
                onError={(e) => {
                  console.error('Image failed to load:', e);
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-white text-sm">Loading image...</p>
                </div>
              </div>
            )}
            
            {/* Overlay with image info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <div className="text-white">
                <h3 className="text-lg font-semibold mb-1">{currentImage.caption}</h3>
                <p className="text-blue-200 text-sm">
                  Image {currentImageIndex + 1} of {images.length} • {currentImage.date}
                </p>
              </div>
            </div>

            {/* Play indicator */}
            {isPlaying && (
              <div className="absolute top-4 right-4 bg-red-500 px-3 py-1 rounded-full text-white text-sm font-medium animate-pulse">
                ● LIVE
              </div>
            )}
          </div>
        </div>

        {/* Progress Indicators */}
        <div className="flex justify-center space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentImageIndex(index);
                setIsPlaying(false);
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ease-in-out ${
                index === currentImageIndex 
                  ? 'bg-blue-400 w-8 scale-110' 
                  : 'bg-white/30 hover:bg-white/50 hover:scale-105'
              }`}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={handlePrevious}
            className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-all duration-300 ease-in-out hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={images.length <= 1}
          >
            <SkipBack className="h-5 w-5" />
          </button>
          
          <button
            onClick={handlePlayPause}
            className="p-4 bg-blue-500 hover:bg-blue-600 rounded-full text-white transition-all duration-300 ease-in-out hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            disabled={!isCurrentImageLoaded}
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </button>
          
          <button
            onClick={handleNext}
            className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-all duration-300 ease-in-out hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={images.length <= 1}
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>

        {/* Image Counter */}
        <div className="text-center">
          <p className="text-blue-200 text-sm">
            Showing Earth's rotation over {images.length} images captured on {selectedDate}
          </p>
          <div className="flex items-center justify-center mt-2 space-x-4 text-xs text-blue-300">
            <span>Frame Rate: {isPlaying ? '1.67 FPS' : 'Paused'}</span>
            <span>•</span>
            <span>Resolution: 2048×2048</span>
            <span>•</span>
            <span>Source: DSCOVR Satellite</span>
          </div>
        </div>
      </div>

      {/* Right Side: Detailed Image Info */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10 lg:sticky lg:top-6">
        <h3 className="text-xl font-bold text-white mb-4">Image Details</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-blue-300 uppercase tracking-wide mb-2">Current Image</h4>
            <p className="text-white text-lg font-medium mb-1">{currentImage.caption}</p>
            <p className="text-blue-200 text-sm">
              <span className="font-medium">Identifier:</span> {currentImage.identifier}
            </p>
            <p className="text-blue-200 text-sm">
              <span className="font-medium">Date:</span> {currentImage.date}
            </p>
          </div>
          
          <div className="border-t border-white/10 pt-4">
            <h4 className="text-sm font-semibold text-blue-300 uppercase tracking-wide mb-2">Earth Coordinates</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-blue-200 text-sm">
                  <span className="font-medium">Latitude</span>
                </p>
                <p className="text-white text-lg font-mono">
                  {currentImage.centroid_coordinates.lat.toFixed(2)}°
                </p>
              </div>
              <div>
                <p className="text-blue-200 text-sm">
                  <span className="font-medium">Longitude</span>
                </p>
                <p className="text-white text-lg font-mono">
                  {currentImage.centroid_coordinates.lon.toFixed(2)}°
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4">
            <h4 className="text-sm font-semibold text-blue-300 uppercase tracking-wide mb-2">Satellite Position</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-200">X:</span>
                <span className="text-white font-mono">{currentImage.dscovr_j2000_position.x.toFixed(0)} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-200">Y:</span>
                <span className="text-white font-mono">{currentImage.dscovr_j2000_position.y.toFixed(0)} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-200">Z:</span>
                <span className="text-white font-mono">{currentImage.dscovr_j2000_position.z.toFixed(0)} km</span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4">
            <h4 className="text-sm font-semibold text-blue-300 uppercase tracking-wide mb-2">Session Info</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-200">Total Images:</span>
                <span className="text-white">{images.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-200">Current Frame:</span>
                <span className="text-white">{currentImageIndex + 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-200">Status:</span>
                <span className={isPlaying ? "text-green-400" : "text-yellow-400"}>
                  {isPlaying ? "Playing" : "Paused"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-200">Preloaded:</span>
                <span className="text-white">
                  {Object.values(imageLoadStatus).filter(status => status === 'loaded').length} / {images.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Monitor (Development Only) */}
      <PerformanceMonitor 
        images={images}
        imageLoadStatus={imageLoadStatus}
        loading={loading}
      />
    </div>
  );
};

export default EarthCarousel;