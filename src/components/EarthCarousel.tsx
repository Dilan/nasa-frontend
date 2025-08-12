import React, { useEffect, useState } from 'react';
import { SkipBack, SkipForward, Pause, Play } from 'lucide-react';
import { EpicImage } from '../types/';
import LoadingSpinner from './LoadingSpinner';

interface EarthCarouselProps {
  loading: boolean;
  images: EpicImage[];
  selectedDate: string;
}

const EarthCarousel: React.FC<EarthCarouselProps> = ({ loading, images, selectedDate }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [allImagesLoaded, setAllImagesLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [preloadedImages, setPreloadedImages] = useState<{ [key: string]: string }>({});

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

  // Reset preloading state when new images are received
  useEffect(() => {
    if (images.length > 0) {
      setAllImagesLoaded(false);
      setLoadingProgress(0);
      setCurrentImageIndex(0);
      setPreloadedImages({});
    }
  }, [images]);

  // Preload images
  useEffect(() => {
    if (images.length === 0) return;

    const preloadImages = async () => {
      const totalImages = images.length;
      let loadedCount = 0;
      const imageCache: { [key: string]: string } = {};

      const imagePromises = images.map((image) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          const handleLoad = () => {
            // Cache the loaded image URL
            imageCache[image.identifier] = img.src;
            loadedCount++;
            setLoadingProgress((loadedCount / totalImages) * 100);
            resolve();
          };

          const handleError = () => {
            console.error(`Failed to preload image ${image.identifier}`);
            // Even on error, cache the URL so we can try to display it
            imageCache[image.identifier] = `/api/v1/epic/image/${image.image}`;
            loadedCount++;
            setLoadingProgress((loadedCount / totalImages) * 100);
            resolve();
          };

          img.onload = handleLoad;
          img.onerror = handleError;
          img.src = `/epic/images/${image.image}.png`;
        });
      });

      try {
        await Promise.all(imagePromises);
        setPreloadedImages(imageCache);
        setAllImagesLoaded(true);
        console.log(`Successfully preloaded ${images.length} images`);
      } catch (error) {
        console.error('Error preloading images:', error);
        setPreloadedImages(imageCache);
        setAllImagesLoaded(true); // Allow to proceed even with errors
      }
    };

    preloadImages();
  }, [images]);

  
  // Auto-play functionality - only start when images are loaded
  useEffect(() => {
    if (!isPlaying || !allImagesLoaded || images.length <= 1) {
      return;
    }

    console.log('Starting auto-play with', images.length, 'images');
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % images.length;
        return nextIndex;
      });
    }, 600); // Slightly faster for smoother rotation

    return () => {
      console.log('Clearing auto-play interval');
      clearInterval(interval);
    };
  }, [isPlaying, allImagesLoaded, images]);
  
  if (loading) {
    return (
      <div className="relative">
        <LoadingSpinner progress={loadingProgress} context="initial" />
      </div>
    );
  }

  const currentImage = images[currentImageIndex];
  const currentImageUrl = currentImage ? preloadedImages[currentImage.identifier] : '';

  // Show loading state if images aren't ready
  if (!allImagesLoaded || !currentImage) {
    return (
      <div className="relative">
        {/* Show main loading state immediately */}
        {loading ? (
          <LoadingSpinner progress={loadingProgress} context="initial" />
        ) : (
          /* Show preloading state when main loading is done but images aren't ready */
          loadingProgress > 0 && (
            <LoadingSpinner progress={loadingProgress} context="preloading" />
          )
        )}
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
            <img
              src={currentImageUrl}
              alt={`Earth from DSCOVR - ${currentImage.caption}`}
              className="w-full h-full object-cover transition-all duration-300 ease-in-out animate-fade-in"
              onError={(e) => {
                console.error('Image failed to load:', e);
              }}
            />
            
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarthCarousel;