import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useStore } from '@/store/useStore';
import { formatCoordinate } from '@/utils/geo';

const TILE_URLS: Record<string, { url: string; attribution: string }> = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap',
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© CARTO',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri',
  },
};

function getDashArray(style: string): string | undefined {
  switch (style) {
    case 'dashed': return '12 8';
    case 'dotted': return '4 8';
    default: return undefined;
  }
}

interface MapViewProps {
  onMapClick: (lat: number, lng: number) => void;
  mapRef: React.MutableRefObject<L.Map | null>;
}

export default function MapView({ onMapClick, mapRef }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const polygonsRef = useRef<Map<string, L.Polygon | L.CircleMarker>>(new Map());
  const drawingLayersRef = useRef<L.Layer[]>([]);

  const branches = useStore((s) => s.branches);
  const selectedBranchId = useStore((s) => s.selectedBranchId);
  const selectedAreaId = useStore((s) => s.selectedAreaId);
  const drawingState = useStore((s) => s.drawingState);
  const mapSettings = useStore((s) => s.mapSettings);
  const addDrawingPoint = useStore((s) => s.addDrawingPoint);
  const finishDrawing = useStore((s) => s.finishDrawing);
  const cancelDrawing = useStore((s) => s.cancelDrawing);

  const [cursorPos, setCursorPos] = useState<{ lat: number; lng: number } | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [35.6892, 51.3890],
      zoom: 12,
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true,
    });

    const tileConfig = TILE_URLS[mapSettings.mapType] || TILE_URLS.street;
    tileLayerRef.current = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCursorPos({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update tile layer
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    const tileConfig = TILE_URLS[mapSettings.mapType] || TILE_URLS.street;
    tileLayerRef.current.setUrl(tileConfig.url);
  }, [mapSettings.mapType]);

  // Map click handler
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handler = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (drawingState.mode === 'drawing-polygon') {
        addDrawingPoint({ latitude: lat, longitude: lng });
      } else if (drawingState.mode === 'placing-branch') {
        onMapClick(lat, lng);
      } else {
        onMapClick(lat, lng);
      }
    };

    map.on('click', handler);
    return () => { map.off('click', handler); };
  }, [drawingState.mode, onMapClick, addDrawingPoint]);

  // Cursor style
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (drawingState.mode !== 'none') {
      container.classList.add('drawing-cursor');
    } else {
      container.classList.remove('drawing-cursor');
    }
  }, [drawingState.mode]);

  // Render markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    if (!mapSettings.showBranches) return;

    branches.forEach((branch) => {
      const isSelected = branch.id === selectedBranchId;

      const html = `
        <div class="branch-marker ${isSelected ? 'branch-marker-selected' : ''}" style="background: linear-gradient(135deg, ${branch.color} 0%, ${branch.color}cc 100%); --marker-glow: ${branch.color}60;">
          <div class="branch-marker-inner">${mapSettings.showStickers ? branch.sticker : ''}</div>
        </div>
        ${mapSettings.showBranchNames ? `<div style="position:absolute;top:52px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:11px;font-weight:700;color:white;text-shadow:0 2px 8px rgba(0,0,0,0.8);font-family:Vazirmatn,sans-serif;">${branch.name}</div>` : ''}
      `;

      const icon = L.divIcon({
        html,
        className: '',
        iconSize: [48, 56],
        iconAnchor: [24, 56],
      });

      const marker = L.marker([branch.latitude, branch.longitude], {
        icon,
        draggable: isSelected && drawingState.mode === 'none',
      }).addTo(map);

      marker.on('click', () => {
        useStore.getState().selectBranch(branch.id);
      });

      marker.on('dragend', (e: any) => {
        const pos = e.target.getLatLng();
        useStore.getState().updateBranch(branch.id, {
          latitude: pos.lat,
          longitude: pos.lng,
        });
      });

      markersRef.current.set(branch.id, marker);
    });
  }, [branches, selectedBranchId, mapSettings.showBranches, mapSettings.showBranchNames, mapSettings.showStickers, drawingState.mode]);

  // Render polygons
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    polygonsRef.current.forEach((p) => p.remove());
    polygonsRef.current.clear();

    if (!mapSettings.showAllAreas) return;

    branches.forEach((branch) => {
      branch.areas.forEach((area) => {
        if (!area.visible) return;
        if (area.slotIndex === 0 && !mapSettings.showArea1) return;
        if (area.slotIndex === 1 && !mapSettings.showArea2) return;
        if (area.slotIndex === 2 && !mapSettings.showArea3) return;
        if (area.points.length < 3) return;

        const latlngs = area.points.map((p) => [p.latitude, p.longitude] as [number, number]);
        const isSelectedArea = area.id === selectedAreaId;

        const polygon = L.polygon(latlngs, {
          color: area.borderColor,
          weight: area.borderWidth,
          opacity: area.borderOpacity,
          fillColor: area.fillColor,
          fillOpacity: area.fillOpacity,
          dashArray: getDashArray(area.borderStyle),
        }).addTo(map);

        polygon.on('click', () => {
          useStore.getState().selectBranch(branch.id);
          useStore.getState().selectArea(area.id);
        });

        polygonsRef.current.set(area.id, polygon);

        // Show vertex points
        if (mapSettings.showPolygonPoints || isSelectedArea) {
          area.points.forEach((p, idx) => {
            const cm = L.circleMarker([p.latitude, p.longitude], {
              radius: isSelectedArea ? 6 : 4,
              color: 'white',
              weight: 2,
              fillColor: area.borderColor,
              fillOpacity: 1,
            }).addTo(map);
            polygonsRef.current.set(`${area.id}-v-${idx}`, cm);
          });
        }
      });
    });
  }, [branches, selectedAreaId, mapSettings.showAllAreas, mapSettings.showArea1, mapSettings.showArea2, mapSettings.showArea3, mapSettings.showPolygonPoints]);

  // Drawing visualization
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous drawing layers
    drawingLayersRef.current.forEach((l) => l.remove());
    drawingLayersRef.current = [];

    if (drawingState.mode !== 'drawing-polygon' || drawingState.currentPoints.length === 0) return;

    const latlngs = drawingState.currentPoints.map((p) => [p.latitude, p.longitude] as [number, number]);

    // Draw polyline
    const polyline = L.polyline(latlngs, {
      color: '#FBBF24',
      weight: 3,
      dashArray: '10 6',
      opacity: 0.9,
    }).addTo(map);
    drawingLayersRef.current.push(polyline);

    // Draw points
    drawingState.currentPoints.forEach((p, i) => {
      const cm = L.circleMarker([p.latitude, p.longitude], {
        radius: i === 0 ? 10 : 6,
        color: i === 0 ? '#FBBF24' : '#A78BFA',
        weight: 3,
        fillColor: i === 0 ? '#FBBF24' : '#7C3AED',
        fillOpacity: 1,
      }).addTo(map);

      if (i === 0 && drawingState.currentPoints.length >= 3) {
        cm.on('click', (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e);
          finishDrawing();
        });
        cm.bindTooltip('کلیک برای بستن', { direction: 'top', permanent: false });
      }

      drawingLayersRef.current.push(cm);
    });

    // Closing hint line
    if (drawingState.currentPoints.length >= 3) {
      const first = drawingState.currentPoints[0];
      const last = drawingState.currentPoints[drawingState.currentPoints.length - 1];
      const closingLine = L.polyline(
        [[last.latitude, last.longitude], [first.latitude, first.longitude]],
        { color: '#FBBF24', weight: 2, dashArray: '6 6', opacity: 0.4 }
      ).addTo(map);
      drawingLayersRef.current.push(closingLine);
    }
  }, [drawingState.currentPoints, drawingState.mode, finishDrawing]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawingState.mode !== 'none') {
        cancelDrawing();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (drawingState.mode === 'drawing-polygon' && drawingState.currentPoints.length > 0) {
          useStore.getState().removeLastDrawingPoint();
        } else {
          useStore.getState().undo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        useStore.getState().redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        useStore.getState().saveData();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [drawingState, cancelDrawing]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} id="map-container" className="w-full h-full" />

      {/* Cursor coordinates */}
      {cursorPos && (
        <div className="absolute bottom-3 left-3 z-[500] glass-light rounded-xl px-3 py-1.5 text-[10px] text-text-secondary font-mono">
          {formatCoordinate(cursorPos.lat, cursorPos.lng, mapSettings.coordinateFormat, mapSettings.coordinateStyle)}
        </div>
      )}

      {/* Drawing mode UI */}
      {drawingState.mode === 'drawing-polygon' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] glass rounded-2xl px-5 py-3 flex items-center gap-4 animate-slide-up shadow-xl">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
            <span className="text-sm font-bold text-accent">رسم محدوده</span>
          </div>
          <div className="w-px h-5 bg-white/10" />
          <span className="text-xs text-text-secondary">{drawingState.currentPoints.length} نقطه</span>
          {drawingState.currentPoints.length >= 3 && (
            <button
              onClick={finishDrawing}
              className="px-4 py-1.5 rounded-xl bg-accent/20 text-accent text-xs font-bold hover:bg-accent/30 transition-colors"
            >
              ✓ پایان
            </button>
          )}
          <button
            onClick={cancelDrawing}
            className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {drawingState.mode === 'placing-branch' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] glass rounded-2xl px-5 py-3 flex items-center gap-4 animate-slide-up shadow-xl">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary-light animate-pulse" />
            <span className="text-sm font-bold text-primary-light">انتخاب موقعیت</span>
          </div>
          <span className="text-xs text-text-secondary">روی نقشه کلیک کنید</span>
          <button
            onClick={cancelDrawing}
            className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition-colors"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
