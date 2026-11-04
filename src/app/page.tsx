'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ListingCard } from '@/components/ListingCard';
import { ListingCardSkeleton } from '@/components/ui/Skeleton';
import { FilterModal } from '@/components/FilterModal';
import { getSocket } from '@/lib/socket';
import {
  buildFilterUrl,
  getFilterSummaryText,
  parseFilterUrl,
  FilterState,
  saveFilterToSession,
  getSavedFilterFromSession,
  clearFilterFromSession,
  hasActiveFilterCriteria,
} from '@/lib/filter-url';

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

export default function Home() {
  const [listings, setListings] = useState<RawListing[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Tất cả');
  const [user, setUser] = useState<{ fullName?: string; avatarUrl?: string } | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [networkError, setNetworkError] = useState(false);

  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filterOptions = [
    { label: 'Tất cả', type: null },
    { label: 'Căn hộ/Chung cư', type: 'APARTMENT' },
    { label: 'Nhà phố', type: 'HOUSE' },
    { label: 'Đất', type: 'LAND' },
    { label: 'Trọ', type: 'ROOM' },
    { label: 'Mặt bằng/Văn phòng', type: 'OFFICE' },
  ];

  useEffect(() => {
    const handleFocusSearch = () => {
      searchInputRef.current?.focus();
      searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    window.addEventListener('haven:focus-search', handleFocusSearch);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('focusSearch') === 'true') {
        handleFocusSearch();
      }
    }

    return () => {
      window.removeEventListener('haven:focus-search', handleFocusSearch);
    };
  }, []);

  const [activeFilters, setActiveFilters] = useState<FilterState>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loadingListings, setLoadingListings] = useState(true);

  // Computes the summary text below "Gợi ý cho bạn hôm nay"
  const filterSummaryText = useMemo(() => {
    return getFilterSummaryText(activeFilters);
  }, [activeFilters]);

  // Builds query string for backend API (/feed)
  const buildFeedQueryParams = (
    filterType?: string | null,
    customFilters: FilterState = activeFilters,
    searchQuery = searchTerm,
  ) => {
    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('limit', '20');

    // Search query
    if (searchQuery?.trim()) {
      params.set('search', searchQuery.trim());
    }

    // Filter by listingType: priority given to customFilters if set, else category pill
    const effectiveListingType = customFilters.listingType || filterType;
    if (effectiveListingType) {
      params.set('listingType', effectiveListingType);
    }

    // Strict location filters if chosen in filter popup
    if (customFilters.cityId) params.set('cityId', customFilters.cityId);
    if (customFilters.districtId) params.set('districtId', customFilters.districtId);
    if (customFilters.wardId) params.set('wardId', customFilters.wardId);
    if (customFilters.saleType) params.set('saleType', customFilters.saleType);

    if (customFilters.minPrice) {
      const cleanMin = customFilters.minPrice.replace(/\D/g, '');
      if (cleanMin) {
        if (customFilters.saleType === 'SALE') {
          params.set('minSalePrice', cleanMin);
        } else if (customFilters.saleType === 'RENT') {
          params.set('minRent', cleanMin);
        } else {
          params.set('minPrice', cleanMin);
        }
      }
    }
    if (customFilters.maxPrice) {
      const cleanMax = customFilters.maxPrice.replace(/\D/g, '');
      if (cleanMax) {
        if (customFilters.saleType === 'SALE') {
          params.set('maxSalePrice', cleanMax);
        } else if (customFilters.saleType === 'RENT') {
          params.set('maxRent', cleanMax);
        } else {
          params.set('maxPrice', cleanMax);
        }
      }
    }

    if (customFilters.minSize) params.set('minSize', customFilters.minSize);
    if (customFilters.maxSize) params.set('maxSize', customFilters.maxSize);
    if (customFilters.br) params.set('minBr', customFilters.br);
    if (customFilters.wc) params.set('minWc', customFilters.wc);

    return params.toString();
  };

  const fetchFeedListings = async (
    filterType?: string | null,
    customFilters: FilterState = activeFilters,
    searchQuery = searchTerm,
  ) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    setLoadingListings(true);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const queryString = buildFeedQueryParams(filterType, customFilters, searchQuery);

    try {
      const feedRes = await fetch(`${apiUrl}/feed?${queryString}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (feedRes.ok) {
        const data = await feedRes.json();
        if (data.data && Array.isArray(data.data)) {
          setListings(data.data);
        }
      }
    } catch (e) {
      console.error('Error fetching feed:', e);
    } finally {
      setLoadingListings(false);
    }
  };

  // Synchronizes browser URL path & query string like ITviec without full page refresh
  const updateBrowserUrl = (filters: FilterState, search?: string): string => {
    if (typeof window === 'undefined') return '/';
    const newUrl = buildFilterUrl(filters, search);
    const currentUrl = window.location.pathname + window.location.search;
    if (currentUrl !== newUrl) {
      window.history.pushState({ filters, search }, '', newUrl);
    }
    return newUrl;
  };

  const handleApplyFilters = (newFilters: FilterState) => {
    setActiveFilters(newFilters);
    // If listingType was picked in modal, sync category pill label
    if (newFilters.listingType) {
      const match = filterOptions.find((o) => o.type === newFilters.listingType);
      setSelectedFilter(match ? match.label : 'Tất cả');
    } else {
      setSelectedFilter('Tất cả');
    }
    const newUrl = updateBrowserUrl(newFilters, searchTerm);
    saveFilterToSession(newFilters, searchTerm, newUrl);
    fetchFeedListings(newFilters.listingType, newFilters, searchTerm);
  };

  const handleResetFilters = () => {
    setActiveFilters({});
    setSelectedFilter('Tất cả');
    setSearchTerm('');
    clearFilterFromSession();
    updateBrowserUrl({}, '');
    fetchFeedListings(null, {}, '');
  };

  const hasActiveFilters = Object.values(activeFilters).some((v) => Boolean(v));

  // Initial load and URL parsing
  useEffect(() => {
    let isCancelled = false;

    async function checkUserAndFetchListings() {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      
      // 1. Extract token from URL query string if returning from OAuth callback (Google/Facebook)
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token') || urlParams.get('accessToken');
      if (urlToken) {
        localStorage.setItem('accessToken', urlToken);
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // 2. Determine initial filters: check current URL first, else fallback to sessionStorage
      const currentPath = window.location.pathname;
      const currentParams = new URLSearchParams(window.location.search);
      const isRootPath = currentPath === '/' || currentPath === '';
      const hasQueryParams = Array.from(currentParams.keys()).some(
        (key) => key !== 'token' && key !== 'accessToken' && key !== 'focusSearch'
      );

      let initialFilters: FilterState = {};
      let initialSearch = '';

      if (!isRootPath || hasQueryParams) {
        // Current URL has filter path segments or query parameters
        const parsed = await parseFilterUrl(currentPath, currentParams, apiUrl);
        initialFilters = parsed.filters;
        initialSearch = parsed.searchTerm;
        saveFilterToSession(
          initialFilters,
          initialSearch,
          currentPath + (window.location.search || '')
        );
      } else {
        // Clean root URL: check if we have a saved filter from sessionStorage
        const saved = getSavedFilterFromSession();
        if (saved && (hasActiveFilterCriteria(saved.filters) || saved.searchTerm)) {
          initialFilters = saved.filters;
          initialSearch = saved.searchTerm;
          if (saved.url && saved.url !== '/') {
            window.history.replaceState({ filters: saved.filters, search: saved.searchTerm }, '', saved.url);
          }
        }
      }

      if (!isCancelled) {
        if (hasActiveFilterCriteria(initialFilters) || initialSearch) {
          setActiveFilters(initialFilters);
          if (initialSearch) setSearchTerm(initialSearch);
          if (initialFilters.listingType) {
            const match = filterOptions.find((o) => o.type === initialFilters.listingType);
            if (match) setSelectedFilter(match.label);
          }
        }
      }

      const feedQueryString = buildFeedQueryParams(
        initialFilters.listingType || null,
        initialFilters,
        initialSearch
      );

      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

      if (!token) {
        // Guest user: fetch initial public feed without requiring login
        setUser(null);
        setFavoriteIds(new Set());
        try {
          const feedRes = await fetch(`${apiUrl}/feed?${feedQueryString}`);
          if (feedRes.ok) {
            const feedData = await feedRes.json();
            if (feedData.data && Array.isArray(feedData.data) && !isCancelled) {
              setListings(feedData.data);
            }
          }
        } catch (e) {
          console.warn('Guest feed fetch error:', e);
          if (!isCancelled) {
            setNetworkError(true);
          }
        } finally {
          if (!isCancelled) {
            setCheckingAuth(false);
            setLoadingListings(false);
          }
        }
        return;
      }

      try {
        // Logged-in user: fetch Auth info, Interested listings, and Feed
        const [authRes, favRes, feedRes] = await Promise.all([
          fetch(`${apiUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${apiUrl}/listings/interested/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${apiUrl}/feed?${feedQueryString}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (isCancelled) return;

        // If token is invalid or expired, clear it and still load feed as guest
        if (authRes.status === 401) {
          localStorage.removeItem('accessToken');
          setUser(null);
          setFavoriteIds(new Set());
          if (feedRes.ok) {
            const feedData = await feedRes.json();
            if (feedData.data && Array.isArray(feedData.data) && !isCancelled) {
              setListings(feedData.data);
            }
          }
          return;
        }

        if (authRes.ok) {
          const userData = await authRes.json();
          if (isCancelled) return;
          setUser(userData);
          setNetworkError(false);
        }

        if (favRes.ok) {
          const favData = await favRes.json();
          if (Array.isArray(favData) && !isCancelled) {
            setFavoriteIds(new Set(favData.map((item: any) => item.id)));
          }
        }

        if (feedRes.ok) {
          const feedData = await feedRes.json();
          if (feedData.data && Array.isArray(feedData.data) && !isCancelled) {
            setListings(feedData.data);
          }
        }
      } catch (e) {
        console.warn('Feed initialization error:', e);
        if (!isCancelled) {
          setNetworkError(true);
        }
      } finally {
        if (!isCancelled) {
          setCheckingAuth(false);
          setLoadingListings(false);
        }
      }
    }

    checkUserAndFetchListings();

    return () => {
      isCancelled = true;
    };
  }, [router]);

  // Support browser Back/Forward navigation with URL parsing
  useEffect(() => {
    const handlePopState = async () => {
      if (typeof window === 'undefined') return;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const parsed = await parseFilterUrl(
        window.location.pathname,
        new URLSearchParams(window.location.search),
        apiUrl
      );
      setActiveFilters(parsed.filters);
      setSearchTerm(parsed.searchTerm);
      if (parsed.filters.listingType) {
        const match = filterOptions.find((o) => o.type === parsed.filters.listingType);
        setSelectedFilter(match ? match.label : 'Tất cả');
      } else {
        setSelectedFilter('Tất cả');
      }
      saveFilterToSession(
        parsed.filters,
        parsed.searchTerm,
        window.location.pathname + window.location.search
      );
      fetchFeedListings(parsed.filters.listingType, parsed.filters, parsed.searchTerm);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Realtime Feed & Listing Socket.IO listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewListing = (newListing: RawListing) => {
      if (!newListing?.id) return;
      setListings((prev) => {
        if (prev.some((l) => l.id === newListing.id)) return prev;
        return [newListing, ...prev];
      });
    };

    const handleListingUpdated = (updatedListing: RawListing) => {
      if (!updatedListing?.id) return;
      setListings((prev) =>
        prev.map((l) => (l.id === updatedListing.id ? { ...l, ...updatedListing } : l))
      );
    };

    const handleInterestCountChanged = (data: { listingId: string; interestScore: number }) => {
      if (!data?.listingId) return;
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

    const handleListingDeleted = (data: { listingId: string }) => {
      if (!data?.listingId) return;
      setListings((prev) => prev.filter((l) => l.id !== data.listingId));
    };

    socket.on('feed:new_listing', handleNewListing);
    socket.on('listing:created', handleNewListing);
    socket.on('listing:updated', handleListingUpdated);
    socket.on('listing:interest_count_changed', handleInterestCountChanged);
    socket.on('listing:deleted', handleListingDeleted);

    return () => {
      socket.off('feed:new_listing', handleNewListing);
      socket.off('listing:created', handleNewListing);
      socket.off('listing:updated', handleListingUpdated);
      socket.off('listing:interest_count_changed', handleInterestCountChanged);
      socket.off('listing:deleted', handleListingDeleted);
    };
  }, []);

  const handleFavoriteToggle = async (listingId: string, currentFav: boolean) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const method = currentFav ? 'DELETE' : 'POST';

    try {
      const res = await fetch(`${apiUrl}/listings/${listingId}/interest`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok || res.status === 400) {
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (currentFav) {
            next.delete(listingId);
          } else {
            next.add(listingId);
          }
          return next;
        });
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex flex-col min-h-screen bg-surface">
        <main className="flex-1 w-full pt-4 pb-16 max-w-[1800px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Sticky Search & Filter Bar */}
          <section className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md pt-2 pb-3 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 border-b border-border-subtle/60">
            <div className="w-fit max-w-full">
              <div className="flex items-center gap-2 w-full">
                <div className="flex-1 min-w-0 flex items-center bg-surface-card rounded-full px-3.5 py-2 shadow-[inset_0_1px_2px_rgba(28,28,28,0.03)] border border-border-subtle">
                  <span className="material-symbols-outlined text-ink-tertiary text-[20px] mr-2 select-none flex-shrink-0">
                    search
                  </span>
                  <div className="h-4 bg-surface-container rounded w-48 animate-pulse" />
                </div>
                <div className="h-10 w-10 rounded-full bg-surface-card border border-border-subtle flex items-center justify-center animate-pulse flex-shrink-0" />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2">
                {filterOptions.map((opt, idx) => (
                  <div
                    key={idx}
                    className="h-8 w-20 bg-surface-card rounded-full border border-border-subtle animate-pulse flex-shrink-0"
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Skeleton Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-4.5 lg:gap-5 mt-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <ListingCardSkeleton key={`auth-skeleton-${i}`} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (networkError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <span className="material-symbols-outlined text-[48px] text-ink-tertiary mb-3">
          wifi_off
        </span>
        <h2 className="text-xl font-semibold text-ink-primary mb-2">
          Không thể kết nối đến máy chủ
        </h2>
        <p className="text-ink-secondary text-sm max-w-md mb-6">
          Vui lòng kiểm tra kết nối mạng hoặc thử lại sau ít phút.
        </p>
        <button
          onClick={() => {
            setCheckingAuth(true);
            setNetworkError(false);
            window.location.reload();
          }}
          className="px-6 py-2.5 bg-primary text-white rounded-xl font-label-md font-medium shadow-md hover:bg-primary/90 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          <span>Thử lại</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <main className="flex-1 w-full pt-4 pb-16 max-w-[1800px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Sticky Search & Filter Bar */}
        <section className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md pt-2 pb-3 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 border-b border-border-subtle/60">
          <div className="w-fit max-w-full">
            <div className="flex items-center gap-2 w-full">
              <div className="flex-1 min-w-0 flex items-center bg-surface-card rounded-full px-3.5 py-2 shadow-[inset_0_1px_2px_rgba(28,28,28,0.03)] border border-border-subtle focus-within:border-ink-primary transition-all">
                <span className="material-symbols-outlined text-ink-tertiary text-[20px] mr-2 select-none flex-shrink-0">
                  search
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const currentType =
                        filterOptions.find((f) => f.label === selectedFilter)?.type ?? null;
                      const newUrl = updateBrowserUrl(activeFilters, searchTerm);
                      saveFilterToSession(activeFilters, searchTerm, newUrl);
                      fetchFeedListings(currentType, activeFilters, searchTerm);
                    }
                  }}
                  placeholder="Tìm kiếm khu vực, quận, dự án căn hộ..."
                  className="w-full bg-transparent font-body-md text-body-md text-ink-primary placeholder:text-ink-tertiary outline-none min-w-0"
                />
                {searchTerm && (
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      const currentType =
                        filterOptions.find((f) => f.label === selectedFilter)?.type ?? null;
                      const newUrl = updateBrowserUrl(activeFilters, '');
                      saveFilterToSession(activeFilters, '', newUrl);
                      fetchFeedListings(currentType, activeFilters, '');
                    }}
                    className="text-ink-quaternary hover:text-ink-secondary p-1 flex items-center flex-shrink-0"
                    title="Xóa tìm kiếm"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>
              
              <button
                onClick={() => setIsFilterOpen(true)}
                aria-label="Mở bộ lọc chi tiết"
                className="h-10 w-10 rounded-full bg-primary text-on-primary flex items-center justify-center flex-shrink-0 shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.25),0_2px_6px_rgba(0,0,0,0.12)] active:scale-95 transition-transform relative"
              >
                <span className="material-symbols-outlined text-[20px]">tune</span>
                {hasActiveFilters && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-accent-warm border-2 border-surface"></span>
                )}
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2">
              {filterOptions.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => {
                    setSelectedFilter(opt.label);
                    let updated: FilterState = { ...activeFilters };
                    if (opt.type) {
                      updated = { ...updated, listingType: opt.type };
                    } else {
                      // Clicked "Tất cả": clear listingType
                      const { listingType: _, ...rest } = updated;
                      updated = rest;
                    }
                    setActiveFilters(updated);
                    const newUrl = updateBrowserUrl(updated, searchTerm);
                    saveFilterToSession(updated, searchTerm, newUrl);
                    fetchFeedListings(opt.type, updated, searchTerm);
                  }}
                  className={`whitespace-nowrap flex-shrink-0 px-3.5 py-1.5 rounded-full font-label-md text-label-md transition-colors ${
                    selectedFilter === opt.label
                      ? 'bg-primary text-on-primary shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.2)] font-medium'
                      : 'bg-surface-card text-ink-secondary hover:text-ink-primary border border-border-subtle'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Content Section */}
        <div className="flex flex-col gap-4 pt-4">
          <div className="flex flex-col gap-1.5">
            <h1 className="font-headline-md text-headline-md text-ink-primary font-semibold">
              Gợi ý cho bạn hôm nay
            </h1>

            {/* Filter detail summary line with funnel icon */}
            {filterSummaryText && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="material-symbols-outlined text-[18px] text-accent-warm flex-shrink-0 select-none">
                  filter_alt
                </span>
                <p className="font-body-md text-body-md text-ink-secondary font-medium">
                  {filterSummaryText}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="text-accent-warm hover:underline text-xs font-medium ml-1 inline-flex items-center gap-0.5"
                    title="Xóa bộ lọc"
                  >
                    <span>(Bỏ lọc)</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Listing Cards Grid (4xN) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-4.5 lg:gap-5 mt-2">
            {loadingListings ? (
              Array.from({ length: 8 }).map((_, i) => (
                <ListingCardSkeleton key={`feed-skeleton-${i}`} />
              ))
            ) : listings.length === 0 ? (
              <div className="col-span-full text-center py-12 text-ink-tertiary font-body-md">
                Chưa có tin đăng nào phù hợp
              </div>
            ) : (
              listings.map((item) => {
                const isRent = item.saleType === 'RENT';
                const priceNum = isRent ? Number(item.monthlyRent || 0) : Number(item.salePrice || 0);
                
                const locationStr = [
                  item.ward?.name,
                  item.district?.name,
                  item.city?.name
                ].filter(Boolean).join(', ') || item.address || 'Việt Nam';

                // Map images array supporting string or image object with imageUrl/url
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
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
                    isFavorite={favoriteIds.has(item.id)}
                    compact={true}
                    onFavoriteToggle={(id) => handleFavoriteToggle(id, favoriteIds.has(item.id))}
                    onClick={(id) => {
                      if (typeof window !== 'undefined') {
                        window.open(`/listings/${id}`, '_blank', 'noopener,noreferrer');
                      }
                    }}
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
              })
            )}
          </div>
        </div>
      </main>

      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={activeFilters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />
    </div>
  );
}
