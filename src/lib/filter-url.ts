import {
  CITIES,
  DISTRICTS,
  findCityByIdOrSlug,
  findDistrictByIdOrSlug,
  getWardsForDistrict,
  toSlug,
} from './location-data';

export interface FilterState {
  cityId?: string;
  cityName?: string;
  districtId?: string;
  districtName?: string;
  wardId?: string;
  wardName?: string;
  saleType?: 'RENT' | 'SALE' | '';
  listingType?: string;
  minPrice?: string;
  maxPrice?: string;
  minSize?: string;
  maxSize?: string;
  br?: string;
  wc?: string;
}

export const LISTING_TYPE_SLUGS: Record<string, { slug: string; label: string }> = {
  APARTMENT: { slug: 'can-ho-chung-cu', label: 'Căn hộ/Chung cư' },
  HOUSE: { slug: 'nha-pho', label: 'Nhà phố' },
  LAND: { slug: 'dat', label: 'Đất' },
  ROOM: { slug: 'tro', label: 'Trọ' },
  OFFICE: { slug: 'mat-bang-van-phong', label: 'Mặt bằng/Văn phòng' },
};

export const SALE_TYPE_SLUGS: Record<string, { slug: string; label: string }> = {
  RENT: { slug: 'cho-thue', label: 'Cho thuê' },
  SALE: { slug: 'can-ban', label: 'Cần bán' },
};

/**
 * Builds clean ITviec-style URL path + query string
 * Example:
 * /cho-thue/can-ho-chung-cu/da-nang-lien-chieu-hoa-minh?minPrice=3000000&maxPrice=5000000&minSize=30&maxSize=80&br=2&wc=1
 */
export function buildFilterUrl(filters: FilterState, searchTerm?: string): string {
  const hasSaleType = Boolean(filters.saleType);
  const hasListingType = Boolean(filters.listingType);
  const hasLocation = Boolean(filters.cityId || filters.cityName);
  const hasPriceOrSize = Boolean(
    filters.minPrice ||
    filters.maxPrice ||
    filters.minSize ||
    filters.maxSize ||
    filters.br ||
    filters.wc
  );
  const hasSearch = Boolean(searchTerm?.trim());

  if (!hasSaleType && !hasListingType && !hasLocation && !hasPriceOrSize && !hasSearch) {
    return '/';
  }

  const segments: string[] = [];

  // 1. Transaction segment
  if (filters.saleType === 'RENT') {
    segments.push('cho-thue');
  } else if (filters.saleType === 'SALE') {
    segments.push('can-ban');
  } else if (hasListingType || hasLocation) {
    segments.push('cho-thue-can-ban');
  }

  // 2. Listing Type segment
  if (filters.listingType && LISTING_TYPE_SLUGS[filters.listingType]) {
    segments.push(LISTING_TYPE_SLUGS[filters.listingType].slug);
  }

  // 3. Location segment: da-nang-lien-chieu-hoa-minh
  if (filters.cityId || filters.cityName) {
    const locParts: string[] = [];

    // City slug
    const city = filters.cityId
      ? findCityByIdOrSlug(filters.cityId)
      : CITIES.find((c) => c.name.toLowerCase() === filters.cityName?.toLowerCase());
    if (city) {
      locParts.push(city.slug);
    } else if (filters.cityName) {
      locParts.push(toSlug(filters.cityName));
    }

    // District slug
    if (filters.districtId && city) {
      const dist = findDistrictByIdOrSlug(city.id, filters.districtId);
      if (dist) {
        locParts.push(dist.slug);
      } else if (filters.districtName) {
        locParts.push(toSlug(filters.districtName));
      }
    } else if (filters.districtName) {
      locParts.push(toSlug(filters.districtName));
    }

    // Ward slug
    if (filters.wardName) {
      locParts.push(toSlug(filters.wardName));
    }

    if (locParts.length > 0) {
      segments.push(locParts.join('-'));
    }
  }

  // Query params for remaining secondary criteria (Price, Size, BR, WC, Search)
  const queryParams = new URLSearchParams();

  if (searchTerm?.trim()) {
    queryParams.set('search', searchTerm.trim());
  }

  if (filters.minPrice) {
    const clean = filters.minPrice.replace(/\D/g, '');
    if (clean) queryParams.set('minPrice', clean);
  }
  if (filters.maxPrice) {
    const clean = filters.maxPrice.replace(/\D/g, '');
    if (clean) queryParams.set('maxPrice', clean);
  }
  if (filters.minSize) {
    queryParams.set('minSize', filters.minSize);
  }
  if (filters.maxSize) {
    queryParams.set('maxSize', filters.maxSize);
  }
  if (filters.br) {
    queryParams.set('br', filters.br);
  }
  if (filters.wc) {
    queryParams.set('wc', filters.wc);
  }

  const path = segments.length > 0 ? `/${segments.join('/')}` : '/';
  const query = queryParams.toString();
  return query ? `${path}?${query}` : path;
}

/**
 * Generates the human-friendly summary text shown right below "Gợi ý cho bạn hôm nay".
 * Example: "Cho thuê/Bán Căn hộ/Chung cư tại Đà Nẵng, Liên Chiểu, Hòa Minh"
 */
export function getFilterSummaryText(filters: FilterState): string | null {
  const hasSaleType = Boolean(filters.saleType);
  const hasListingType = Boolean(filters.listingType);
  const hasLocation = Boolean(filters.cityId || filters.cityName);
  const hasSecondary = Boolean(
    filters.minPrice ||
    filters.maxPrice ||
    filters.minSize ||
    filters.maxSize ||
    filters.br ||
    filters.wc
  );

  // Return null if no filter criteria are active
  if (!hasSaleType && !hasListingType && !hasLocation && !hasSecondary) {
    return null;
  }

  // 1. Transaction: "Cho thuê", "Cần bán", or "Cho thuê/Bán"
  let actionText = 'Cho thuê/Bán';
  if (filters.saleType === 'RENT') {
    actionText = 'Cho thuê';
  } else if (filters.saleType === 'SALE') {
    actionText = 'Cần bán';
  }

  // 2. Listing type: "Căn hộ/Chung cư", "Nhà phố", etc.
  let typeText = 'Bất động sản';
  if (filters.listingType && LISTING_TYPE_SLUGS[filters.listingType]) {
    typeText = LISTING_TYPE_SLUGS[filters.listingType].label;
  }

  // 3. Location: "tại Đà Nẵng, Liên Chiểu, Hòa Minh" or "trên toàn quốc"
  let locationText = '';
  const locNames = [filters.cityName, filters.districtName, filters.wardName].filter(Boolean);

  if (locNames.length > 0) {
    locationText = ` tại ${locNames.join(', ')}`;
  } else if (hasListingType || hasSaleType || hasSecondary) {
    locationText = ' trên toàn quốc';
  }

  return `${actionText} ${typeText}${locationText}`;
}

/**
 * Parses URL pathname and searchParams into FilterState and searchTerm.
 * Supports both clean path slugs and query param fallbacks.
 */
export async function parseFilterUrl(
  pathname: string,
  searchParams: URLSearchParams,
  apiUrl = 'http://localhost:3000'
): Promise<{ filters: FilterState; searchTerm: string }> {
  const filters: FilterState = {};
  const searchTerm = searchParams.get('search') || '';

  // Secondary query params
  if (searchParams.get('minPrice')) filters.minPrice = searchParams.get('minPrice')!;
  if (searchParams.get('maxPrice')) filters.maxPrice = searchParams.get('maxPrice')!;
  if (searchParams.get('minSize')) filters.minSize = searchParams.get('minSize')!;
  if (searchParams.get('maxSize')) filters.maxSize = searchParams.get('maxSize')!;
  if (searchParams.get('br')) filters.br = searchParams.get('br')!;
  if (searchParams.get('wc')) filters.wc = searchParams.get('wc')!;

  // Fallbacks from query params if specified
  if (searchParams.get('saleType')) {
    filters.saleType = searchParams.get('saleType') as FilterState['saleType'];
  }
  if (searchParams.get('listingType')) {
    filters.listingType = searchParams.get('listingType')!;
  }
  if (searchParams.get('cityId')) {
    const c = findCityByIdOrSlug(searchParams.get('cityId')!);
    if (c) {
      filters.cityId = c.id;
      filters.cityName = c.name;
    }
  }
  if (searchParams.get('districtId') && filters.cityId) {
    const d = findDistrictByIdOrSlug(filters.cityId, searchParams.get('districtId')!);
    if (d) {
      filters.districtId = d.id;
      filters.districtName = d.name;
    }
  }

  // Extract path segments (excluding empty strings)
  const segments = pathname.split('/').filter(Boolean);

  // If path is root '/' or no segments, return query-parsed filters
  if (segments.length === 0) {
    return { filters, searchTerm };
  }

  // Helper matchers
  const isSaleTypeSlug = (s: string) => s === 'cho-thue' || s === 'can-ban' || s === 'cho-thue-can-ban';
  const isListingTypeSlug = (s: string) => Object.values(LISTING_TYPE_SLUGS).some((item) => item.slug === s);

  for (const seg of segments) {
    // Check if segment is saleType
    if (isSaleTypeSlug(seg)) {
      if (seg === 'cho-thue') filters.saleType = 'RENT';
      else if (seg === 'can-ban') filters.saleType = 'SALE';
      else if (seg === 'cho-thue-can-ban') filters.saleType = '';
      continue;
    }

    // Check if segment is listingType
    if (isListingTypeSlug(seg)) {
      const found = Object.entries(LISTING_TYPE_SLUGS).find(([, item]) => item.slug === seg);
      if (found) {
        filters.listingType = found[0];
      }
      continue;
    }

    // Otherwise, attempt to parse as Location slug (e.g., 'da-nang-lien-chieu-hoa-minh' or 'da-nang')
    await parseLocationSlug(seg, filters, apiUrl);
  }

  return { filters, searchTerm };
}

/**
 * Resolves combined location slug (e.g. 'da-nang-lien-chieu-hoa-minh')
 * hierarchically to City, District, and Ward.
 */
async function parseLocationSlug(slug: string, filters: FilterState, apiUrl: string) {
  if (!slug) return;

  // 1. Match City
  // Sort cities by slug length descending to match 'ho-chi-minh' before 'ha-noi'
  const city = CITIES.find((c) => slug === c.slug || slug.startsWith(`${c.slug}-`));
  if (!city) return;

  filters.cityId = city.id;
  filters.cityName = city.name;

  if (slug === city.slug) {
    return; // Exact city match only
  }

  // Remainder after city slug
  let remainder = slug.slice(city.slug.length).replace(/^-+/, '');
  if (!remainder) return;

  // 2. Match District in this City
  const cityDistricts = DISTRICTS.filter((d) => d.cityId === city.id).sort(
    (a, b) => b.slug.length - a.slug.length
  );

  const district = cityDistricts.find(
    (d) => remainder === d.slug || remainder.startsWith(`${d.slug}-`)
  );

  if (!district) return;

  filters.districtId = district.id;
  filters.districtName = district.name;

  if (remainder === district.slug) {
    return; // Exact district match
  }

  // Remainder after district slug
  remainder = remainder.slice(district.slug.length).replace(/^-+/, '');
  if (!remainder) return;

  // 3. Match Ward in this District
  try {
    const wards = await getWardsForDistrict(district.id, apiUrl);
    const ward = wards.find((w) => w.slug === remainder);
    if (ward) {
      filters.wardId = ward.id;
      filters.wardName = ward.name;
    } else {
      // Humanize remaining slug if ward wasn't found in cache
      filters.wardName = remainder
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
  } catch {
    filters.wardName = remainder
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
