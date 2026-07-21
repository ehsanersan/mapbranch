import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { calculateArea, formatArea, formatCoordinate, generateTXT, generateGeoJSON } from '@/utils/geo';
import { downloadText, downloadJSON } from '@/utils/exportUtils';
import type { Area } from '@/types';

interface AreaPanelProps {
  onStartDrawing: (branchId: string, slotIndex: number) => void;
}

export default function AreaPanel({ onStartDrawing }: AreaPanelProps) {
  const branches = useStore((s) => s.branches);
  const selectedBranchId = useStore((s) => s.selectedBranchId);
  const selectedAreaId = useStore((s) => s.selectedAreaId);
  const selectArea = useStore((s) => s.selectArea);
  const updateArea = useStore((s) => s.updateArea);
  const deleteArea = useStore((s) => s.deleteArea);
  const drawingState = useStore((s) => s.drawingState);
  const mapSettings = useStore((s) => s.mapSettings);
  const addToast = useStore((s) => s.addToast);
  const selectBranch = useStore((s) => s.selectBranch);

  const [expandedArea, setExpandedArea] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const branch = branches.find((b) => b.id === selectedBranchId);
  if (!branch) return null;

  const availableSlots = [0, 1, 2].filter((i) => !branch.areas.some((a) => a.slotIndex === i));
  const isDrawing = drawingState.mode !== 'none';

  const handleExportTXT = (area: Area) => {
    try {
      const txt = generateTXT(branch, area);
      downloadText(txt, `${branch.name}-${area.name}.txt`);
      addToast('TXT دانلود شد', 'success');
    } catch (err) {
      addToast('خطا در دانلود', 'error');
    }
  };

  const handleExportGeoJSON = (area: Area) => {
    try {
      const geoJSON = generateGeoJSON([{ ...branch, areas: [area] }]);
      downloadJSON(geoJSON, `${branch.name}-${area.name}.geojson`);
      addToast('GeoJSON دانلود شد', 'success');
    } catch (err) {
      addToast('خطا در دانلود', 'error');
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-[1000] w-80 max-h-[65vh] glass rounded-2xl shadow-2xl animate-slide-up flex flex-col overflow-hidden max-md:left-2 max-md:right-2 max-md:bottom-2 max-md:w-auto">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: `${branch.color}20`, border: `1px solid ${branch.color}40` }}
          >
            {branch.sticker}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{branch.name}</h3>
            <p className="text-[10px] text-text-secondary">{branch.areas.length}/3 محدوده</p>
          </div>
        </div>
        <button
          onClick={() => selectBranch(null)}
          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-text-secondary hover:text-white transition-all"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto flex-1 p-3 space-y-2">
        {/* Add area buttons */}
        {availableSlots.length > 0 && !isDrawing && (
          <div className="flex gap-2 pb-2">
            {availableSlots.map((slot) => (
              <button
                key={slot}
                onClick={() => onStartDrawing(branch.id, slot)}
                className="flex-1 py-2.5 rounded-xl border border-dashed border-primary/30 text-xs text-text-secondary hover:bg-primary/10 hover:border-primary/50 hover:text-accent transition-all"
              >
                + محدوده {slot + 1}
              </button>
            ))}
          </div>
        )}

        {/* Drawing mode indicator */}
        {isDrawing && drawingState.targetBranchId === branch.id && (
          <div className="p-4 rounded-xl bg-gradient-to-l from-accent/20 to-accent/10 border border-accent/30 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-bold text-accent">حالت رسم فعال</span>
            </div>
            <p className="text-[10px] text-text-secondary">
              روی نقشه کلیک کنید ({drawingState.currentPoints.length} نقطه)
            </p>
          </div>
        )}

        {/* Empty state */}
        {branch.areas.length === 0 && !isDrawing && (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">📐</div>
            <p className="text-xs text-text-secondary">محدوده‌ای ندارد</p>
          </div>
        )}

        {/* Areas list */}
        {branch.areas.sort((a, b) => a.slotIndex - b.slotIndex).map((area) => {
          const isExpanded = expandedArea === area.id;
          const areaSize = calculateArea(area.points);

          return (
            <div
              key={area.id}
              className={`rounded-xl border transition-all ${
                selectedAreaId === area.id
                  ? 'bg-primary/15 border-primary/40'
                  : 'bg-white/3 border-white/5 hover:border-primary/20'
              }`}
            >
              {/* Area header */}
              <div
                className="p-3 cursor-pointer flex items-center gap-3"
                onClick={() => {
                  selectArea(area.id);
                  setExpandedArea(isExpanded ? null : area.id);
                }}
              >
                <div
                  className="w-5 h-5 rounded-full shrink-0 ring-2 ring-white/20"
                  style={{ backgroundColor: area.fillColor }}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{area.name}</h4>
                  <p className="text-[10px] text-text-secondary mt-0.5">
                    {area.points.length} نقطه • {formatArea(areaSize)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {area.locked && <span className="text-[10px]">🔒</span>}
                  {!area.visible && <span className="text-[10px] opacity-50">👁️</span>}
                  <span className={`text-xs text-text-secondary transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </div>
              </div>

              {/* Expanded settings */}
              {isExpanded && (
                <div className="px-3 pb-3 space-y-3 border-t border-white/5 pt-3 animate-fade-in">
                  {/* Name */}
                  <div>
                    <label className="text-[10px] text-text-secondary mb-1.5 block">نام</label>
                    <input
                      type="text"
                      value={area.name}
                      onChange={(e) => updateArea(branch.id, area.id, { name: e.target.value })}
                      className="w-full input-glass rounded-lg px-3 py-2 text-xs"
                    />
                  </div>

                  {/* Colors */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-text-secondary mb-1.5 block">رنگ پر</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={area.fillColor}
                          onChange={(e) => updateArea(branch.id, area.id, { fillColor: e.target.value })}
                          className="w-7 h-7 rounded cursor-pointer"
                        />
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={area.fillOpacity * 100}
                          onChange={(e) => updateArea(branch.id, area.id, { fillOpacity: +e.target.value / 100 })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-text-secondary mb-1.5 block">رنگ خط</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={area.borderColor}
                          onChange={(e) => updateArea(branch.id, area.id, { borderColor: e.target.value })}
                          className="w-7 h-7 rounded cursor-pointer"
                        />
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={area.borderOpacity * 100}
                          onChange={(e) => updateArea(branch.id, area.id, { borderOpacity: +e.target.value / 100 })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Border width */}
                  <div>
                    <label className="text-[10px] text-text-secondary mb-1.5 block">
                      ضخامت خط: {area.borderWidth}px
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="8"
                      value={area.borderWidth}
                      onChange={(e) => updateArea(branch.id, area.id, { borderWidth: +e.target.value })}
                      className="w-full"
                    />
                  </div>

                  {/* Toggles */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => updateArea(branch.id, area.id, { visible: !area.visible })}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                        area.visible
                          ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/30'
                          : 'bg-white/5 text-text-secondary'
                      }`}
                    >
                      {area.visible ? '👁️ نمایش' : '👁️ مخفی'}
                    </button>
                    <button
                      onClick={() => updateArea(branch.id, area.id, { locked: !area.locked })}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                        area.locked
                          ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30'
                          : 'bg-white/5 text-text-secondary'
                      }`}
                    >
                      {area.locked ? '🔒 قفل' : '🔓 آزاد'}
                    </button>
                  </div>

                  {/* Coordinates */}
                  {area.points.length > 0 && (
                    <div>
                      <label className="text-[10px] text-text-secondary mb-1.5 block">
                        مختصات ({area.points.length} نقطه)
                      </label>
                      <div className="max-h-20 overflow-y-auto bg-black/30 rounded-lg p-2 space-y-0.5">
                        {area.points.map((p, i) => (
                          <div key={i} className="flex items-center gap-2 text-[9px] font-mono text-text-secondary/80">
                            <span className="text-primary-light w-4">{i + 1}.</span>
                            <span>{formatCoordinate(p.latitude, p.longitude, mapSettings.coordinateFormat)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Export buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExportTXT(area)}
                      className="flex-1 py-2 rounded-lg bg-white/5 text-[10px] text-text-secondary hover:bg-white/10 hover:text-white transition-colors"
                    >
                      📄 TXT
                    </button>
                    <button
                      onClick={() => handleExportGeoJSON(area)}
                      className="flex-1 py-2 rounded-lg bg-white/5 text-[10px] text-text-secondary hover:bg-white/10 hover:text-white transition-colors"
                    >
                      🌍 GeoJSON
                    </button>
                  </div>

                  {/* Delete */}
                  {deleteConfirm === area.id ? (
                    <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 animate-fade-in">
                      <p className="text-[10px] text-red-300 mb-2">حذف «{area.name}»؟</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { deleteArea(branch.id, area.id); setDeleteConfirm(null); setExpandedArea(null); }}
                          className="px-3 py-1 rounded bg-red-500/30 text-[10px] text-red-200 font-semibold"
                        >
                          حذف
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-3 py-1 rounded bg-white/5 text-[10px] text-text-secondary"
                        >
                          انصراف
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(area.id)}
                      disabled={area.locked}
                      className="w-full py-2 rounded-lg text-[10px] text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      🗑️ حذف محدوده
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
