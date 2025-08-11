import { useState, useEffect } from "react";
import { EpicImage } from "../types";

interface UseImagePreloaderProps {
  images: EpicImage[];
  date: string;
  onProgress?: (progress: number) => void;
}

function useImagePreloader({ images, date, onProgress }: UseImagePreloaderProps) {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  // date must be a string with format YYYYMMDD
  if (typeof date === 'object') {
    date = new Date(date).toISOString().split('T')[0];
  }

  if (date.length !== 10) {
    console.log('[ERROR] ----------> Date must be a string with format YYYY-MM-DD', date);
    return;
  }

  useEffect(() => {
    console.log('----------> useImagePreloader', date, 'images amount', images.length);

    if (!images || images.length === 0) {
      setLoadingProgress(0);
      setIsLoaded(false);
      setLoadedImages(new Set());
      return;
    }

    let isCancelled = false;
    setLoadingProgress(0);
    setIsLoaded(false);
    setLoadedImages(new Set());

    async function preload() {
      const imagePromises = images.map((img) => {
        return new Promise<void>((resolve) => {
          const image = new Image();
          
          image.onload = () => {
            if (!isCancelled) {
              setLoadedImages(prev => new Set([...prev, img.identifier]));
              setLoadingProgress(prev => {
                const newProgress = prev + (100 / images.length);
                onProgress?.(newProgress);
                return newProgress;
              });
            }
            resolve();
          };
          
          image.onerror = () => {
            if (!isCancelled) {
              setLoadedImages(prev => new Set([...prev, img.identifier]));
              setLoadingProgress(prev => {
                const newProgress = prev + (100 / images.length);
                onProgress?.(newProgress);
                return newProgress;
              });
            }
            resolve();
          };

          // Construct the API URL for the image
          const dateWithoutHyphens = date.replace(/-/g, '');
          if (!img.image.includes(dateWithoutHyphens)) {
            console.log('[ERROR] ----------> image', img.image, 'does not belong to', date);
          } else {
            image.src = `/api/v1/epic/image/${img.image}`;
          }
        });
      });

      await Promise.all(imagePromises);

      if (!isCancelled) {
        setIsLoaded(true);
        setLoadingProgress(100);
        onProgress?.(100);
      }
    }

    preload();

    return () => {
      isCancelled = true;
    };
  }, [images, date, onProgress]);

  return { 
    loadingProgress, 
    isLoaded, 
    loadedImages,
    totalImages: images?.length || 0,
    loadedCount: loadedImages.size
  };
}

export default useImagePreloader;