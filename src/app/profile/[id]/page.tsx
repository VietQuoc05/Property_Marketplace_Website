'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ListingCard } from '@/components/ListingCard';
import { ProfileSkeleton, ListingCardSkeleton } from '@/components/ui/Skeleton';

interface UserProfile {
  id: string;
  fullName?: string;
  phone?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  cityId?: string | null;
  role?: string;
  createdAt?: string;
}

interface City {
  id: string;
  name: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id?: string; fullName?: string; avatarUrl?: string } | null>(null);
  const [cityName, setCityName] = useState<string>('');
  const [listings, setListings] = useState<any[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    async function fetchUserProfileAndListings() {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        // Fetch current user info for Header component
        fetch(`${apiUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data) {
              setCurrentUser(data);
              // If viewing own profile via ID, redirect to /profile
              if (data.id === userId) {
                router.replace('/profile');
              }
            }
          })
          .catch(() => { });

        // Fetch target user profile by ID using GET /users/:id
        const res = await fetch(`${apiUrl}/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (res.status === 404) {
            setError('Không tìm thấy thông tin người dùng.');
          } else {
            setError('Không thể tải thông tin hồ sơ.');
          }
          setLoading(false);
          return;
        }

        const data: UserProfile = await res.json();
        setProfileUser(data);

        // Fetch city details if cityId exists
        if (data.cityId) {
          const citiesRes = await fetch(`${apiUrl}/locations/cities`);
          if (citiesRes.ok) {
            const citiesData = await citiesRes.json();
            const list: City[] = Array.isArray(citiesData) ? citiesData : (citiesData.data || []);
            const matchedCity = list.find((c) => c.id === data.cityId);
            if (matchedCity) {
              setCityName(matchedCity.name);
            }
          }
        }

        // Fetch target user listings
        const listingsRes = await fetch(`${apiUrl}/users/${userId}/listings`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (listingsRes.ok) {
          const listingsData = await listingsRes.json();
          setListings(Array.isArray(listingsData) ? listingsData : (listingsData.data || []));
        }

        // Fetch favorite listings for favorite state
        if (token) {
          fetch(`${apiUrl}/listings/interested/me`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((r) => (r.ok ? r.json() : []))
            .then((favList) => {
              if (Array.isArray(favList)) {
                setFavoriteIds(new Set(favList.map((item: any) => item.id)));
              }
            })
            .catch(() => { });
        }
      } catch (err) {
        setError('Có lỗi xảy ra khi kết nối máy chủ.');
      } finally {
        setLoading(false);
        setListingsLoading(false);
      }
    }

    if (userId) {
      fetchUserProfileAndListings();
    }
  }, [userId, apiUrl, router]);

  const handleFavoriteToggle = async (listingId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    const isFav = favoriteIds.has(listingId);
    const nextFavs = new Set(favoriteIds);
    if (isFav) {
      nextFavs.delete(listingId);
    } else {
      nextFavs.add(listingId);
    }
    setFavoriteIds(nextFavs);

    try {
      await fetch(`${apiUrl}/listings/${listingId}/interest`, {
        method: isFav ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      setFavoriteIds(favoriteIds);
    }
  };

  const displayAvatar = profileUser?.avatarUrl
    ? (profileUser.avatarUrl.startsWith('http') ? profileUser.avatarUrl : `${apiUrl}${profileUser.avatarUrl}`)
    : undefined;

  const userInitials = profileUser?.fullName
    ? profileUser.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  if (loading) {
    return <ProfileSkeleton isOwn={false} />;
  }

  if (error || !profileUser) {
    return (
      <div className="flex flex-col min-h-screen bg-surface">
        <main className="flex-1 max-w-xl w-full mx-auto px-4 pt-12 pb-12 flex flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined text-[48px] text-ink-tertiary mb-2">person_off</span>
          <h2 className="font-headline-sm text-headline-sm text-ink-primary font-semibold mb-1">
            {error || 'Không tìm thấy hồ sơ người dùng'}
          </h2>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 rounded-full bg-primary text-on-primary font-label-md text-label-md"
          >
            Quay lại
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <main className="flex-1 max-w-6xl 2xl:max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 flex flex-col gap-6">
        {/* Profile Card with Back button on the left (outside component width) */}
        <div className="relative w-full">
          <button
            type="button"
            onClick={() => router.back()}
            className="absolute -left-12 sm:-left-13 top-1 shrink-0 w-10 h-10 rounded-full bg-surface-card border border-border-subtle hover:bg-surface-container text-ink-primary shadow-xs flex items-center justify-center transition-all cursor-pointer hover:-translate-x-0.5 active:scale-95 z-10"
            title="Quay lại"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>

          {/* Unified Profile Card (Expanded & Balanced for Wide Layout) */}
          <div className="w-full bg-surface-card rounded-2xl p-6 sm:p-7 border border-border-subtle shadow-sm flex flex-col gap-6">
          {/* User Header: Avatar, Name, Email, Phone, Chat button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4 sm:gap-5 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt={profileUser.fullName || 'User'}
                    className="w-18 h-18 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-border-strong shadow-sm"
                  />
                ) : (
                  <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-primary text-on-primary flex items-center justify-center font-headline-md text-2xl font-semibold shadow-md">
                    {userInitials}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="font-headline-sm text-headline-sm text-ink-primary font-bold text-xl sm:text-2xl truncate">
                    {profileUser.fullName || 'Người dùng Homers'}
                  </h2>
                </div>

                <div className="flex items-center gap-4 sm:gap-6 flex-wrap mt-2 text-ink-secondary text-sm">
                  {profileUser.email && (
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-ink-tertiary">mail</span>
                      {profileUser.email}
                    </span>
                  )}
                  {profileUser.phone && (
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-ink-tertiary">call</span>
                      {profileUser.phone}
                    </span>
                  )}
                  {cityName && (
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-ink-tertiary">location_on</span>
                      {cityName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick action button: Nhắn tin */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => router.push(`/messages?userId=${profileUser.id}`)}
                className="px-5 py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md shadow-sm hover:opacity-90 flex items-center gap-2 transition-all cursor-pointer hover:shadow-md active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
                <span>Nhắn tin</span>
              </button>
            </div>
          </div>

          {/* Lower Grid: Bio & Info Stats Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Bio */}
            <div className="lg:col-span-8 flex flex-col justify-start">
              <p className="font-body-md text-body-md text-ink-primary leading-relaxed break-words whitespace-pre-wrap py-1">
                {profileUser.bio || <span className="italic text-ink-tertiary">Chưa có thông tin giới thiệu.</span>}
              </p>
            </div>

            {/* Stats / Info Summary */}
            <div className="lg:col-span-4 flex flex-col justify-between gap-3">
              <div className="bg-surface-container/40 p-3.5 sm:p-4 rounded-xl border border-border-subtle/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent-warm/10 text-accent-warm flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">real_estate_agent</span>
                  </div>
                  <div>
                    <div className="text-[11px] text-ink-tertiary font-medium">Tin đang đăng</div>
                    <div className="font-bold text-base text-ink-primary">{listings.length} tin đăng</div>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container/40 p-3.5 sm:p-4 rounded-xl border border-border-subtle/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">location_city</span>
                  </div>
                  <div>
                    <div className="text-[11px] text-ink-tertiary font-medium">Khu vực sinh sống</div>
                    <div className="font-bold text-base text-ink-primary">{cityName || 'Chưa cập nhật'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* User's Listings Section */}
        <div className="flex flex-col gap-3.5 mt-2">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-sm text-headline-sm text-ink-primary font-semibold text-base flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-accent-warm">real_estate_agent</span>
              Bài đăng của người dùng {!listingsLoading && `(${listings.length})`}
            </h3>
          </div>

          {listingsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mt-1">
              {[1, 2, 3].map((i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12 text-ink-tertiary font-body-md flex flex-col items-center gap-2 bg-surface-card rounded-2xl border border-border-subtle p-6">
              <span className="material-symbols-outlined text-[42px] text-ink-tertiary">inventory_2</span>
              <span className="text-ink-secondary font-medium">Chưa có bài đăng nào</span>
              <span className="text-xs text-ink-tertiary">Người dùng này hiện chưa đăng tin bất động sản nào.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mt-1">
              {listings.map((item) => {
                const isRent = item.saleType === 'RENT';
                const priceNum = isRent ? Number(item.monthlyRent || 0) : Number(item.salePrice || 0);

                const locationStr = [
                  item.ward?.name,
                  item.district?.name,
                  item.city?.name,
                ].filter(Boolean).join(', ') || item.address || 'Việt Nam';

                const imageList = item.images?.map((img: any) => {
                  if (typeof img === 'string') return img.startsWith('http') ? img : `${apiUrl}${img}`;
                  const rawUrl = img.imageUrl || img.url || '';
                  return rawUrl.startsWith('http') ? rawUrl : `${apiUrl}${rawUrl}`;
                }).filter(Boolean) || [];

                const hostInfo = item.createdBy || profileUser;
                const hostId = hostInfo?.id || userId;
                const hostName = hostInfo?.fullName || profileUser?.fullName || 'Homers Host';
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
                    isFavorite={favoriteIds.has(item.id)}
                    onFavoriteToggle={() => handleFavoriteToggle(item.id)}
                    onClick={(id) => router.push(`/listings/${id}`)}
                    onHostClick={(hId) => {
                      if (hId !== userId) router.push(`/profile/${hId}`);
                    }}
                    onContactClick={() => {
                      router.push(`/messages?userId=${userId}`);
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
