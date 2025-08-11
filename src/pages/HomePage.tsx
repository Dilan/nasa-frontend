import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Globe, Satellite } from 'lucide-react';
import RateLimitDisplay from '../components/RateLimitDisplay';
import DateSelector from '../components/DateSelector';
import EarthCarousel from '../components/EarthCarousel';
import LoadingSpinner from '../components/LoadingSpinner';
import { EpicImage } from '../types';

function HomePage() {
  const [selectedDate, setSelectedDate] = useState<string>('2015-06-13');
  const [images, setImages] = useState<EpicImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiLimit, setApiLimit] = useState({ used: 0, total: 2000 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  useEffect(() => {
    const fetchAvailableDates = async () => {
      setLoading(true);
      
      try {
        const response = await fetch('/api/v1/epic/available-dates');

        // HEADERS: [X-RateLimit-Limit] & [X-RateLimit-Remaining]
        if (response.headers.get('X-RateLimit-Remaining')) {
          const rateLimitLimit = parseInt(response.headers.get('X-RateLimit-Limit') || '0');
          const rateLimitRemaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0');
          setApiLimit({ used: rateLimitLimit - rateLimitRemaining, total: rateLimitLimit });
        }

        const datesList = await response.json();
        const dates = [];
        // Use the actual length of datesList instead of rateLimitLimit
        for (let i = 0; i < datesList.length; i++) {
          const date = new Date(datesList[i]);
          dates.push(date.toISOString().split('T')[0]);
        }

        setAvailableDates(dates);

        console.log('dates amount', dates.length);

      } catch (error) {
        console.error('Failed to fetch available dates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableDates();
  }, []);

  const fetchEpicImages = async (date: string) => {
    setLoading(true);
    setError(null);
    setLoadingProgress(0);

    try {
      
      // in case of NASA API, use `https://api.nasa.gov/EPIC/api/natural/date/${date}?api_key=${NASA_API_KEY}`
      const response = await fetch(`/api/v1/epic/?date=${date}`);

      // HEADERS: [X-RateLimit-Limit] & [X-RateLimit-Remaining]
      if (response.headers.get('X-RateLimit-Remaining')) {
        const rateLimitLimit = parseInt(response.headers.get('X-RateLimit-Limit') || '0');
        const rateLimitRemaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0');
        setApiLimit({ used: rateLimitLimit - rateLimitRemaining, total: rateLimitLimit });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: EpicImage[] = await response.json();

      if (data.length === 0) {
        throw new Error('No images available for this date. Please try a different date.');
      }

      setImages(data);
      setCurrentImageIndex(0);
      
      // loading progress for preloading images
      const imagePromises = data.map((img, _index) => {

        // img.image has format: epic_1b_20150613110250
        // 20150613 is the date
       

        return new Promise((resolve) => {
          let dateWithoutHyphens = date.replace(/-/g, '');
          if (!img.image.includes(dateWithoutHyphens)) {
            console.log('[img.image]', img.image, 'does not belong to', date);
          } else {
            console.log('[img.image]', img.image, 'belongs to', date);
          }
          
          const image = new Image();
          image.onload = () => {
            setLoadingProgress((prev) => prev + (100 / Math.min(data.length, 10)));
            resolve(img);
          };
          image.onerror = () => resolve(img);
          // const [year, month, day] = date.split('-');
          // image.src = `https://api.nasa.gov/EPIC/archive/natural/${year}/${month}/${day}/png/${img.image}.png?api_key=${NASA_API_KEY}`;
          image.src = `/api/v1/epic/image/${date}/${img.image}`;
        });
      });

      await Promise.all(imagePromises);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch images');
      setImages([]);
    } finally {
      setLoading(false);
      setLoadingProgress(100);
    }
  };

  useEffect(() => {
    fetchEpicImages(selectedDate);
  }, [selectedDate]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/20 rounded-lg backdrop-blur-sm">
            <Satellite className="h-8 w-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">NASA EPIC Viewer</h1>
            <p className="text-blue-200 text-sm">Earth Polychromatic Imaging Camera</p>
          </div>
        </div>
        <RateLimitDisplay apiLimit={apiLimit} />
      </header>

      <main className="px-6 pb-6">
        {/* Date Selection */}
        <div className="mb-8 relative z-10">
          <DateSelector
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            availableDates={availableDates}
            disabled={loading}
          />
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto relative">
          {loading ? (
            <LoadingSpinner progress={loadingProgress} />
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
              <Globe className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-red-400 mb-2">Error Loading Images</h3>
              <p className="text-red-200">{error}</p>
              <button
                onClick={() => fetchEpicImages(selectedDate)}
                className="mt-4 px-6 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : images.length > 0 ? (
            <div className="space-y-6">
              {/* Earth Carousel */}
              <EarthCarousel
                images={images}
                selectedDate={selectedDate}
                currentImageIndex={currentImageIndex}
                isPlaying={isPlaying}
                onImageIndexChange={setCurrentImageIndex}
                onPlayingChange={setIsPlaying}
              />

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
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
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
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default HomePage;