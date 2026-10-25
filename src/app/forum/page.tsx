'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export type NeedType = 'APARTMENT' | 'HOUSE' | 'LAND' | 'OFFICE' | 'ROOM';
export type NeedSaleType = 'RENT' | 'SALE';

interface ForumAuthor {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface LocationEntity {
  id: string;
  name: string;
}

interface ForumPost {
  id: string;
  title: string;
  detail: string;
  userId: string;
  user: ForumAuthor;
  needType?: NeedType | null;
  needSaleType?: NeedSaleType | null;
  cityId?: string | null;
  city?: LocationEntity | null;
  districtId?: string | null;
  district?: LocationEntity | null;
  wardId?: string | null;
  ward?: LocationEntity | null;
  createdAt: string;
  updatedAt: string;
}

interface CurrentUser {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  email?: string | null;
}

interface CityOption {
  id: string;
  name: string;
}

interface DistrictOption {
  id: string;
  name: string;
}

interface WardOption {
  id: string;
  name: string;
}

const NEED_TYPE_OPTIONS: { value: NeedType; label: string }[] = [
  { value: 'APARTMENT', label: 'Căn hộ / Chung cư' },
  { value: 'HOUSE', label: 'Nhà riêng / Nguyên căn' },
  { value: 'LAND', label: 'Nhà đất / Đất nền' },
  { value: 'ROOM', label: 'Phòng trọ / Studio' },
  { value: 'OFFICE', label: 'Văn phòng / Mặt bằng' },
];

const NEED_SALE_TYPE_OPTIONS: { value: NeedSaleType; label: string }[] = [
  { value: 'RENT', label: 'Cần thuê' },
  { value: 'SALE', label: 'Cần mua' },
];

function getNeedTypeLabel(type?: NeedType | null): string | null {
  if (!type) return null;
  const match = NEED_TYPE_OPTIONS.find((item) => item.value === type);
  return match ? match.label : type;
}

function getNeedSaleTypeLabel(saleType?: NeedSaleType | null): string | null {
  if (!saleType) return null;
  const match = NEED_SALE_TYPE_OPTIONS.find((item) => item.value === saleType);
  return match ? match.label : saleType;
}

function formatRelativeTime(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Vừa xong';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} ngày trước`;

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatLocationString(post: ForumPost): string | null {
  const parts: string[] = [];
  if (post.ward?.name) parts.push(post.ward.name);
  if (post.district?.name) parts.push(post.district.name);
  if (post.city?.name) parts.push(post.city.name);

  return parts.length > 0 ? parts.join(', ') : null;
}

export default function ForumPage() {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('');
  const [selectedNeedSaleTypeFilter, setSelectedNeedSaleTypeFilter] = useState<string>('');
  const [selectedNeedTypeFilter, setSelectedNeedTypeFilter] = useState<string>('');

  // Location Options for Modal & Filter
  const [cities, setCities] = useState<CityOption[]>([]);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [wards, setWards] = useState<WardOption[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [titleInput, setTitleInput] = useState<string>('');
  const [detailInput, setDetailInput] = useState<string>('');
  const [needSaleTypeInput, setNeedSaleTypeInput] = useState<NeedSaleType | ''>('RENT');
  const [needTypeInput, setNeedTypeInput] = useState<NeedType | ''>('APARTMENT');
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [selectedWardId, setSelectedWardId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 1. Fetch User & Forum Posts & Cities
  useEffect(() => {
    async function initData() {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

      // Fetch user profile if token exists
      if (token) {
        try {
          const res = await fetch(`${apiUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setCurrentUser(data);
          }
        } catch {
          // ignore error
        }
      }

      // Fetch Cities for location selectors
      try {
        const cityRes = await fetch(`${apiUrl}/locations/cities`);
        if (cityRes.ok) {
          const cityData = await cityRes.json();
          setCities(Array.isArray(cityData) ? cityData : cityData.data || []);
        }
      } catch {
        // ignore error
      }

      // Fetch forum posts
      try {
        const res = await fetch(`${apiUrl}/forum-posts`);
        if (res.ok) {
          const data = await res.json();
          setPosts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to fetch forum posts:', err);
      } finally {
        setLoading(false);
      }
    }

    initData();
  }, [apiUrl]);

  // When city changes in modal -> fetch districts
  useEffect(() => {
    if (!selectedCityId) {
      setDistricts([]);
      setSelectedDistrictId('');
      setWards([]);
      setSelectedWardId('');
      return;
    }

    async function fetchDistricts() {
      try {
        const res = await fetch(`${apiUrl}/locations/cities/${selectedCityId}/districts`);
        if (res.ok) {
          const data = await res.json();
          setDistricts(Array.isArray(data) ? data : data.data || []);
        }
      } catch {
        setDistricts([]);
      }
      setSelectedDistrictId('');
      setWards([]);
      setSelectedWardId('');
    }

    fetchDistricts();
  }, [selectedCityId, apiUrl]);

  // When district changes in modal -> fetch wards
  useEffect(() => {
    if (!selectedDistrictId) {
      setWards([]);
      setSelectedWardId('');
      return;
    }

    async function fetchWards() {
      try {
        const res = await fetch(`${apiUrl}/locations/districts/${selectedDistrictId}/wards`);
        if (res.ok) {
          const data = await res.json();
          setWards(Array.isArray(data) ? data : data.data || []);
        }
      } catch {
        setWards([]);
      }
      setSelectedWardId('');
    }

    fetchWards();
  }, [selectedDistrictId, apiUrl]);

  // Handle open create modal
  const handleOpenCreateModal = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      router.push('/login');
      return;
    }
    setFormError('');
    setIsModalOpen(true);
  };

  // Submit new post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    const trimmedTitle = titleInput.trim();
    const trimmedDetail = detailInput.trim();

    if (!trimmedTitle || trimmedTitle.length < 5) {
      setFormError('Tiêu đề cần có ít nhất 5 ký tự.');
      return;
    }
    if (!trimmedDetail || trimmedDetail.length < 10) {
      setFormError('Chi tiết nhu cầu cần có ít nhất 10 ký tự.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/forum-posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: trimmedTitle,
          detail: trimmedDetail,
          needSaleType: needSaleTypeInput || undefined,
          needType: needTypeInput || undefined,
          cityId: selectedCityId || undefined,
          districtId: selectedDistrictId || undefined,
          wardId: selectedWardId || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const msg = Array.isArray(errorData?.message)
          ? errorData.message.join(', ')
          : errorData?.message || 'Có lỗi xảy ra khi đăng tin. Vui lòng thử lại.';
        setFormError(msg);
        return;
      }

      const newPost: ForumPost = await res.json();
      setPosts((prev) => [newPost, ...prev]);
      setTitleInput('');
      setDetailInput('');
      setNeedSaleTypeInput('RENT');
      setNeedTypeInput('APARTMENT');
      setSelectedCityId('');
      setSelectedDistrictId('');
      setSelectedWardId('');
      setIsModalOpen(false);
    } catch {
      setFormError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete post
  const handleDeletePost = async (postId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài đăng này không?')) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) return;

    setDeletingId(postId);
    try {
      const res = await fetch(`${apiUrl}/forum-posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      } else {
        alert('Không thể xóa bài đăng. Vui lòng thử lại sau.');
      }
    } catch {
      alert('Lỗi kết nối máy chủ khi xóa bài đăng.');
    } finally {
      setDeletingId(null);
    }
  };

  // Direct Message to Author
  const handleContactAuthor = (authorId: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    if (currentUser?.id === authorId) {
      return;
    }

    router.push(`/messages?userId=${authorId}`);
  };

  // Filtered posts (supports needSaleType + needType + city filter)
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      // 1. NeedSaleType filter
      if (selectedNeedSaleTypeFilter && p.needSaleType !== selectedNeedSaleTypeFilter) {
        return false;
      }

      // 2. NeedType filter
      if (selectedNeedTypeFilter && p.needType !== selectedNeedTypeFilter) {
        return false;
      }

      // 3. City filter
      if (selectedCityFilter && p.cityId !== selectedCityFilter) {
        return false;
      }

      return true;
    });
  }, [posts, selectedCityFilter, selectedNeedSaleTypeFilter, selectedNeedTypeFilter]);

  // Helper avatar URL
  const getAvatarUrl = (url?: string | null) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${apiUrl}${url}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <main className="flex-1 w-full pt-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8">
          {/* Left Column: Hero & Filter Controls */}
          <aside className="w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 flex flex-col gap-4 lg:sticky lg:top-6 self-start">
            {/* Header Hero Banner */}
            <div className="bg-gradient-to-br from-surface-card to-surface-container/50 border border-border-subtle rounded-3xl p-5 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] relative overflow-hidden">
              <div className="flex flex-col sm:flex-row lg:flex-col sm:items-center lg:items-stretch sm:justify-between gap-4">
                <div className="max-w-xl">
                  <h1 className="font-headline-md text-xl sm:text-2xl font-bold text-ink-primary leading-tight">
                    Nhu cầu tìm kiếm bất động sản
                  </h1>
                  <p className="mt-2 text-ink-secondary text-xs sm:text-sm leading-relaxed">
                    Đăng nhu cầu tìm nhà của bạn để các tư vấn viên và chủ nhà liên hệ trực tiếp.
                  </p>
                </div>

                <div className="flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="w-full sm:w-auto lg:w-full px-5 py-3 rounded-2xl bg-primary text-on-primary font-semibold text-sm shadow-md hover:bg-primary/90 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    <span>Đăng tin tìm kiếm</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-surface-card border border-border-subtle p-4 sm:p-5 rounded-3xl shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink-primary uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[16px] text-primary">tune</span>
                  <span>Bộ lọc tìm kiếm</span>
                </div>
                {(selectedCityFilter || selectedNeedTypeFilter || selectedNeedSaleTypeFilter) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCityFilter('');
                      setSelectedNeedTypeFilter('');
                      setSelectedNeedSaleTypeFilter('');
                    }}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                    <span>Đặt lại</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2.5 w-full">
                {/* 1. NeedSaleType Filter (Thuê / Mua) */}
                <div className="relative">
                  <select
                    value={selectedNeedSaleTypeFilter}
                    onChange={(e) => setSelectedNeedSaleTypeFilter(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl bg-surface-container/60 hover:bg-surface-container border border-border-subtle text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium cursor-pointer"
                  >
                    <option value="">Tất cả hình thức (Thuê / Mua)</option>
                    {NEED_SALE_TYPE_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. NeedType Filter (Loại BĐS) */}
                <div className="relative">
                  <select
                    value={selectedNeedTypeFilter}
                    onChange={(e) => setSelectedNeedTypeFilter(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl bg-surface-container/60 hover:bg-surface-container border border-border-subtle text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium cursor-pointer"
                  >
                    <option value="">Tất cả loại BĐS</option>
                    {NEED_TYPE_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. City Quick Filter */}
                <div className="relative">
                  <select
                    value={selectedCityFilter}
                    onChange={(e) => setSelectedCityFilter(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl bg-surface-container/60 hover:bg-surface-container border border-border-subtle text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium cursor-pointer"
                  >
                    <option value="">Tất cả tỉnh / thành</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Column: Post Feed */}
          <div className="flex-1 min-w-0 w-full">
            {/* Post Feed */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-surface-card border border-border-subtle rounded-2xl p-6 animate-pulse flex flex-col gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-surface-container" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="h-4 bg-surface-container rounded w-1/4" />
                    <div className="h-3 bg-surface-container rounded w-1/6" />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-20 bg-surface-container rounded-full" />
                    <div className="h-6 w-24 bg-surface-container rounded-full" />
                  </div>
                  <div className="h-8 w-24 bg-surface-container rounded-xl" />
                </div>
                <div className="h-5 bg-surface-container rounded w-3/4" />
                <div className="h-4 bg-surface-container rounded w-full" />
                <div className="h-4 bg-surface-container rounded w-5/6" />
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-surface-card rounded-2xl border border-border-subtle p-10 text-center flex flex-col items-center max-w-md mx-auto my-8 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-ink-tertiary mb-4">
              <span className="material-symbols-outlined text-[32px]">forum</span>
            </div>
            <h3 className="text-lg font-bold text-ink-primary mb-1">
              {selectedCityFilter || selectedNeedTypeFilter || selectedNeedSaleTypeFilter
                ? 'Không tìm thấy bài đăng phù hợp'
                : 'Chưa có tin tìm kiếm nào'}
            </h3>
            <p className="text-ink-secondary text-sm mb-6 text-center">
              {selectedCityFilter || selectedNeedTypeFilter || selectedNeedSaleTypeFilter
                ? 'Thử thay đổi bộ lọc hình thức, loại nhà đất hoặc khu vực.'
                : 'Bạn đang cần tìm phòng trọ, căn hộ hoặc nhà nguyên căn? Đăng bài ngay để các sale bất động sản tư vấn giúp bạn!'}
            </p>
            {selectedCityFilter || selectedNeedTypeFilter || selectedNeedSaleTypeFilter ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedCityFilter('');
                  setSelectedNeedTypeFilter('');
                  setSelectedNeedSaleTypeFilter('');
                }}
                className="px-4 py-2 rounded-xl bg-surface-container text-ink-primary text-sm font-medium hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                Xóa tất cả bộ lọc
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 shadow-sm transition-all cursor-pointer"
              >
                Đăng tin đầu tiên ngay
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredPosts.map((post) => {
              const isOwner = currentUser?.id === post.userId;
              const avatarSrc = getAvatarUrl(post.user?.avatarUrl);
              const authorName = post.user?.fullName || 'Người dùng Homers';
              const locationStr = formatLocationString(post);
              const needTypeLabel = getNeedTypeLabel(post.needType);
              const needSaleTypeLabel = getNeedSaleTypeLabel(post.needSaleType);
              const isRent = post.needSaleType === 'RENT';

              return (
                <article
                  key={post.id}
                  className="bg-surface-card rounded-2xl border border-border-subtle p-5 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:border-ink-secondary/20 hover:shadow-md transition-all duration-200"
                >
                  {/* Top: Author header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/profile/${post.userId}`}
                        className="group flex-shrink-0"
                        title={authorName}
                      >
                        {avatarSrc ? (
                          <img
                            src={avatarSrc}
                            alt={authorName}
                            className="w-11 h-11 rounded-full object-cover ring-1 ring-border-subtle group-hover:ring-primary transition-all"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm ring-1 ring-border-subtle group-hover:bg-primary group-hover:text-on-primary transition-all">
                            {authorName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </Link>

                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/profile/${post.userId}`}
                            className="font-bold text-sm sm:text-base text-ink-primary hover:underline hover:text-primary transition-colors"
                          >
                            {authorName}
                          </Link>
                          {isOwner && (
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
                              Tin của bạn
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-ink-tertiary">
                          {formatRelativeTime(post.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Owner delete button */}
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleDeletePost(post.id)}
                        disabled={deletingId === post.id}
                        title="Xóa bài đăng"
                        className="text-ink-tertiary hover:text-error p-1.5 rounded-lg hover:bg-error-container/20 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {deletingId === post.id ? 'hourglass_empty' : 'delete'}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Badges & Nhắn tin action: NeedSaleType, NeedType, Location & Contact Button */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* NeedSaleType Badge */}
                      {needSaleTypeLabel && (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${isRent
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                            : 'bg-blue-50 text-blue-700 border border-blue-200/80'
                            }`}
                        >
                          <span className="material-symbols-outlined text-[13px]">
                            {isRent ? 'key' : 'shopping_bag'}
                          </span>
                          <span>{needSaleTypeLabel}</span>
                        </span>
                      )}

                      {/* NeedType Badge */}
                      {needTypeLabel && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-ink-primary border border-border-subtle text-xs font-semibold">
                          <span className="material-symbols-outlined text-[14px] text-ink-secondary">
                            {post.needType === 'LAND'
                              ? 'landscape'
                              : post.needType === 'HOUSE'
                                ? 'home'
                                : post.needType === 'OFFICE'
                                  ? 'domain'
                                  : post.needType === 'ROOM'
                                    ? 'hotel'
                                    : 'apartment'}
                          </span>
                          <span>{needTypeLabel}</span>
                        </span>
                      )}

                      {/* Location Badge */}
                      {locationStr && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent-warm/10 text-accent-warm border border-accent-warm/25 text-xs font-semibold">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          <span>{locationStr}</span>
                        </span>
                      )}
                    </div>

                    {/* Action: Nhắn tin button on same row with badges */}
                    {!isOwner && (
                      <button
                        type="button"
                        onClick={() => handleContactAuthor(post.userId)}
                        className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary font-semibold text-xs sm:text-sm shadow-sm hover:bg-primary/90 active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer group flex-shrink-0"
                      >
                        <svg
                          className="w-3.5 h-3.5 transition-transform group-hover:scale-110"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" fill="none" />
                        </svg>
                        <span>Liên hệ</span>
                      </button>
                    )}
                  </div>

                  {/* Middle: Title & Detail */}
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-ink-primary mb-2 leading-snug">
                      {post.title}
                    </h2>
                    <p className="text-ink-secondary text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                      {post.detail}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      
          </div>
        </div>
      </main>

      {/* Modal: Đăng tin tìm kiếm */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-surface-card rounded-3xl border border-border-subtle shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">post_add</span>
                <h3 className="font-bold text-lg text-ink-primary">Đăng tin tìm kiếm</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full text-ink-secondary hover:text-ink-primary hover:bg-surface-container flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
              {formError && (
                <div className="p-3.5 rounded-xl bg-error-container/40 border border-error/20 text-error text-sm flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] flex-shrink-0 mt-0.5">error</span>
                  <span>{formError}</span>
                </div>
              )}

              {/* Title input */}
              <div>
                <label className="block text-xs font-bold text-ink-primary uppercase tracking-wider mb-1.5">
                  Tiêu đề nhu cầu <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tìm Chung cư 2PN tại Thảo Điền, TP Thủ Đức, TP Hồ Chí Minh"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  maxLength={200}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container/50 border border-border-subtle text-sm text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                />
                <p className="mt-1 text-[11px] text-ink-tertiary">
                  Nêu rõ loại hình, số phòng và mong muốn để các sale dễ nhận biết.
                </p>
              </div>

              {/* NeedSaleType (Cần thuê / Cần mua) & NeedType (Loại BĐS) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* NeedSaleType */}
                <div>
                  <label className="block text-xs font-bold text-ink-primary uppercase tracking-wider mb-1.5">
                    Hình thức nhu cầu
                  </label>
                  <select
                    value={needSaleTypeInput}
                    onChange={(e) => setNeedSaleTypeInput(e.target.value as NeedSaleType)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-surface-container/50 border border-border-subtle text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                  >
                    {NEED_SALE_TYPE_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* NeedType */}
                <div>
                  <label className="block text-xs font-bold text-ink-primary uppercase tracking-wider mb-1.5">
                    Loại bất động sản
                  </label>
                  <select
                    value={needTypeInput}
                    onChange={(e) => setNeedTypeInput(e.target.value as NeedType)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-surface-container/50 border border-border-subtle text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                  >
                    {NEED_TYPE_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location Selectors: City, District, Ward */}
              <div>
                <label className="block text-xs font-bold text-ink-primary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-accent-warm">location_on</span>
                  <span>Khu vực tìm kiếm (Tùy chọn)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* City */}
                  <div>
                    <select
                      value={selectedCityId}
                      onChange={(e) => setSelectedCityId(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-surface-container/50 border border-border-subtle text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                    >
                      <option value="">Tỉnh / TP</option>
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
                      value={selectedDistrictId}
                      onChange={(e) => setSelectedDistrictId(e.target.value)}
                      disabled={!selectedCityId || districts.length === 0}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-surface-container/50 border border-border-subtle text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium disabled:opacity-40"
                    >
                      <option value="">Quận / Huyện</option>
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
                      value={selectedWardId}
                      onChange={(e) => setSelectedWardId(e.target.value)}
                      disabled={!selectedDistrictId || wards.length === 0}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-surface-container/50 border border-border-subtle text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium disabled:opacity-40"
                    >
                      <option value="">Phường / Xã</option>
                      {wards.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="mt-1 text-[11px] text-ink-tertiary">
                  Bạn có thể chọn đủ Phường/Quận/TP, hoặc chỉ Quận/TP, hoặc chỉ Tỉnh/TP.
                </p>
              </div>

              {/* Detail textarea */}
              <div>
                <label className="block text-xs font-bold text-ink-primary uppercase tracking-wider mb-1.5">
                  Nội dung chi tiết <span className="text-error">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Mô tả cụ thể nhu cầu: khoảng ngân sách, nội thất, hướng nhà, thời gian cần chuyển vào, tiện ích cần có..."
                  value={detailInput}
                  onChange={(e) => setDetailInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container/50 border border-border-subtle text-sm text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all leading-relaxed resize-none font-medium"
                />
                <p className="mt-1 text-[11px] text-ink-tertiary">
                  Các thông tin cụ thể giúp bạn nhận được các lời mời bất động sản sát với nhu cầu nhất.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-surface-container/60 border border-border-subtle flex items-start gap-2 text-xs text-ink-secondary">
                <span className="material-symbols-outlined text-[18px] text-accent-warm flex-shrink-0 mt-0.5">info</span>
                <span>
                  Tin đăng sẽ hiển thị trên diễn đàn công khai. Bất kỳ chuyên viên sale hoặc chủ nhà nào có bất động sản phù hợp đều có thể nhấn <strong>Liên hệ</strong> trực tiếp với bạn.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-border-subtle mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-border-subtle text-ink-secondary font-medium text-sm hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-sm shadow-sm hover:opacity-90 active:scale-98 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting && (
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  )}
                  <span>{isSubmitting ? 'Đang đăng...' : 'Đăng tin ngay'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
