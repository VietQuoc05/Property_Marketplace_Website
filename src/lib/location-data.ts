export function toSlug(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface CityData {
  id: string;
  name: string;
  slug: string;
}

export interface DistrictData {
  id: string;
  name: string;
  cityId: string;
  slug: string;
}

export interface WardData {
  id: string;
  name: string;
  districtId: string;
  slug: string;
}

export const CITIES: CityData[] = [
  { id: 'HCM', name: 'Hồ Chí Minh', slug: 'ho-chi-minh' },
  { id: 'HN', name: 'Hà Nội', slug: 'ha-noi' },
  { id: 'DN', name: 'Đà Nẵng', slug: 'da-nang' },
];

export const DISTRICTS: DistrictData[] = [
  { id: 'HCM_THU_DUC', name: 'Thủ Đức', cityId: 'HCM', slug: 'thu-duc' },
  { id: 'HCM_Q1', name: 'Quận 1', cityId: 'HCM', slug: 'quan-1' },
  { id: 'HCM_Q3', name: 'Quận 3', cityId: 'HCM', slug: 'quan-3' },
  { id: 'HCM_Q4', name: 'Quận 4', cityId: 'HCM', slug: 'quan-4' },
  { id: 'HCM_Q5', name: 'Quận 5', cityId: 'HCM', slug: 'quan-5' },
  { id: 'HCM_Q6', name: 'Quận 6', cityId: 'HCM', slug: 'quan-6' },
  { id: 'HCM_Q7', name: 'Quận 7', cityId: 'HCM', slug: 'quan-7' },
  { id: 'HCM_Q8', name: 'Quận 8', cityId: 'HCM', slug: 'quan-8' },
  { id: 'HCM_Q10', name: 'Quận 10', cityId: 'HCM', slug: 'quan-10' },
  { id: 'HCM_Q11', name: 'Quận 11', cityId: 'HCM', slug: 'quan-11' },
  { id: 'HCM_Q12', name: 'Quận 12', cityId: 'HCM', slug: 'quan-12' },
  { id: 'HCM_BINH_TAN', name: 'Bình Tân', cityId: 'HCM', slug: 'binh-tan' },
  { id: 'HCM_BINH_THANH', name: 'Bình Thạnh', cityId: 'HCM', slug: 'binh-thanh' },
  { id: 'HCM_GO_VAP', name: 'Gò Vấp', cityId: 'HCM', slug: 'go-vap' },
  { id: 'HCM_PHU_NHUAN', name: 'Phú Nhuận', cityId: 'HCM', slug: 'phu-nhuan' },
  { id: 'HCM_TAN_BINH', name: 'Tân Bình', cityId: 'HCM', slug: 'tan-binh' },
  { id: 'HCM_TAN_PHU', name: 'Tân Phú', cityId: 'HCM', slug: 'tan-phu' },
  { id: 'HCM_BINH_CHANH', name: 'Bình Chánh', cityId: 'HCM', slug: 'binh-chanh' },
  { id: 'HCM_CAN_GIO', name: 'Cần Giờ', cityId: 'HCM', slug: 'can-gio' },
  { id: 'HCM_CU_CHI', name: 'Củ Chi', cityId: 'HCM', slug: 'cu-chi' },
  { id: 'HCM_HOC_MON', name: 'Hóc Môn', cityId: 'HCM', slug: 'hoc-mon' },
  { id: 'HCM_NHA_BE', name: 'Nhà Bè', cityId: 'HCM', slug: 'nha-be' },
  { id: 'HN_BA_DINH', name: 'Ba Đình', cityId: 'HN', slug: 'ba-dinh' },
  { id: 'HN_HOAN_KIEM', name: 'Hoàn Kiếm', cityId: 'HN', slug: 'hoan-kiem' },
  { id: 'HN_TAY_HO', name: 'Tây Hồ', cityId: 'HN', slug: 'tay-ho' },
  { id: 'HN_LONG_BIEN', name: 'Long Biên', cityId: 'HN', slug: 'long-bien' },
  { id: 'HN_CAU_GIAY', name: 'Cầu Giấy', cityId: 'HN', slug: 'cau-giay' },
  { id: 'HN_DONG_DA', name: 'Đống Đa', cityId: 'HN', slug: 'dong-da' },
  { id: 'HN_HAI_BA_TRUNG', name: 'Hai Bà Trưng', cityId: 'HN', slug: 'hai-ba-trung' },
  { id: 'HN_HOANG_MAI', name: 'Hoàng Mai', cityId: 'HN', slug: 'hoang-mai' },
  { id: 'HN_THANH_XUAN', name: 'Thanh Xuân', cityId: 'HN', slug: 'thanh-xuan' },
  { id: 'HN_SOC_SON', name: 'Sóc Sơn', cityId: 'HN', slug: 'soc-son' },
  { id: 'HN_DONG_ANH', name: 'Đông Anh', cityId: 'HN', slug: 'dong-anh' },
  { id: 'HN_GIA_LAM', name: 'Gia Lâm', cityId: 'HN', slug: 'gia-lam' },
  { id: 'HN_NAM_TU_LIEM', name: 'Nam Từ Liêm', cityId: 'HN', slug: 'nam-tu-liem' },
  { id: 'HN_THANH_TRI', name: 'Thanh Trì', cityId: 'HN', slug: 'thanh-tri' },
  { id: 'HN_BAC_TU_LIEM', name: 'Bắc Từ Liêm', cityId: 'HN', slug: 'bac-tu-liem' },
  { id: 'HN_ME_LINH', name: 'Mê Linh', cityId: 'HN', slug: 'me-linh' },
  { id: 'HN_HA_DONG', name: 'Hà Đông', cityId: 'HN', slug: 'ha-dong' },
  { id: 'HN_SON_TAY', name: 'Sơn Tây', cityId: 'HN', slug: 'son-tay' },
  { id: 'HN_BA_VI', name: 'Ba Vì', cityId: 'HN', slug: 'ba-vi' },
  { id: 'HN_PHUC_THO', name: 'Phúc Thọ', cityId: 'HN', slug: 'phuc-tho' },
  { id: 'HN_DAN_PHUONG', name: 'Đan Phượng', cityId: 'HN', slug: 'dan-phuong' },
  { id: 'HN_HOAI_DUC', name: 'Hoài Đức', cityId: 'HN', slug: 'hoai-duc' },
  { id: 'HN_QUOC_OAI', name: 'Quốc Oai', cityId: 'HN', slug: 'quoc-oai' },
  { id: 'HN_THACH_THAT', name: 'Thạch Thất', cityId: 'HN', slug: 'thach-that' },
  { id: 'HN_CHUONG_MY', name: 'Chương Mỹ', cityId: 'HN', slug: 'chuong-my' },
  { id: 'HN_THANH_OAI', name: 'Thanh Oai', cityId: 'HN', slug: 'thanh-oai' },
  { id: 'HN_THUONG_TIN', name: 'Thường Tín', cityId: 'HN', slug: 'thuong-tin' },
  { id: 'HN_PHU_XUYEN', name: 'Phú Xuyên', cityId: 'HN', slug: 'phu-xuyen' },
  { id: 'HN_UNG_HOA', name: 'Ứng Hòa', cityId: 'HN', slug: 'ung-hoa' },
  { id: 'HN_MY_DUC', name: 'Mỹ Đức', cityId: 'HN', slug: 'my-duc' },
  { id: 'DN_LIEN_CHIEU', name: 'Liên Chiểu', cityId: 'DN', slug: 'lien-chieu' },
  { id: 'DN_THANH_KHE', name: 'Thanh Khê', cityId: 'DN', slug: 'thanh-khe' },
  { id: 'DN_HAI_CHAU', name: 'Hải Châu', cityId: 'DN', slug: 'hai-chau' },
  { id: 'DN_SON_TRA', name: 'Sơn Trà', cityId: 'DN', slug: 'son-tra' },
  { id: 'DN_NGU_HANH_SON', name: 'Ngũ Hành Sơn', cityId: 'DN', slug: 'ngu-hanh-son' },
  { id: 'DN_CAM_LE', name: 'Cẩm Lệ', cityId: 'DN', slug: 'cam-le' },
  { id: 'DN_HOA_VANG', name: 'Hòa Vang', cityId: 'DN', slug: 'hoa-vang' },
  { id: 'DN_HOANG_SA', name: 'Hoàng Sa', cityId: 'DN', slug: 'hoang-sa' },
];

// In-memory cache for wards by districtId
const wardsCache = new Map<string, WardData[]>();

export async function getWardsForDistrict(districtId: string, apiUrl = 'http://localhost:3000'): Promise<WardData[]> {
  if (wardsCache.has(districtId)) {
    return wardsCache.get(districtId)!;
  }

  try {
    const res = await fetch(`${apiUrl}/locations/districts/${districtId}/wards`);
    if (res.ok) {
      const data: Array<{ id: string; name: string; districtId: string }> = await res.json();
      const mapped: WardData[] = data.map((w) => ({
        id: w.id,
        name: w.name,
        districtId: w.districtId,
        slug: toSlug(w.name),
      }));
      wardsCache.set(districtId, mapped);
      return mapped;
    }
  } catch (err) {
    console.warn(`Failed to fetch wards for district ${districtId}:`, err);
  }

  return [];
}

export function findCityByIdOrSlug(idOrSlug: string): CityData | undefined {
  if (!idOrSlug) return undefined;
  const s = idOrSlug.toLowerCase();
  return CITIES.find((c) => c.id.toLowerCase() === s || c.slug === s || (c.id === 'HCM' && s === 'hcm') || (c.id === 'HN' && s === 'hn') || (c.id === 'DN' && s === 'dn'));
}

export function findDistrictByIdOrSlug(cityId: string, idOrSlug: string): DistrictData | undefined {
  if (!idOrSlug) return undefined;
  const s = idOrSlug.toLowerCase();
  return DISTRICTS.find((d) => d.cityId === cityId && (d.id.toLowerCase() === s || d.slug === s));
}

