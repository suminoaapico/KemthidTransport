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
