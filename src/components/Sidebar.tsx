import React, { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';

interface SidebarProps {
  onAddBranch: () => void;
  onEditBranch: (id: string) => void;
  onZoomToBranch: (id: string) => void;
  onZoomToAll: () => void;
}

export default function Sidebar({ onAddBranch, onEditBranch, onZoomToBranch, onZoomToAll }: SidebarProps) {
  const branches = useStore((s) => s.branches);
  const selectedBranchId = useStore((s) => s.selectedBranchId);
  const selectBranch = useStore((s) => s.selectBranch);
  const deleteBranch = useStore((s) => s.deleteBranch);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      if (search && !b.name.includes(search) && !(b.address || '').includes(search)) return false;
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      return true;
    });
  }, [branches, search, statusFilter]);

  const totalAreas = branches.reduce((sum, b) => sum + b.areas.length, 0);
  const totalPoints = branches.reduce((sum, b) => sum + b.areas.reduce((s, a) => s + a.points.length, 0), 0);

  const statusColors: Record<string, string> = {
    active: 'bg-green-500',
    inactive: 'bg-red-500',
    pending: 'bg-amber-500',
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[1001]"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-16 right-0 h-[calc(100vh-64px)] w-80 z-[1002] glass transition-transform duration-300 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/5">
          <button
            onClick={onAddBranch}
            className="w-full btn-primary py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 relative z-10"
          >
            <span className="relative z-10 flex items-center gap-2">
              <span className="text-lg">+</span>
              افزودن شعبه
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجوی شعبه..."
              className="w-full input-glass rounded-xl px-4 py-2.5 pr-10 text-sm"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary">🔍</span>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 pb-3 flex gap-2 flex-wrap">
          {[
            { value: 'all', label: 'همه' },
            { value: 'active', label: 'فعال' },
            { value: 'inactive', label: 'غیرفعال' },
            { value: 'pending', label: 'بررسی' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                statusFilter === f.value
                  ? 'bg-primary/30 text-accent ring-1 ring-primary/30'
                  : 'bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Branch list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {filteredBranches.length === 0 ? (
            <div className="text-center py-16 animate-fade-in">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center text-3xl mb-4">
                📍
              </div>
              <p className="text-sm font-medium text-text-secondary mb-1">
                {branches.length === 0 ? 'شعبه‌ای وجود ندارد' : 'نتیجه‌ای یافت نشد'}
              </p>
              {branches.length === 0 && (
                <button
                  onClick={onAddBranch}
                  className="text-xs text-accent hover:text-accent-light transition-colors mt-2"
                >
                  + اولین شعبه را ایجاد کنید
                </button>
              )}
            </div>
          ) : (
            filteredBranches.map((branch, index) => (
              <div
                key={branch.id}
                style={{ animationDelay: `${index * 30}ms` }}
                className={`animate-fade-in rounded-2xl p-4 cursor-pointer transition-all duration-200 relative group ${
                  selectedBranchId === branch.id
                    ? 'bg-gradient-to-l from-primary/20 to-primary/10 ring-1 ring-primary/40 shadow-lg shadow-primary/10'
                    : 'bg-white/3 hover:bg-white/5 border border-white/5 hover:border-primary/20'
                }`}
                onClick={() => {
                  selectBranch(branch.id);
                  onZoomToBranch(branch.id);
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Sticker */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-lg"
                    style={{ 
                      background: `linear-gradient(135deg, ${branch.color}30 0%, ${branch.color}10 100%)`,
                      border: `1px solid ${branch.color}40` 
                    }}
                  >
                    {branch.sticker}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white truncate">{branch.name}</h3>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${statusColors[branch.status]}`} />
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-text-secondary">
                      <span className="flex items-center gap-1">
                        <span className="text-xs">📐</span>
                        {branch.areas.length}
                      </span>
                      {branch.areas.length > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="text-xs">📍</span>
                          {branch.areas.reduce((s, a) => s + a.points.length, 0)}
                        </span>
                      )}
                    </div>
                    {/* Area color dots */}
                    {branch.areas.length > 0 && (
                      <div className="flex gap-1.5 mt-2">
                        {branch.areas.map((a) => (
                          <span
                            key={a.id}
                            className="w-3 h-3 rounded-full ring-1 ring-white/20"
                            style={{ backgroundColor: a.fillColor }}
                            title={a.name}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Menu button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(menuOpen === branch.id ? null : branch.id);
                    }}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-text-secondary hover:text-white transition-all opacity-0 group-hover:opacity-100"
                  >
                    ⋮
                  </button>
                </div>

                {/* Dropdown menu */}
                {menuOpen === branch.id && (
                  <div className="absolute left-4 top-14 glass rounded-xl shadow-2xl border border-white/10 py-2 z-50 min-w-[140px] animate-scale-in">
                    <button
                      onClick={(e) => { e.stopPropagation(); onEditBranch(branch.id); setMenuOpen(null); }}
                      className="w-full text-right px-4 py-2 text-xs text-text-secondary hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                    >
                      ✏️ ویرایش
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onZoomToBranch(branch.id); setMenuOpen(null); }}
                      className="w-full text-right px-4 py-2 text-xs text-text-secondary hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                    >
                      🔍 زوم
                    </button>
                    <div className="border-t border-white/5 my-1" />
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(branch.id); setMenuOpen(null); }}
                      className="w-full text-right px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                    >
                      🗑️ حذف
                    </button>
                  </div>
                )}

                {/* Delete confirmation */}
                {deleteConfirm === branch.id && (
                  <div 
                    className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 animate-fade-in" 
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="text-xs text-red-300 mb-2">حذف «{branch.name}»؟</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { deleteBranch(branch.id); setDeleteConfirm(null); }}
                        className="px-3 py-1.5 rounded-lg bg-red-500/30 text-xs text-red-200 font-semibold hover:bg-red-500/50 transition-colors"
                      >
                        حذف
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-text-secondary hover:bg-white/10 transition-colors"
                      >
                        انصراف
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer stats */}
        <div className="p-4 border-t border-white/5 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: branches.length, label: 'شعبه', icon: '🏢', color: 'from-primary/20 to-primary/5' },
              { value: totalAreas, label: 'محدوده', icon: '📐', color: 'from-accent/20 to-accent/5' },
              { value: totalPoints, label: 'نقطه', icon: '📍', color: 'from-green-500/20 to-green-500/5' },
            ].map((stat) => (
              <div key={stat.label} className={`text-center p-2.5 rounded-xl bg-gradient-to-b ${stat.color}`}>
                <div className="text-lg font-black text-white">{stat.value}</div>
                <div className="text-[9px] text-text-secondary">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onZoomToAll}
              disabled={branches.length === 0}
              className="flex-1 py-2 rounded-xl bg-white/5 text-[10px] text-text-secondary hover:bg-white/10 hover:text-white transition-all disabled:opacity-40"
            >
              🔲 نمایش همه
            </button>
            <button
              onClick={() => selectBranch(null)}
              className="flex-1 py-2 rounded-xl bg-white/5 text-[10px] text-text-secondary hover:bg-white/10 hover:text-white transition-all"
            >
              ✕ پاک‌سازی
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
