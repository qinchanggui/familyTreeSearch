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

// 高德地图标记颜色
const MARKER_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];

export default function MemorialMap({ places }: MemorialMapProps) {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const AMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // 初始化高德地图
  useEffect(() => {
    if (mapRef.current && typeof window !== 'undefined') {
      // 动态加载高德地图JS API
      const script = document.createElement('script');
      script.src = 'https://webapi.amap.com/maps?v=2.0&key=15bab9f5bf3ab11493cf97fc1732669f';
      script.onload = () => {
        initMap();
      };
      script.onerror = () => {
        // 如果JS API加载失败，使用静态图片模式
        setMapLoaded(true);
      };
      document.head.appendChild(script);
    }
  }, []);

  const initMap = useCallback(() => {
    if (!mapRef.current || !(window as any).AMap) return;

    // 计算中心点
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

    // 添加标记
    places.forEach((place, index) => {
      const marker = new AMap.Marker({
        position: [place.lng, place.lat],
        title: place.name,
        content: `<div style="
          background: ${MARKER_COLORS[index % MARKER_COLORS.length]};
          color: white;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
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

  // 导航功能
  const openNavigation = (place: Place) => {
    // 优先尝试打开高德App导航
    const amapNavUrl = `https://uri.amap.com/navigation?to=${place.lng},${place.lat},${encodeURIComponent(place.name)}&mode=car&policy=1&src=myapp&coordinate=gaode&callnative=1`;
    window.open(amapNavUrl, '_blank');
  };

  // 地图静态图片URL（备用方案）
  const centerLng = places.reduce((s, p) => s + p.lng, 0) / places.length;
  const centerLat = places.reduce((s, p) => s + p.lat, 0) / places.length;
  const markers = places.map(p => `${p.lng},${p.lat}`).join('|');
  const staticMapUrl = `https://restapi.amap.com/v3/staticmap?location=${centerLng},${centerLat}&zoom=13&size=750*400&markers=${markers}&key=YOUR_AMAP_KEY`;

  return (
    <div className="relative">
      {/* 地图区域 */}
      <div ref={mapRef} className="w-full h-[50vh] sm:h-[60vh] bg-gray-200 dark:bg-gray-800 rounded-xl overflow-hidden">
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-3"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">加载地图中...</p>
            </div>
          </div>
        )}
      </div>

      {/* 地点列表 */}
      <div className="mt-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          祭祖地点 ({places.length}处)
        </h3>
        {places.map((place, index) => (
          <div
            key={place.id}
            className={`flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-md transition-all active:scale-[0.98] ${selectedPlace?.id === place.id ? 'ring-2 ring-blue-400' : ''}`}
            onClick={() => setSelectedPlace(place)}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs"
              style={{ background: MARKER_COLORS[index % MARKER_COLORS.length] }}
            >
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">{place.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{place.address}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openNavigation(place);
              }}
              className="p-2 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg flex-shrink-0"
              title="导航"
            >
              <MapPinIcon className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>

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
