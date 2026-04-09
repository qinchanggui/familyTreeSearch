"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPinIcon, XMarkIcon } from '@heroicons/react/24/outline';

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
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const AMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (mapRef.current && typeof window !== 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://webapi.amap.com/maps?v=2.0&key=15bab9f5bf3ab11493cf97fc1732669f';
      script.onload = () => {
        initMap();
      };
      script.onerror = () => {
        setMapLoaded(true);
      };
      document.head.appendChild(script);
    }
  }, []);

  const initMap = useCallback(() => {
    if (!mapRef.current || !(window as any).AMap) return;

    const centerLng = places.reduce((s, p) => s + p.lng, 0) / places.length;
    const centerLat = places.reduce((s, p) => s + p.lat, 0) / places.length;

    const AMap = (window as any).AMap;
    const map = new AMap.Map(mapRef.current, {
      zoom: 13,
      center: [centerLng, centerLat],
      mapStyle: 'amap://styles/normal',
      resizeEnable: true,
    });

    AMapRef.current = map;

    places.forEach((place, index) => {
      const marker = new AMap.Marker({
        position: [place.lng, place.lat],
        title: place.name,
        content: `<div style="
          background: ${MARKER_COLORS[index % MARKER_COLORS.length]};
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: bold;
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
          border: 2px solid white;
        ">${place.name}</div>`,
        offset: new AMap.Pixel(-20, -15),
        extData: place,
      });

      marker.on('click', () => {
        setSelectedPlace(place);
      });

      markersRef.current.push(marker);
      map.add(marker);
    });

    setMapLoaded(true);
  }, [places]);

  const openNavigation = (place: Place) => {
    const amapNavUrl = `https://uri.amap.com/navigation?to=${place.lng},${place.lat},${encodeURIComponent(place.name)}&mode=car&policy=1&src=myapp&coordinate=gaode&callnative=1`;
    window.open(amapNavUrl, '_blank');
  };

  return (
    <div className="relative">
      {/* 地图区域 - 全屏高度 */}
      <div ref={mapRef} className="w-full h-[70vh] sm:h-[75vh] bg-gray-200 dark:bg-gray-800 rounded-xl overflow-hidden">
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-3"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">加载地图中...</p>
            </div>
          </div>
        )}
      </div>

      {/* 扫墓照片墙 */}
      {places.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">扫墓照片</h3>
          <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex-shrink-0 w-48 sm:w-56 snap-start">
                <img
                  src={`/memorial-photos/photo${i}.jpg`}
                  alt={`扫墓照片${i}`}
                  className="w-full h-64 sm:h-72 object-cover rounded-xl"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 地点详情弹窗 */}
      {selectedPlace && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedPlace(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md mx-auto p-6 shadow-2xl">
            <button
              onClick={() => setSelectedPlace(null)}
              className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <MapPinIcon className="h-6 w-6 text-red-500 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{selectedPlace.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedPlace.address}</p>
              </div>
            </div>

            {selectedPlace.ancestor && (
              <div className="mb-3 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  祭祀先祖：{selectedPlace.ancestor}
                </p>
              </div>
            )}

            {selectedPlace.memorialDay && (
              <div className="mb-3 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  祭祖日期：{selectedPlace.memorialDay}
                </p>
              </div>
            )}

            {selectedPlace.note && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{selectedPlace.note}</p>
            )}

            <button
              onClick={() => openNavigation(selectedPlace)}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <MapPinIcon className="h-5 w-5" />
              导航到这里
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
