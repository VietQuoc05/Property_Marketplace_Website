'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ListingCard } from '@/components/ListingCard';
import { ListingCardSkeleton } from '@/components/ui/Skeleton';
import { ListingInterestsModal } from '@/components/ListingInterestsModal';
import { getSocket } from '@/lib/socket';

interface RawListing {
  id: string;
  title: string;
  monthlyRent?: number;
  salePrice?: number;
  saleType?: 'RENT' | 'SALE';
  city?: { name: string };
  district?: { name: string };
  ward?: { name: string };
  address?: string;
  br?: number;
  wc?: number;
  size?: number;
  images?: Array<{ imageUrl?: string; url?: string } | string>;
  isVerified?: boolean;
  user?: {
    id?: string;
    fullName?: string;
    avatarUrl?: string;
    email?: string;
  };
  createdBy?: {
    id?: string;
    fullName?: string;
    avatarUrl?: string;
    email?: string;
  };
  [key: string]: any;
}

export default function MyListingsPage() {
  const [listings, setListings] = useState<RawListing[]>([]);
  const [user, setUser] = useState<{ id?: string; fullName?: string; avatarUrl?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedListingForInterests, setSelectedListingForInterests] = useState<{ id: string; title: string } | null>(null);

  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    async function fetchMyListings() {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        // 1. Fetch Current User
        const userRes = await fetch(`${apiUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!userRes.ok) {
          localStorage.removeItem('accessToken');
          router.push('/login');
          return;
        }

        const userData = await userRes.json();
        setUser(userData);

        // 2. Fetch My Listings GET /listings/me
        const listingsRes = await fetch(`${apiUrl}/listings/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (listingsRes.ok) {
          const data = await listingsRes.json();
          const list = Array.isArray(data) ? data : data.data || [];
          setListings(list);
        }
      } catch (err) {
        console.error('Error fetching my listings:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMyListings();

    const socket = getSocket();
    if (socket) {
      const handleInterestCountChanged = (data: { listingId: string; interestScore: number }) => {
        setListings((prev) =>
          prev.map((l) =>
            l.id === data.listingId
              ? {
                  ...l,
                  interestScore: data.interestScore,
                  _count: {
                    ...l._count,
                    interests: data.interestScore,
                  },
                }
              : l
          )
        );
      };

      const handleListingUpdated = (updatedListing: RawListing) => {
        setListings((prev) =>
          prev.map((l) => (l.id === updatedListing.id ? { ...l, ...updatedListing } : l))
        );
      };

      const handleListingCreated = (newListing: RawListing) => {
        const myId = user?.id;
        if (myId && (newListing as any).createdById === myId) {
          setListings((prev) => {
            if (prev.some((l) => l.id === newListing.id)) return prev;
            return [newListing, ...prev];
          });
        }
      };

      const handleListingDeleted = (data: { listingId: string }) => {
        if (!data?.listingId) return;
        setListings((prev) => prev.filter((l) => l.id !== data.listingId));
      };

      const handleListingModerated = (data: {
        listingId: string;
        status: string;
        decision: string;
        reasons: string[];
      }) => {
        setListings((prev) =>
          prev.map((l) =>
            l.id === data.listingId
              ? {
                  ...l,
                  status: data.status,
                  moderation: {
                    ...(l as any).moderation,
                    decision: data.decision,
                    reasons: data.reasons,
                  },
                }
              : l,
          ),
        );
      };

      socket.on('listing:interest_count_changed', handleInterestCountChanged);
      socket.on('listing:updated', handleListingUpdated);
      socket.on('listing:created', handleListingCreated);
      socket.on('listing:deleted', handleListingDeleted);
      socket.on('listing:moderated', handleListingModerated);

      return () => {
        socket.off('listing:interest_count_changed', handleInterestCountChanged);
        socket.off('listing:updated', handleListingUpdated);
        socket.off('listing:created', handleListingCreated);
        socket.off('listing:deleted', handleListingDeleted);
        socket.off('listing:moderated', handleListingModerated);
      };
    }
  }, [router, apiUrl, user?.id]);

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <main className="flex-1 w-full pt-4 pb-16 max-w-6xl 2xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between pt-4 pb-2">
          <div>
            <h1 className="font-headline-md text-headline-md text-ink-primary font-semibold">
              Tin của tôi ({listings.length})
            </h1>
          </div>

          <Link
            href="/create-listing"
            className="px-3.5 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-label-md shadow-sm hover:opacity-90 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Đăng tin mới
          </Link>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-16 text-ink-tertiary font-body-md flex flex-col items-center gap-3 bg-surface-card rounded-2xl border border-border-subtle p-6 max-w-md mx-auto my-4">
              <span className="material-symbols-outlined text-[48px] text-ink-tertiary">post_add</span>
              <span className="text-ink-secondary font-medium">Bạn chưa đăng tin nào</span>
              <Link
                href="/create-listing"
                className="mt-1 px-4 py-2 rounded-full bg-primary text-on-primary font-label-md text-label-md shadow-sm"
              >
                Đăng tin đầu tiên ngay
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {listings.map((item) => {
                const isRent = item.saleType === 'RENT';
                const priceNum = isRent ? Number(item.monthlyRent || 0) : Number(item.salePrice || 0);

                const locationStr = [
                  item.ward?.name,
                  item.district?.name,
                  item.city?.name
                ].filter(Boolean).join(', ') || item.address || 'Việt Nam';

                const imageList = item.images?.map((img) => {
                  if (typeof img === 'string') return img.startsWith('http') ? img : `${apiUrl}${img}`;
                  const rawUrl = img.imageUrl || img.url || '';
                  return rawUrl.startsWith('http') ? rawUrl : `${apiUrl}${rawUrl}`;
                }).filter(Boolean) || [];

                const hostInfo = item.createdBy || item.user || user;
                const hostId = hostInfo?.id || user?.id;
                const hostName = hostInfo?.fullName || user?.fullName || 'Homers Host';
                const hostAvatar = hostInfo?.avatarUrl
                  ? (hostInfo.avatarUrl.startsWith('http') ? hostInfo.avatarUrl : `${apiUrl}${hostInfo.avatarUrl}`)
                  : user?.avatarUrl ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `${apiUrl}${user.avatarUrl}`) : undefined;

                const interestCount = item._count?.interests ?? item.interestScore ?? 0;

                return (
                  <ListingCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    price={priceNum}
                    saleType={item.saleType || 'RENT'}
                    location={locationStr}
                    listingType={item.listingType}
                    isDealable={item.isDealable}
                    bedrooms={item.br}
                    bathrooms={item.wc}
                    area={item.size}
                    images={imageList}
                    isVerified={item.isVerified}
                    hostId={hostId}
                    hostName={hostName}
                    hostAvatar={hostAvatar}
                    createdAt={item.createdAt}
                    compact={true}
                    tag={
                    item.status === 'PENDING_REVIEW'
                      ? 'Đang kiểm duyệt ⏳'
                      : item.status === 'REJECTED'
                      ? 'Bị từ chối ⚠️'
                      : undefined
                  }
                  extraFooter={
                    item.status === 'REJECTED' && item.moderation?.reasons?.length ? (
                      <div className="mt-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs">
                        <div className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">gpp_bad</span>
                          Lý do từ chối kiểm duyệt (AI):
                        </div>
                        <ul className="list-disc list-inside mt-1.5 text-ink-secondary space-y-0.5">
                          {item.moderation.reasons.map((r: string, i: number) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    ) : item.status === 'PENDING_REVIEW' ? (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                        <span>Hệ thống AI đang kiểm duyệt nội dung và hình ảnh của tin đăng...</span>
                      </div>
                    ) : null
                  }
                  onClick={(id) => router.push(`/listings/${id}`)}
                  onHostClick={(hId) => {
                    router.push(`/profile/${hId}`);
                  }}
                  onContactClick={() => {
                    if (hostId) {
                      router.push(`/messages?userId=${hostId}`);
                    }
                  }}
                  specsAction={
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedListingForInterests({ id: item.id, title: item.title });
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black hover:bg-neutral-800 text-white transition-all text-[12px] font-semibold border border-black/10 group/btn shadow-xs active:scale-95 cursor-pointer"
                      title="Xem danh sách người quan tâm tin đăng này"
                    >
                      <svg
                        className="w-[13px] h-[13px] text-white group-hover/btn:scale-110 transition-transform flex-shrink-0"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                      <span className="text-white">{interestCount} người quan tâm</span>
                      <span className="material-symbols-outlined text-[14px] text-white/80 group-hover/btn:translate-x-0.5 transition-transform">
                        chevron_right
                      </span>
                    </button>
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </main>

      {/* Popup / Modal hiển thị danh sách user quan tâm tin đăng */}
      <ListingInterestsModal
        isOpen={!!selectedListingForInterests}
        onClose={() => setSelectedListingForInterests(null)}
        listingId={selectedListingForInterests?.id || null}
        listingTitle={selectedListingForInterests?.title || null}
      />
    </div>
  );
}
