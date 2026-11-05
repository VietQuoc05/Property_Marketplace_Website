'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { formatVietnamesePrice, formatRelativeTime } from '@/components/ListingCard';
import { ListingDetailSkeleton } from '@/components/ui/Skeleton';

interface ListingDetail {
  id: string;
  title: string;
  description?: string;
  monthlyRent?: number;
  salePrice?: number;
  saleType?: 'RENT' | 'SALE';
  listingType?: string;
  size?: number;
  depositAmount?: number;
  wc?: number;
  br?: number;
  isDealable?: boolean;
  amenities?: string[];
  status?: string;
  createdAt?: string;
  city?: { id: string; name: string };
  district?: { id: string; name: string };
  ward?: { id: string; name: string };
  address?: string;
  images?: Array<{ id?: string; imageUrl?: string; url?: string } | string>;
  createdBy?: {
    id: string;
    fullName?: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
    bio?: string;
  };
}

const amenityLabels: Record<string, { label: string; icon: string }> = {
  POOL: { label: 'Hồ bơi', icon: 'pool' },
  GYM: { label: 'Phòng Gym', icon: 'fitness_center' },
  PARK: { label: 'Công viên', icon: 'park' },
  STORE: { label: 'Cửa hàng tiện lợi', icon: 'storefront' },
  SCHOOL: { label: 'Trường học', icon: 'school' },
  HOSPITAL: { label: 'Bệnh viện', icon: 'local_hospital' },
  YARD: { label: 'Sân vườn', icon: 'yard' },
  CAFE: { label: 'Quán Cafe', icon: 'local_cafe' },
  STATION: { label: 'Bến xe / Ga tàu', icon: 'directions_bus' },
};

const listingTypeLabels: Record<string, string> = {
  APARTMENT: 'Căn hộ / Chung cư',
  HOUSE: 'Nhà riêng / Nguyên căn',
  ROOM: 'Phòng trọ / Studio',
  OFFICE: 'Văn phòng / Mặt bằng',
  LAND: 'Đất thổ cư / Khác',
};

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params?.id as string;

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id?: string; fullName?: string; avatarUrl?: string } | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const handleDeleteListing = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token || !listingId) return;

    setDeleting(true);
    try {
      const res = await fetch(`${apiUrl}/listings/${listingId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setShowDeleteModal(false);
        router.push('/my-listings');
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.message || 'Gỡ bài đăng thất bại. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Error deleting listing:', err);
      alert('Đã xảy ra lỗi khi kết nối đến máy chủ.');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    async function fetchListingDetail() {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

      try {
        if (token) {
          // Fetch Current User
          fetch(`${apiUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (data) setCurrentUser(data);
            })
            .catch(() => { });

          // Fetch User's Interested Listings to check initial favorite status
          fetch(`${apiUrl}/listings/interested/me`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((res) => (res.ok ? res.json() : []))
            .then((favList) => {
              if (Array.isArray(favList)) {
                setIsFavorite(favList.some((fav: any) => fav.id === listingId));
              }
            })
            .catch(() => { });
        }

        // Fetch Listing Details GET /listings/:id (Public)
        const res = await fetch(`${apiUrl}/listings/${listingId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok || res.status === 404) {
          router.replace('/');
          return;
        }

        const text = await res.text();
        if (!text || text.trim() === '' || text.trim() === 'null') {
          router.replace('/');
          return;
        }

        let data: ListingDetail | null = null;
        try {
          data = JSON.parse(text);
        } catch {
          router.replace('/');
          return;
        }

        if (!data || !data.id) {
          router.replace('/');
          return;
        }

        setListing(data);
      } catch {
        router.replace('/');
      } finally {
        setLoading(false);
      }
    }

    if (listingId) {
      fetchListingDetail();
    }
  }, [listingId, apiUrl, router]);

  const handleToggleFavorite = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      router.push('/login');
      return;
    }
    if (!listingId) return;

    const method = isFavorite ? 'DELETE' : 'POST';
    try {
      const res = await fetch(`${apiUrl}/listings/${listingId}/interest`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok || res.status === 400) {
        setIsFavorite(!isFavorite);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  // Images mapping (computed unconditionally for hooks)
  const imageList = listing?.images?.map((img) => {
    if (typeof img === 'string') return img.startsWith('http') ? img : `${apiUrl}${img}`;
    const rawUrl = img.imageUrl || img.url || '';
    return rawUrl.startsWith('http') ? rawUrl : `${apiUrl}${rawUrl}`;
  }).filter(Boolean) || [];

  const totalImages = imageList.length;
  const safeIndex = totalImages > 0 ? ((activeImageIndex % totalImages) + totalImages) % totalImages : 0;

  const mainDisplayImage = totalImages > 0
    ? imageList[safeIndex]
    : 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800&auto=format&fit=crop';

  const handlePrevImage = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (totalImages <= 1) return;
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : totalImages - 1));
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (totalImages <= 1) return;
    setActiveImageIndex((prev) => (prev < totalImages - 1 ? prev + 1 : 0));
  };

  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Smoothly scroll active thumbnail into view when index changes
  useEffect(() => {
    if (thumbnailRefs.current[safeIndex]) {
      thumbnailRefs.current[safeIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [safeIndex]);

  // Keyboard navigation (< and >, ArrowLeft and ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when user is typing in form controls
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (totalImages <= 1 || showDeleteModal) return;

      if (e.key === 'ArrowLeft' || e.key === '<' || e.key === ',') {
        e.preventDefault();
        setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : totalImages - 1));
      } else if (e.key === 'ArrowRight' || e.key === '>' || e.key === '.') {
        e.preventDefault();
        setActiveImageIndex((prev) => (prev < totalImages - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [totalImages, showDeleteModal]);

  if (loading) {
    return <ListingDetailSkeleton />;
  }

  if (error || !listing) {
    return (
      <div className="flex flex-col min-h-screen bg-surface">
        <main className="flex-1 max-w-xl w-full mx-auto px-4 pt-12 pb-12 flex flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined text-[48px] text-ink-tertiary mb-2">error_outline</span>
          <h2 className="font-headline-sm text-headline-sm text-ink-primary font-semibold mb-1">
            {error || 'Bài đăng không tồn tại'}
          </h2>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 rounded-full bg-primary text-on-primary font-label-md text-label-md shadow-sm"
          >
            Quay lại trang chủ
          </button>
        </main>
      </div>
    );
  }

  // Price formatting
  const isRent = listing.saleType === 'RENT';
  const priceNum = isRent ? Number(listing.monthlyRent || 0) : Number(listing.salePrice || 0);
  const formattedPriceStr = formatVietnamesePrice(priceNum);

  // Location string
  const locationStr = [
    listing.ward?.name,
    listing.district?.name,
    listing.city?.name
  ].filter(Boolean).join(', ') || listing.address || 'Việt Nam';

  // Host Info
  const host = listing.createdBy;
  const hostAvatar = host?.avatarUrl
    ? (host.avatarUrl.startsWith('http') ? host.avatarUrl : `${apiUrl}${host.avatarUrl}`)
    : undefined;
  const hostName = host?.fullName || host?.email?.split('@')[0] || 'Homers Host';

  // Check if current user is the owner of the listing
  const isOwner = Boolean(
    currentUser?.id &&
    (listing.createdBy?.id === currentUser.id || (listing as any).createdById === currentUser.id)
  );

  const isCommercialOrLand = listing.listingType === 'OFFICE' || listing.listingType === 'LAND';

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <main className="flex-1 w-full pt-4 sm:pt-6 pb-20 max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 2-Column Responsive Layout: Left = Media Gallery with Back Button, Right = Listing Information */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Back button + Gallery (Sticky on desktop) */}
          <div className="lg:col-span-7 xl:col-span-7 lg:sticky lg:top-6 flex items-start gap-3 sm:gap-4">
            {/* Back button to the left of the image */}
            <button
              type="button"
              aria-label="Quay lại"
              onClick={() => router.back()}
              className="shrink-0 w-10 h-10 rounded-full bg-surface-card border border-border-subtle hover:bg-surface-container text-ink-primary shadow-xs flex items-center justify-center transition-all cursor-pointer hover:-translate-x-0.5 active:scale-95 mt-1"
              title="Quay lại"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>

            {/* Gallery Content */}
            <div className="flex-1 min-w-0 flex flex-col gap-3">
              {/* Main Hero Image */}
              <div className="relative w-full aspect-[4/3] max-h-[54vh] rounded-2xl overflow-hidden bg-surface-container border border-border-subtle shadow-sm group select-none">
                <img
                  key={mainDisplayImage}
                  src={mainDisplayImage}
                  alt={listing.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                />

                {/* Save / Bookmark Button at top-right corner of image (icon only) */}
                <button
                  type="button"
                  aria-label={isFavorite ? "Bỏ lưu tin" : "Lưu tin đăng"}
                  onClick={handleToggleFavorite}
                  className={`absolute top-3.5 right-3.5 w-10 h-10 rounded-full bg-surface-card/90 hover:bg-surface-card backdrop-blur-md border border-border-subtle flex items-center justify-center transition-all shadow-md active:scale-90 z-20 cursor-pointer ${isFavorite ? 'text-amber-500 border-amber-500/40 bg-amber-500/10' : 'text-ink-primary hover:text-amber-500'
                    }`}
                  title={isFavorite ? "Bỏ lưu tin" : "Lưu tin đăng"}
                >
                  <svg
                    className={`w-5 h-5 transition-transform duration-150 ${isFavorite ? 'scale-110' : ''}`}
                    viewBox="0 0 24 24"
                    fill={isFavorite ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </button>

                {/* Left Arrow Button */}
                {totalImages > 1 && (
                  <button
                    type="button"
                    aria-label="Ảnh trước (hoặc phím < / ←)"
                    title="Ảnh trước (< hoặc ←)"
                    onClick={handlePrevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface-card/85 hover:bg-surface-card text-ink-primary backdrop-blur-md shadow-md flex items-center justify-center transition-all opacity-90 hover:opacity-100 hover:scale-110 active:scale-95 z-20 border border-white/20 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[22px]">chevron_left</span>
                  </button>
                )}

                {/* Right Arrow Button */}
                {totalImages > 1 && (
                  <button
                    type="button"
                    aria-label="Ảnh kế tiếp (hoặc phím > / →)"
                    title="Ảnh kế tiếp (> hoặc →)"
                    onClick={handleNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface-card/85 hover:bg-surface-card text-ink-primary backdrop-blur-md shadow-md flex items-center justify-center transition-all opacity-90 hover:opacity-100 hover:scale-110 active:scale-95 z-20 border border-white/20 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[22px]">chevron_right</span>
                  </button>
                )}

                {/* Photo Counter Badge (e.g. 1/8) */}
                {totalImages > 0 && (
                  <div className="absolute bottom-3.5 right-3.5 bg-ink-primary/75 backdrop-blur-md text-white text-[12px] font-semibold px-3 py-1 rounded-full shadow-sm flex items-center justify-center z-10 pointer-events-none tracking-wide">
                    <span>{safeIndex + 1}/{totalImages}</span>
                  </div>
                )}
              </div>

              {/* Image Thumbnails Strip */}
              {totalImages > 1 && (
                <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
                  {imageList.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      ref={(el) => {
                        thumbnailRefs.current[idx] = el;
                      }}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-20 h-20 sm:w-22 sm:h-22 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer ${safeIndex === idx
                          ? 'border-primary ring-2 ring-primary/20 shadow-sm scale-[1.02]'
                          : 'border-transparent opacity-70 hover:opacity-100 hover:scale-[1.02]'
                        }`}
                    >
                      <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Listing Details & Information */}
          <div className="lg:col-span-5 xl:col-span-5 flex flex-col gap-4">
            <div className="bg-surface-card rounded-2xl p-5 sm:p-6 border border-border-subtle shadow-sm flex flex-col gap-4">
              {/* Title & Pricing Section */}
              <div className="flex flex-col gap-3">
                <h1 className="font-headline-md text-xl sm:text-2xl font-bold text-ink-primary leading-snug">
                  {listing.title}
                </h1>

                {/* Price & Property Type + Save Button Row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span className="font-headline-lg text-headline-lg font-bold text-emerald-600 text-2xl sm:text-3xl">
                      {formattedPriceStr}
                    </span>
                    {isRent && (
                      <span className="font-body-md text-body-md text-ink-secondary">/tháng</span>
                    )}
                  </div>

                  {/* Property type badge & Larger icon-only Save listing button */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="font-label-sm text-[12px] px-3 py-1.5 rounded-full bg-surface-container text-ink-secondary border border-border-subtle font-medium">
                      {listingTypeLabels[listing.listingType || ''] || 'Bất động sản'}
                    </span>

                    <button
                      type="button"
                      aria-label={isFavorite ? "Bỏ lưu tin" : "Lưu tin đăng"}
                      onClick={handleToggleFavorite}
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 ${isFavorite
                          ? 'border-amber-500/50 text-amber-500 bg-amber-500/10 hover:bg-amber-500/20'
                          : 'border-border-subtle text-ink-secondary hover:text-amber-500 bg-surface-container hover:bg-surface-card'
                        }`}
                      title={isFavorite ? "Bỏ lưu tin" : "Lưu tin đăng"}
                    >
                      <svg
                        className={`w-5 h-5 sm:w-[22px] sm:h-[22px] transition-transform ${isFavorite ? 'scale-110' : ''}`}
                        viewBox="0 0 24 24"
                        fill={isFavorite ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Dealable badge if applicable */}
                {listing.isDealable && (
                  <div className="-mt-1">
                    <span className="inline-block font-label-sm text-[11px] text-accent-warm font-semibold px-2.5 py-0.5 rounded-full bg-accent-warm/10 border border-accent-warm/25">
                      Còn thương lượng
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="font-body-sm text-body-sm text-ink-secondary flex items-start gap-1.5 flex-1 min-w-0">
                    <span className="material-symbols-outlined text-[18px] text-accent-warm flex-shrink-0 mt-0.5">
                      location_on
                    </span>
                    <span className="truncate">{locationStr}</span>
                  </p>
                  {listing.createdAt && (
                    <span className="text-[12px] text-ink-secondary flex items-center gap-1 bg-surface-container px-2.5 py-1 rounded-full border border-border-subtle font-medium flex-shrink-0">
                      <span className="material-symbols-outlined text-[14px] text-ink-tertiary">schedule</span>
                      {formatRelativeTime(listing.createdAt)}
                    </span>
                  )}
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t border-border-subtle text-ink-secondary font-body-sm">
                  {!isCommercialOrLand && (
                    <>
                      <div className="flex items-center gap-2 bg-surface-container/60 p-2.5 rounded-xl border border-border-subtle/80">
                        <span className="material-symbols-outlined text-[20px] text-accent-warm">bed</span>
                        <div>
                          <div className="text-[11px] text-ink-tertiary">Phòng ngủ</div>
                          <div className="font-semibold text-sm text-ink-primary">{listing.br || 0} PN</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-surface-container/60 p-2.5 rounded-xl border border-border-subtle/80">
                        <span className="material-symbols-outlined text-[20px] text-accent-warm">bathtub</span>
                        <div>
                          <div className="text-[11px] text-ink-tertiary">Phòng tắm</div>
                          <div className="font-semibold text-sm text-ink-primary">{listing.wc || 0} WC</div>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-2 bg-surface-container/60 p-2.5 rounded-xl border border-border-subtle/80">
                    <span className="material-symbols-outlined text-[20px] text-accent-warm">square_foot</span>
                    <div>
                      <div className="text-[11px] text-ink-tertiary">Diện tích</div>
                      <div className="font-semibold text-sm text-ink-primary">{listing.size || 0} m²</div>
                    </div>
                  </div>
                  {listing.depositAmount ? (
                    <div className="flex items-center gap-2 bg-surface-container/60 p-2.5 rounded-xl border border-border-subtle/80">
                      <span className="material-symbols-outlined text-[20px] text-accent-warm">payments</span>
                      <div>
                        <div className="text-[11px] text-ink-tertiary">Tiền đặt cọc</div>
                        <div className="font-semibold text-sm text-ink-primary">{formatVietnamesePrice(listing.depositAmount)}</div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Description Section */}
              {listing.description && (
                <div className="flex flex-col gap-2 pt-4 border-t border-border-subtle">
                  <h2 className="font-headline-sm font-semibold text-base text-ink-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-accent-warm">description</span>
                    Mô tả chi tiết
                  </h2>
                  <p className="font-body-md text-ink-primary leading-relaxed whitespace-pre-line text-sm sm:text-base">
                    {listing.description}
                  </p>
                </div>
              )}

              {/* Amenities Section */}
              {listing.amenities && listing.amenities.length > 0 && (
                <div className="flex flex-col gap-3 pt-4 border-t border-border-subtle">
                  <h2 className="font-headline-sm font-semibold text-base text-ink-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-accent-warm">star</span>
                    Tiện ích xung quanh
                  </h2>

                  <div className="grid grid-cols-3 gap-2">
                    {listing.amenities.map((itemKey) => {
                      const info = amenityLabels[itemKey] || { label: itemKey, icon: 'check_circle' };
                      return (
                        <div
                          key={itemKey}
                          className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-surface-container/60 border border-border-subtle text-ink-primary text-center"
                        >
                          <span className="material-symbols-outlined text-[22px] text-accent-warm mb-1">{info.icon}</span>
                          <span className="font-label-sm text-[11px] font-medium leading-tight">{info.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Host Info & Contact CTAs */}
              {host && (
                <div className="pt-4 border-t border-border-subtle flex flex-col gap-3.5">
                  <div
                    onClick={() => router.push(`/profile/${host.id}`)}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container/50 border border-border-subtle/80 cursor-pointer hover:bg-surface-container transition-all"
                  >
                    {hostAvatar ? (
                      <img
                        src={hostAvatar}
                        alt={hostName}
                        className="w-12 h-12 rounded-full object-cover border border-border-subtle flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center font-headline-sm text-ink-primary font-semibold text-sm flex-shrink-0">
                        {hostName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-headline-sm text-ink-primary font-semibold text-base truncate">
                        {hostName}
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-ink-tertiary">chevron_right</span>
                  </div>

                  {/* Prominent Action Buttons in Right Column */}
                  <div className="flex items-center gap-2.5 pt-1">
                    {isOwner ? (
                      <button
                        type="button"
                        onClick={() => setShowDeleteModal(true)}
                        className="w-full h-11 rounded-full bg-red-600 hover:bg-red-700 text-white font-label-md text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                        Gỡ bài đăng
                      </button>
                    ) : (
                      <>
                        {host?.phone ? (
                          <a
                            href={`tel:${host.phone}`}
                            className="flex-1 h-11 rounded-full bg-surface-card border border-border-strong text-ink-primary font-label-md text-sm font-semibold flex items-center justify-center gap-2 hover:bg-surface-container transition-colors shadow-2xs"
                          >
                            <span className="material-symbols-outlined text-[18px]">call</span>
                            Gọi {host.phone}
                          </a>
                        ) : null}

                        <button
                          onClick={() => {
                            const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
                            if (!token) {
                              router.push('/login');
                              return;
                            }
                            if (host?.id) {
                              router.push(`/messages?userId=${host.id}&listingId=${listing.id}`);
                            }
                          }}
                          className="flex-1 h-11 rounded-full bg-primary text-on-primary font-label-md text-sm font-semibold flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">chat</span>
                          Nhắn tin ngay
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Floating Bottom Action Bar on Mobile/Tablet */}
      <footer className="lg:hidden fixed bottom-0 left-16 md:left-52 right-0 z-30 bg-surface-parchment/95 backdrop-blur-xl border-t border-border-subtle py-2.5 px-4 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          {isOwner ? (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="flex-1 h-11 rounded-full bg-red-600 hover:bg-red-700 text-white font-label-md text-label-md font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">delete</span>
              Gỡ bài đăng
            </button>
          ) : (
            <>
              {host?.phone ? (
                <a
                  href={`tel:${host.phone}`}
                  className="flex-1 h-11 rounded-full bg-surface-card border border-border-strong text-ink-primary font-label-md text-label-md font-semibold flex items-center justify-center gap-2 hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">call</span>
                  Gọi {host.phone}
                </a>
              ) : null}

              <button
                onClick={() => {
                  if (host?.id) {
                    router.push(`/messages?userId=${host.id}&listingId=${listing.id}`);
                  }
                }}
                className="flex-1 h-11 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">chat</span>
                Liên hệ ngay
              </button>
            </>
          )}
        </div>
      </footer>

      {/* Confirmation Modal for Deleting Listing */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface-card border border-border-subtle rounded-2xl max-w-sm w-full p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[22px]">delete_forever</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-ink-primary font-semibold text-lg">Gỡ bài đăng</h3>
                <p className="text-xs text-ink-secondary">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <p className="text-sm text-ink-primary leading-relaxed">
              Bạn có chắc chắn muốn gỡ bài đăng <span className="font-semibold">"{listing.title}"</span>? Bài đăng sẽ bị xóa khỏi hệ thống.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-full border border-border-subtle text-ink-primary hover:bg-surface-container text-sm font-medium transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteListing}
                className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Đang gỡ...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    Xác nhận gỡ
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
