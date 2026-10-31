'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { NotificationModal } from './NotificationModal';
import { getSavedFeedUrl } from '@/lib/filter-url';

import { getSocket } from '@/lib/socket';

interface UserInfo {
  id?: string;
  fullName?: string;
  avatarUrl?: string;
}

export const SidebarNavigation: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<UserInfo | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [isMoreOpen, setIsMoreOpen] = useState<boolean>(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  // Fetch current user details
  const fetchCurrentUser = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch {
      // Backend unavailable or network error
    }
  };

  // Fetch unread notifications count
  const checkUnreadNotifications = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      setUnreadCount(0);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // ignore
    }
  };

  // Fetch unread conversations count (number of chats that have new messages)
  const checkUnreadMessages = async () => {
    if (pathname?.startsWith('/messages')) {
      setUnreadMessagesCount(0);
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      setUnreadMessagesCount(0);
      return;
    }

    try {
      const lastVisited = typeof window !== 'undefined' ? localStorage.getItem('haven:lastVisitedMessagesAt') : null;
      const url = lastVisited
        ? `${apiUrl}/conversations/unread-count?since=${encodeURIComponent(lastVisited)}`
        : `${apiUrl}/conversations/unread-count`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadMessagesCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    checkUnreadNotifications();
    checkUnreadMessages();

    // Socket.IO realtime event listeners
    const socket = getSocket();
    const onNotifNew = () => {
      setUnreadCount((prev) => prev + 1);
    };
    const onNotifCount = (data: { unreadCount: number }) => {
      if (typeof data?.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      }
    };
    const onMsgCount = (data: { unreadCount: number }) => {
      if (!pathname?.startsWith('/messages') && typeof data?.unreadCount === 'number') {
        setUnreadMessagesCount(data.unreadCount);
      }
    };
    const onMsgNew = () => {
      if (!pathname?.startsWith('/messages')) {
        checkUnreadMessages();
      }
    };

    if (socket) {
      socket.on('notification:new', onNotifNew);
      socket.on('notification:unread_count', onNotifCount);
      socket.on('messages:unread_count', onMsgCount);
      socket.on('message:new', onMsgNew);
      socket.on('conversation:updated', onMsgNew);
    }

    // Check notifications every 30s, and unread messages every 10s as loose fallback
    const notifInterval = setInterval(checkUnreadNotifications, 30000);
    const msgInterval = setInterval(checkUnreadMessages, 10000);

    const handleUserUpdate = () => {
      fetchCurrentUser();
      checkUnreadNotifications();
      checkUnreadMessages();
    };
    const handleMessagesUpdate = () => checkUnreadMessages();
    const handleWindowFocus = () => {
      checkUnreadNotifications();
      checkUnreadMessages();
    };

    window.addEventListener('haven:user-updated', handleUserUpdate);
    window.addEventListener('haven:messages-updated', handleMessagesUpdate);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      if (socket) {
        socket.off('notification:new', onNotifNew);
        socket.off('notification:unread_count', onNotifCount);
        socket.off('messages:unread_count', onMsgCount);
        socket.off('message:new', onMsgNew);
        socket.off('conversation:updated', onMsgNew);
      }
      clearInterval(notifInterval);
      clearInterval(msgInterval);
      window.removeEventListener('haven:user-updated', handleUserUpdate);
      window.removeEventListener('haven:messages-updated', handleMessagesUpdate);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  // When user navigates to /messages, immediately clear the navigation badge and update visit time
  useEffect(() => {
    if (pathname?.startsWith('/messages')) {
      setUnreadMessagesCount(0);
      if (typeof window !== 'undefined') {
        localStorage.setItem('haven:lastVisitedMessagesAt', new Date().toISOString());
      }
    } else {
      checkUnreadMessages();
    }
  }, [pathname]);

  // Close "More" menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    if (isMoreOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMoreOpen]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
    setIsMoreOpen(false);
    router.push('/login');
  };

  const handleSearchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (pathname === '/') {
      window.dispatchEvent(new CustomEvent('haven:focus-search'));
    } else {
      router.push('/?focusSearch=true');
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
        const targetUrl = getSavedFeedUrl();
        const currentUrl = window.location.pathname + window.location.search;
        if (currentUrl === targetUrl) {
          window.location.reload();
        } else {
          router.push(targetUrl);
        }
      }
    };

    const fullAvatarUrl = user?.avatarUrl
      ? user.avatarUrl.startsWith('http')
        ? user.avatarUrl
        : `${apiUrl}${user.avatarUrl}`
      : null;

    return (
      <>
        <aside className="fixed top-0 bottom-0 left-0 z-40 h-screen w-16 md:w-60 lg:w-64 bg-surface-card border-r border-border-subtle flex flex-col justify-between py-6 px-2.5 md:px-3 select-none transition-all duration-200">
          {/* Top: Logo & Main Navigation List */}
          <div className="flex flex-col gap-6">
            {/* Logo Area */}
            <div className="px-2 pt-1 pb-1">
              <a href="/" onClick={handleLogoClick} className="flex items-center gap-2 group cursor-pointer">
                {/* Full wordmark logo on desktop */}
                <img
                  src="/logo.svg"
                  alt="Homers"
                  className="hidden md:block h-8 w-auto object-contain transition-transform group-hover:scale-105"
                />
                {/* Compact icon logo on mobile */}
                <img
                  src="/favicon.svg"
                  alt="Homers"
                  className="block md:hidden w-8 h-8 rounded-xl object-contain mx-auto transition-transform group-hover:scale-110"
                />
              </a>
            </div>

            {/* Navigation Items (Instagram-styled in exact order) */}
            <nav className="flex flex-col gap-1.5">
              {/* 1. Home */}
              {(() => {
                const isHomeActive = pathname === '/' || (
                  !pathname.startsWith('/forum') &&
                  !pathname.startsWith('/my-listings') &&
                  !pathname.startsWith('/messages') &&
                  !pathname.startsWith('/create-listing') &&
                  !pathname.startsWith('/profile') &&
                  !pathname.startsWith('/listings') &&
                  !pathname.startsWith('/favorites') &&
                  !pathname.startsWith('/login') &&
                  !pathname.startsWith('/register') &&
                  !pathname.startsWith('/auth')
                );
                return (
                  <Link
                    href="/"
                    onClick={(e) => {
                      e.preventDefault();
                      const targetUrl = getSavedFeedUrl();
                      const currentUrl = window.location.pathname + window.location.search;
                      if (currentUrl === targetUrl) {
                        window.location.reload();
                      } else {
                        router.push(targetUrl);
                      }
                    }}
                    title="Trang chủ"
                    className={`flex items-center justify-center md:justify-start gap-4 px-3 py-3 rounded-xl transition-all duration-150 group ${
                      isHomeActive
                        ? 'font-bold text-ink-primary bg-surface-container/60'
                        : 'font-medium text-ink-primary hover:bg-surface-container/50'
                    }`}
                  >
                  <div className="w-[26px] h-[26px] flex-shrink-0 flex items-center justify-center">
                    {isHomeActive ? (
                      <svg
                        className="w-[26px] h-[26px] transition-transform group-hover:scale-105"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M22 22h-7.005v-5.455a2.997 2.997 0 0 0-2.997-2.997 2.997 2.997 0 0 0-2.998 2.997V22H2V11.543l10-9.543 10 9.543V22z" />
                      </svg>
                    ) : (
                      <svg
                        className="w-[26px] h-[26px] transition-transform group-hover:scale-105"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9.005 16.545a2.997 2.997 0 0 1 2.997-2.997A2.997 2.997 0 0 1 15 16.545V22h7V11.543L12 2 2 11.543V22h7.005z" />
                      </svg>
                    )}
                  </div>
              <span className={`hidden md:inline-block text-[15px] leading-none ${isHomeActive ? 'font-bold' : 'font-medium'}`}>
                Trang chủ
              </span>
            </Link>
            );
            })()}

            {/* Diễn đàn */}
            {(() => {
              const isActive = pathname?.startsWith('/forum');
              return (
                <Link
                  href="/forum"
                  title="Diễn đàn"
                  className={`flex items-center justify-center md:justify-start gap-4 px-3 py-3 rounded-xl transition-all duration-150 group ${isActive
                      ? 'font-bold text-ink-primary bg-surface-container/60'
                      : 'font-medium text-ink-primary hover:bg-surface-container/50'
                    }`}
                >
                  <div className="w-[26px] h-[26px] flex-shrink-0 flex items-center justify-center">
                    <svg
                      className="w-[26px] h-[26px] transition-transform group-hover:scale-105"
                      viewBox="0 0 24 24"
                      fill={isActive ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                  </div>
                  <span className={`hidden md:inline-block text-[15px] leading-none ${isActive ? 'font-bold' : 'font-medium'}`}>
                    Diễn đàn
                  </span>
                </Link>
              );
            })()}

            {/* 2. Tin của tôi */}
            {(() => {
              const isActive = pathname?.startsWith('/my-listings');
              return (
                <Link
                  href={user ? '/my-listings' : '/login'}
                  title="Tin của tôi"
                  className={`flex items-center justify-center md:justify-start gap-4 px-3 py-3 rounded-xl transition-all duration-150 group ${isActive
                      ? 'font-bold text-ink-primary bg-surface-container/60'
                      : 'font-medium text-ink-primary hover:bg-surface-container/50'
                    }`}
                >
                  <div className="w-[26px] h-[26px] flex-shrink-0 flex items-center justify-center">
                    <svg
                      className="w-[26px] h-[26px] transition-transform group-hover:scale-105"
                      viewBox="0 0 24 24"
                      fill={isActive ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="4" />
                      <line x1="7" y1="8" x2="17" y2="8" stroke={isActive ? 'var(--color-surface, #fff)' : 'currentColor'} />
                      <line x1="7" y1="12" x2="17" y2="12" stroke={isActive ? 'var(--color-surface, #fff)' : 'currentColor'} />
                      <line x1="7" y1="16" x2="13" y2="16" stroke={isActive ? 'var(--color-surface, #fff)' : 'currentColor'} />
                    </svg>
                  </div>
                  <span className={`hidden md:inline-block text-[15px] leading-none ${isActive ? 'font-bold' : 'font-medium'}`}>
                    Tin của tôi
                  </span>
                </Link>
              );
            })()}

            {/* 3. Messages */}
            {(() => {
              const isActive = pathname?.startsWith('/messages');
              const showBadge = !isActive && unreadMessagesCount > 0;

              return (
                <Link
                  href={user ? '/messages' : '/login'}
                  title="Tin nhắn"
                  className={`flex items-center justify-center md:justify-start gap-4 px-3 py-3 rounded-xl transition-all duration-150 group ${isActive
                      ? 'font-bold text-ink-primary bg-surface-container/60'
                      : 'font-medium text-ink-primary hover:bg-surface-container/50'
                    }`}
                >
                  <div className="w-[26px] h-[26px] flex-shrink-0 flex items-center justify-center relative">
                    <svg
                      className="w-[26px] h-[26px] transition-transform group-hover:scale-105"
                      viewBox="0 0 24 24"
                      fill={isActive ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon
                        points="22 2 15 22 11 13 2 9 22 2"
                        fill={isActive ? 'currentColor' : 'none'}
                      />
                    </svg>

                    {showBadge && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-warm text-white text-[10px] font-bold flex items-center justify-center leading-none shadow-sm ring-2 ring-surface-card animate-in zoom-in-75 duration-150">
                        {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                      </span>
                    )}
                  </div>
                  <span className={`hidden md:inline-block text-[15px] leading-none ${isActive ? 'font-bold' : 'font-medium'}`}>
                    Tin nhắn
                  </span>
                </Link>
              );
            })()}

            {/* 4. Tin đã lưu */}
            {(() => {
              const isActive = pathname?.startsWith('/favorites');
              return (
                <Link
                  href={user ? '/favorites' : '/login'}
                  title="Tin đã lưu"
                  className={`flex items-center justify-center md:justify-start gap-4 px-3 py-3 rounded-xl transition-all duration-150 group ${isActive
                      ? 'font-bold text-ink-primary bg-surface-container/60'
                      : 'font-medium text-ink-primary hover:bg-surface-container/50'
                    }`}
                >
                  <div className="w-[26px] h-[26px] flex-shrink-0 flex items-center justify-center">
                    <svg
                      className="w-[26px] h-[26px] transition-transform group-hover:scale-105"
                      viewBox="0 0 24 24"
                      fill={isActive ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <span className={`hidden md:inline-block text-[15px] leading-none ${isActive ? 'font-bold' : 'font-medium'}`}>
                    Tin đã lưu
                  </span>
                </Link>
              );
            })()}

            {/* 5. Notifications */}
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  router.push('/login');
                  return;
                }
                setIsNotifOpen((prev) => !prev);
              }}
              title="Thông báo"
              className={`flex items-center justify-center md:justify-start gap-4 px-3 py-3 rounded-xl transition-all duration-150 group text-left w-full relative ${isNotifOpen
                  ? 'font-bold text-ink-primary bg-surface-container/60'
                  : 'font-medium text-ink-primary hover:bg-surface-container/50'
                }`}
            >
              <div className="w-[26px] h-[26px] flex-shrink-0 flex items-center justify-center relative">
                <svg
                  className="w-[26px] h-[26px] transition-transform group-hover:scale-105"
                  viewBox="0 0 24 24"
                  fill={isNotifOpen ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>

                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-warm text-white text-[10px] font-bold flex items-center justify-center leading-none shadow-sm ring-2 ring-surface-card">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className={`hidden md:inline-block text-[15px] leading-none ${isNotifOpen ? 'font-bold' : 'font-medium'}`}>
                Thông báo
              </span>
            </button>

            {/* 6. Create */}
            {(() => {
              const isActive = pathname === '/create-listing';
              return (
                <Link
                  href={user ? '/create-listing' : '/login'}
                  title="Tạo tin"
                  className={`flex items-center justify-center md:justify-start gap-4 px-3 py-3 rounded-xl transition-all duration-150 group ${isActive
                      ? 'font-bold text-ink-primary bg-surface-container/60'
                      : 'font-medium text-ink-primary hover:bg-surface-container/50'
                    }`}
                >
                  <div className="w-[26px] h-[26px] flex-shrink-0 flex items-center justify-center">
                    <svg
                      className="w-[26px] h-[26px] transition-transform group-hover:scale-105"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                  </div>
                  <span className={`hidden md:inline-block text-[15px] leading-none ${isActive ? 'font-bold' : 'font-medium'}`}>
                    Tạo tin
                  </span>
                </Link>
              );
            })()}

            {/* 7. Profile */}
            {(() => {
              const isActive = pathname === '/profile';
              return (
                <Link
                  href={user ? '/profile' : '/login'}
                  title="Trang cá nhân"
                  className={`flex items-center justify-center md:justify-start gap-4 px-3 py-3 rounded-xl transition-all duration-150 group ${isActive
                      ? 'font-bold text-ink-primary bg-surface-container/60'
                      : 'font-medium text-ink-primary hover:bg-surface-container/50'
                    }`}
                >
                  <div className="w-[26px] h-[26px] flex-shrink-0 flex items-center justify-center">
                    {fullAvatarUrl ? (
                      <img
                        src={fullAvatarUrl}
                        alt={user?.fullName || 'User'}
                        className={`w-[26px] h-[26px] rounded-full object-cover transition-all ${isActive
                            ? 'ring-2 ring-ink-primary ring-offset-2 scale-105'
                            : 'ring-1 ring-border-subtle group-hover:scale-105'
                          }`}
                      />
                    ) : (
                      <div
                        className={`w-[26px] h-[26px] rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-semibold ${isActive
                            ? 'ring-2 ring-ink-primary ring-offset-2 scale-105'
                            : 'group-hover:scale-105'
                          }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">person</span>
                      </div>
                    )}
                  </div>
                  <span className={`hidden md:inline-block text-[15px] leading-none truncate max-w-[140px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                    {user?.fullName || 'Đăng nhập'}
                  </span>
                </Link>
              );
            })()}
          </nav>
        </div>

        {/* Bottom: "More" Menu Button (Instagram-styled hamburger) */}
        <div className="relative" ref={moreMenuRef}>
          {isMoreOpen && (
            <div className="absolute bottom-full left-0 mb-3 w-52 bg-surface-card rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-border-subtle p-1.5 z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
              {user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-error-container/20 text-error text-sm font-medium transition-colors w-full text-left"
                >
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                  <span>Đăng xuất</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreOpen(false);
                    router.push('/login');
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container/60 text-ink-primary text-sm font-medium transition-colors w-full text-left"
                >
                  <span className="material-symbols-outlined text-[20px]">login</span>
                  <span>Đăng nhập / Đăng ký</span>
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            title="Xem thêm"
            className={`flex items-center justify-center md:justify-start gap-4 px-3 py-3 rounded-xl transition-all duration-150 group text-ink-primary hover:bg-surface-container/50 w-full ${isMoreOpen ? 'bg-surface-container/60 font-bold' : 'font-medium'
              }`}
          >
            <div className="w-[26px] h-[26px] flex-shrink-0 flex items-center justify-center">
              <svg
                className="w-[26px] h-[26px] transition-transform group-hover:scale-105"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </div>
            <span className="hidden md:inline-block text-[15px] leading-none font-medium">
              Xem thêm
            </span>
          </button>
        </div>
      </aside >

        {/* Notification Modal */ }
        < NotificationModal
    isOpen = { isNotifOpen }
    onClose = {() => {
  setIsNotifOpen(false);
  checkUnreadNotifications();
}}
onNotificationRead = { checkUnreadNotifications }
  />
    </>
  );
};
