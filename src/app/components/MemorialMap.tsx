"use client";

import { MapPinIcon } from '@heroicons/react/24/outline';

interface Place {
  id: string;
  name: string;
  address: string;
  lng: number;
  lat: number;
  memorialDay: string;
  ancestor: string;
  note: string;
  photo: string;
}

interface MemorialMapProps {
  places: Place[];
}

const MARKER_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];

export default function MemorialMap({ places }: MemorialMapProps) {
  const openNavigation = (place: Place) => {
    const amapNavUrl = `https://uri.amap.com/navigation?to=${place.lng},${place.lat},${encodeURIComponent(place.name)}&mode=car&policy=1&src=myapp&coordinate=gaode&callnative=1`;
    const opened = window.open(amapNavUrl, '_blank');
    if (!opened) {
      window.location.href = amapNavUrl;
    }
  };

  return (
    <div className="w-full">
      <div className="bg-card dark:bg-dark-card shadow-sm overflow-hidden">
        <div className="p-3 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
        <MapPinIcon className="h-5 w-5 text-cinnabar" />
        <h2 className="text-base sm:text-lg font-bold font-serif text-ink dark:text-dark-text">祭祖地点 ({places.length}处)</h2>
      </div>
      <div className="space-y-2">
        {places.map((place, index) => (
          <div
            key={place.id}
            className="flex items-center gap-3 p-3 bg-card dark:bg-dark-card rounded-xl border border-border dark:border-dark-border"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs"
              style={{ background: MARKER_COLORS[index % MARKER_COLORS.length] }}
            >
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-ink dark:text-dark-text text-sm">{place.name}</p>
              <p className="text-xs text-muted dark:text-dark-muted truncate">{place.address}</p>
            </div>
            <button
              onClick={() => openNavigation(place)}
              className="p-2 text-cinnabar dark:text-dark-cinnabar hover:bg-heritage dark:hover:bg-dark-heritage rounded-lg flex-shrink-0"
              title="导航"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
            </button>
          </div>
        ))}
      </div>
        </div>
      </div>
    </div>
  );
}
