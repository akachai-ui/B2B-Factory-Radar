/**
 * Helper utilities for B2B Lead Health & Inactive Days Calculation
 */

export interface ContactHealth {
  days: number;
  label: string;
  shortLabel: string;
  badgeClass: string;
  dotColor: string;
  isStale: boolean;
  isCritical: boolean;
}

export function getLeadLastContactDate(lead?: {
  last_activity_at?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
}): string | null {
  if (!lead) return null;
  return lead.last_activity_at || lead.updated_at || lead.created_at || null;
}

export function calculateContactHealth(dateStr?: string | null): ContactHealth {
  if (!dateStr) {
    return {
      days: 999,
      label: 'ยังไม่เคยติดต่อ',
      shortLabel: 'ไม่ระบุ',
      badgeClass: 'bg-slate-800 text-slate-400 border-slate-700',
      dotColor: 'bg-slate-500',
      isStale: true,
      isCritical: false,
    };
  }

  try {
    const now = new Date();
    const date = new Date(dateStr);
    
    // Invalid date check
    if (isNaN(date.getTime())) {
      return {
        days: 999,
        label: 'ยังไม่เคยติดต่อ',
        shortLabel: 'ไม่ระบุ',
        badgeClass: 'bg-slate-800 text-slate-400 border-slate-700',
        dotColor: 'bg-slate-500',
        isStale: true,
        isCritical: false,
      };
    }

    const diffMs = now.getTime() - date.getTime();
    const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    if (days === 0) {
      return {
        days: 0,
        label: '🟢 ติดต่อวันนี้',
        shortLabel: 'วันนี้',
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        dotColor: 'bg-emerald-400',
        isStale: false,
        isCritical: false,
      };
    } else if (days === 1) {
      return {
        days: 1,
        label: '🟢 เมื่อวาน',
        shortLabel: '1 วัน',
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        dotColor: 'bg-emerald-400',
        isStale: false,
        isCritical: false,
      };
    } else if (days <= 6) {
      return {
        days,
        label: `🟢 ${days} วันที่แล้ว`,
        shortLabel: `${days} วัน`,
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        dotColor: 'bg-emerald-400',
        isStale: false,
        isCritical: false,
      };
    } else if (days <= 13) {
      return {
        days,
        label: `🟡 ขาดติดต่อ ${days} วัน`,
        shortLabel: `${days} วัน`,
        badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-medium',
        dotColor: 'bg-amber-400',
        isStale: true,
        isCritical: false,
      };
    } else if (days <= 29) {
      return {
        days,
        label: `🟠 ขาดติดต่อ ${days} วัน`,
        shortLabel: `${days} วัน`,
        badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/30 font-bold',
        dotColor: 'bg-orange-400',
        isStale: true,
        isCritical: false,
      };
    } else {
      return {
        days,
        label: `🔴 ขาดติดต่อ ${days} วัน (เสี่ยงหลุด)`,
        shortLabel: `${days} วัน`,
        badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-black',
        dotColor: 'bg-rose-500',
        isStale: true,
        isCritical: true,
      };
    }
  } catch {
    return {
      days: 999,
      label: 'ไม่ระบุ',
      shortLabel: 'ไม่ระบุ',
      badgeClass: 'bg-slate-800 text-slate-400 border-slate-700',
      dotColor: 'bg-slate-500',
      isStale: false,
      isCritical: false,
    };
  }
}

/**
 * Obfuscates company name for Preview Mode (PENDING_APPROVAL)
 * Keeps first ~6-8 characters, appends asterisk mask and (Pro) tag.
 * E.g., "บริษัท แหลมฟ้าผ่า โลจิสติก จำกัด" -> "บริษัท แหลมฟ้า*** (Pro)"
 */
export function maskCompanyName(name?: string | null, isPro: boolean = false): string {
  if (!name) return '-';
  if (isPro) return name;

  const trimmed = name.trim();
  if (trimmed.length <= 8) {
    return `${trimmed.slice(0, 3)}*** (Pro)`;
  }
  return `${trimmed.slice(0, 8)}*** (Pro)`;
}

/**
 * Obfuscates factory detailed address for Preview Mode (PENDING_APPROVAL)
 * Hides house numbers, moo, sois, roads and only displays district & province.
 * E.g., "เลขที่ 327/3 หมู่ 13 ต. สุขสวัสดิ์..." -> "อำเภอเมืองสมุทรปราการ สมุทรปราการ (ที่อยู่ละเอียดสงวนสิทธิ์ Pro)"
 */
export function maskAddress(
  address?: string | null,
  district?: string | null,
  province?: string | null,
  isPro: boolean = false
): string {
  if (isPro) return address || '-';

  const parts = [];
  if (district) parts.push(district.startsWith('อ.') || district.startsWith('อำเภอ') ? district : `อ.${district}`);
  if (province) parts.push(province.startsWith('จ.') || province.startsWith('จังหวัด') ? province : `จ.${province}`);

  const areaStr = parts.length > 0 ? parts.join(' ') : 'สมุทรปราการ';
  return `${areaStr} (ที่อยู่ละเอียดสงวนสิทธิ์ Pro)`;
}
