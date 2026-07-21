import React, { useState } from 'react';
import Modal from './Modal';
import { useStore } from '@/store/useStore';
import { captureElement, downloadDataUrl, downloadJSON, downloadText } from '@/utils/exportUtils';
import { generateGeoJSON, generateCSV, generateTXT } from '@/utils/geo';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const branches = useStore((s) => s.branches);
  const selectedBranchId = useStore((s) => s.selectedBranchId);
  const addToast = useStore((s) => s.addToast);

  const [tab, setTab] = useState<'image' | 'data'>('data');
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const [imgFormat, setImgFormat] = useState<'png' | 'jpeg'>('png');
  const [imgScale, setImgScale] = useState(2);
  const [imgQuality, setImgQuality] = useState(90);

  const [dataFormat, setDataFormat] = useState<'geojson' | 'csv' | 'txt' | 'json'>('geojson');
  const [dataScope, setDataScope] = useState<'all' | 'selected'>('all');

  const handleImageExport = async () => {
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) {
      addToast('نقشه یافت نشد', 'error');
      return;
    }

    setIsExporting(true);
    setProgress(10);

    try {
      setProgress(30);
      const dataUrl = await captureElement(mapContainer, imgFormat, imgScale, imgQuality / 100);
      setProgress(70);

      const timestamp = new Date().toISOString().slice(0, 10);
      downloadDataUrl(dataUrl, `mapbranch-${timestamp}.${imgFormat}`);
      
      setProgress(100);
      addToast('تصویر دانلود شد', 'success');
    } catch (err: any) {
      addToast(err.message || 'خطا در خروجی', 'error');
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setProgress(0);
      }, 500);
    }
  };

  const handleDataExport = () => {
    if (branches.length === 0) {
      addToast('داده‌ای برای خروجی وجود ندارد', 'warning');
      return;
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    const targetBranches = dataScope === 'selected' && selectedBranchId
      ? branches.filter(b => b.id === selectedBranchId)
      : branches;

    try {
      switch (dataFormat) {
        case 'geojson': {
          const geoJSON = generateGeoJSON(targetBranches);
          downloadJSON(geoJSON, `mapbranch-${timestamp}.geojson`);
          break;
        }
        case 'csv': {
          const csv = generateCSV(targetBranches);
          downloadText(csv, `mapbranch-${timestamp}.csv`, 'text/csv');
          break;
        }
        case 'txt': {
          let txt = '';
          targetBranches.forEach(b => {
            if (b.areas.length === 0) {
              txt += `شعبه: ${b.name}\nموقعیت: ${b.latitude}, ${b.longitude}\nمحدوده: ندارد\n\n${'─'.repeat(40)}\n\n`;
            } else {
              b.areas.forEach(a => {
                txt += generateTXT(b, a) + '\n' + '─'.repeat(40) + '\n\n';
              });
            }
          });
          downloadText(txt || 'داده‌ای وجود ندارد', `mapbranch-${timestamp}.txt`);
          break;
        }
        case 'json': {
          downloadJSON(targetBranches, `mapbranch-${timestamp}.json`);
          break;
        }
      }
      addToast('فایل دانلود شد', 'success');
    } catch (err: any) {
      addToast(err.message || 'خطا در خروجی', 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📤 خروجی گرفتن" size="lg">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white/5 rounded-2xl p-1.5">
        {[
          { key: 'data' as const, label: '📄 خروجی داده', desc: 'GeoJSON, CSV, TXT' },
          { key: 'image' as const, label: '🖼️ خروجی تصویر', desc: 'PNG, JPEG' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
              tab === t.key
                ? 'bg-gradient-to-l from-primary to-primary-dark text-white shadow-lg'
                : 'text-text-secondary hover:text-white hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'data' && (
        <div className="space-y-6">
          {/* Format selection */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-3">فرمت خروجی</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'geojson' as const, label: '🌍 GeoJSON', desc: 'استاندارد جغرافیایی' },
                { key: 'json' as const, label: '📋 JSON', desc: 'ساختار کامل پروژه' },
                { key: 'csv' as const, label: '📊 CSV', desc: 'قابل باز شدن با Excel' },
                { key: 'txt' as const, label: '📄 TXT', desc: 'مختصات ساده' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setDataFormat(f.key)}
                  className={`p-4 rounded-xl text-right transition-all duration-200 ${
                    dataFormat === f.key
                      ? 'bg-primary/20 ring-2 ring-primary/50'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="text-sm font-semibold text-white">{f.label}</div>
                  <div className="text-[10px] text-text-secondary mt-1">{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Scope */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-3">محدوده خروجی</label>
            <div className="flex gap-3">
              <button
                onClick={() => setDataScope('all')}
                className={`flex-1 p-3 rounded-xl text-sm font-medium transition-all ${
                  dataScope === 'all'
                    ? 'bg-primary/20 ring-2 ring-primary/50 text-white'
                    : 'bg-white/5 text-text-secondary hover:bg-white/10'
                }`}
              >
                همه شعب ({branches.length})
              </button>
              <button
                onClick={() => setDataScope('selected')}
                disabled={!selectedBranchId}
                className={`flex-1 p-3 rounded-xl text-sm font-medium transition-all disabled:opacity-40 ${
                  dataScope === 'selected'
                    ? 'bg-accent/20 ring-2 ring-accent/50 text-white'
                    : 'bg-white/5 text-text-secondary hover:bg-white/10'
                }`}
              >
                شعبه انتخاب‌شده
              </button>
            </div>
          </div>

          {/* Export button */}
          <button
            onClick={handleDataExport}
            disabled={branches.length === 0}
            className="w-full btn-primary py-4 rounded-xl text-sm font-bold relative z-10 disabled:opacity-40"
          >
            <span className="relative z-10">📥 دانلود فایل</span>
          </button>
        </div>
      )}

      {tab === 'image' && (
        <div className="space-y-6">
          {/* Format */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-3">فرمت تصویر</label>
            <div className="flex gap-3">
              {(['png', 'jpeg'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setImgFormat(f)}
                  className={`flex-1 p-3 rounded-xl text-sm font-semibold transition-all ${
                    imgFormat === f
                      ? 'bg-primary/20 ring-2 ring-primary/50 text-white'
                      : 'bg-white/5 text-text-secondary hover:bg-white/10'
                  }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Scale */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-3">
              کیفیت: {imgScale}x ({imgScale * 100}%)
            </label>
            <input
              type="range"
              min="1"
              max="4"
              step="1"
              value={imgScale}
              onChange={(e) => setImgScale(+e.target.value)}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-text-secondary mt-1">
              <span>معمولی</span>
              <span>خیلی بالا</span>
            </div>
          </div>

          {/* Quality */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-3">
              فشرده‌سازی: {imgQuality}%
            </label>
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={imgQuality}
              onChange={(e) => setImgQuality(+e.target.value)}
              className="w-full"
            />
          </div>

          {/* Progress */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary">در حال پردازش...</span>
                <span className="text-accent font-bold">{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-accent to-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Export button */}
          <button
            onClick={handleImageExport}
            disabled={isExporting}
            className="w-full btn-primary py-4 rounded-xl text-sm font-bold relative z-10 disabled:opacity-50"
          >
            <span className="relative z-10">
              {isExporting ? '⏳ در حال خروجی...' : '📸 دانلود تصویر'}
            </span>
          </button>
        </div>
      )}
    </Modal>
  );
}
