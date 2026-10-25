'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';

export interface NotificationItem {
  id: string;
  userId: string;
  type:
    | 'CONTRACT_INVITATION'
    | 'LISTING_INTEREST'
    | 'LISTING_APPROVED'
    | 'LISTING_REJECTED';
  title: string;
  content: string;
  data?: {
    contractId?: string;
    invitationId?: string;
    contractName?: string;
    landlordName?: string;
    landlordPhone?: string;
    invitationStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    listingId?: string;
    listingTitle?: string;
    listingImage?: string | null;
    interestedUserId?: string;
    interestedUserName?: string;
    interestedUserAvatar?: string | null;
    interestedUserPhone?: string;
  };
  isRead: boolean;
  createdAt: string;
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationRead?: () => void;
}

type FilterType = 'ALL' | 'CONTRACT' | 'INTEREST' | 'UNREAD';

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  onNotificationRead,
}) => {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<Record<string, 'APPROVED' | 'REJECTED'>>({});
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const getAvatarUrl = (url?: string | null) => {
    if (!url) return undefined;
    return url.startsWith('http') ? url : `${apiUrl}${url}`;
  };

  const getListingImageUrl = (url?: string | null) => {
    if (!url) return undefined;
    return url.startsWith('http') ? url : `${apiUrl}${url}`;
  };

  const handleOpenListing = (listingId?: string) => {
    onClose();
    if (listingId) {
      router.push(`/listings/${listingId}`);
    } else {
      router.push('/my-listings');
    }
  };

  const handleDeleteNotification = async (notifId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const res = await fetch(`${apiUrl}/notifications/${notifId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      fetchNotifications();
    }
  };

  const handleOpenContractChat = (contractId?: string) => {
    onClose();
    if (contractId) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('haven:open-chat', { detail: { contractId } })
        );
      }
      router.push(`/messages?contractId=${contractId}`);
    } else {
      router.push('/messages');
    }
  };

  const handleOpenDirectChat = (userId: string) => {
    onClose();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('haven:open-chat', { detail: { userId } })
      );
    }
    router.push(`/messages?userId=${userId}`);
  };

  const handleOpenUserProfile = (userId: string) => {
    onClose();
    router.push(`/profile/${userId}`);
  };

  const fetchNotifications = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewNotification = (newNotif: any) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === newNotif.id)) return prev;
        return [newNotif, ...prev];
      });
      setUnreadCount((prev) => prev + 1);
    };

    const handleUnreadCount = (data: { unreadCount: number }) => {
      if (typeof data?.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      }
    };

    socket.on('notification:new', handleNewNotification);
    socket.on('notification:unread_count', handleUnreadCount);

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:unread_count', handleUnreadCount);
    };
  }, []);

  const handleMarkAsRead = async (id: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${apiUrl}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (onNotificationRead) onNotificationRead();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${apiUrl}/notifications/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      if (onNotificationRead) onNotificationRead();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleApproveInvitation = async (invitationId: string, notifId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      setProcessingId(notifId);
      const res = await fetch(`${apiUrl}/contracts/invitations/${invitationId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setActionStatus((prev) => ({ ...prev, [notifId]: 'APPROVED' }));
        await handleMarkAsRead(notifId);
      } else {
        const errData = await res.json().catch(() => null);
        alert(errData?.message || 'Không thể chấp nhận lời mời');
      }
    } catch (err) {
      console.error('Error approving invitation:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectInvitation = async (invitationId: string, notifId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      setProcessingId(notifId);
      const res = await fetch(`${apiUrl}/contracts/invitations/${invitationId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setActionStatus((prev) => ({ ...prev, [notifId]: 'REJECTED' }));
        await handleMarkAsRead(notifId);
      } else {
        const errData = await res.json().catch(() => null);
        alert(errData?.message || 'Không thể từ chối lời mời');
      }
    } catch (err) {
      console.error('Error rejecting invitation:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins}p`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
    return `${date.getDate()} Th${date.getMonth() + 1}`;
  };

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeFilter === 'CONTRACT') return n.type === 'CONTRACT_INVITATION';
      if (activeFilter === 'INTEREST') return n.type === 'LISTING_INTEREST';
      if (activeFilter === 'UNREAD') return !n.isRead;
      return true;
    });
  }, [notifications, activeFilter]);

  // Grouped into "Tháng này" and "Trước đó" (Instagram style)
  const groupedNotifications = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonth: NotificationItem[] = [];
    const earlier: NotificationItem[] = [];

    filteredNotifications.forEach((n) => {
      const d = new Date(n.createdAt);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        thisMonth.push(n);
      } else {
        earlier.push(n);
      }
    });

    return { thisMonth, earlier };
  }, [filteredNotifications]);

  if (!isOpen) return null;

  const renderNotificationCard = (notif: NotificationItem) => {
    const isContract = notif.type === 'CONTRACT_INVITATION';
    const isListingApproved = notif.type === 'LISTING_APPROVED';
    const isListingRejected = notif.type === 'LISTING_REJECTED';
    const isModeration = isListingApproved || isListingRejected;

    const invitationId = notif.data?.invitationId;
    const backendStatus = notif.data?.invitationStatus;
    const status =
      actionStatus[notif.id] ||
      (backendStatus === 'ACCEPTED'
        ? 'APPROVED'
        : backendStatus === 'REJECTED'
          ? 'REJECTED'
          : null);

    const interestedUserId = notif.data?.interestedUserId;
    const interestedUserName = notif.data?.interestedUserName || 'Người dùng Homers';
    const interestedUserAvatar = getAvatarUrl(notif.data?.interestedUserAvatar);
    const listingId = notif.data?.listingId;
    const listingTitle = notif.data?.listingTitle;
    const listingImage = getListingImageUrl(notif.data?.listingImage);
    const timeFormatted = formatRelativeTime(notif.createdAt);

    return (
      <div
        key={notif.id}
        onClick={() => {
          if (!notif.isRead) handleMarkAsRead(notif.id);
          if (isListingRejected) {
            router.push('/my-listings');
            onClose();
          } else if (listingId) {
            handleOpenListing(listingId);
          }
        }}
        className={`px-4 py-3.5 hover:bg-surface-container/40 transition-colors flex flex-col gap-2 group cursor-pointer border-b border-border-subtle/50 ${!notif.isRead ? 'bg-primary/[0.03]' : ''
          }`}
      >
        <div className="flex items-start justify-between gap-3 w-full">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {/* Avatar on Left */}
            {isContract ? (
              <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 border border-primary/20">
                <span className="material-symbols-outlined text-[20px]">handshake</span>
              </div>
            ) : isListingApproved ? (
              <div className="w-11 h-11 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                <span className="material-symbols-outlined text-[22px]">verified</span>
              </div>
            ) : isListingRejected ? (
              <div className="w-11 h-11 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 border border-rose-500/30">
                <span className="material-symbols-outlined text-[22px]">gpp_bad</span>
              </div>
            ) : (
              <div
                onClick={(e) => {
                  if (interestedUserId) {
                    e.stopPropagation();
                    handleOpenUserProfile(interestedUserId);
                  }
                }}
                className="relative flex-shrink-0 cursor-pointer"
                title={`Xem trang cá nhân của ${interestedUserName}`}
              >
                {interestedUserAvatar ? (
                  <img
                    src={interestedUserAvatar}
                    alt={interestedUserName}
                    className="w-11 h-11 rounded-full object-cover border border-border-subtle group-hover:ring-2 group-hover:ring-primary transition-all"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-accent-warm/15 text-accent-warm flex items-center justify-center font-bold text-sm border border-accent-warm/20 group-hover:ring-2 group-hover:ring-primary transition-all">
                    {interestedUserName
                      ? interestedUserName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()
                      : 'U'}
                  </div>
                )}
              </div>
            )}

            {/* Text Description */}
            <div className="flex flex-col text-sm leading-snug min-w-0 flex-1 pt-0.5">
              <p className="text-ink-primary font-normal text-[13px] leading-relaxed">
                {isContract ? (
                  <>
                    <span className="font-semibold text-ink-primary mr-1">
                      {notif.data?.landlordName || 'Chủ trọ'}
                    </span>
                    đã mời bạn tham gia hợp đồng{' '}
                    <span className="font-medium text-ink-primary">
                      "{notif.data?.contractName || 'Hợp đồng'}"
                    </span>
                  </>
                ) : isListingApproved ? (
                  <>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 mr-1">
                      {notif.title}
                    </span>
                    <span className="text-ink-secondary">{notif.content}</span>
                  </>
                ) : isListingRejected ? (
                  <>
                    <span className="font-semibold text-rose-600 dark:text-rose-400 mr-1">
                      {notif.title}
                    </span>
                    <span className="text-ink-secondary">{notif.content}</span>
                  </>
                ) : (
                  <>
                    <span
                      onClick={(e) => {
                        if (interestedUserId) {
                          e.stopPropagation();
                          handleOpenUserProfile(interestedUserId);
                        }
                      }}
                      className="font-semibold text-ink-primary hover:underline cursor-pointer mr-1"
                    >
                      {interestedUserName}
                    </span>
                    quan tâm đến tin đăng của bạn
                  </>
                )}
                <span className="text-ink-tertiary ml-1.5 text-xs font-normal">
                  {timeFormatted}
                </span>
              </p>

              {/* Unread indicator dot */}
              {!notif.isRead && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-warm mt-1"></span>
              )}
            </div>
          </div>

          {/* Action Buttons on Right (Icons only to save space) */}
          <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
            {isContract ? (
              status === 'APPROVED' ? (
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-semibold text-emerald-600 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30">
                    Đã chấp nhận
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenContractChat(notif.data?.contractId);
                    }}
                    className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center hover:opacity-90 transition-opacity shadow-xs"
                    title="Vào chat hợp đồng"
                  >
                    <span className="material-symbols-outlined text-[17px]">chat</span>
                  </button>
                </div>
              ) : status === 'REJECTED' ? (
                <span className="text-[11px] font-medium text-ink-tertiary px-2 py-0.5 rounded-md bg-surface-container">
                  Đã từ chối
                </span>
              ) : invitationId ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={processingId === notif.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRejectInvitation(invitationId, notif.id);
                    }}
                    className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-variant text-ink-primary flex items-center justify-center transition-colors disabled:opacity-50 shadow-xs"
                    title="Từ chối lời mời"
                  >
                    <span className="material-symbols-outlined text-[17px]">close</span>
                  </button>
                  <button
                    type="button"
                    disabled={processingId === notif.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApproveInvitation(invitationId, notif.id);
                    }}
                    className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 shadow-xs"
                    title="Chấp nhận lời mời"
                  >
                    {processingId === notif.id ? (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-on-primary border-t-transparent animate-spin"></div>
                    ) : (
                      <span className="material-symbols-outlined text-[17px]">check</span>
                    )}
                  </button>
                </div>
              ) : null
            ) : isListingApproved ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenListing(listingId);
                }}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-variant text-ink-primary flex items-center justify-center transition-colors shadow-xs"
                title="Xem tin đăng"
              >
                <span className="material-symbols-outlined text-[18px]">visibility</span>
              </button>
            ) : isListingRejected ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/my-listings');
                  onClose();
                }}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-variant text-ink-primary flex items-center justify-center transition-colors shadow-xs"
                title="Chi tiết bài đăng"
              >
                <span className="material-symbols-outlined text-[18px]">visibility</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (interestedUserId) handleOpenDirectChat(interestedUserId);
                }}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-variant text-ink-primary flex items-center justify-center transition-colors shadow-xs"
                title="Nhắn tin với người quan tâm"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
              </button>
            )}

            {/* Nút Xóa thông báo (Biểu tượng dấu X) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteNotification(notif.id);
              }}
              className="w-8 h-8 rounded-full bg-surface-container hover:bg-rose-500/10 text-ink-tertiary hover:text-rose-600 flex items-center justify-center transition-colors shadow-xs"
              title="Xóa thông báo này"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Listing preview: Hiển thị hình ảnh chính và 1 phần title của tin đó */}
        {!isContract && (listingTitle || listingImage) && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (!notif.isRead) handleMarkAsRead(notif.id);
              if (listingId) handleOpenListing(listingId);
            }}
            className="ml-14 flex items-center gap-2.5 p-2 rounded-xl bg-surface-container/60 hover:bg-surface-container border border-border-subtle hover:border-accent-warm/40 transition-all cursor-pointer group/listing shadow-xs"
            title="Nhấn để xem tin đăng này"
          >
            {listingImage ? (
              <img
                src={listingImage}
                alt={listingTitle || 'Tin đăng'}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-border-subtle group-hover/listing:scale-105 transition-transform"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-ink-tertiary flex-shrink-0">
                <span className="material-symbols-outlined text-[20px]">apartment</span>
              </div>
            )}
            <div className="flex flex-col min-w-0 flex-1">
              <p className="text-[12.5px] font-medium text-ink-primary truncate group-hover/listing:text-accent-warm transition-colors">
                {listingTitle || 'Xem chi tiết tin đăng'}
              </p>
            </div>
            <span className="material-symbols-outlined text-[18px] text-ink-tertiary group-hover/listing:text-accent-warm group-hover/listing:translate-x-0.5 transition-all mr-1">
              chevron_right
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Backdrop: click outside to dismiss drawer */}
      <div
        className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px] animate-fade-in transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel (Overlays navigation bar like Instagram) */}
      <aside
        className="fixed top-0 bottom-0 left-0 z-50 w-full sm:w-[397px] lg:w-[410px] h-screen bg-surface-card border-r border-border-subtle shadow-[8px_0_30px_rgba(0,0,0,0.15)] flex flex-col animate-in slide-in-from-left duration-200 select-none overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header matching Instagram screenshot */}
        <div className="px-5 pt-6 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h1 className="font-bold text-2xl tracking-tight text-ink-primary">
              Thông báo
            </h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-accent-warm text-white text-xs font-bold shadow-xs">
                {unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-xs text-ink-secondary hover:text-ink-primary font-medium px-2 py-1 rounded-lg hover:bg-surface-container transition-colors"
              >
                Đọc tất cả
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-ink-secondary hover:text-ink-primary hover:bg-surface-container transition-colors"
              title="Đóng"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Filter Pills matching Instagram screenshot */}
        <div className="flex items-center gap-2 px-5 py-3 overflow-x-auto no-scrollbar border-b border-border-subtle/50">
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${activeFilter === 'ALL'
                ? 'bg-ink-primary text-surface shadow-xs'
                : 'bg-surface-container/70 text-ink-secondary hover:bg-surface-container hover:text-ink-primary'
              }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('CONTRACT')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${activeFilter === 'CONTRACT'
                ? 'bg-ink-primary text-surface shadow-xs'
                : 'bg-surface-container/70 text-ink-secondary hover:bg-surface-container hover:text-ink-primary'
              }`}
          >
            Hợp đồng
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('INTEREST')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${activeFilter === 'INTEREST'
                ? 'bg-ink-primary text-surface shadow-xs'
                : 'bg-surface-container/70 text-ink-secondary hover:bg-surface-container hover:text-ink-primary'
              }`}
          >
            Quan tâm
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('UNREAD')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${activeFilter === 'UNREAD'
                ? 'bg-ink-primary text-surface shadow-xs'
                : 'bg-surface-container/70 text-ink-secondary hover:bg-surface-container hover:text-ink-primary'
              }`}
          >
            Chưa đọc
          </button>
        </div>

        {/* Notifications List matching Instagram screenshot */}
        <div className="flex-1 overflow-y-auto divide-y divide-border-subtle/30 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-16 text-ink-tertiary flex flex-col items-center gap-2 px-6">
              <span className="material-symbols-outlined text-[44px] text-ink-tertiary/60">notifications_off</span>
              <p className="text-sm font-medium">Không có thông báo nào</p>
            </div>
          ) : (
            <>
              {/* This Month Section */}
              {groupedNotifications.thisMonth.length > 0 && (
                <div>
                  <div className="px-5 py-2.5 text-sm font-bold text-ink-primary">
                    Tháng này
                  </div>
                  <div className="flex flex-col">
                    {groupedNotifications.thisMonth.map(renderNotificationCard)}
                  </div>
                </div>
              )}

              {/* Earlier Section */}
              {groupedNotifications.earlier.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border-subtle/40">
                  <div className="px-5 py-2.5 text-sm font-bold text-ink-primary">
                    Trước đó
                  </div>
                  <div className="flex flex-col">
                    {groupedNotifications.earlier.map(renderNotificationCard)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
};
