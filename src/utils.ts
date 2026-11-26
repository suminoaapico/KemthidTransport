import type { DailyExpense, DailyExpenseType, ExpenseCategory, TaxRuleItem } from './types';

/**
 * Converts a numeric value into the official Thai Baht text representation.
 * Example: 4158.00 -> "สี่พันหนึ่งร้อยห้าสิบแปดบาทถ้วน"
 */
export function arabicToThaiBaht(value: number): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "ศูนย์บาทถ้วน";
  }

  // Handle negative values
  const isNegative = value < 0;
  const absValue = Math.abs(value);

  // Round to 2 decimal places to avoid floating point precision issues
  const roundedValue = Math.round(absValue * 100) / 100;
  if (roundedValue === 0) {
    return "ศูนย์บาทถ้วน";
  }

  const parts = roundedValue.toFixed(2).split(".");
  const baht = parts[0];
  const satang = parts[1];

  let bahtText = convertDigitsToThai(baht);
  let satangText = "";

  if (parseInt(satang) > 0) {
    satangText = convertDigitsToThai(satang) + "สตางค์";
  } else {
    satangText = "ถ้วน";
  }

  const result = (isNegative ? "ลบ" : "") + bahtText + "บาท" + satangText;
  return result;
}

function convertDigitsToThai(numStr: string): string {
  const THAI_NUMBERS = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
  const THAI_POSITIONS = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];

  let text = "";
  const len = numStr.length;

  // Handle segments of 6 digits (millions)
  if (len > 6) {
    const millionPart = numStr.substring(0, len - 6);
    const remainingPart = numStr.substring(len - 6);
    return convertDigitsToThai(millionPart) + "ล้าน" + convertDigitsToThai(remainingPart);
  }

  for (let i = 0; i < len; i++) {
    const digit = parseInt(numStr.charAt(i));
    const position = len - 1 - i;

    if (digit !== 0) {
      let digitText = THAI_NUMBERS[digit];

      // Special rule: "สิบ" positions
      if (position === 1) {
        if (digit === 1) {
          digitText = ""; // "สิบ" instead of "หนึ่งสิบ"
        } else if (digit === 2) {
          digitText = "ยี่"; // "ยี่สิบ" instead of "สองสิบ"
        }
      }

      // Special rule: "หน่วย" positions (only when len > 1)
      if (position === 0 && len > 1 && digit === 1) {
        // If the preceding digit is NOT 0, it ends with "เอ็ด"
        // Wait, for numbers like 101, 11, we use "เอ็ด"
        const precedingDigit = parseInt(numStr.charAt(i - 1));
        if (len > 1) {
          digitText = "เอ็ด";
        }
      }

      text += digitText + THAI_POSITIONS[position];
    }
  }

  // Remove "ศูนย์" prefix if any (unless it's just "ศูนย์")
  if (text === "" && numStr === "0") {
    return "ศูนย์";
  }

  return text;
}

/**
 * Format currency to Thai Baht style
 * Example: 1847.48 -> ฿1,847.48
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a date string (YYYY-MM-DD or ISO) into standard DD/MM/YYYY
 * Example: "2026-08-28" -> "28/08/2026"
 */
export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  const clean = String(dateStr).split('T')[0].trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
    return clean;
  }
  const parts = clean.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    return `${day}/${month}/${year}`;
  }
  return clean;
}

/**
 * Helper to get status bar color in Google Sheet style
 */
export function getStatusStyle(status: string): string {
  switch (status) {
    case "รอดำเนินการ":
    case "ยังไม่ได้เคลียร์":
    case "ยังไม่ได้รับเงิน":
    case "ยังไม่จ่าย":
    case "Unpaid":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "กำลังขนส่ง":
    case "ยังไม่ถึงกำหนด":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "ส่งแล้ว":
    case "ใกล้ครบกำหนด":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "วางบิลแล้ว":
    case "เกินกำหนด":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "รับเงินแล้ว":
    case "จ่ายแล้ว":
    case "Paid":
    case "Available":
      return "bg-green-100 text-green-800 border-green-200";
    case "Maintenance":
    case "On Duty":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

/**
 * Generates sequential monthly invoice numbers in the format KTTYYYYMM###
 * Each new month automatically resets sequence to 001.
 * Example:
 * 31/08/2026 -> KTT202608099 (if 98 existed)
 * 01/09/2026 -> KTT202609001 (new month starts at 001)
 * 01/10/2026 -> KTT202610001 (month 10 starts at 001)
 */
export function generateMonthlyInvoiceNo(
  dateStr?: string | null,
  existingInvoices: { invoiceNo: string; date?: string }[] = []
): string {
  const cleanDate = dateStr ? String(dateStr).split('T')[0] : new Date().toISOString().split('T')[0];
  const parts = cleanDate.split('-');
  const year = parts[0] || String(new Date().getFullYear());
  const month = (parts[1] || String(new Date().getMonth() + 1)).padStart(2, '0');
  const targetPrefix = `KTT${year}${month}`;

  let maxSeq = 0;

  for (const inv of existingInvoices) {
    if (!inv || !inv.invoiceNo) continue;
    const rawNo = String(inv.invoiceNo).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    
    // Check if starts with KTTYYYYMM
    if (rawNo.startsWith(targetPrefix)) {
      const seqStr = rawNo.substring(targetPrefix.length);
      const seqNum = parseInt(seqStr, 10);
      if (!isNaN(seqNum) && seqNum > maxSeq) {
        maxSeq = seqNum;
      }
    } else if (inv.date) {
      // Fallback check by invoice.date if invoiceNo had older custom format
      const invDateParts = String(inv.date).split('T')[0].split('-');
      if (invDateParts[0] === year && invDateParts[1] === month) {
        const matches = rawNo.match(/\d+$/);
        if (matches) {
          const num = parseInt(matches[0], 10);
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
          }
        }
      }
    }
  }

  const nextSeq = maxSeq + 1;
  const seqPadded = String(nextSeq).padStart(3, '0');
  return `${targetPrefix}${seqPadded}`;
}

/**
 * Default configurable Withholding Tax rules for document line items (Invoices / Receipts).
 * Users can add, edit, delete, toggle, and change % rates directly in the Tax Rules window.
 */
export const DEFAULT_TAX_RULES: TaxRuleItem[] = [
  {
    id: 'RULE-XRAY',
    name: 'X-ray',
    aliases: ['x-rey', 'ค่า x-ray', 'ค่า x-rey'],
    taxRate: 1,
    isActive: true,
    note: 'ค่าบริการ X-ray ตู้สินค้า',
  },
  {
    id: 'RULE-INSPECT',
    name: 'เปิดตรวจ',
    aliases: ['ค่าเปิดตรวจ'],
    taxRate: 1,
    isActive: true,
    note: 'ค่าบริการเปิดตรวจตู้สินค้า',
  },
  {
    id: 'RULE-EMPTY-HAUL',
    name: 'ลากตู้เปล่า',
    aliases: ['ค่าลากตู้เปล่า'],
    taxRate: 1,
    isActive: true,
    note: 'ค่าลากตู้เปล่า',
  },
  {
    id: 'RULE-HEAVY-HAUL',
    name: 'ลากตู้หนัก',
    aliases: ['ค่าลากตู้หนัก'],
    taxRate: 1,
    isActive: true,
    note: 'ค่าลากตู้หนัก',
  },
  {
    id: 'RULE-TRAILER-HOLD',
    name: 'ค้างหาง',
    aliases: ['ค่าค้างหาง'],
    taxRate: 1,
    isActive: true,
    note: 'ค่าค้างหางพ่วง',
  },
  {
    id: 'RULE-TRANSPORT',
    name: 'Transportation',
    aliases: ['ค่าขนส่ง', 'ค่าขนส่งสินค้า'],
    taxRate: 0,
    isActive: true,
    note: 'ค่าขนส่งหลัก (ปรับ % ได้ตามต้องการ)',
  },
  {
    id: 'RULE-OVERTIME',
    name: 'Overtime',
    aliases: ['ot', 'ค่าล่วงเวลา', 'ค่า ot'],
    taxRate: 0,
    isActive: true,
    note: 'ค่าล่วงเวลา (OT)',
  },
  {
    id: 'RULE-PORT-CHARGE',
    name: 'Port Charge',
    aliases: ['ค่าท่าเรือ', 'port charge'],
    taxRate: 0,
    isActive: true,
    note: 'ค่าธรรมเนียมท่าเรือ',
  },
  {
    id: 'RULE-HANDLING',
    name: 'Container Handling',
    aliases: ['ค่ายกตู้', 'handling'],
    taxRate: 0,
    isActive: true,
    note: 'ค่าจัดการตู้สินค้า',
  },
  {
    id: 'RULE-LIFTONOFF',
    name: 'Lift On / Lift Off',
    aliases: ['life on / life off', 'lift on/off', 'lift on / off'],
    taxRate: 0,
    isActive: true,
    note: 'ค่ายกตู้ขึ้น-ลง',
  },
  {
    id: 'RULE-DROP',
    name: 'Drop',
    aliases: ['ค่า drop', 'drop'],
    taxRate: 0,
    isActive: true,
    note: 'ค่า Drop ตู้',
  },
  {
    id: 'RULE-SHORE',
    name: 'Shore',
    aliases: ['ค่า shore', 'shore'],
    taxRate: 0,
    isActive: true,
    note: 'ค่า Shore',
  },
];

function normalizeRuleToken(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function stripThaiFeePrefix(s: string): string {
  return s.startsWith('ค่า') ? s.slice(3).trim() : s;
}

/**
 * Looks up the configured Withholding Tax percentage (%) for any document line item name.
 * Matches exact name, aliases, or with/without leading "ค่า" prefix (case-insensitive).
 */
export function getItemTaxRate(
  itemName: string,
  taxRules?: TaxRuleItem[] | null
): number {
  if (!itemName) return 0;
  const rules = taxRules && taxRules.length > 0 ? taxRules : DEFAULT_TAX_RULES;
  const target = normalizeRuleToken(itemName);
  const targetNoPrefix = stripThaiFeePrefix(target);

  for (const rule of rules) {
    if (!rule.isActive) continue;
    const rate = Number(rule.taxRate);
    if (!Number.isFinite(rate) || rate < 0) continue;

    const candidates = [rule.name, ...(rule.aliases || [])]
      .filter(Boolean)
      .map(normalizeRuleToken);

    for (const c of candidates) {
      if (c === target || stripThaiFeePrefix(c) === targetNoPrefix) {
        return Math.round(rate * 100) / 100;
      }
    }
  }
  return 0;
}

/**
 * Formats a clean Thai WHT label for documents (e.g. "ภาษีหัก ณ ที่จ่าย 1%", "ภาษีหัก ณ ที่จ่าย 3%", or "ภาษีหัก ณ ที่จ่าย (1%, 3%)")
 */
export function formatTaxRateLabel(appliedRates: number[], fallbackRules?: TaxRuleItem[] | null): string {
  const uniquePositive = Array.from(
    new Set(appliedRates.filter((r) => Number.isFinite(r) && r > 0))
  ).sort((a, b) => a - b);

  if (uniquePositive.length === 1) {
    return `ภาษีหัก ณ ที่จ่าย ${uniquePositive[0]}%`;
  }
  if (uniquePositive.length > 1) {
    return `ภาษีหัก ณ ที่จ่าย (${uniquePositive.map((r) => `${r}%`).join(', ')})`;
  }

  // If no taxable items on this doc, check if active rules share a single positive rate
  const rules = fallbackRules && fallbackRules.length > 0 ? fallbackRules : DEFAULT_TAX_RULES;
  const activePositiveRates = Array.from(
    new Set(rules.filter((r) => r.isActive && r.taxRate > 0).map((r) => r.taxRate))
  ).sort((a, b) => a - b);

  if (activePositiveRates.length === 1) {
    return `ภาษีหัก ณ ที่จ่าย ${activePositiveRates[0]}%`;
  }
  return 'ภาษีหัก ณ ที่จ่าย';
}

/**
 * Legacy helper checking if an item name is taxable under default/supplied rules.
 */
export function isTaxable1Percent(name: string, taxRules?: TaxRuleItem[] | null): boolean {
  return getItemTaxRate(name, taxRules) > 0;
}

export const DRIVER_EXPENSE_TYPES: DailyExpenseType[] = [
  'ค่าจ้างคนขับรถ',
  'ค่าเที่ยวรถ',
  'ค่าขนส่งที่จ่ายให้คนขับรถ',
  'ค่าใช้จ่ายคนขับรถ',
  'ค่าแรงคนขับรถ',
];

export const GENERAL_NORMAL_EXPENSE_TYPES: DailyExpenseType[] = [
  'น้ำมัน',
  'ค่าน้ำมัน',
  'ค่าอาหาร',
  'ทางด่วน',
  'ค่าทางด่วน',
  'ค่าซ่อม',
  'ค่าโรงแรม',
  'ค่าอุปกรณ์สำนักงาน',
  'ค่าเดินทางทั่วไป',
  'ค่าใช้จ่ายบริษัททั่วไป',
  'advance รถร่วม',
  'ค่าแรง',
  'อื่นๆ',
];

export const GENERAL_ADV_EXPENSE_TYPES: DailyExpenseType[] = [
  'Life on / Life off',
  'Port Charge',
  'Shore',
  'Drop',
  'อื่นๆ',
];

export const ALL_EXPENSE_TYPES: DailyExpenseType[] = Array.from(
  new Set([
    ...DRIVER_EXPENSE_TYPES,
    ...GENERAL_NORMAL_EXPENSE_TYPES,
    ...GENERAL_ADV_EXPENSE_TYPES,
  ])
);

/**
 * Determines whether an expense is categorized as a "Driver" expense
 * eligible for 1% Withholding Tax deduction.
 */
export function isDriverExpenseType(
  type?: string | null,
  explicitCategory?: ExpenseCategory | null
): boolean {
  if (explicitCategory === 'driver') return true;
  if (explicitCategory === 'general') return false;
  if (!type) return false;
  const trimmed = type.trim();
  if ((DRIVER_EXPENSE_TYPES as string[]).includes(trimmed)) return true;
  return trimmed.includes('คนขับรถ') || trimmed.includes('ค่าเที่ยว');
}

export interface DriverTaxCalculationResult {
  expenseCategory: ExpenseCategory;
  amount: number;
  withholdingTaxRate: 0 | 1;
  withholdingTaxAmount: number;
  netAmount: number;
}

/**
 * Business Rule: 1% Withholding Tax applies ONLY to Driver-related expenses.
 * Non-driver expenses (food, fuel, hotel, office supplies, general) have 0% WHT.
 */
export function calculateDriverExpenseTax(
  amount: number,
  expenseCategory: ExpenseCategory
): DriverTaxCalculationResult {
  const safeAmount =
    Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : 0;

  if (expenseCategory === 'driver') {
    const withholdingTaxAmount = Math.round(safeAmount * 0.01 * 100) / 100;
    const netAmount = Math.round((safeAmount - withholdingTaxAmount) * 100) / 100;
    return {
      expenseCategory: 'driver',
      amount: safeAmount,
      withholdingTaxRate: 1,
      withholdingTaxAmount,
      netAmount,
    };
  }

  return {
    expenseCategory: 'general',
    amount: safeAmount,
    withholdingTaxRate: 0,
    withholdingTaxAmount: 0,
    netAmount: safeAmount,
  };
}

/**
 * Normalizes any DailyExpense record (including legacy Firestore docs)
 * so tax fields are always consistent with the 1% Driver WHT rule.
 */
export function normalizeExpenseRecord(exp: Partial<DailyExpense>): DailyExpense {
  const rawType = (exp.type || 'อื่นๆ') as DailyExpenseType;
  const resolvedCategory: ExpenseCategory =
    exp.expenseCategory === 'driver' || exp.expenseCategory === 'general'
      ? exp.expenseCategory
      : isDriverExpenseType(rawType)
        ? 'driver'
        : 'general';
  const calc = calculateDriverExpenseTax(Number(exp.amount) || 0, resolvedCategory);

  return {
    id: exp.id || '',
    jobNo: exp.jobNo || '',
    containerNo: exp.containerNo || '',
    date: exp.date || '',
    type: rawType,
    expenseCategory: calc.expenseCategory,
    description: exp.description || '',
    vehicleLicense: exp.vehicleLicense || '',
    driverName: exp.driverName || '',
    amount: calc.amount,
    withholdingTaxRate: calc.withholdingTaxRate,
    withholdingTaxAmount: calc.withholdingTaxAmount,
    netAmount: calc.netAmount,
    note: exp.note || '',
    billType: exp.billType === 'Adv' ? 'Adv' : 'Normal',
  };
}



