import React from 'react';
import { useStore } from '@/store/useStore';

const SAMPLE_BRANCHES = [
  {
    name: 'شعبه مرکزی',
    description: 'دفتر مرکزی در قلب تهران',
    address: 'تهران، خیابان ولیعصر',
    phone: '021-88001234',
    latitude: 35.7219,
    longitude: 51.3347,
    sticker: '🏢',
    color: '#7C3AED',
    status: 'active' as const,
    stickerType: 'emoji' as const,
    areas: [
      {
        name: 'محدوده سرویس‌دهی',
        slotIndex: 0,
        points: [
          { latitude: 35.7280, longitude: 51.3250 },
          { latitude: 35.7300, longitude: 51.3450 },
          { latitude: 35.7180, longitude: 51.3480 },
          { latitude: 35.7140, longitude: 51.3300 },
          { latitude: 35.7200, longitude: 51.3200 },
        ],
      },
    ],
  },
  {
    name: 'شعبه شمال',
    description: 'شعبه منطقه تجریش',
    address: 'تهران، تجریش',
    latitude: 35.8000,
    longitude: 51.4250,
    sticker: '🌟',
    color: '#FBBF24',
    status: 'active' as const,
    stickerType: 'emoji' as const,
    areas: [],
  },
  {
    name: 'شعبه بازار',
    description: 'نزدیک بازار بزرگ',
    address: 'تهران، بازار',
    latitude: 35.6762,
    longitude: 51.4222,
    sticker: '🏪',
    color: '#10B981',
    status: 'pending' as const,
    stickerType: 'emoji' as const,
    areas: [],
  },
];

interface WelcomeOverlayProps {
  onClose: () => void;
}

export default function WelcomeOverlay({ onClose }: WelcomeOverlayProps) {
  const addBranch = useStore((s) => s.addBranch);
  const addArea = useStore((s) => s.addArea);

  const handleLoadSample = () => {
    SAMPLE_BRANCHES.forEach((sb) => {
      const { areas, ...branchData } = sb;
      const branchId = addBranch(branchData);
      areas.forEach((area) => {
        addArea(branchId, area.slotIndex, area.points, area.name);
      });
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-bg-dark/95 backdrop-blur-2xl" />
      
      <div className="relative glass rounded-3xl shadow-2xl max-w-lg w-full p-10 text-center animate-scale-in overflow-hidden">
        {/* Gradient background effect */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/30 rounded-full blur-3xl" />
        </div>
        
        <div className="relative">
          {/* Logo */}
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary via-primary-light to-accent flex items-center justify-center text-5xl mb-8 shadow-2xl shadow-primary/30 glow-purple">
            🗺️
          </div>
          
          <h1 className="text-3xl font-black mb-3">
            <span className="bg-gradient-to-l from-accent via-primary-light to-primary bg-clip-text text-transparent">
              MapBranch Glass
            </span>
          </h1>
          
          <p className="text-base text-text-secondary mb-8 leading-relaxed">
            مدیریت حرفه‌ای شعب و محدوده‌های جغرافیایی
          </p>
          
          {/* Features grid */}
          <div className="grid grid-cols-2 gap-3 mb-10">
            {[
              { icon: '📍', label: 'مدیریت شعب', desc: 'ایجاد و ویرایش' },
              { icon: '📐', label: 'رسم محدوده', desc: 'چندضلعی دلخواه' },
              { icon: '🖼️', label: 'خروجی تصویر', desc: 'PNG با کیفیت بالا' },
              { icon: '🌍', label: 'خروجی داده', desc: 'GeoJSON, CSV' },
            ].map((f) => (
              <div key={f.label} className="p-4 rounded-2xl bg-white/5 border border-white/5 text-right">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{f.icon}</span>
                  <span className="text-sm font-bold text-white">{f.label}</span>
                </div>
                <p className="text-[10px] text-text-secondary/70">{f.desc}</p>
              </div>
            ))}
          </div>
          
          <div className="space-y-3">
            <button
              onClick={handleLoadSample}
              className="w-full btn-primary py-4 rounded-2xl text-base font-black relative z-10 shadow-xl shadow-primary/30"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                🚀 شروع با داده نمونه
              </span>
            </button>
            
            <button
              onClick={onClose}
              className="w-full py-4 rounded-2xl glass-light text-base font-semibold text-text-secondary hover:text-white transition-all border border-white/5 hover:border-primary/30"
            >
              شروع خالی
            </button>
          </div>

          <p className="text-[10px] text-text-secondary/40 mt-8">
            نسخه ۱.۰ • طراحی شده با ❤️
          </p>
        </div>
      </div>
    </div>
  );
}
