'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatRelativeTime } from './ListingCard';
import { getSocket } from '@/lib/socket';

export interface InterestedUser {
  id: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
}

interface ListingInterestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string | null;
  listingTitle: string | null;
}

export const ListingInterestsModal: React.FC<ListingInterestsModalProps> = ({
  isOpen,
  onClose,
  listingId,
  listingTitle,
}) => {
  const router = useRouter();
  const [users, setUsers] = useState<InterestedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    if (!isOpen || !listingId) return;

    let isMounted = true;

    async function fetchInterests() {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Vui lòng đăng nhập để xem thông tin.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/listings/${listingId}/interests`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.message || 'Không thể tải danh sách người quan tâm');
        }

        const data = await res.json();
        if (isMounted) {
          setUsers(Array.isArray(data) ? data : []);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Đã có lỗi xảy ra');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchInterests();

    return () => {
      isMounted = false;
    };
  }, [isOpen, listingId, apiUrl]);

  // Realtime updates for interested users list
  useEffect(() => {
    if (!isOpen || !listingId) return;

    const socket = getSocket();
    if (!socket) return;

    socket.emit('join:listing', { listingId });

    const handleInterestUpdated = (data: {
      listingId: string;
      action: 'ADD' | 'REMOVE';
      user?: InterestedUser;
    }) => {
      if (data?.listingId !== listingId) return;

      if (data.action === 'ADD' && data.user) {
        setUsers((prev) => {
          if (prev.some((u) => u.id === data.user!.id)) return prev;
          return [data.user!, ...prev];
        });
      } else if (data.action === 'REMOVE' && data.user) {
        setUsers((prev) => prev.filter((u) => u.id !== data.user!.id));
      }
    };

    socket.on('listing:interest_updated', handleInterestUpdated);

    return () => {
      socket.emit('leave:listing', { listingId });
      socket.off('listing:interest_updated', handleInterestUpdated);
    };
  }, [isOpen, listingId]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getAvatarUrl = (url?: string | null) => {
    if (!url) return undefined;
    return url.startsWith('http') ? url : `${apiUrl}${url}`;
  };

  const handleOpenUserProfile = (userId: string) => {
    onClose();
    router.push(`/profile/${userId}`);
  };

  const handleOpenDirectChat = (userId: string) => {
    onClose();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('haven:open-chat', { detail: { userId } }));
    }
    router.push(`/messages?userId=${userId}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-surface-card rounded-2xl shadow-2xl border border-border-subtle flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between bg-surface-card sticky top-0 z-10">
          <div className="flex flex-col min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <h2 className="font-headline-sm text-headline-sm text-ink-primary font-bold">
                Người quan tâm
              </h2>
              {!loading && (
                <span className="px-2 py-0.5 rounded-full bg-accent-warm/15 text-accent-warm text-xs font-bold">
                  {users.length}
                </span>
              )}
            </div>
            {listingTitle && (
              <p className="text-xs text-ink-secondary truncate mt-0.5" title={listingTitle}>
                {listingTitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-ink-secondary hover:text-ink-primary hover:bg-surface-container transition-colors flex-shrink-0"
            title="Đóng"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto divide-y divide-border-subtle/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              <span className="text-xs text-ink-tertiary">Đang tải danh sách...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-error text-[36px]">error</span>
              <p className="text-sm text-error font-medium">{error}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center gap-3 text-ink-tertiary">
              <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-ink-tertiary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-ink-primary text-sm">
                  Chưa có người dùng nào bấm quan tâm
                </p>
                <p className="text-xs text-ink-secondary max-w-xs">
                  Khi có người dùng lưu tin hoặc bày tỏ quan tâm đến tin này, danh sách sẽ hiển thị tại đây.
                </p>
              </div>
            </div>
          ) : (
            users.map((item) => {
              const avatar = getAvatarUrl(item.avatarUrl);
              const timeRaw = item.createdAt ? formatRelativeTime(item.createdAt) : '';
              const timeDisplay = timeRaw
                ? (timeRaw === 'Vừa xong' ? 'Vừa xong' : `${timeRaw} trước`)
                : 'Đã quan tâm';

              return (
                <div
                  key={item.id}
                  className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-surface-container/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* User Avatar */}
                    <div
                      onClick={() => handleOpenUserProfile(item.id)}
                      className="cursor-pointer flex-shrink-0"
                      title="Xem trang cá nhân"
                    >
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={item.fullName}
                          className="w-11 h-11 rounded-full object-cover border border-border-subtle hover:ring-2 hover:ring-primary transition-all"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-accent-warm/15 text-accent-warm flex items-center justify-center font-bold text-sm border border-accent-warm/20 hover:ring-2 hover:ring-primary transition-all">
                          {item.fullName
                            ? item.fullName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .substring(0, 2)
                                .toUpperCase()
                            : 'U'}
                        </div>
                      )}
                    </div>

                    {/* User Details */}
                    <div className="flex flex-col min-w-0">
                      <span
                        onClick={() => handleOpenUserProfile(item.id)}
                        className="font-semibold text-[13.5px] text-ink-primary hover:underline cursor-pointer truncate"
                      >
                        {item.fullName || 'Người dùng Homers'}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-ink-secondary">
                        <span className="flex items-center gap-1 text-ink-tertiary">
                          <span className="material-symbols-outlined text-[13px]">schedule</span>
                          {timeDisplay}
                        </span>
                        {item.phone && (
                          <>
                            <span className="text-ink-quaternary">•</span>
                            <span className="text-ink-tertiary">{item.phone}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenDirectChat(item.id)}
                      className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-variant text-ink-primary text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs active:scale-95"
                      title="Nhắn tin với người này"
                    >
                      <span className="material-symbols-outlined text-[15px]">chat</span>
                      Nhắn tin
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
