'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CurrencyInput, parseNumberFromDots } from '@/components/ui/CurrencyInput';

interface City {
  id: string;
  name: string;
}

interface District {
  id: string;
  name: string;
}

interface Ward {
  id: string;
  name: string;
}

const listingTypes = [
  { value: 'APARTMENT', label: 'Căn hộ / Chung cư' },
  { value: 'HOUSE', label: 'Nhà riêng / Nguyên căn' },
  { value: 'ROOM', label: 'Phòng trọ / Studio' },
  { value: 'OFFICE', label: 'Văn phòng / Mặt bằng' },
  { value: 'LAND', label: 'Đất thổ cư / Khác' },
];

const saleTypes = [
  { value: 'RENT', label: 'Cho thuê' },
  { value: 'SALE', label: 'Cần bán' },
];

const amenitiesList = [
  { value: 'POOL', label: 'Hồ bơi', icon: 'pool' },
  { value: 'GYM', label: 'Phòng Gym', icon: 'fitness_center' },
  { value: 'PARK', label: 'Công viên', icon: 'park' },
  { value: 'STORE', label: 'Cửa hàng tiện lợi', icon: 'storefront' },
  { value: 'SCHOOL', label: 'Trường học', icon: 'school' },
  { value: 'HOSPITAL', label: 'Bệnh viện', icon: 'local_hospital' },
  { value: 'YARD', label: 'Sân vườn', icon: 'yard' },
  { value: 'CAFE', label: 'Quán Cafe', icon: 'local_cafe' },
  { value: 'STATION', label: 'Bến xe / Ga tàu', icon: 'directions_bus' },
];

export default function CreateListingPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [listingType, setListingType] = useState('APARTMENT');
  const [saleType, setSaleType] = useState('RENT');

  // Location Cascading
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedWardId, setSelectedWardId] = useState('');

  // Pricing & Metrics
  const [monthlyRent, setMonthlyRent] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [areaSize, setAreaSize] = useState('');
  const [bedrooms, setBedrooms] = useState('1');
  const [bathrooms, setBathrooms] = useState('1');
  const [isDealable, setIsDealable] = useState(false);

  // Selected Amenities
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Image files & preview state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Form submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  // Check Auth & Fetch Cities
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    async function fetchCities() {
      try {
        const res = await fetch(`${apiUrl}/locations/cities`);
        if (res.ok) {
          const data = await res.json();
          const cityList = Array.isArray(data) ? data : data.data || [];
          setCities(cityList);
          if (cityList.length > 0) {
            setSelectedCityId(cityList[0].id);
          }
        }
      } catch (err) {
        // Fallback
      }
    }
    fetchCities();
  }, [router, apiUrl]);

  // Fetch Districts when City changes
  useEffect(() => {
    if (!selectedCityId) {
      setDistricts([]);
      setWards([]);
      return;
    }

    async function fetchDistricts() {
      try {
        const res = await fetch(`${apiUrl}/locations/cities/${selectedCityId}/districts`);
        if (res.ok) {
          const data = await res.json();
          const distList = Array.isArray(data) ? data : data.data || [];
          setDistricts(distList);
          setSelectedDistrictId('');
          setWards([]);
          setSelectedWardId('');
        }
      } catch (err) {
        setDistricts([]);
      }
    }
    fetchDistricts();
  }, [selectedCityId, apiUrl]);

  // Fetch Wards when District changes
  useEffect(() => {
    if (!selectedDistrictId) {
      setWards([]);
      return;
    }

    async function fetchWards() {
      try {
        const res = await fetch(`${apiUrl}/locations/districts/${selectedDistrictId}/wards`);
        if (res.ok) {
          const data = await res.json();
          const wardList = Array.isArray(data) ? data : data.data || [];
          setWards(wardList);
          setSelectedWardId('');
        }
      } catch (err) {
        setWards([]);
      }
    }
    fetchWards();
  }, [selectedDistrictId, apiUrl]);

  // Handle Image File Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImageFiles((prev) => [...prev, ...filesArray]);

      const previewsArray = filesArray.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => {
        const updated = [...prev, ...previewsArray];
        return updated;
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith('image/'));
      if (filesArray.length === 0) return;
      setImageFiles((prev) => [...prev, ...filesArray]);
      const previewsArray = filesArray.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...previewsArray]);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (activePreviewIndex >= updated.length) {
        setActivePreviewIndex(Math.max(0, updated.length - 1));
      }
      return updated;
    });
  };

  const toggleAmenity = (value: string) => {
    if (selectedAmenities.includes(value)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== value));
    } else {
      setSelectedAmenities([...selectedAmenities, value]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedCityId) {
      setErrorMessage('Vui lòng chọn Tỉnh/Thành phố.');
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem('accessToken');

    const formData = new FormData();
    formData.append('title', title);
    if (description) formData.append('description', description);
    formData.append('cityId', selectedCityId);
    if (selectedDistrictId) formData.append('districtId', selectedDistrictId);
    if (selectedWardId) formData.append('wardId', selectedWardId);
    formData.append('listingType', listingType);
    formData.append('saleType', saleType);

    if (saleType === 'RENT' && monthlyRent) {
      formData.append('monthlyRent', parseNumberFromDots(monthlyRent));
    }
    if (saleType === 'SALE' && salePrice) {
      formData.append('salePrice', parseNumberFromDots(salePrice));
    }
    if (depositAmount) formData.append('depositAmount', parseNumberFromDots(depositAmount));

    if (areaSize) {
      formData.append('size', areaSize);
    }

    // Only append bedrooms/bathrooms for residential listing types (not OFFICE or LAND)
    if (listingType !== 'OFFICE' && listingType !== 'LAND') {
      if (bedrooms) formData.append('br', bedrooms);
      if (bathrooms) formData.append('wc', bathrooms);
    }
    if (saleType === 'SALE') {
      formData.append('isDealable', String(isDealable));
    }

    selectedAmenities.forEach((amenity) => {
      formData.append('amenities[]', amenity);
    });

    imageFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const res = await fetch(`${apiUrl}/listings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message || 'Tạo tin đăng thất bại.';
        throw new Error(errorMsg);
      }

      // Success -> Redirect to My Listings to see moderation status
      router.push('/my-listings');
    } catch (err: any) {
      setErrorMessage(err.message || 'Có lỗi xảy ra khi tạo tin đăng.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <main className="flex-1 w-full pt-4 sm:pt-6 pb-20 max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Bar */}
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="shrink-0 w-10 h-10 rounded-full bg-surface-card border border-border-subtle hover:bg-surface-container text-ink-primary shadow-xs flex items-center justify-center transition-all cursor-pointer hover:-translate-x-0.5 active:scale-95"
            title="Quay lại"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <h1 className="font-headline-md text-xl sm:text-2xl font-bold text-ink-primary">
              Tạo tin đăng mới
            </h1>
            <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
              Điền đầy đủ thông tin để bài đăng tiếp cận người thuê nhanh chóng và hiệu quả
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-error-container text-on-error-container font-body-sm text-body-sm flex items-center gap-2 shadow-xs">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Container with 2-Column Responsive Layout */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left Column: Image Gallery & Upload (Sticky on Desktop) */}
            <div className="lg:col-span-5 xl:col-span-5 lg:sticky lg:top-6 flex flex-col gap-4">
              <div className="bg-surface-card rounded-2xl p-5 border border-border-subtle shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-headline-sm text-base font-semibold text-ink-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-accent-warm">collections</span>
                    Hình ảnh thực tế
                  </h2>
                  {imagePreviews.length > 0 && (
                    <span className="text-xs font-medium text-ink-secondary bg-surface-container px-2.5 py-1 rounded-full border border-border-subtle">
                      Đã chọn {imagePreviews.length} ảnh
                    </span>
                  )}
                </div>

                {/* Main Hero Image Preview or Dropzone */}
                {imagePreviews.length > 0 ? (
                  <div className="relative w-full aspect-[4/3] max-h-[48vh] rounded-2xl overflow-hidden bg-surface-container border border-border-subtle shadow-sm group select-none">
                    <img
                      src={imagePreviews[activePreviewIndex] || imagePreviews[0]}
                      alt="Preview"
                      className="w-full h-full object-cover transition-transform duration-300"
                    />

                    {/* Delete button at top-right */}
                    <button
                      type="button"
                      aria-label="Xóa ảnh này"
                      onClick={() => removeImage(activePreviewIndex)}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-red-600 text-white backdrop-blur-md flex items-center justify-center transition-all shadow-md active:scale-90 z-20 cursor-pointer"
                      title="Xóa ảnh này"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>

                    {/* Left Arrow Button */}
                    {imagePreviews.length > 1 && (
                      <button
                        type="button"
                        aria-label="Ảnh trước"
                        onClick={() =>
                          setActivePreviewIndex((prev) =>
                            prev > 0 ? prev - 1 : imagePreviews.length - 1
                          )
                        }
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-surface-card/85 hover:bg-surface-card text-ink-primary backdrop-blur-md shadow-md flex items-center justify-center transition-all opacity-90 hover:opacity-100 active:scale-95 z-20 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                      </button>
                    )}

                    {/* Right Arrow Button */}
                    {imagePreviews.length > 1 && (
                      <button
                        type="button"
                        aria-label="Ảnh kế tiếp"
                        onClick={() =>
                          setActivePreviewIndex((prev) =>
                            prev < imagePreviews.length - 1 ? prev + 1 : 0
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-surface-card/85 hover:bg-surface-card text-ink-primary backdrop-blur-md shadow-md flex items-center justify-center transition-all opacity-90 hover:opacity-100 active:scale-95 z-20 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                      </button>
                    )}

                    {/* Counter Badge */}
                    <div className="absolute bottom-3 right-3 bg-black/65 backdrop-blur-md text-white text-[12px] font-semibold px-2.5 py-1 rounded-full shadow-sm flex items-center justify-center z-10 pointer-events-none">
                      <span>
                        {activePreviewIndex + 1}/{imagePreviews.length}
                      </span>
                    </div>
                  </div>
                ) : (
                  <label
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative w-full aspect-[4/3] max-h-[48vh] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${isDragging
                        ? 'border-primary bg-primary/5 scale-[1.01]'
                        : 'border-border-strong hover:border-primary bg-surface-container/30 hover:bg-surface-container/60'
                      }`}
                  >
                    <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                      <span className="material-symbols-outlined text-[28px]">add_a_photo</span>
                    </div>
                    <p className="font-headline-sm text-sm font-semibold text-ink-primary mb-1">
                      Tải lên ảnh bất động sản
                    </p>
                    <p className="font-body-sm text-xs text-ink-secondary max-w-xs mb-3">
                      Kéo thả hoặc bấm để chọn ảnh từ thiết bị
                    </p>
                    <span className="px-4 py-2 rounded-full bg-primary text-on-primary font-label-sm text-xs font-semibold shadow-xs hover:opacity-90 transition-opacity">
                      Chọn ảnh từ máy
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}

                {/* Thumbnails strip + Add more slot */}
                {imagePreviews.length > 0 && (
                  <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
                    {imagePreviews.map((src, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActivePreviewIndex(idx)}
                        className={`relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer group ${activePreviewIndex === idx
                            ? 'border-primary ring-2 ring-primary/20 shadow-sm scale-[1.02]'
                            : 'border-transparent opacity-75 hover:opacity-100 hover:scale-[1.02]'
                          }`}
                      >
                        <img
                          src={src}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(idx);
                          }}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                          title="Xóa ảnh"
                        >
                          <span className="material-symbols-outlined text-[12px]">close</span>
                        </button>
                      </div>
                    ))}

                    {/* Add More Slot */}
                    <label className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl border-2 border-dashed border-border-strong hover:border-primary bg-surface-container/40 flex flex-col items-center justify-center cursor-pointer text-ink-secondary hover:text-primary transition-all flex-shrink-0 group">
                      <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                        add_photo_alternate
                      </span>
                      <span className="text-[10px] font-medium mt-0.5">Thêm ảnh</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {/* Helpful Guidance Tips */}
                <div className="bg-surface-container/40 rounded-xl p-3.5 border border-border-subtle/60 flex items-start gap-2.5 text-xs text-ink-secondary">
                  <span className="material-symbols-outlined text-[18px] text-accent-warm shrink-0 mt-0.5">
                    lightbulb
                  </span>
                  <div className="leading-relaxed">
                    <span className="font-semibold text-ink-primary">Mẹo đăng ảnh đẹp:</span> Chụp không gian đủ sáng, chụp rộng phòng khách, phòng ngủ và nhà bếp để tin đăng thu hút hơn 80% người xem.
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Listing Information */}
            <div className="lg:col-span-7 xl:col-span-7 flex flex-col gap-5">
              {/* Section 1: Basic Info */}
              <div className="bg-surface-card rounded-2xl p-5 sm:p-6 border border-border-subtle shadow-sm flex flex-col gap-4">
                <h2 className="font-headline-sm text-base font-semibold text-ink-primary flex items-center gap-2 border-b border-border-subtle pb-3">
                  <span className="material-symbols-outlined text-[20px] text-accent-warm">description</span>
                  Thông tin chung
                </h2>

                <Input
                  label="Tiêu đề tin đăng *"
                  placeholder="VD: Căn hộ Studio 42m² ban công thoáng mát Quận 1..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm text-ink-secondary font-medium">
                    Hình thức &amp; Loại bất động sản *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      value={listingType}
                      onChange={(e) => setListingType(e.target.value)}
                      className="h-11 bg-surface-container rounded-xl px-3 font-body-sm text-body-sm text-ink-primary border border-border-subtle focus:border-ink-primary outline-none transition-all"
                    >
                      {listingTypes.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={saleType}
                      onChange={(e) => setSaleType(e.target.value)}
                      className="h-11 bg-surface-container rounded-xl px-3 font-body-sm text-body-sm text-ink-primary border border-border-subtle focus:border-ink-primary outline-none transition-all"
                    >
                      {saleTypes.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm text-ink-secondary font-medium">
                    Mô tả chi tiết
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả ưu điểm căn hộ, nội thất, hướng nhà, tiện ích xung quanh..."
                    className="w-full bg-surface-container rounded-xl p-3.5 font-body-sm text-body-sm text-ink-primary border border-border-subtle focus:border-ink-primary outline-none resize-none transition-all"
                  />
                </div>
              </div>

              {/* Section 2: Pricing & Details */}
              <div className="bg-surface-card rounded-2xl p-5 sm:p-6 border border-border-subtle shadow-sm flex flex-col gap-4">
                <h2 className="font-headline-sm text-base font-semibold text-ink-primary flex items-center gap-2 border-b border-border-subtle pb-3">
                  <span className="material-symbols-outlined text-[20px] text-accent-warm">payments</span>
                  {saleType === 'SALE' ? 'Giá bán & Thông số chi tiết' : 'Giá thuê & Thông số chi tiết'}
                </h2>

                {/* Dynamic Price Inputs based on saleType */}
                {saleType === 'SALE' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <CurrencyInput
                      label="Giá bán (VNĐ) *"
                      placeholder="VD: 3.500.000.000"
                      value={salePrice}
                      onChange={setSalePrice}
                      wordsSuffix="VNĐ"
                      required
                    />

                    <CurrencyInput
                      label="Tiền cọc giữ chỗ (VNĐ)"
                      placeholder="VD: 100.000.000"
                      value={depositAmount}
                      onChange={setDepositAmount}
                      wordsSuffix="VNĐ"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <CurrencyInput
                      label="Giá thuê (VNĐ/tháng) *"
                      placeholder="VD: 15.000.000"
                      value={monthlyRent}
                      onChange={setMonthlyRent}
                      wordsSuffix="VNĐ/tháng"
                      required
                    />

                    <CurrencyInput
                      label="Tiền cọc thuê (VNĐ)"
                      placeholder="VD: 30.000.000"
                      value={depositAmount}
                      onChange={setDepositAmount}
                      wordsSuffix="VNĐ"
                    />
                  </div>
                )}

                {/* Dynamic Metrics based on listingType (Hide bedrooms/bathrooms for OFFICE & LAND) */}
                <div
                  className={`grid gap-3 ${listingType === 'OFFICE' || listingType === 'LAND'
                      ? 'grid-cols-1'
                      : 'grid-cols-1 sm:grid-cols-3'
                    }`}
                >
                  <Input
                    label="Diện tích (m²)"
                    placeholder="VD: 75"
                    type="number"
                    value={areaSize}
                    onChange={(e) => setAreaSize(e.target.value)}
                    required
                  />

                  {listingType !== 'OFFICE' && listingType !== 'LAND' && (
                    <>
                      <Input
                        label="Phòng ngủ"
                        type="number"
                        value={bedrooms}
                        onChange={(e) => setBedrooms(e.target.value)}
                      />

                      <Input
                        label="Phòng vệ sinh"
                        type="number"
                        value={bathrooms}
                        onChange={(e) => setBathrooms(e.target.value)}
                      />
                    </>
                  )}
                </div>

                {saleType === 'SALE' && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="isDealable"
                      checked={isDealable}
                      onChange={(e) => setIsDealable(e.target.checked)}
                      className="w-4 h-4 accent-ink-primary rounded cursor-pointer"
                    />
                    <label
                      htmlFor="isDealable"
                      className="font-body-sm text-body-sm text-ink-primary font-medium cursor-pointer"
                    >
                      Giá có thể thương lượng thêm
                    </label>
                  </div>
                )}
              </div>

              {/* Section 3: Location */}
              <div className="bg-surface-card rounded-2xl p-5 sm:p-6 border border-border-subtle shadow-sm flex flex-col gap-4">
                <h2 className="font-headline-sm text-base font-semibold text-ink-primary flex items-center gap-2 border-b border-border-subtle pb-3">
                  <span className="material-symbols-outlined text-[20px] text-accent-warm">location_on</span>
                  Vị trí bất động sản
                </h2>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm text-ink-secondary font-medium">
                    Tỉnh / Thành phố *
                  </label>
                  <select
                    value={selectedCityId}
                    onChange={(e) => setSelectedCityId(e.target.value)}
                    className="w-full h-11 bg-surface-container rounded-xl px-3 font-body-sm text-body-sm text-ink-primary border border-border-subtle focus:border-ink-primary outline-none transition-all"
                    required
                  >
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-ink-secondary font-medium">
                      Quận / Huyện
                    </label>
                    <select
                      value={selectedDistrictId}
                      onChange={(e) => setSelectedDistrictId(e.target.value)}
                      disabled={districts.length === 0}
                      className="w-full h-11 bg-surface-container rounded-xl px-3 font-body-sm text-body-sm text-ink-primary border border-border-subtle focus:border-ink-primary outline-none disabled:opacity-50 transition-all"
                    >
                      <option value="">-- Chọn Quận/Huyện --</option>
                      {districts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-label-sm text-ink-secondary font-medium">
                      Phường / Xã
                    </label>
                    <select
                      value={selectedWardId}
                      onChange={(e) => setSelectedWardId(e.target.value)}
                      disabled={wards.length === 0}
                      className="w-full h-11 bg-surface-container rounded-xl px-3 font-body-sm text-body-sm text-ink-primary border border-border-subtle focus:border-ink-primary outline-none disabled:opacity-50 transition-all"
                    >
                      <option value="">-- Chọn Phường/Xã --</option>
                      {wards.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 4: Amenities */}
              <div className="bg-surface-card rounded-2xl p-5 sm:p-6 border border-border-subtle shadow-sm flex flex-col gap-4">
                <h2 className="font-headline-sm text-base font-semibold text-ink-primary flex items-center gap-2 border-b border-border-subtle pb-3">
                  <span className="material-symbols-outlined text-[20px] text-accent-warm">star</span>
                  Tiện ích xung quanh
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {amenitiesList.map((item) => {
                    const isSelected = selectedAmenities.includes(item.value);
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => toggleAmenity(item.value)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${isSelected
                            ? 'bg-primary text-on-primary border-primary shadow-sm scale-[1.01]'
                            : 'bg-surface-container/50 text-ink-secondary border-border-subtle hover:bg-surface-container hover:text-ink-primary'
                          }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                        <span className="font-label-sm text-xs font-medium leading-tight">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                fullWidth
                className="h-12 text-base font-semibold shadow-md hover:shadow-lg active:scale-[0.99] transition-all cursor-pointer mt-1"
                disabled={submitting}
              >
                {submitting ? 'Đang đăng tin...' : 'Đăng tin ngay'}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
