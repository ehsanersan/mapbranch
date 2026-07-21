import React, { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { calculateArea, formatArea, generateGeoJSON, generateCSV } from '@/utils/geo';
import { downloadJSON, downloadText } from '@/utils/exportUtils';

interface BranchesPageProps {
  onEditBranch: (id: string) => void;
  onZoomToBranch: (id: string) => void;
}

export default function BranchesPage({ onEditBranch, onZoomToBranch }: BranchesPageProps) {
  const branches = useStore((s) => s.branches);
  const deleteBranch = useStore((s) => s.deleteBranch);
  const setCurrentPage = useStore((s) => s.setCurrentPage);
  const addToast = useStore((s) => s.addToast);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return branches.filter((b) => {
      if (search && !b.name.includes(search) && !(b.address || '').includes(search)) return false;
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      return true;
    });
  }, [branches, search, statusFilter]);

  const statusLabel: Record<string, string> = {
    active: 'فعال',
    inactive: 'غیرفعال',
    pending: 'بررسی',
  };

  const statusBadge: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400 ring-green-500/30',
    inactive: 'bg-red-500/20 text-red-400 ring-red-500/30',
    pending: 'bg-amber-500/20 text-amber-400 ring-amber-500/30',
  };

  const handleExportAll = () => {
    try {
      const geoJSON = generateGeoJSON(branches);
      downloadJSON(geoJSON, `branches-${new Date().toISOString().slice(0, 10)}.geojson`);
      addToast('GeoJSON دانلود شد', 'success');
    } catch (err) {
      addToast('خطا در دانلود', 'error');
    }
  };

  const handleExportCSV = () => {
    try {
      const csv = generateCSV(branches);
      downloadText(csv, `branches-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
      addToast('CSV دانلود شد', 'success');
    } catch (err) {
      addToast('خطا در دانلود', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[900] bg-bg-dark overflow-y-auto pt-16">
      <div className="max-w-4xl mx-auto p-6 space-y-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="w-10 h-10 rounded-xl glass flex items-center justify-center text-text-secondary hover:text-white transition-all"
            >
              →
            </button>
            <h1 className="text-xl font-black text-white">📍 شعب ({branches.length})</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              disabled={branches.length === 0}
              className="px-4 py-2 rounded-xl glass-light text-xs font-semibold text-text-secondary hover:text-white transition-all disabled:opacity-40"
            >
              📊 CSV
            </button>
            <button
              onClick={handleExportAll}
              disabled={branches.length === 0}
              className="px-4 py-2 rounded-xl glass-light text-xs font-semibold text-text-secondary hover:text-white transition-all disabled:opacity-40"
            >
              🌍 GeoJSON
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="glass rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو..."
              className="w-full input-glass rounded-xl px-4 py-3 pr-10 text-sm"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary">🔍</span>
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'inactive', 'pending'].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === f
                    ? 'bg-primary/30 text-accent ring-1 ring-primary/30'
                    : 'bg-white/5 text-text-secondary hover:bg-white/10'
                }`}
              >
                {f === 'all' ? 'همه' : statusLabel[f]}
              </button>
            ))}
          </div>
        </div>

        {/* Branch list */}
        {filtered.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center text-3xl mb-4">📍</div>
            <p className="text-sm font-medium text-text-secondary">شعبه‌ای یافت نشد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((branch, index) => {
              const totalArea = branch.areas.reduce((s, a) => s + calculateArea(a.points), 0);

              return (
                <div
                  key={branch.id}
                  style={{ animationDelay: `${index * 30}ms` }}
                  className="glass rounded-2xl p-5 animate-fade-in group hover:bg-white/5 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${branch.color}30, ${branch.color}10)`, border: `1px solid ${branch.color}40` }}
                    >
                      {branch.sticker}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-bold text-white">{branch.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ring-1 ${statusBadge[branch.status]}`}>
                          {statusLabel[branch.status]}
                        </span>
                      </div>
                      
                      {branch.description && (
                        <p className="text-xs text-text-secondary mb-2 line-clamp-1">{branch.description}</p>
                      )}

                      <div className="flex flex-wrap gap-4 text-[10px] text-text-secondary/70">
                        {branch.address && <span>📍 {branch.address}</span>}
                        <span>📐 {branch.areas.length} محدوده</span>
                        {totalArea > 0 && <span>📏 {formatArea(totalArea)}</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => { onZoomToBranch(branch.id); setCurrentPage('dashboard'); }}
                        className="w-9 h-9 rounded-xl glass-light flex items-center justify-center text-sm hover:bg-white/10 transition-colors"
                        title="نمایش"
                      >
                        🗺️
                      </button>
                      <button
                        onClick={() => onEditBranch(branch.id)}
                        className="w-9 h-9 rounded-xl glass-light flex items-center justify-center text-sm hover:bg-white/10 transition-colors"
                        title="ویرایش"
                      >
                        ✏️
                      </button>
                      {deleteConfirm === branch.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => { deleteBranch(branch.id); setDeleteConfirm(null); }}
                            className="px-3 py-1.5 rounded-lg bg-red-500/30 text-[10px] text-red-200 font-bold"
                          >
                            حذف
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-2 py-1.5 rounded-lg bg-white/5 text-[10px] text-text-secondary"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(branch.id)}
                          className="w-9 h-9 rounded-xl glass-light flex items-center justify-center text-sm hover:bg-red-500/20 text-red-400/60 hover:text-red-400 transition-colors"
                          title="حذف"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
