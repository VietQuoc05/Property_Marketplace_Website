'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  saleType?: 'RENT' | 'SALE';
  period?: string;
  location: string;
  listingType?: string;
  isDealable?: boolean;
  bedrooms?: number | string;
  bathrooms?: number;
  area?: number;
  images: string[];
  isVerified?: boolean;
  tag?: string;
  hostId?: string;
  hostName?: string;
  hostAvatar?: string;
  hostRole?: string;
  createdAt?: string | Date;
  isFavorite?: boolean;
  compact?: boolean;
  onFavoriteToggle?: (id: string) => void;
  onContactClick?: (id: string) => void;
  onHostClick?: (hostId: string) => void;
  onClick?: (id: string) => void;
  extraFooter?: React.ReactNode;
  specsAction?: React.ReactNode;
}

export function getListingTypeLabel(type?: string): string {
  switch (type) {
    case 'APARTMENT':
      return 'Căn hộ';
    case 'HOUSE':
      return 'Nhà phố';
    case 'ROOM':
      return 'Phòng trọ';
    case 'OFFICE':
      return 'Văn phòng';
    case 'LAND':
      return 'Đất';
    default:
      return 'Nhà đất';
  }
}

export function formatRelativeTime(dateInput?: string | Date | number | null): string {
  if (!dateInput) return '';

  const date = typeof dateInput === 'object' && dateInput instanceof Date
    ? dateInput
    : new Date(dateInput);

  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return 'Vừa xong';

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Trong ngày (diffDays === 0)
  if (diffDays === 0) {
    if (diffHours >= 1) {
      return `${diffHours} giờ`;
    }
    if (diffMinutes >= 1) {
      return `${diffMinutes} phút`;
    }
    return 'Vừa xong';
  }

  // 1-6 ngày trước -> 1-6 ngày
  if (diffDays >= 1 && diffDays <= 6) {
    return `${diffDays} ngày`;
  }

  // 7-13 ngày -> 1 tuần, 14-20 ngày -> 2 tuần, 21-27 ngày -> 3 tuần...
  if (diffDays >= 7 && diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} tuần`;
  }

  // >= 30 ngày -> tháng
  if (diffDays >= 30 && diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} tháng`;
  }

  // >= 365 ngày -> năm
  const years = Math.floor(diffDays / 365);
  return `${years} năm`;
}

export function formatVietnamesePrice(amount: number): string {
  if (!amount || isNaN(amount)) return '0';

  if (amount >= 1000000000) {
    const value = amount / 1000000000;
    const formatted = Number.isInteger(value) ? value.toString() : parseFloat(value.toFixed(2)).toString().replace('.', ',');
    return `${formatted} tỉ`;
  }

  if (amount >= 1000000) {
    const value = amount / 1000000;
    const formatted = Number.isInteger(value) ? value.toString() : parseFloat(value.toFixed(2)).toString().replace('.', ',');
    return `${formatted} triệu`;
  }

  if (amount >= 1000) {
    const value = amount / 1000;
    const formatted = Number.isInteger(value) ? value.toString() : parseFloat(value.toFixed(2)).toString().replace('.', ',');
    return `${formatted} nghìn`;
  }

  return amount.toLocaleString('vi-VN');
}

export const ListingCard: React.FC<ListingCardProps> = ({
  id,
  title,
  price,
  saleType = 'RENT',
  period = 'tháng',
  location,
  listingType,
  isDealable = false,
  bedrooms,
  bathrooms,
  area,
  images,
  isVerified = false,
  tag,
  hostId,
  hostName = 'Homers Host',
  hostAvatar,
  createdAt,
  isFavorite: initialFavorite = false,
  compact = true,
  onFavoriteToggle,
  onContactClick,
  onHostClick,
  onClick,
  extraFooter,
  specsAction,
}) => {
  const router = useRouter();
  const [favorite, setFavorite] = useState(initialFavorite);
  const [copied, setCopied] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    setFavorite(initialFavorite);
  }, [initialFavorite]);

  const timeAgoStr = createdAt ? formatRelativeTime(createdAt) : '';

  const totalImages = images && images.length > 0 ? images.length : 0;
  const safeIndex = totalImages > 0 ? ((currentImageIndex % totalImages) + totalImages) % totalImages : 0;

  const displayImage = totalImages > 0
    ? images[safeIndex]
    : 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800&auto=format&fit=crop';

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (totalImages <= 1) return;
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : totalImages - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (totalImages <= 1) return;
    setCurrentImageIndex((prev) => (prev < totalImages - 1 ? prev + 1 : 0));
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorite(!favorite);
    if (onFavoriteToggle) {
      onFavoriteToggle(id);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window === 'undefined') return;
    const shareUrl = `${window.location.origin}/listings/${id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(id);
    } else {
      router.push(`/listings/${id}`);
    }
  };

  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || totalImages <= 1) return;
    const diffX = touchStartX - e.changedTouches[0].clientX;
    if (diffX > 45) {
      // Swiped left -> next
      setCurrentImageIndex((prev) => (prev < totalImages - 1 ? prev + 1 : 0));
    } else if (diffX < -45) {
      // Swiped right -> prev
      setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : totalImages - 1));
    }
    setTouchStartX(null);
  };

  const formattedPriceStr = formatVietnamesePrice(price);

  const isCommercialOrLand = listingType === 'OFFICE' || listingType === 'LAND';

  // Compact layout matching the user's reference image
  if (compact) {
    const categoryBadge = tag || getListingTypeLabel(listingType);

    return (
      <article
        onClick={handleCardClick}
        className="bg-surface-card rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(28,28,28,0.04)] border border-border-subtle flex flex-col transition-all hover:shadow-[0_8px_20px_rgba(28,28,28,0.08)] cursor-pointer hover:-translate-y-0.5 group"
      >
        {/* Compact Hero Image */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative w-full aspect-[4/3] overflow-hidden bg-surface-container select-none group/media"
        >
          <img
            key={displayImage}
            src={displayImage}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />

          {/* Category / Property Type Badge (Top Right of Image) */}
          {categoryBadge && (
            <span
              className={`absolute top-2.5 right-2.5 z-20 font-semibold text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full shadow-sm pointer-events-none ${
                tag?.includes('từ chối')
                  ? 'bg-rose-500 text-white'
                  : tag?.includes('kiểm duyệt')
                  ? 'bg-amber-400 text-neutral-900'
                  : 'bg-yellow-400 text-neutral-900'
              }`}
            >
              {categoryBadge}
            </span>
          )}

          {/* Navigation Arrows on Hover */}
          {totalImages > 1 && (
            <>
              <button
                type="button"
                aria-label="Ảnh trước"
                onClick={handlePrevImage}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-surface-card/90 hover:bg-surface-card text-ink-primary backdrop-blur-md shadow-xs flex items-center justify-center transition-all opacity-0 group-hover/media:opacity-100 hover:scale-105 active:scale-95 z-20 border border-white/20"
              >
                <span className="material-symbols-outlined text-[15px]">chevron_left</span>
              </button>
              <button
                type="button"
                aria-label="Ảnh kế tiếp"
                onClick={handleNextImage}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-surface-card/90 hover:bg-surface-card text-ink-primary backdrop-blur-md shadow-xs flex items-center justify-center transition-all opacity-0 group-hover/media:opacity-100 hover:scale-105 active:scale-95 z-20 border border-white/20"
              >
                <span className="material-symbols-outlined text-[15px]">chevron_right</span>
              </button>
            </>
          )}

          {/* Photo Counter Badge (Bottom Right) */}
          {totalImages > 0 && (
            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-xs flex items-center justify-center z-10 pointer-events-none tracking-wide border border-white/10">
              <span>{safeIndex + 1}/{totalImages}</span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-3.5 sm:p-4 flex flex-col gap-2 flex-1 justify-between">
          <div className="flex flex-col gap-1">
            {/* Row 1: Title */}
            <h3 
              className="font-semibold text-ink-primary text-[13.5px] sm:text-[14.5px] line-clamp-1 hover:text-accent-warm transition-colors leading-snug" 
              title={title}
            >
              {title}
            </h3>

            {/* Row 2: Location (Pin icon + Location text) */}
            <p className="flex items-center gap-1 text-ink-secondary text-[11px] sm:text-xs line-clamp-1 pt-0.5">
              <span className="material-symbols-outlined text-[14px] text-ink-tertiary shrink-0">
                location_on
              </span>
              <span className="truncate">{location}</span>
            </p>
          </div>

          {/* Row 3: Price + Area (Left) & Save + Share Buttons (Bottom Right) */}
          <div className="pt-0.5 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-baseline gap-1.5 min-w-0 flex-wrap">
              <div className="flex items-baseline text-emerald-600 font-bold text-sm sm:text-base">
                <span>{formattedPriceStr}</span>
                {saleType === 'RENT' && (
                  <span className="text-[11px] sm:text-xs text-ink-secondary font-normal">/{period}</span>
                )}
              </div>
              {Boolean(area && Number(area) > 0) && (
                <span className="text-xs sm:text-[13px] font-semibold text-ink-secondary">
                  {area}m2
                </span>
              )}
              {isDealable && (
                <span className="font-medium text-[10px] text-accent-warm bg-accent-warm/10 px-1.5 py-0.5 rounded">
                  Thương lượng
                </span>
              )}
            </div>

            {/* Save (Left) & Share (Right) Action Buttons */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 shrink-0 ml-auto"
            >
              <button
                type="button"
                aria-label={favorite ? 'Bỏ lưu tin' : 'Lưu tin đăng'}
                title={favorite ? 'Bỏ lưu tin' : 'Lưu tin đăng'}
                onClick={handleFavorite}
                className={`w-7.5 h-7.5 rounded-full flex items-center justify-center transition-all active:scale-90 border cursor-pointer ${
                  favorite
                    ? 'text-amber-500 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20'
                    : 'text-ink-secondary hover:text-amber-500 bg-surface-container/70 hover:bg-surface-container border-border-subtle/60'
                }`}
              >
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${favorite ? 'scale-105' : ''}`}
                  viewBox="0 0 24 24"
                  fill={favorite ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </button>

              <button
                type="button"
                aria-label="Chia sẻ tin đăng"
                title={copied ? 'Đã sao chép liên kết!' : 'Chia sẻ tin đăng'}
                onClick={handleShare}
                className={`w-7.5 h-7.5 rounded-full flex items-center justify-center transition-all active:scale-90 border cursor-pointer ${
                  copied
                    ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30'
                    : 'text-ink-secondary hover:text-ink-primary bg-surface-container/70 hover:bg-surface-container border-border-subtle/60'
                }`}
              >
                {copied ? (
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {specsAction && (
            <div onClick={(e) => e.stopPropagation()} className="pt-0.5 flex justify-end">
              {specsAction}
            </div>
          )}

          {/* Optional extra footer (moderation reasons, etc.) */}
          {extraFooter && (
            <div onClick={(e) => e.stopPropagation()} className="pt-2 border-t border-border-subtle">
              {extraFooter}
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <article 
      onClick={handleCardClick}
      className="bg-surface-card rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(28,28,28,0.05)] border border-border-subtle flex flex-col transition-all hover:shadow-[0_12px_32px_rgba(28,28,28,0.1)] cursor-pointer hover:-translate-y-0.5 group"
    >
      {/* Hero Image Container - standard 4:3 real estate aspect ratio */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full aspect-[4/3] overflow-hidden bg-surface-container select-none group/media"
      >
        <img
          key={displayImage}
          src={displayImage}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />

        {/* Top & bottom subtle gradient protection */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 via-black/15 to-transparent pointer-events-none z-[5]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 via-black/15 to-transparent pointer-events-none z-[5]" />

        {/* Price Tag (Top Left) */}
        <div className="absolute top-3.5 left-3.5 bg-surface-card/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-1.5 z-10 pointer-events-none border border-border-subtle/50">
          <span className="font-headline-sm text-headline-sm sm:text-base text-ink-primary font-bold">
            {formattedPriceStr}
          </span>
          {saleType === 'RENT' && (
            <span className="font-body-sm text-body-sm text-ink-secondary">/{period}</span>
          )}
          {isDealable && (
            <span className="font-label-sm text-[11px] text-accent-warm font-semibold ml-0.5 bg-accent-warm/10 px-1.5 py-0.5 rounded-md">
              Thương lượng
            </span>
          )}
        </div>

        {/* Favorite / Bookmark Button (Top Right) */}
        <button
          type="button"
          aria-label={favorite ? "Bỏ lưu tin" : "Lưu tin đăng"}
          onClick={handleFavorite}
          className={`absolute top-3.5 right-3.5 w-10 h-10 rounded-full bg-surface-card/95 hover:bg-surface-card backdrop-blur-md flex items-center justify-center transition-all shadow-md z-20 active:scale-90 border border-border-subtle/50 hover:scale-105 ${
            favorite ? 'text-amber-500' : 'text-ink-primary hover:text-amber-500'
          }`}
        >
          <svg
            className={`w-5 h-5 transition-transform duration-150 ${favorite ? 'scale-105' : ''}`}
            viewBox="0 0 24 24"
            fill={favorite ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>

        {/* Left Arrow Button (Center Left) */}
        {totalImages > 1 && (
          <button
            type="button"
            aria-label="Ảnh trước"
            onClick={handlePrevImage}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-card/90 hover:bg-surface-card text-ink-primary backdrop-blur-md shadow-md flex items-center justify-center transition-all opacity-90 sm:opacity-0 sm:group-hover/media:opacity-100 hover:scale-110 active:scale-95 z-20 border border-white/20"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
        )}

        {/* Right Arrow Button (Center Right) */}
        {totalImages > 1 && (
          <button
            type="button"
            aria-label="Ảnh kế tiếp"
            onClick={handleNextImage}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-card/90 hover:bg-surface-card text-ink-primary backdrop-blur-md shadow-md flex items-center justify-center transition-all opacity-90 sm:opacity-0 sm:group-hover/media:opacity-100 hover:scale-110 active:scale-95 z-20 border border-white/20"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        )}

        {/* Center Carousel Dots */}
        {totalImages > 1 && (
          <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 pointer-events-auto bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 shadow-sm">
            {Array.from({ length: Math.min(totalImages, 7) }).map((_, idx) => {
              const isActive = idx === safeIndex || (totalImages > 7 && safeIndex >= 6 && idx === 6);
              return (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Ảnh ${idx + 1}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentImageIndex(idx);
                  }}
                  className={`transition-all rounded-full ${
                    isActive
                      ? 'w-4 h-1.5 bg-white shadow-xs'
                      : 'w-1.5 h-1.5 bg-white/60 hover:bg-white/90'
                  }`}
                />
              );
            })}
          </div>
        )}

        {/* Verified / Star Tag (Bottom Left) */}
        {(isVerified || tag) && (
          <div className="absolute bottom-3.5 left-3.5 bg-surface-container-highest/95 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm z-10 pointer-events-none">
            <span
              className="material-symbols-outlined text-[14px] text-accent-warm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {isVerified ? 'verified' : 'star'}
            </span>
            <span className="font-label-sm text-label-sm text-ink-primary font-medium">
              {tag || 'Môi giới xác thực'}
            </span>
          </div>
        )}

        {/* Photo Counter Badge (Bottom Right, e.g. 1/8) */}
        {totalImages > 0 && (
          <div className="absolute bottom-3.5 right-3.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-sm flex items-center justify-center z-10 pointer-events-none tracking-wide border border-white/10">
            <span>{safeIndex + 1}/{totalImages}</span>
          </div>
        )}
      </div>

      {/* Card Information Section */}
      <div className="p-4 sm:p-5 flex flex-col gap-2.5">
        {/* Host Avatar & Name if available */}
        {(hostName && hostName !== 'Homers Host' || hostAvatar) && (
          <div 
            onClick={(e) => {
              if (onHostClick && hostId) {
                e.stopPropagation();
                onHostClick(hostId);
              }
            }}
            className="flex items-center gap-2 group/host w-fit hover:opacity-85 transition-opacity"
          >
            {hostAvatar ? (
              <img
                src={hostAvatar}
                alt={hostName}
                className="w-6 h-6 rounded-full object-cover border border-border-subtle"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-accent-warm/15 text-accent-warm font-semibold text-xs flex items-center justify-center">
                {hostName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-label-sm text-label-sm text-ink-secondary font-medium group-hover/host:text-ink-primary transition-colors">
              {hostName}
            </span>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <h3 className="font-headline-sm text-headline-sm sm:text-base text-ink-primary font-semibold tracking-tight line-clamp-2 hover:text-accent-warm transition-colors leading-snug">
            {title}
          </h3>
          <div className="flex items-center justify-between text-ink-secondary font-body-sm text-body-sm pt-0.5">
            <p className="flex items-center gap-1.5 line-clamp-1 flex-1 min-w-0">
              <span className="material-symbols-outlined text-[17px] text-accent-warm flex-shrink-0">
                location_on
              </span>
              <span className="truncate">{location}</span>
            </p>
            {timeAgoStr && (
              <span className="text-[12px] text-ink-tertiary flex items-center gap-1 flex-shrink-0 ml-3 font-medium">
                <span className="material-symbols-outlined text-[13px] text-ink-tertiary">schedule</span>
                {timeAgoStr}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1 text-ink-secondary font-body-sm text-body-sm flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {!isCommercialOrLand && (
              <>
                <span className="inline-flex items-center gap-1 bg-surface-container px-3 py-1 rounded-full text-xs font-medium text-ink-secondary">
                  <span className="material-symbols-outlined text-[14px] text-ink-tertiary">bed</span>
                  {typeof bedrooms === 'number' ? `${bedrooms} PN` : bedrooms}
                </span>
                <span className="inline-flex items-center gap-1 bg-surface-container px-3 py-1 rounded-full text-xs font-medium text-ink-secondary">
                  <span className="material-symbols-outlined text-[14px] text-ink-tertiary">bathtub</span>
                  {bathrooms} WC
                </span>
              </>
            )}
            <span className="inline-flex items-center gap-1 bg-surface-container px-3 py-1 rounded-full text-xs font-medium text-ink-secondary">
              <span className="material-symbols-outlined text-[14px] text-ink-tertiary">square_foot</span>
              {area} m²
            </span>
          </div>

          {specsAction && (
            <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
              {specsAction}
            </div>
          )}
        </div>

        {extraFooter && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="pt-3 mt-1 border-t border-border-subtle flex items-center justify-between"
          >
            {extraFooter}
          </div>
        )}
      </div>
    </article>
  );
};
