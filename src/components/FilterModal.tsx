'use client';

import React, { useState, useEffect, useRef } from 'react';
import { formatNumberWithDots, parseNumberFromDots } from '@/components/ui/CurrencyInput';
import { FilterState } from '@/lib/filter-url';

export type { FilterState };

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
  onReset: () => void;
}


interface PriceInputFieldProps {
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
}

const PriceInputField: React.FC<PriceInputFieldProps> = ({
  placeholder,
  value,
  onChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const calculateNewCursor = (formatted: string, digitsBefore: number) => {
    if (digitsBefore <= 0) return 0;
    let digitCount = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) {
        digitCount++;
      }
      if (digitCount === digitsBefore) {
        return i + 1;
      }
    }
    return formatted.length;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const rawValue = input.value;
    const selectionStart = input.selectionStart ?? rawValue.length;

    // Count how many numeric digits were before the cursor
    const digitsBeforeCursor = rawValue.slice(0, selectionStart).replace(/\D/g, '').length;

    // Format with dots
    const formatted = formatNumberWithDots(rawValue);

    onChange(formatted);

    // Restore cursor position accurately
    requestAnimationFrame(() => {
      if (!inputRef.current) return;
      const newCursor = calculateNewCursor(formatted, digitsBeforeCursor);
      inputRef.current.setSelectionRange(newCursor, newCursor);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const { selectionStart, selectionEnd, value: currentVal } = input;

    // Allow standard navigation, shortcuts and editing keys
    if (
      e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      [
        'Backspace',
        'Delete',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Tab',
        'Enter',
        'Home',
        'End',
        'Escape',
      ].includes(e.key)
    ) {
      if (selectionStart === selectionEnd && selectionStart !== null) {
        // Smart Backspace: when cursor is right after a dot, delete digit preceding the dot
        if (e.key === 'Backspace' && selectionStart > 1 && currentVal[selectionStart - 1] === '.') {
          e.preventDefault();
          const nextVal = currentVal.slice(0, selectionStart - 2) + currentVal.slice(selectionStart);
          const digitsBefore = Math.max(
            0,
            currentVal.slice(0, selectionStart).replace(/\D/g, '').length - 1
          );
          const formatted = formatNumberWithDots(nextVal);
          onChange(formatted);

          requestAnimationFrame(() => {
            if (!inputRef.current) return;
            const newCursor = calculateNewCursor(formatted, digitsBefore);
            inputRef.current.setSelectionRange(newCursor, newCursor);
          });
          return;
        }

        // Smart Delete: when cursor is right before a dot, delete digit following the dot
        if (e.key === 'Delete' && selectionStart < currentVal.length && currentVal[selectionStart] === '.') {
          e.preventDefault();
          const nextVal = currentVal.slice(0, selectionStart) + currentVal.slice(selectionStart + 2);
          const digitsBefore = currentVal.slice(0, selectionStart).replace(/\D/g, '').length;
          const formatted = formatNumberWithDots(nextVal);
          onChange(formatted);

          requestAnimationFrame(() => {
            if (!inputRef.current) return;
            const newCursor = calculateNewCursor(formatted, digitsBefore);
            inputRef.current.setSelectionRange(newCursor, newCursor);
          });
          return;
        }
      }
      return;
    }

    // Only allow numeric digits 0-9
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className="w-full bg-surface-container border border-border-subtle rounded-xl px-3 py-2 text-ink-primary font-body-sm text-body-sm outline-none focus:border-ink-primary transition-colors"
    />
  );
};

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  onApply,
  onReset,
}) => {
  const [cityId, setCityId] = useState(filters.cityId || '');
  const [districtId, setDistrictId] = useState(filters.districtId || '');
  const [wardId, setWardId] = useState(filters.wardId || '');
  const [saleType, setSaleType] = useState<'RENT' | 'SALE' | ''>(filters.saleType || '');
  const [listingType, setListingType] = useState(filters.listingType || '');
  const [minPrice, setMinPrice] = useState(formatNumberWithDots(filters.minPrice) || '');
  const [maxPrice, setMaxPrice] = useState(formatNumberWithDots(filters.maxPrice) || '');
  const [minSize, setMinSize] = useState(filters.minSize || '');
  const [maxSize, setMaxSize] = useState(filters.maxSize || '');
  const [br, setBr] = useState(filters.br || '');
  const [wc, setWc] = useState(filters.wc || '');

  const [cities, setCities] = useState<Array<{ id: string; name: string }>>([]);
  const [districts, setDistricts] = useState<Array<{ id: string; name: string }>>([]);
  const [wards, setWards] = useState<Array<{ id: string; name: string }>>([]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  // Sync internal state when filters prop changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setCityId(filters.cityId || '');
      setDistrictId(filters.districtId || '');
      setWardId(filters.wardId || '');
      setSaleType(filters.saleType || '');
      setListingType(filters.listingType || '');
      setMinPrice(formatNumberWithDots(filters.minPrice) || '');
      setMaxPrice(formatNumberWithDots(filters.maxPrice) || '');
      setMinSize(filters.minSize || '');
      setMaxSize(filters.maxSize || '');
      setBr(filters.br || '');
      setWc(filters.wc || '');
    }
  }, [isOpen, filters]);

  // Fetch Cities
  useEffect(() => {
    // Only fetch if open or if cities not loaded yet
    if (!isOpen && cities.length > 0) return;

    let isCancelled = false;

    async function loadCities() {
      try {
        const res = await fetch(`${apiUrl}/locations/cities`);
        if (res.ok && !isCancelled) {
          const data = await res.json();
          setCities(data);
        }
      } catch (err) {
        // Silently warn if offline or starting up
        console.warn('Locations API unavailable or starting up:', err);
      }
    }
    loadCities();

    return () => {
      isCancelled = true;
    };
  }, [apiUrl, isOpen, cities.length]);

  // Fetch Districts when cityId changes
  useEffect(() => {
    if (!cityId) {
      setDistricts([]);
      setDistrictId('');
      setWards([]);
      setWardId('');
      return;
    }

    let isCancelled = false;

    async function loadDistricts() {
      try {
        const res = await fetch(`${apiUrl}/locations/cities/${cityId}/districts`);
        if (res.ok && !isCancelled) {
          const data = await res.json();
          setDistricts(data);
        }
      } catch (err) {
        console.warn('Failed to load districts:', err);
      }
    }
    loadDistricts();

    return () => {
      isCancelled = true;
    };
  }, [cityId, apiUrl]);

  // Fetch Wards when districtId changes
  useEffect(() => {
    if (!districtId) {
      setWards([]);
      setWardId('');
      return;
    }

    let isCancelled = false;

    async function loadWards() {
      try {
        const res = await fetch(`${apiUrl}/locations/districts/${districtId}/wards`);
        if (res.ok && !isCancelled) {
          const data = await res.json();
          setWards(data);
        }
      } catch (err) {
        console.warn('Failed to load wards:', err);
      }
    }
    loadWards();

    return () => {
      isCancelled = true;
    };
  }, [districtId, apiUrl]);

  if (!isOpen) return null;

  const handleApply = () => {
    const selectedCity = cities.find((c) => c.id === cityId);
    const selectedDistrict = districts.find((d) => d.id === districtId);
    const selectedWard = wards.find((w) => w.id === wardId);

    onApply({
      cityId: cityId || undefined,
      cityName: selectedCity?.name,
      districtId: districtId || undefined,
      districtName: selectedDistrict?.name,
      wardId: wardId || undefined,
      wardName: selectedWard?.name,
      saleType: saleType || undefined,
      listingType: listingType || undefined,
      minPrice: parseNumberFromDots(minPrice) || undefined,
      maxPrice: parseNumberFromDots(maxPrice) || undefined,
      minSize: minSize || undefined,
      maxSize: maxSize || undefined,
      br: br || undefined,
      wc: wc || undefined,
    });
    onClose();
  };

  const handleReset = () => {
    setCityId('');
    setDistrictId('');
    setWardId('');
    setSaleType('');
    setListingType('');
    setMinPrice('');
    setMaxPrice('');
    setMinSize('');
    setMaxSize('');
    setBr('');
    setWc('');
    onReset();
    onClose();
  };

  const propertyTypes = [
    { label: 'Tất cả', value: '' },
    { label: 'Căn hộ/Chung cư', value: 'APARTMENT' },
    { label: 'Nhà phố', value: 'HOUSE' },
    { label: 'Đất', value: 'LAND' },
    { label: 'Trọ', value: 'ROOM' },
    { label: 'Mặt bằng/Văn phòng', value: 'OFFICE' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink-primary/50 backdrop-blur-sm transition-opacity">
      <div 
        className="w-full sm:max-w-lg bg-surface-card rounded-t-3xl sm:rounded-2xl border border-border-subtle shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] text-ink-primary">tune</span>
            <h2 id="modal-title" className="font-headline-sm text-headline-sm text-ink-primary font-semibold">
              Bộ lọc tìm kiếm
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng bộ lọc"
            className="w-8 h-8 rounded-full flex items-center justify-center text-ink-tertiary hover:text-ink-primary hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Location Filters */}
          <div className="space-y-3">
            <label className="font-label-md text-label-md text-ink-primary font-medium block">
              Địa điểm (Lọc chính xác theo khu vực)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* City */}
              <div>
                <select
                  value={cityId}
                  onChange={(e) => {
                    setCityId(e.target.value);
                    setDistrictId('');
                    setWardId('');
                  }}
                  className="w-full bg-surface-container border border-border-subtle rounded-xl px-3 py-2 text-ink-primary font-body-sm text-body-sm outline-none focus:border-ink-primary transition-colors cursor-pointer"
                >
                  <option value="">Tất cả Tỉnh/TP</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* District */}
              <div>
                <select
                  value={districtId}
                  disabled={!cityId || districts.length === 0}
                  onChange={(e) => {
                    setDistrictId(e.target.value);
                    setWardId('');
                  }}
                  className="w-full bg-surface-container border border-border-subtle rounded-xl px-3 py-2 text-ink-primary font-body-sm text-body-sm outline-none focus:border-ink-primary transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <option value="">Tất cả Quận/Huyện</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ward */}
              <div>
                <select
                  value={wardId}
                  disabled={!districtId || wards.length === 0}
                  onChange={(e) => setWardId(e.target.value)}
                  className="w-full bg-surface-container border border-border-subtle rounded-xl px-3 py-2 text-ink-primary font-body-sm text-body-sm outline-none focus:border-ink-primary transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <option value="">Tất cả Phường/Xã</option>
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {cityId && (
              <p className="font-label-sm text-label-sm text-ink-tertiary">
                * Khi chọn Tỉnh/TP, bộ lọc sẽ chỉ hiển thị các tin thuộc khu vực này.
              </p>
            )}
          </div>

          {/* Sale Type */}
          <div className="space-y-2">
            <label className="font-label-md text-label-md text-ink-primary font-medium block">
              Hình thức giao dịch
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Tất cả', value: '' },
                { label: 'Cho thuê', value: 'RENT' },
                { label: 'Cần bán', value: 'SALE' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => setSaleType(item.value as any)}
                  className={`py-2 px-3 rounded-xl font-label-md text-label-md text-center border transition-all ${
                    saleType === item.value
                      ? 'bg-primary text-on-primary border-primary shadow-sm font-semibold'
                      : 'bg-surface-container border-border-subtle text-ink-secondary hover:text-ink-primary'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Property Type */}
          <div className="space-y-2">
            <label className="font-label-md text-label-md text-ink-primary font-medium block">
              Loại bất động sản
            </label>
            <div className="flex flex-wrap gap-2">
              {propertyTypes.map((item) => (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => setListingType(item.value)}
                  className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md border transition-all ${
                    listingType === item.value
                      ? 'bg-primary text-on-primary border-primary shadow-sm font-semibold'
                      : 'bg-surface-container border-border-subtle text-ink-secondary hover:text-ink-primary'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <label className="font-label-md text-label-md text-ink-primary font-medium block">
              Khoảng giá (VNĐ)
            </label>
            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <PriceInputField
                  placeholder="Giá tối thiểu"
                  value={minPrice}
                  onChange={setMinPrice}
                />
              </div>
              <div>
                <PriceInputField
                  placeholder="Giá tối đa"
                  value={maxPrice}
                  onChange={setMaxPrice}
                />
              </div>
            </div>
          </div>

          {/* Size Range */}
          <div className="space-y-2">
            <label className="font-label-md text-label-md text-ink-primary font-medium block">
              Diện tích (m²)
            </label>
            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <input
                  type="number"
                  placeholder="Từ m²"
                  value={minSize}
                  onChange={(e) => setMinSize(e.target.value)}
                  className="w-full bg-surface-container border border-border-subtle rounded-xl px-3 py-2 text-ink-primary font-body-sm text-body-sm outline-none focus:border-ink-primary"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Đến m²"
                  value={maxSize}
                  onChange={(e) => setMaxSize(e.target.value)}
                  className="w-full bg-surface-container border border-border-subtle rounded-xl px-3 py-2 text-ink-primary font-body-sm text-body-sm outline-none focus:border-ink-primary"
                />
              </div>
            </div>
          </div>

          {/* Bedrooms & Bathrooms */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-label-md text-label-md text-ink-primary font-medium block">
                Phòng ngủ
              </label>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {['', '1', '2', '3', '4'].map((val) => (
                  <button
                    type="button"
                    key={val}
                    onClick={() => setBr(val)}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-label-sm text-label-sm border text-center transition-all ${
                      br === val
                        ? 'bg-primary text-on-primary border-primary font-semibold'
                        : 'bg-surface-container border-border-subtle text-ink-secondary hover:text-ink-primary'
                    }`}
                  >
                    {val ? `${val}+` : 'Bất kỳ'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-label-md text-label-md text-ink-primary font-medium block">
                Phòng tắm/WC
              </label>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {['', '1', '2', '3'].map((val) => (
                  <button
                    type="button"
                    key={val}
                    onClick={() => setWc(val)}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-label-sm text-label-sm border text-center transition-all ${
                      wc === val
                        ? 'bg-primary text-on-primary border-primary font-semibold'
                        : 'bg-surface-container border-border-subtle text-ink-secondary hover:text-ink-primary'
                    }`}
                  >
                    {val ? `${val}+` : 'Bất kỳ'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border-subtle bg-surface-card flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 py-2.5 px-4 rounded-full font-label-md text-label-md text-ink-primary bg-surface-container hover:bg-surface-container-high border border-border-subtle transition-all active:scale-[0.98]"
          >
            Bỏ
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-2.5 px-4 rounded-full font-label-md text-label-md text-on-primary bg-primary shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.25),0_2px_6px_rgba(0,0,0,0.12)] hover:opacity-90 transition-all font-semibold active:scale-[0.98]"
          >
            Lọc
          </button>
        </div>
      </div>
    </div>
  );
};
