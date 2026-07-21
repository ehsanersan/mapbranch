import React from 'react';
import { useStore } from '@/store/useStore';
import { calculateArea, formatArea, formatCoordinate, generateTXT, generateGeoJSON } from '@/utils/geo';
import { downloadText, downloadJSON } from '@/utils/exportUtils';

interface BranchDetailProps {
  branchId: string;
  onClose: () => void;
  onStartDrawing: (branchId: string, slotIndex: number) => void;
}

export default function BranchDetail({ branchId, onClose, onStartDrawing }: BranchDetailProps) {
  const branches = useStore((s) => s.branches);
  const mapSettings = useStore((s) => s.mapSettings);
  const addToast = useStore((s) => s.addToast);
  const branch = branches.find((b) => b.id === branchId);

  if (!branch) return null;

  const statusLabel: Record<string, string> = {
    active: 'فعال',
    inactive: 'غیرفعال',
    pending: 'در حال بررسی',
  };

  const statusColor: Record<string, string> = {
    active: 'text-green-400 bg-green-500/15',
    inactive: 'text-red-400 bg-red-500/15',
    pending: 'text-yellow-400 bg-yellow-500/15',
  };

  const availableSlots = [0, 1, 2].filter(
    (i) => !branch.areas.some((a) => a.slotIndex === i)
  );

  return (
    <div className="fixed inset-0 z-[900] bg-bg-dark overflow-y-auto pt-14">
      <div className="max-w-3xl mx-auto p-6 space-y-6 pb-24">
        <button onClick={onClose} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-main transition-colors">
          ← بازگشت
        </button>

        {/* Branch info card */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
              style={{ backgroundColor: branch.color + '20', border: `2px solid ${branch.color}40` }}
            >
              {branch.sticker}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-text-main">{branch.name}</h1>
              <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${statusColor[branch.status]}`}>
                {statusLabel[branch.status]}
              </span>
              {branch.description && (
                <p className="text-xs text-text-secondary mt-2">{branch.description}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {branch.address && (
              <div className="bg-white/5 rounded-xl p-3 border border-primary/10">
                <span className="text-[10px] text-text-secondary">📍 آدرس</span>
                <p className="text-text-main mt-1">{branch.address}</p>
              </div>
            )}
            {branch.phone && (
              <div className="bg-white/5 rounded-xl p-3 border border-primary/10">
                <span className="text-[10px] text-text-secondary">📞 تماس</span>
                <p className="text-text-main mt-1">{branch.phone}</p>
              </div>
            )}
            <div className="bg-white/5 rounded-xl p-3 border border-primary/10">
              <span className="text-[10px] text-text-secondary">🌐 مختصات</span>
              <p className="text-text-main mt-1 font-mono text-[10px]">
                {formatCoordinate(branch.latitude, branch.longitude, mapSettings.coordinateFormat, mapSettings.coordinateStyle)}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-primary/10">
              <span className="text-[10px] text-text-secondary">📐 محدوده‌ها</span>
              <p className="text-text-main mt-1">{branch.areas.length} از ۳</p>
            </div>
          </div>
        </div>

        {/* Areas */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-accent">📐 محدوده‌های شعبه</h2>
          </div>

          {/* Add area buttons */}
          {availableSlots.length > 0 && (
            <div className="flex gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => { onClose(); onStartDrawing(branch.id, slot); }}
                  className="flex-1 py-2.5 rounded-xl border border-dashed border-primary/30 text-xs text-text-secondary hover:bg-primary/10 hover:border-primary/50 hover:text-accent transition-all"
                >
                  + رسم محدوده {slot + 1}
                </button>
              ))}
            </div>
          )}

          {branch.areas.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">📐</div>
              <p className="text-xs text-text-secondary">هنوز محدوده‌ای برای این شعبه تعریف نشده است</p>
            </div>
          ) : (
            branch.areas.sort((a, b) => a.slotIndex - b.slotIndex).map((area) => {
              const areaSize = calculateArea(area.points);
              return (
                <div key={area.id} className="bg-white/5 rounded-xl p-4 border border-primary/10 space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full border-2 border-white/20 shrink-0"
                      style={{ backgroundColor: area.fillColor }}
                    />
                    <div className="flex-1">
                      <h3 className="text-xs font-bold text-text-main">{area.name}</h3>
                      <p className="text-[10px] text-text-secondary mt-0.5">
                        {area.points.length} نقطه • {formatArea(areaSize)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          const txt = generateTXT(branch, area);
                          downloadText(txt, `${branch.name}-${area.name}.txt`);
                          addToast('TXT دانلود شد', 'success');
                        }}
                        className="px-2 py-1 rounded-lg bg-white/5 text-[9px] text-text-secondary hover:bg-primary/15 hover:text-text-main transition-colors"
                      >
                        TXT
                      </button>
                      <button
                        onClick={() => {
                          const gj = generateGeoJSON([{ ...branch, areas: [area] }]);
                          downloadJSON(gj, `${branch.name}-${area.name}.geojson`);
                          addToast('GeoJSON دانلود شد', 'success');
                        }}
                        className="px-2 py-1 rounded-lg bg-white/5 text-[9px] text-text-secondary hover:bg-primary/15 hover:text-text-main transition-colors"
                      >
                        GeoJSON
                      </button>
                    </div>
                  </div>

                  {/* Points table */}
                  <div className="bg-black/20 rounded-lg p-2 max-h-32 overflow-y-auto">
                    <table className="w-full text-[9px] font-mono">
                      <thead>
                        <tr className="text-text-secondary/60">
                          <th className="text-right pb-1 w-6">#</th>
                          <th className="text-right pb-1">Latitude</th>
                          <th className="text-right pb-1">Longitude</th>
                        </tr>
                      </thead>
                      <tbody>
                        {area.points.map((p, i) => (
                          <tr key={i} className="text-text-secondary/80">
                            <td className="py-0.5 text-primary-light">{i + 1}</td>
                            <td className="py-0.5">{p.latitude.toFixed(6)}</td>
                            <td className="py-0.5">{p.longitude.toFixed(6)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
