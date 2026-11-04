'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ListingCard } from '@/components/ListingCard';
import { ListingCardSkeleton } from '@/components/ui/Skeleton';

interface RawListing {
  id: string;
  title: string;
  monthlyRent?: number;
  salePrice?: number;
  saleType?: 'RENT' | 'SALE';
  listingType?: string;
  isDealable?: boolean;
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

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<RawListing[]>([]);
  const [user, setUser] = useState<{ id?: string; fullName?: string; avatarUrl?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    async function fetchFavorites() {
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

        // 2. Fetch Favorites GET /listings/interested/me
        const favRes = await fetch(`${apiUrl}/listings/interested/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (favRes.ok) {
          const data = await favRes.json();
          const list = Array.isArray(data) ? data : data.data || [];
          setFavorites(list);
        }
      } catch (err) {
        console.error('Error fetching interested listings:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFavorites();
  }, [router, apiUrl]);

  const handleRemoveFavorite = async (listingId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res = await fetch(`${apiUrl}/listings/${listingId}/interest`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setFavorites((prev) => prev.filter((item) => item.id !== listingId));
      }
    } catch (err) {
      console.error('Error removing favorite:', err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <main className="flex-1 w-full pt-4 pb-16 max-w-[1800px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between pt-4 pb-2">
          <div>
            <h1 className="font-headline-md text-headline-md text-ink-primary font-semibold">
              Tin đã lưu ({favorites.length})
            </h1>
          </div>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-16 text-ink-tertiary font-body-md flex flex-col items-center gap-3 bg-surface-card rounded-2xl border border-border-subtle p-6 max-w-md mx-auto my-4">
              <span className="material-symbols-outlined text-[48px] text-ink-tertiary">bookmark_border</span>
              <span className="text-ink-secondary font-medium">Bạn chưa lưu bài đăng nào</span>
              <Link
                href="/"
                className="mt-1 px-4 py-2 rounded-full bg-primary text-on-primary font-label-md text-label-md shadow-sm"
              >
                Khám phá ngay
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {favorites.map((item) => {
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

                const hostInfo = item.createdBy || item.user;
                const hostId = hostInfo?.id || item.createdById;
                const hostName = hostInfo?.fullName || hostInfo?.email?.split('@')[0] || 'Homers Host';
                const hostAvatar = hostInfo?.avatarUrl
                  ? (hostInfo.avatarUrl.startsWith('http') ? hostInfo.avatarUrl : `${apiUrl}${hostInfo.avatarUrl}`)
                  : undefined;

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
                    isFavorite={true}
                    onFavoriteToggle={() => handleRemoveFavorite(item.id)}
                    onClick={(id) => router.push(`/listings/${id}`)}
                    onHostClick={(hId) => {
                      router.push(`/profile/${hId}`);
                    }}
                    onContactClick={() => {
                      if (hostId) {
                        router.push(`/messages?userId=${hostId}`);
                      }
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
