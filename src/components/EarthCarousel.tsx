import React, { useEffect, useState, useCallback } from 'react';
import { EpicImage } from '../App';
import { Loader2 } from 'lucide-react';

interface EarthCarouselProps {
  images: EpicImage[];
  selectedDate: string;
  currentImageIndex: number;
  isPlaying: boolean;
  onImageIndexChange: (index: number) => void;
  onPlayingChange: (playing: boolean) => void;
}

const EarthCarousel: React.FC<EarthCarouselProps> = ({
  images,
  selectedDate,
  currentImageIndex,
  isPlaying,
  onImageIndexChange,
  onPlayingChange,
}) => {
  const [allImagesLoaded, setAllImagesLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [preloadedImages, setPreloadedImages] = useState<{ [key: string]: string }>({});

  const getImageUrl = useCallback((image: EpicImage) => {
    return `/api/v1/epic/image/${selectedDate}/${image.image}`;
    // const [year, month, day] = selectedDate.split('-');
    // return `https://api.nasa.gov/EPIC/archive/natural/${year}/${month}/${day}/png/${image.image}.png?api_key=${NASA_API_KEY}`;
  }, [selectedDate]);

  // Preload images
  useEffect(() => {
    if (images.length === 0) return;

    setAllImagesLoaded(false);
    setLoadingProgress(0);
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
            imageCache[image.identifier] = getImageUrl(image);
            loadedCount++;
            setLoadingProgress((loadedCount / totalImages) * 100);
            resolve();
          };

          img.onload = handleLoad;
          img.onerror = handleError;
          img.src = getImageUrl(image);
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
  }, [images, getImageUrl]);

  // Auto-play functionality - only start when images are loaded
  useEffect(() => {
    if (!isPlaying || !allImagesLoaded || images.length <= 1) {
      return;
    }

    console.log('Starting auto-play with', images.length, 'images');
    
    const interval = setInterval(() => {
      onImageIndexChange((prevIndex) => {
        const nextIndex = (prevIndex + 1) % images.length;
        console.log(`Auto-advancing from image ${prevIndex} to ${nextIndex}`);
        return nextIndex;
      });
    }, 600); // Slightly faster for smoother rotation

    return () => {
      console.log('Clearing auto-play interval');
      clearInterval(interval);
    };
  }, [isPlaying, allImagesLoaded, images.length, onImageIndexChange]);

  const currentImage = images[currentImageIndex];
  const currentImageUrl = currentImage ? preloadedImages[currentImage.identifier] || getImageUrl(currentImage) : '';

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
              onImageIndexChange(index);
              onPlayingChange(false);
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
    </div>
  );
};

export default EarthCarousel;