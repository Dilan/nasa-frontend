import { useState, useEffect, useCallback, useMemo } from 'react';
import { Satellite } from 'lucide-react';
import RateLimitDisplay from '../components/RateLimitDisplay';
import DateSelector from '../components/DateSelector';
import EarthCarousel from '../components/EarthCarousel';
import { EpicImage } from '../types';
import { toast } from 'sonner';

function HomePage() {
  const [selectedDate, setSelectedDate] = useState<string>('2025-07-15');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [images, setImages] = useState<EpicImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [_error, setError] = useState<string | null>(null);
  const [apiLimit, setApiLimit] = useState({ used: 0, total: 2000 });
  
  // Memoize the fetch function to prevent unnecessary re-creations
  const fetchAvailableDates = useCallback(async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/v1/epic/available-dates');

      // console.log('response', response.status);
      if (response.status >= 400) {
        toast.error('Failed to fetch available dates. Please try again later.');
        setLoading(false);
        return;
      }

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
      // Add a small delay to prevent toast conflicts
      toast.error('Failed to fetch available dates. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEpicImages = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);

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

      // Only update images after successful fetch
      setImages(data);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch images';
      // Add a small delay to prevent toast conflicts
      setTimeout(() => {
        toast.error(errorMessage);
      }, 100);
      setError(errorMessage);
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Memoize the date change handler
  const handleDateChange = useCallback((newDate: string) => {
    setSelectedDate(newDate);
  }, []);

  useEffect(() => {
    fetchAvailableDates();
  }, [fetchAvailableDates]);

  useEffect(() => {
    fetchEpicImages(selectedDate);
  }, [selectedDate, fetchEpicImages]);

  // Memoize the loading overlay to prevent unnecessary re-renders
  const loadingOverlay = useMemo(() => {
    if (!loading) return null;
    
    return (
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-xl z-10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-white font-medium">Loading new date...</p>
          <p className="text-blue-200 text-sm">Fetching Earth images</p>
        </div>
      </div>
    );
  }, [loading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/20 rounded-lg backdrop-blur-sm">
            <Satellite className="h-8 w-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">NASA Earth</h1>
            <p className="text-blue-200 text-sm">Earth Polychromatic Imaging Camera</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <RateLimitDisplay apiLimit={apiLimit} />
        </div>
      </header>

      <main className="px-6 pb-6">
        {/* Date Selection */}
        <div className="mb-8 relative z-10">
          <DateSelector
            loading={loading}
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            availableDates={availableDates}
            disabled={loading}
          />
        </div>

        <div className="max-w-7xl mx-auto relative">
          {/* Loading overlay for smooth transitions */}
          {loadingOverlay}
          
          <EarthCarousel
            loading={loading}
            images={images}
            selectedDate={selectedDate}
          />
        </div>
      </main>
    </div>
  );
}

export default HomePage;