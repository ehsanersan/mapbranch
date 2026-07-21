import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import type { Branch } from '@/types';

const EMOJI_LIST = ['🏢', '🏬', '🏪', '🏗️', '🏠', '🏥', '🏦', '🏨', '🏫', '🏭', '📍', '🌟', '⭐', '💎', '🔥', '🎯', '🛒', '🍕', '☕', '🎨', '🚀', '💫', '🌊', '🌿', '🏔️', '🌆', '🎪', '🎭', '🎬', '🎮'];

const COLOR_PRESETS = ['#7C3AED', '#FBBF24', '#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6', '#14B8A6', '#F97316'];

const STATUS_OPTIONS = [
  { value: 'active' as const, label: 'فعال', color: 'bg-green-500', ring: 'ring-green-500/30' },
  { value: 'inactive' as const, label: 'غیرفعال', color: 'bg-red-500', ring: 'ring-red-500/30' },
  { value: 'pending' as const, label: 'در حال بررسی', color: 'bg-amber-500', ring: 'ring-amber-500/30' },
];

interface BranchFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Branch, 'id' | 'areas' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: Branch | null;
  initialCoords?: { lat: number; lng: number } | null;
}

export default function BranchForm({ isOpen, onClose, onSave, initialData, initialCoords }: BranchFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [link, setLink] = useState('');
  const [sticker, setSticker] = useState('🏢');
  const [color, setColor] = useState('#7C3AED');
  const [status, setStatus] = useState<'active' | 'inactive' | 'pending'>('active');
  const [lat, setLat] = useState('35.6892');
  const [lng, setLng] = useState('51.3890');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || '');
      setAddress(initialData.address || '');
      setPhone(initialData.phone || '');
      setLink(initialData.link || '');
      setSticker(initialData.sticker);
      setColor(initialData.color);
      setStatus(initialData.status);
      setLat(String(initialData.latitude));
      setLng(String(initialData.longitude));
    } else {
      setName('');
      setDescription('');
      setAddress('');
      setPhone('');
      setLink('');
      setSticker('🏢');
      setColor('#7C3AED');
      setStatus('active');
      if (initialCoords) {
        setLat(initialCoords.lat.toFixed(6));
        setLng(initialCoords.lng.toFixed(6));
      } else {
        setLat('35.6892');
        setLng('51.3890');
      }
    }
  }, [initialData, initialCoords, isOpen]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
      link: link.trim() || undefined,
      latitude: parseFloat(lat) || 35.6892,
      longitude: parseFloat(lng) || 51.3890,
      sticker,
      stickerType: 'emoji',
      color,
      status,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? '✏️ ویرایش شعبه' : '➕ شعبه جدید'} size="lg">
      <div className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-2">نام شعبه *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: شعبه مرکزی تهران"
            className="w-full input-glass rounded-xl px-4 py-3 text-sm"
            autoFocus
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-2">توضیحات</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="توضیحات کوتاه درباره شعبه..."
            className="w-full input-glass rounded-xl px-4 py-3 text-sm h-20 resize-none"
          />
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-2">📞 تلفن</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="021-12345678"
              className="w-full input-glass rounded-xl px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-2">🔗 لینک</label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              className="w-full input-glass rounded-xl px-4 py-3 text-sm"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-2">📍 آدرس</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="آدرس کامل شعبه..."
            className="w-full input-glass rounded-xl px-4 py-3 text-sm"
          />
        </div>

        {/* Coordinates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-2">عرض جغرافیایی</label>
            <input
              type="number"
              step="any"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="w-full input-glass rounded-xl px-4 py-3 text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-2">طول جغرافیایی</label>
            <input
              type="number"
              step="any"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="w-full input-glass rounded-xl px-4 py-3 text-sm font-mono"
            />
          </div>
        </div>

        {/* Sticker */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-2">🎨 استیکر</label>
          <div className="flex flex-wrap gap-2">
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setSticker(emoji)}
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all duration-200 ${
                  sticker === emoji
                    ? 'bg-primary/30 ring-2 ring-accent scale-110 shadow-lg'
                    : 'bg-white/5 hover:bg-white/10 hover:scale-105'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-2">🎨 رنگ شعبه</label>
          <div className="flex items-center gap-3">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-all duration-200 ${
                  color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-dark scale-125' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded-full cursor-pointer"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-2">وضعیت</label>
          <div className="flex gap-3">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  status === opt.value
                    ? `bg-white/10 ring-2 ${opt.ring} text-white`
                    : 'bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${opt.color}`} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-white/5">
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 btn-primary py-3.5 rounded-xl text-sm font-bold relative z-10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="relative z-10">{initialData ? '💾 ذخیره تغییرات' : '✨ ایجاد شعبه'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3.5 rounded-xl glass-light text-sm font-medium text-text-secondary hover:text-white transition-colors"
          >
            انصراف
          </button>
        </div>
      </div>
    </Modal>
  );
}
