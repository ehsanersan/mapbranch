import React, { useState } from 'react';
import L from 'leaflet';
import { useStore } from '@/store/useStore';

interface MapControlsProps {
  mapRef: React.MutableRefObject<L.Map | null>;
}

export default function MapControls({ mapRef }: MapControlsProps) {
  const mapSettings = useStore((s) => s.mapSettings);
  const updateMapSettings = useStore((s) => s.updateMapSettings);
  const branches = useStore((s) => s.branches);
  const addToast = useStore((s) => s.addToast);
  const [layerPanelOpen, setLayerPanelOpen] = useState(false);

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();

  const handleLocate = () => {
    if (!mapRef.current) return;
    mapRef.current.locate({ setView: true, maxZoom: 16 });
    mapRef.current.once('locationfound', () => {
      addToast('موقعیت یافت شد', 'success');
    });
    mapRef.current.once('locationerror', () => {
      addToast('دسترسی به موقعیت ممکن نیست', 'error');
    });
  };

  const handleFitAll = () => {
    if (!mapRef.current || branches.length === 0) {
      addToast('شعبه‌ای وجود ندارد', 'warning');
      return;
    }
    const group = L.featureGroup();
    branches.forEach((b) => {
      group.addLayer(L.marker([b.latitude, b.longitude]));
      b.areas.forEach((a) => {
        if (a.points.length >= 3) {
          group.addLayer(L.polygon(a.points.map((p) => [p.latitude, p.longitude] as [number, number])));
        }
      });
    });
    mapRef.current.flyToBounds(group.getBounds().pad(0.1), { duration: 0.8 });
  };

  const handleFullscreen = () => {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const mapTypes = [
    { key: 'street' as const, label: '🗺️', title: 'خیابانی' },
    { key: 'dark' as const, label: '🌙', title: 'تیره' },
    { key: 'satellite' as const, label: '🛰️', title: 'ماهواره' },
  ];

  const btnClass = "w-10 h-10 rounded-xl glass flex items-center justify-center text-base hover:bg-white/10 transition-all cursor-pointer text-text-secondary hover:text-white shadow-lg";

  return (
    <>
      {/* Zoom controls */}
      <div className="map-controls absolute top-20 left-4 z-[500] flex flex-col gap-2">
        <button onClick={handleZoomIn} className={btnClass} title="بزرگ‌نمایی">+</button>
        <button onClick={handleZoomOut} className={btnClass} title="کوچک‌نمایی">−</button>
        <div className="w-10 h-px bg-white/10" />
        <button onClick={handleLocate} className={btnClass} title="موقعیت من">📍</button>
        <button onClick={handleFitAll} className={btnClass} title="نمایش همه">🔲</button>
        <button onClick={handleFullscreen} className={btnClass} title="تمام‌صفحه">⛶</button>
      </div>

      {/* Map type & layers */}
      <div className="map-controls absolute top-20 right-4 lg:right-[340px] z-[500] flex flex-col gap-2">
        {/* Map type */}
        <div className="flex gap-1 glass rounded-2xl p-1.5 shadow-xl">
          {mapTypes.map((t) => (
            <button
              key={t.key}
              onClick={() => updateMapSettings({ mapType: t.key })}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all ${
                mapSettings.mapType === t.key
                  ? 'bg-primary/30 text-white shadow-inner'
                  : 'hover:bg-white/10 text-text-secondary'
              }`}
              title={t.title}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Layers button */}
        <button
          onClick={() => setLayerPanelOpen(!layerPanelOpen)}
          className={`${btnClass} ${layerPanelOpen ? 'bg-primary/30 text-white' : ''}`}
          title="لایه‌ها"
        >
          📑
        </button>

        {/* Layer panel */}
        {layerPanelOpen && (
          <div className="glass rounded-2xl p-4 min-w-[220px] animate-scale-in shadow-xl">
            <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
              <span>📑</span> کنترل لایه‌ها
            </h4>
            
            <div className="space-y-2">
              {[
                { key: 'showBranches', label: 'نمایش شعب', icon: '🏢' },
                { key: 'showBranchNames', label: 'نام شعب', icon: '🏷️' },
                { key: 'showStickers', label: 'استیکرها', icon: '🎨' },
                { key: 'showAllAreas', label: 'همه محدوده‌ها', icon: '📐' },
                { key: 'showArea1', label: 'محدوده ۱', icon: '1️⃣' },
                { key: 'showArea2', label: 'محدوده ۲', icon: '2️⃣' },
                { key: 'showArea3', label: 'محدوده ۳', icon: '3️⃣' },
                { key: 'showPolygonPoints', label: 'نقاط رئوس', icon: '📍' },
              ].map((item) => {
                const value = mapSettings[item.key as keyof typeof mapSettings] as boolean;
                return (
                  <label
                    key={item.key}
                    className="flex items-center gap-3 cursor-pointer group py-1"
                    onClick={() => updateMapSettings({ [item.key]: !value })}
                  >
                    <div className={`toggle-switch ${value ? 'active' : ''}`} />
                    <span className="text-[11px] text-text-secondary group-hover:text-white transition-colors flex items-center gap-1.5">
                      <span>{item.icon}</span>
                      {item.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
