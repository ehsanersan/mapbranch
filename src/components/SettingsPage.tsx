import React, { useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { downloadJSON } from '@/utils/exportUtils';

export default function SettingsPage() {
  const mapSettings = useStore((s) => s.mapSettings);
  const updateMapSettings = useStore((s) => s.updateMapSettings);
  const branches = useStore((s) => s.branches);
  const importData = useStore((s) => s.importData);
  const clearAllData = useStore((s) => s.clearAllData);
  const addToast = useStore((s) => s.addToast);
  const setCurrentPage = useStore((s) => s.setCurrentPage);

  const fileRef = useRef<HTMLInputElement>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleExportProject = () => {
    try {
      const data = useStore.getState().exportData();
      downloadJSON(data, `mapbranch-backup-${new Date().toISOString().slice(0, 10)}.json`);
      addToast('پروژه خروجی گرفته شد', 'success');
    } catch (err) {
      addToast('خطا در خروجی', 'error');
    }
  };

  const handleImportProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (Array.isArray(data)) {
          importData(data);
        } else {
          addToast('فایل نامعتبر است', 'error');
        }
      } catch {
        addToast('خطا در خواندن فایل', 'error');
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const totalAreas = branches.reduce((s, b) => s + b.areas.length, 0);
  const totalPoints = branches.reduce((s, b) => s + b.areas.reduce((ss, a) => ss + a.points.length, 0), 0);

  return (
    <div className="fixed inset-0 z-[900] bg-bg-dark overflow-y-auto pt-16">
      <div className="max-w-3xl mx-auto p-6 space-y-6 pb-24">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="w-10 h-10 rounded-xl glass flex items-center justify-center text-text-secondary hover:text-white transition-all"
          >
            →
          </button>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            ⚙️ تنظیمات
          </h1>
        </div>

        {/* Map Settings */}
        <div className="glass rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-bold text-accent flex items-center gap-2">🗺️ تنظیمات نقشه</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-text-secondary mb-3 block">نوع نقشه</label>
              <div className="flex gap-3">
                {[
                  { key: 'street' as const, label: '🗺️ خیابانی' },
                  { key: 'dark' as const, label: '🌙 تیره' },
                  { key: 'satellite' as const, label: '🛰️ ماهواره' },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => updateMapSettings({ mapType: t.key })}
                    className={`flex-1 p-3 rounded-xl text-sm font-semibold transition-all ${
                      mapSettings.mapType === t.key
                        ? 'bg-primary/20 ring-2 ring-primary/50 text-white'
                        : 'bg-white/5 text-text-secondary hover:bg-white/10'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-secondary mb-3 block">فرمت مختصات</label>
              <div className="flex gap-3">
                <button
                  onClick={() => updateMapSettings({ coordinateFormat: 'lat-lng' })}
                  className={`flex-1 p-3 rounded-xl text-sm font-semibold transition-all ${
                    mapSettings.coordinateFormat === 'lat-lng'
                      ? 'bg-primary/20 ring-2 ring-primary/50 text-white'
                      : 'bg-white/5 text-text-secondary hover:bg-white/10'
                  }`}
                >
                  Lat, Lng
                </button>
                <button
                  onClick={() => updateMapSettings({ coordinateFormat: 'lng-lat' })}
                  className={`flex-1 p-3 rounded-xl text-sm font-semibold transition-all ${
                    mapSettings.coordinateFormat === 'lng-lat'
                      ? 'bg-primary/20 ring-2 ring-primary/50 text-white'
                      : 'bg-white/5 text-text-secondary hover:bg-white/10'
                  }`}
                >
                  Lng, Lat
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="glass rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-bold text-accent flex items-center gap-2">💾 مدیریت داده‌ها</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div>
                <p className="text-sm font-semibold text-white">خروجی پروژه</p>
                <p className="text-[10px] text-text-secondary mt-0.5">فایل JSON کامل</p>
              </div>
              <button
                onClick={handleExportProject}
                className="px-4 py-2 rounded-xl bg-primary/20 text-sm text-primary-light font-semibold hover:bg-primary/30 transition-all"
              >
                📤 دانلود
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div>
                <p className="text-sm font-semibold text-white">وارد کردن پروژه</p>
                <p className="text-[10px] text-text-secondary mt-0.5">بازیابی از فایل</p>
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-primary/20 text-sm text-primary-light font-semibold hover:bg-primary/30 transition-all"
              >
                📥 انتخاب فایل
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".json"
                onChange={handleImportProject}
                className="hidden"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/10">
              <div>
                <p className="text-sm font-semibold text-red-400">حذف همه</p>
                <p className="text-[10px] text-text-secondary mt-0.5">قابل بازگشت نیست</p>
              </div>
              {showClearConfirm ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => { clearAllData(); setShowClearConfirm(false); }}
                    className="px-3 py-1.5 rounded-lg bg-red-500/30 text-xs text-red-200 font-bold"
                  >
                    تأیید
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-text-secondary"
                  >
                    انصراف
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="px-4 py-2 rounded-xl bg-red-500/20 text-sm text-red-400 font-semibold hover:bg-red-500/30 transition-all"
                >
                  🗑️ حذف
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="glass rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-bold text-accent flex items-center gap-2">📊 آمار پروژه</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'شعب', value: branches.length, icon: '🏢', color: 'from-primary/20' },
              { label: 'محدوده‌ها', value: totalAreas, icon: '📐', color: 'from-accent/20' },
              { label: 'نقاط', value: totalPoints, icon: '📍', color: 'from-green-500/20' },
              { label: 'فعال', value: branches.filter(b => b.status === 'active').length, icon: '✅', color: 'from-blue-500/20' },
            ].map((stat) => (
              <div key={stat.label} className={`p-4 rounded-xl bg-gradient-to-b ${stat.color} to-transparent text-center`}>
                <span className="text-2xl">{stat.icon}</span>
                <div className="text-2xl font-black text-white mt-2">{stat.value}</div>
                <div className="text-[10px] text-text-secondary">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Shortcuts */}
        <div className="glass rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-bold text-accent flex items-center gap-2">⌨️ میانبرها</h2>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              { keys: 'Esc', desc: 'لغو رسم' },
              { keys: 'Ctrl+Z', desc: 'بازگشت' },
              { keys: 'Ctrl+Y', desc: 'تکرار' },
              { keys: 'Ctrl+S', desc: 'ذخیره' },
            ].map((shortcut) => (
              <div key={shortcut.keys} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <code className="px-2 py-1 rounded bg-primary/20 text-[10px] text-accent font-mono">{shortcut.keys}</code>
                <span className="text-xs text-text-secondary">{shortcut.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
