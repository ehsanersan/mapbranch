import React from 'react';
import { useStore } from '@/store/useStore';

export default function Header() {
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  const lastSaved = useStore((s) => s.lastSaved);
  const branches = useStore((s) => s.branches);
  const currentPage = useStore((s) => s.currentPage);
  const setCurrentPage = useStore((s) => s.setCurrentPage);
  const saveData = useStore((s) => s.saveData);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  };

  const totalAreas = branches.reduce((sum, b) => sum + b.areas.length, 0);

  return (
    <header className="glass fixed top-0 left-0 right-0 z-[1000] h-16 flex items-center justify-between px-4 lg:px-6">
      {/* Right side - Logo */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden w-10 h-10 rounded-xl glass-light flex items-center justify-center hover:bg-white/5 transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
          </svg>
        </button>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary-light to-accent flex items-center justify-center shadow-lg glow-purple">
            <span className="text-xl">🗺️</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-black bg-gradient-to-l from-accent via-primary-light to-primary bg-clip-text text-transparent">
              MapBranch Glass
            </h1>
            <p className="text-[10px] text-text-secondary -mt-0.5">مدیریت شعب و محدوده‌ها</p>
          </div>
        </div>
      </div>

      {/* Center - Navigation */}
      <nav className="hidden md:flex items-center gap-1 bg-white/5 rounded-2xl p-1">
        {[
          { key: 'dashboard' as const, label: 'داشبورد', icon: '📊' },
          { key: 'branches' as const, label: 'شعب', icon: '📍' },
          { key: 'settings' as const, label: 'تنظیمات', icon: '⚙️' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setCurrentPage(item.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
              currentPage === item.key
                ? 'bg-gradient-to-l from-primary to-primary-dark text-white shadow-lg'
                : 'text-text-secondary hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="ml-1.5">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Left side - Stats & Actions */}
      <div className="flex items-center gap-3">
        {/* Stats badges */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20">
            <span className="text-xs">🏢</span>
            <span className="text-xs font-bold text-primary-light">{branches.length}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/20">
            <span className="text-xs">📐</span>
            <span className="text-xs font-bold text-accent">{totalAreas}</span>
          </div>
        </div>

        {/* Save status */}
        <button
          onClick={saveData}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5"
        >
          {lastSaved ? (
            <>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-text-secondary hidden sm:inline">
                {formatTime(lastSaved)}
              </span>
            </>
          ) : (
            <span className="text-[10px] text-text-secondary">ذخیره</span>
          )}
        </button>

        {/* User avatar */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-black shadow-lg cursor-pointer hover:scale-105 transition-transform">
          ک
        </div>
      </div>
    </header>
  );
}
