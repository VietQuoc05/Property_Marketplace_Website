'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  const router = useRouter();

  // On mount, check if user is already authenticated via token or social login token
  useEffect(() => {
    const checkAuth = async () => {
      // Check query parameters for social callback token if any
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token') || urlParams.get('accessToken');
      if (urlToken) {
        localStorage.setItem('accessToken', urlToken);
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setCheckingAuth(false);
        return;
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const res = await fetch(`${apiUrl}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          router.push('/');
          return;
        } else {
          localStorage.removeItem('accessToken');
        }
      } catch (err) {
        // Backend unavailable or token invalid
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!agreedToTerms) {
      setError('Vui lòng đồng ý với Điều khoản dịch vụ & Chính sách bảo mật của Homers.');
      return;
    }

    setLoading(true);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    const payload = isLogin
      ? { phone, password }
      : { phone, password, fullName };

    try {
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Có lỗi xảy ra, vui lòng thử lại.');
      }

      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        router.push('/');
      } else {
        if (!isLogin) {
          setIsLogin(true);
          setError('Đăng ký thành công! Vui lòng đăng nhập.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: 'google' | 'facebook') => {
    if (!agreedToTerms) {
      setError('Vui lòng đồng ý với Điều khoản dịch vụ & Chính sách bảo mật của Homers.');
      return;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    window.location.href = `${apiUrl}/auth/${provider}`;
  };

  if (checkingAuth) {
    return (
      <main className="flex flex-col relative w-full bg-surface min-h-screen">
        <div className="flex flex-col w-full py-space-lg max-w-md mx-auto px-6">
          <div className="flex flex-col items-center text-center mb-space-lg pt-4">
            <Skeleton className="w-12 h-12 rounded-full mb-space-sm" />
            <Skeleton className="h-3.5 w-24 rounded-full mb-2" />
            <Skeleton className="h-7 w-64 rounded-lg mb-2" />
            <Skeleton className="h-4 w-52 rounded" />
          </div>

          <Skeleton className="h-11 w-full rounded-full mb-space-lg" />

          <div className="flex flex-col gap-4">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-full mt-2" />
            <div className="flex items-center gap-3 my-2">
              <Skeleton className="h-[1px] flex-1" />
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-[1px] flex-1" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-11 flex-1 rounded-full" />
              <Skeleton className="h-11 flex-1 rounded-full" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col relative w-full bg-surface min-h-screen">
      <div className="flex flex-col w-full py-space-lg max-w-md mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-space-lg pt-4">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center p-2 mb-space-sm shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.25)]">
            <span className="material-symbols-outlined text-[24px] text-on-primary">home_pin</span>
          </div>
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-ink-secondary mb-1">
            homers. living
          </span>
          <h1 className="font-headline-xl-mobile text-headline-xl-mobile text-ink-primary font-semibold tracking-tight max-w-[280px]">
            Tìm không gian sống lý tưởng của bạn
          </h1>
        </div>

        <div className="p-1 bg-surface-container rounded-full flex relative mb-space-lg border border-border-subtle">
          <button
            type="button"
            className={`flex-1 py-2 rounded-full font-label-md text-label-md font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${isLogin
              ? 'text-on-primary bg-primary shadow-sm'
              : 'text-ink-secondary bg-transparent hover:text-ink-primary'
              }`}
            style={isLogin ? { boxShadow: 'inset 0 0.5px 0 0 rgba(255, 255, 255, 0.2), inset 0 0 0 0.5px rgba(0, 0, 0, 0.2), 0 1px 2px 0 rgba(0, 0, 0, 0.05)' } : {}}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            <span className="material-symbols-outlined text-[16px]">login</span>
            Đăng nhập
          </button>
          <button
            type="button"
            className={`flex-1 py-2 rounded-full font-label-md text-label-md font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${!isLogin
              ? 'text-on-primary bg-primary shadow-sm'
              : 'text-ink-secondary bg-transparent hover:text-ink-primary'
              }`}
            style={!isLogin ? { boxShadow: 'inset 0 0.5px 0 0 rgba(255, 255, 255, 0.2), inset 0 0 0 0.5px rgba(0, 0, 0, 0.2), 0 1px 2px 0 rgba(0, 0, 0, 0.05)' } : {}}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            Đăng ký
          </button>
        </div>

        <form className="flex flex-col gap-space-sm" onSubmit={handleSubmit}>
          {error && (
            <div className={`p-3 rounded-lg text-sm ${error.includes('thành công') ? 'bg-green-100 text-green-700' : 'bg-error-container text-on-error-container'}`}>
              {error}
            </div>
          )}

          {!isLogin && (
            <Input
              label="Họ và tên"
              icon="badge"
              placeholder="Nguyễn Văn An"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required={!isLogin}
            />
          )}

          <Input
            label="Số điện thoại"
            icon="call"
            placeholder="090..."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            type="tel"
          />

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between pl-1">
              <label className="font-label-sm text-label-sm text-ink-secondary font-medium">
                Mật khẩu
              </label>
              {isLogin && (
                <button type="button" className="font-label-sm text-label-sm text-ink-secondary underline hover:text-ink-primary transition-colors">
                  Quên mật khẩu?
                </button>
              )}
            </div>
            <Input
              isPassword
              icon="lock"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>


          <Button type="submit" variant="primary" fullWidth className="mt-2" icon="arrow_forward" disabled={loading}>
            {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập ngay' : 'Tạo tài khoản mới')}
          </Button>
        </form>

        <div className="flex items-center my-space-md">
          <div className="flex-1 h-[1px] bg-secondary-container"></div>
          <span className="px-3 font-body-sm text-body-sm text-ink-secondary">hoặc tiếp tục với</span>
          <div className="flex-1 h-[1px] bg-secondary-container"></div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-space-lg">
          <Button
            type="button"
            variant="social"
            className="gap-2.5 border border-border-subtle hover:bg-surface-container"
            onClick={() => handleSocialLogin('google')}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"></path>
            </svg>
            Google
          </Button>

          <Button
            type="button"
            variant="social"
            className="gap-2.5 border border-border-subtle hover:bg-surface-container text-[#1877F2]"
            onClick={() => handleSocialLogin('facebook')}
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path>
            </svg>
            Facebook
          </Button>
        </div>

        <div className="mt-auto pt-space-md flex items-center justify-center">
          <label
            htmlFor="agreeTerms"
            className="inline-flex items-start gap-2 cursor-pointer select-none text-left"
          >
            <input
              type="checkbox"
              id="agreeTerms"
              checked={agreedToTerms}
              onChange={(e) => {
                setAgreedToTerms(e.target.checked);
                if (e.target.checked && error.includes('Điều khoản dịch vụ')) {
                  setError('');
                }
              }}
              className="mt-0.5 w-4 h-4 accent-primary rounded border-border-strong cursor-pointer shrink-0"
            />
            <span className="font-body-sm text-body-sm text-ink-secondary leading-relaxed">
              Tôi đồng ý với{' '}
              <a
                href="#"
                onClick={(e) => e.stopPropagation()}
                className="text-ink-primary font-medium underline"
              >
                Điều khoản dịch vụ
              </a>{' '}
              &amp;{' '}
              <a
                href="#"
                onClick={(e) => e.stopPropagation()}
                className="text-ink-primary font-medium underline"
              >
                Chính sách bảo mật
              </a>{' '}
              của Homers.
            </span>
          </label>
        </div>
      </div>
    </main>
  );
}
