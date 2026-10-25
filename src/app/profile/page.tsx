'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProfileSkeleton } from '@/components/ui/Skeleton';

interface UserProfile {
  id?: string;
  fullName?: string;
  phone?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  cityId?: string | null;
  role?: string;
}

interface City {
  id: string;
  name: string;
  code?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  // Inline edit state for Personal Info
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [cityInputId, setCityInputId] = useState('');
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Phone modal state
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isSubmittingPhone, setIsSubmittingPhone] = useState(false);

  // Avatar upload state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    async function fetchData() {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        router.push('/login');
        return;
      }

      try {
        // 1. Fetch User Profile (auth/me)
        const userRes = await fetch(`${apiUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!userRes.ok) {
          localStorage.removeItem('accessToken');
          router.push('/login');
          return;
        }

        const userData: UserProfile = await userRes.json();
        setUser(userData);
        setBioInput(userData.bio || '');
        setCityInputId(userData.cityId || '');

        // 2. Fetch Cities (/locations/cities)
        const citiesRes = await fetch(`${apiUrl}/locations/cities`);
        if (citiesRes.ok) {
          const citiesData = await citiesRes.json();
          if (Array.isArray(citiesData)) {
            setCities(citiesData);
          } else if (citiesData.data && Array.isArray(citiesData.data)) {
            setCities(citiesData.data);
          }
        }
      } catch (err) {
        // Fallback
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router, apiUrl]);

  const handleStartEditInfo = () => {
    setBioInput(user?.bio || '');
    setCityInputId(user?.cityId || (cities[0]?.id ?? ''));
    setIsEditingInfo(true);
  };

  const handleCancelEditInfo = () => {
    setBioInput(user?.bio || '');
    setCityInputId(user?.cityId || '');
    setIsEditingInfo(false);
  };

  const handleSaveInfo = async () => {
    setUpdateMessage(null);
    setIsSavingInfo(true);

    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`${apiUrl}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bio: bioInput,
          cityId: cityInputId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMessage = Array.isArray(data.message)
          ? data.message.join(', ')
          : (data.message || 'Cập nhật thông tin thất bại');
        throw new Error(errorMessage);
      }

      setUser((prev) => (prev ? { ...prev, bio: data.bio, cityId: data.cityId } : null));
      setIsEditingInfo(false);
      setUpdateMessage({ type: 'success', text: 'Cập nhật thông tin cá nhân thành công.' });
      setTimeout(() => setUpdateMessage(null), 3000);
    } catch (err: any) {
      const errorText = err.message || 'Không thể lưu thông tin.';
      setUpdateMessage({ type: 'error', text: errorText });
    } finally {
      setIsSavingInfo(false);
    }
  };

  // Avatar Click -> File Picker -> Upload (POST /users/avatar)
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setUpdateMessage(null);

    const token = localStorage.getItem('accessToken');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${apiUrl}/users/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Tải ảnh đại diện thất bại');
      }

      const newAvatarUrl = data.imageUrl || data.avatarUrl;
      setUser((prev) => (prev ? { ...prev, avatarUrl: newAvatarUrl } : null));
    } catch (err: any) {
      setUpdateMessage({ type: 'error', text: err.message || 'Không thể tải ảnh đại diện lên.' });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Add Phone Number (POST /users/me/phone)
  const handleAddPhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');
    setIsSubmittingPhone(true);

    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`${apiUrl}/users/me/phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone: newPhone }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Cập nhật số điện thoại thất bại');
      }

      setUser((prev) => (prev ? { ...prev, phone: data.phone || newPhone } : null));
      setShowPhoneModal(false);
      setNewPhone('');
    } catch (err: any) {
      setPhoneError(err.message || 'Số điện thoại không hợp lệ');
    } finally {
      setIsSubmittingPhone(false);
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        await fetch(`${apiUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (e) {
        // Continue cleanup regardless
      }
    }
    localStorage.removeItem('accessToken');
    router.push('/login');
  };

  if (loading) {
    return <ProfileSkeleton isOwn={true} />;
  }

  const initialLetters = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'US';

  const userCityName = cities.find((c) => c.id === user?.cityId)?.name || 'Chưa cập nhật khu vực';

  const displayAvatar = user?.avatarUrl
    ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `${apiUrl}${user.avatarUrl}`)
    : undefined;

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <main className="flex-1 max-w-6xl 2xl:max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 flex flex-col gap-6">
        {/* Hidden File Input for Avatar */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleAvatarFileChange}
          accept="image/*"
          className="hidden"
        />

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

          {/* Unified Profile Card (Expanded & Balanced matching Profile/[id]) */}
          <div className="w-full bg-surface-card rounded-2xl p-6 sm:p-7 border border-border-subtle shadow-sm flex flex-col gap-6">
          {/* User Header: Avatar, Name, Email, Phone, Edit Action Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4 sm:gap-5 flex-1 min-w-0">
              {/* Avatar with click to upload */}
              <div className="relative flex-shrink-0">
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                  className="relative group block rounded-full focus:outline-none cursor-pointer"
                  title="Bấm để đổi ảnh đại diện"
                >
                  {displayAvatar ? (
                    <img
                      src={displayAvatar}
                      alt={user?.fullName || 'User Avatar'}
                      className="w-18 h-18 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-border-strong shadow-sm group-hover:opacity-85 transition-opacity"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-primary text-on-primary flex items-center justify-center font-headline-md text-2xl font-semibold shadow-md group-hover:opacity-85 transition-opacity">
                      {initialLetters}
                    </div>
                  )}

                  {/* Camera overlay icon */}
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-white text-[22px]">
                      {isUploadingAvatar ? 'sync' : 'photo_camera'}
                    </span>
                  </div>
                </button>
              </div>

              {/* User details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="font-headline-sm text-headline-sm text-ink-primary font-bold text-xl sm:text-2xl truncate">
                    {user?.fullName || 'Người dùng Homers'}
                  </h2>
                </div>

                <div className="flex items-center gap-4 sm:gap-6 flex-wrap mt-2 text-ink-secondary text-sm">
                  {user?.email && (
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-ink-tertiary">mail</span>
                      {user.email}
                    </span>
                  )}
                  {user?.phone ? (
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-ink-tertiary">call</span>
                      {user.phone}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowPhoneModal(true)}
                      className="inline-flex items-center gap-1 text-accent-warm hover:underline font-medium cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">add_call</span>
                      + Thêm số điện thoại
                    </button>
                  )}
                  {userCityName && (
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-ink-tertiary">location_on</span>
                      {userCityName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick action: Chỉnh sửa thông tin */}
            <div className="flex items-center gap-3 shrink-0">
              {!isEditingInfo ? (
                <button
                  type="button"
                  onClick={handleStartEditInfo}
                  className="px-5 py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md shadow-sm hover:opacity-90 flex items-center gap-2 transition-all cursor-pointer hover:shadow-md active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  <span>Chỉnh sửa thông tin</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelEditInfo}
                    className="px-4 py-2 rounded-full font-label-md text-label-md text-ink-secondary hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <Button
                    type="button"
                    variant="primary"
                    disabled={isSavingInfo}
                    onClick={handleSaveInfo}
                    className="h-10 px-5 rounded-full"
                  >
                    {isSavingInfo ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Status Message if any */}
          {updateMessage && (
            <div
              className={`p-3.5 rounded-xl text-sm ${
                updateMessage.type === 'success'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-error-container text-on-error-container'
              }`}
            >
              {updateMessage.text}
            </div>
          )}

          {/* Lower Grid: Bio & Info Stats Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Bio */}
            <div className="lg:col-span-8 flex flex-col justify-start">
              {isEditingInfo ? (
                <div className="flex flex-col gap-1.5">
                  <textarea
                    rows={3}
                    maxLength={70}
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    placeholder="Chia sẻ đôi nét về bản thân (Tối đa 70 ký tự)..."
                    className="w-full bg-surface-card rounded-xl p-3.5 font-body-md text-body-md text-ink-primary border border-border-strong focus:border-ink-primary outline-none transition-all resize-none min-h-[88px]"
                  />
                  <div className="flex justify-end">
                    <span className="text-[11px] text-ink-tertiary">
                      {bioInput.length}/70 ký tự
                    </span>
                  </div>
                </div>
              ) : (
                <p className="font-body-md text-body-md text-ink-primary leading-relaxed break-words whitespace-pre-wrap py-1">
                  {user?.bio || <span className="italic text-ink-tertiary">Chưa có thông tin giới thiệu.</span>}
                </p>
              )}
            </div>

            {/* Stats / Info Summary */}
            <div className="lg:col-span-4 flex flex-col justify-between gap-3">
              {/* Khu vực sinh sống */}
              <div className="bg-surface-container/40 p-3.5 sm:p-4 rounded-xl border border-border-subtle/60 flex items-center justify-between">
                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">location_city</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-ink-tertiary font-medium">Khu vực sinh sống</div>
                    {isEditingInfo ? (
                      <select
                        value={cityInputId}
                        onChange={(e) => setCityInputId(e.target.value)}
                        className="w-full mt-1 bg-surface-card rounded-lg px-2.5 py-1.5 text-sm text-ink-primary border border-border-subtle focus:border-ink-primary outline-none transition-all"
                      >
                        <option value="">Chọn Tỉnh / Thành phố</option>
                        {cities.map((city) => (
                          <option key={city.id} value={city.id}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="font-bold text-base text-ink-primary truncate">{userCityName}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tin đăng của tôi Link */}
              <Link
                href="/my-listings"
                className="bg-surface-container/40 p-3.5 sm:p-4 rounded-xl border border-border-subtle/60 flex items-center justify-between hover:bg-surface-container transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent-warm/10 text-accent-warm flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">real_estate_agent</span>
                  </div>
                  <div>
                    <div className="text-[11px] text-ink-tertiary font-medium">Quản lý bài đăng</div>
                    <div className="font-bold text-base text-ink-primary group-hover:text-primary transition-colors">
                      Tin đăng của tôi
                    </div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-ink-tertiary group-hover:translate-x-1 group-hover:text-primary transition-all">
                  chevron_right
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

        {/* Profile Settings & Utilities Menu */}
        <div className="flex flex-col gap-3 mt-2">
          <h2 className="font-headline-sm text-headline-sm text-ink-primary font-semibold text-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">widgets</span>
            Tiện ích & Cài đặt
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {[
              { label: 'Tin đăng của tôi', icon: 'real_estate_agent', desc: 'Quản lý căn hộ đang cho thuê', href: '/my-listings' },
              { label: 'Căn hộ đã lưu', icon: 'favorite', desc: 'Xem danh sách tin yêu thích', href: '/favorites' },
              { label: 'Hợp đồng thuê của tôi', icon: 'description', desc: 'Quản lý hợp đồng & lời mời', href: '#' },
              { label: 'Yêu cầu thuê đã gửi', icon: 'send', desc: 'Lịch sử quan tâm căn hộ', href: '#' },
              { label: 'Cài đặt tài khoản', icon: 'settings', desc: 'Bảo mật & thông báo', href: '#' },
              { label: 'Trợ giúp & Liên hệ', icon: 'help_outline', desc: 'Hỗ trợ 24/7 từ Homers', href: '#' },
            ].map((item) => (
              item.href && item.href !== '#' ? (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3.5 p-4 bg-surface-card rounded-xl border border-border-subtle hover:bg-surface-container hover:border-border-strong transition-all text-left shadow-sm group"
                >
                  <div className="w-10 h-10 rounded-full bg-surface-container group-hover:bg-primary/10 group-hover:text-primary transition-colors flex items-center justify-center text-ink-primary shrink-0">
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-label-md text-label-md text-ink-primary font-semibold group-hover:text-primary transition-colors truncate">
                      {item.label}
                    </p>
                    <p className="text-[12px] text-ink-secondary truncate">{item.desc}</p>
                  </div>
                  <span className="material-symbols-outlined text-[20px] text-ink-tertiary group-hover:translate-x-0.5 group-hover:text-primary transition-all">
                    chevron_right
                  </span>
                </Link>
              ) : (
                <button
                  key={item.label}
                  type="button"
                  className="flex items-center gap-3.5 p-4 bg-surface-card rounded-xl border border-border-subtle hover:bg-surface-container hover:border-border-strong transition-all text-left shadow-sm group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-surface-container group-hover:bg-primary/10 group-hover:text-primary transition-colors flex items-center justify-center text-ink-primary shrink-0">
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-label-md text-label-md text-ink-primary font-semibold group-hover:text-primary transition-colors truncate">
                      {item.label}
                    </p>
                    <p className="text-[12px] text-ink-secondary truncate">{item.desc}</p>
                  </div>
                  <span className="material-symbols-outlined text-[20px] text-ink-tertiary group-hover:translate-x-0.5 group-hover:text-primary transition-all">
                    chevron_right
                  </span>
                </button>
              )
            ))}
          </div>
        </div>

        {/* Logout Action */}
        <div className="pt-2 flex justify-start">
          <Button
            variant="outline"
            icon="logout"
            iconPosition="left"
            onClick={handleLogout}
            className="border-border-strong text-ink-primary hover:bg-surface-container px-6"
          >
            Đăng xuất tài khoản
          </Button>
        </div>
      </main>

      {/* Modal Add Phone Number */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface-card rounded-2xl p-5 w-full max-w-sm border border-border-subtle shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-headline-sm text-ink-primary font-semibold text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-accent-warm">add_call</span>
                Thêm số điện thoại
              </h3>
              <button
                type="button"
                onClick={() => setShowPhoneModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink-secondary hover:text-ink-primary hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAddPhoneSubmit} className="flex flex-col gap-3">
              {phoneError && (
                <div className="p-2.5 rounded-lg bg-error-container text-on-error-container text-xs">
                  {phoneError}
                </div>
              )}

              <Input
                label="Số điện thoại"
                icon="call"
                placeholder="0901234567"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                required
                type="tel"
              />

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={() => setShowPhoneModal(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={isSubmittingPhone}
                >
                  {isSubmittingPhone ? 'Đang lưu...' : 'Xác nhận'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
