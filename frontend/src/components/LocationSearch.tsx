import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface LocationSearchProps {
  onSelectLocation: (lng: number, lat: number) => void;
}

interface Suggestion {
  id: string;
  place_name: string;
  center: [number, number];
}

export const LocationSearch: React.FC<LocationSearchProps> = ({ onSelectLocation }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      try {
        const token = import.meta.env.VITE_MAPBOX_TOKEN;
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=5`
        );
        const data = await response.json();
        setSuggestions(data.features || []);
        setIsOpen(true);
      } catch (error) {
        console.error('Geocoding error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = (suggestion: Suggestion) => {
    setQuery(suggestion.place_name);
    setSuggestions([]);
    setIsOpen(false);
    onSelectLocation(suggestion.center[0], suggestion.center[1]);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative group">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-brand-teal animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-white/40 group-focus-within:text-brand-teal transition-colors" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 3 && setIsOpen(true)}
          placeholder="Search location..."
          className="w-full bg-brand-navy/80 backdrop-blur-md border border-white/10 text-white text-sm rounded-xl py-2.5 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal/50 transition-all shadow-2xl"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-3 flex items-center text-white/40 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-brand-navy/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-[1000] animate-in fade-in slide-in-from-top-2">
          {suggestions.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSelect(s)}
              className="w-full flex items-start gap-3 p-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group"
            >
              <MapPin className="w-4 h-4 text-brand-teal/60 group-hover:text-brand-teal shrink-0 mt-0.5" />
              <span className="text-xs text-white/80 group-hover:text-white line-clamp-2">{s.place_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
