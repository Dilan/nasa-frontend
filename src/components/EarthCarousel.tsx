import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, SkipBack, SkipForward, Pause, Play } from 'lucide-react';
import { EpicImage } from '../types/';

interface EarthCarouselProps {
  images: EpicImage[];
  selectedDate: string;
}

const EarthCarousel: React.FC<EarthCarouselProps> = ({ images, selectedDate }) => {
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

  // Preload images
  useEffect(() => {
    if (images.length === 0) return;

    setAllImagesLoaded(false);
    setLoadingProgress(0);
    setCurrentImageIndex(0);
    setPreloadedImages({});

    const preloadImages = async () => {
      const totalImages = images.length;
      let loadedCount = 0;
      const imageCache: { [key: string]: string } = {};

      const imagePromises = images.map((image, index) => {
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
          img.src = `/api/v1/epic/image/${image.image}`;
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
  

  const currentImage = images[currentImageIndex];
  const currentImageUrl = currentImage ? preloadedImages[currentImage.identifier] : '';

  if (!currentImage) {
    return null;
  }

  // Show loading state if images aren't ready
  if (!allImagesLoaded) {
    return (
      <div className="relative">
        <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl mx-auto max-w-2xl">
          <div className="aspect-square relative flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-blue-400 animate-spin mx-auto mb-4" />
              <p className="text-white text-lg font-medium">Preloading Earth Images...</p>
              <p className="text-blue-200 text-sm mb-4">
                Loading {images.length} images (~2.5MB each)
              </p>
              <div className="w-64 bg-white/10 rounded-full h-2 overflow-hidden mx-auto">
                <div 
                  className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <p className="text-blue-300 text-sm mt-2">
                {Math.round(loadingProgress)}% complete
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Main Image Display */}
      <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl mx-auto max-w-2xl">
        <div className="aspect-square relative">
          <img
            src={currentImageUrl}
            alt={`Earth from DSCOVR - ${currentImage.caption}`}
            className="w-full h-full object-cover transition-opacity duration-200"
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
      <div className="flex justify-center mt-6 space-x-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentImageIndex(index);
              setIsPlaying(false);
            }}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              index === currentImageIndex 
                ? 'bg-blue-400 w-8' 
                : 'bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Image Counter */}
      <div className="text-center mt-4">
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

      {/* Controls */}
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={handlePrevious}
          className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-all duration-200 hover:scale-105"
          disabled={images.length <= 1}
        >
          <SkipBack className="h-5 w-5" />
        </button>
        
        <button
          onClick={handlePlayPause}
          className="p-4 bg-blue-500 hover:bg-blue-600 rounded-full text-white transition-all duration-200 hover:scale-105 shadow-lg"
        >
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        </button>
        
        <button
          onClick={handleNext}
          className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-all duration-200 hover:scale-105"
          disabled={images.length <= 1}
        >
          <SkipForward className="h-5 w-5" />
        </button>
      </div>

      {/* Image Info */}
      {images[currentImageIndex] && (
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10 mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Image Details</h3>
              <p className="text-blue-200 text-sm mb-2">
                <span className="font-medium">Identifier:</span> {images[currentImageIndex].identifier}
              </p>
              <p className="text-blue-200 text-sm mb-2">
                <span className="font-medium">Caption:</span> {images[currentImageIndex].caption}
              </p>
              <p className="text-blue-200 text-sm">
                <span className="font-medium">Date:</span> {images[currentImageIndex].date}
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Earth Coordinates</h3>
              <p className="text-blue-200 text-sm mb-2">
                <span className="font-medium">Latitude:</span> {images[currentImageIndex].centroid_coordinates.lat.toFixed(2)}°
              </p>
              <p className="text-blue-200 text-sm">
                <span className="font-medium">Longitude:</span> {images[currentImageIndex].centroid_coordinates.lon.toFixed(2)}°
              </p>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default EarthCarousel;