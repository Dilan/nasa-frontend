import { useState, useEffect, useCallback } from 'react';
import { Satellite } from 'lucide-react';
import RateLimitDisplay from '../components/RateLimitDisplay';
import DateSelector from '../components/DateSelector';
import EarthCarousel from '../components/EarthCarousel';
import { EpicImage } from '../types';
import useImagePreloader from '../hooks/useImagePreloader';


function HomePage() {
  const [selectedDate, setSelectedDate] = useState<string>('2015-06-13');
  const [images, setImages] = useState<EpicImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiLimit, setApiLimit] = useState({ used: 0, total: 2000 });
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  // Use the image preloader hook
  /*
  useImagePreloader({
    images: images,
    date: selectedDate,
    onProgress: setLoadingProgress
  });
  */

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
    setImages([]);

    try {
      // NASA API, use `https://api.nasa.gov/EPIC/api/natural/date/${date}?api_key=${NASA_API_KEY}`
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

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch images');
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEpicImages(selectedDate);
  }, [selectedDate]);

  

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

        <div className="max-w-7xl mx-auto relative">
          <EarthCarousel
            images={images}
            selectedDate={selectedDate}
          />
        </div>

        
      </main>
    </div>
  );
}

export default HomePage;