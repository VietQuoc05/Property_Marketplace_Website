'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { NotificationModal } from './NotificationModal';

import { getSocket } from '@/lib/socket';
import { getSavedFeedUrl } from '@/lib/filter-url';

interface HeaderProps {
  user?: {
    name?: string;
    avatar?: string;
  } | null;
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const checkUnreadNotifications = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) return;

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

  useEffect(() => {
    checkUnreadNotifications();

    const socket = getSocket();
    const onNotifNew = () => {
      setUnreadCount((prev) => prev + 1);
    };
    const onNotifCount = (data: { unreadCount: number }) => {
      if (typeof data?.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      }
    };

    if (socket) {
      socket.on('notification:new', onNotifNew);
      socket.on('notification:unread_count', onNotifCount);
    }

    const interval = setInterval(checkUnreadNotifications, 30000);
    return () => {
      if (socket) {
        socket.off('notification:new', onNotifNew);
        socket.off('notification:unread_count', onNotifCount);
      }
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface-parchment/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(28,28,28,0.03)] border-b border-border-subtle">
        <div className="h-16 flex items-center justify-between px-4 max-w-7xl mx-auto">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              if (typeof window !== 'undefined') {
                  const targetUrl = getSavedFeedUrl();
                  const currentUrl = window.location.pathname + window.location.search;
                  if (currentUrl === targetUrl) {
                    window.location.reload();
                  } else {
                    window.location.href = targetUrl;
                  }
                }
              }
            }
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <img
              src="/logo.svg"
              alt="Homers Logo"
              className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNotifOpen(true)}
              aria-label="Thông báo"
              className="w-10 h-10 rounded-full flex items-center justify-center text-ink-primary hover:bg-surface-container transition-colors relative"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-warm text-white text-[10px] font-bold flex items-center justify-center leading-none shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <Link href={user ? "/profile" : "/login"}>
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || "User"}
                  className="w-9 h-9 rounded-full object-cover border border-border-strong shadow-sm"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.2)] hover:opacity-90 transition-opacity">
                  <span className="material-symbols-outlined text-[18px]">person</span>
                </div>
              )}
            </Link>
          </div>
        </div>
      </header>

      <NotificationModal
        isOpen={isNotifOpen}
        onClose={() => {
          setIsNotifOpen(false);
          checkUnreadNotifications();
        }}
        onNotificationRead={checkUnreadNotifications}
      />
    </>
  );
};
