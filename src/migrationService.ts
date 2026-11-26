import {
  AppDataState,
  EMPTY_APP_STATE,
  fbSaveCustomer,
  fbSaveDriver,
  fbSaveVehicle,
  fbSaveEmployee,
  fbSaveJob,
  fbSaveExpense,
  fbSaveCreditIncome,
  fbMigrateInvoiceDirect,
  fbMigrateReceiptDirect,
  fbSaveManagerEntry,
  fbSaveSubcontractorPaymentDoc,
  fbSavePartnerPayment,
  fbSaveWithholdingTax,
  fbSavePayroll,
  fbSaveTaxRule,
} from './firebaseService';
import {
  Customer,
  Driver,
  Vehicle,
  Employee,
  TransportJob,
  DailyExpense,
  DailyExpenseType,
  CreditIncome,
  Invoice,
  Receipt,
  ManagerEntry,
  SubcontractorPaymentDoc,
  PartnerPayment,
  WithholdingTaxRecord,
  PayrollRecord,
  ContainerDetail,
  AdvanceItem,
  ExtraInvoiceItem,
  SubcontractorTripItem,
  TaxRuleItem,
} from './types';
import {
  ALL_EXPENSE_TYPES,
  arabicToThaiBaht,
  isDriverExpenseType,
  normalizeExpenseRecord,
} from './utils';

export type DatasetKey = keyof AppDataState;

export interface DatasetMeta {
  key: DatasetKey;
  firestoreCollection: string;
  supabaseTables: string[];
  thaiName: string;
  csvHeaders: string[];
  sampleRow: Record<string, string | number>;
}

export const DATASET_CATALOG: DatasetMeta[] = [
  {
    key: 'customers',
    firestoreCollection: 'customers',
    supabaseTables: ['customers'],
    thaiName: 'ทะเบียนลูกค้า (Customers)',
    csvHeaders: ['id', 'name', 'company', 'phone', 'line', 'creditTerm', 'address', 'taxId'],
    sampleRow: {
      id: 'CUST-001',
      name: 'บริษัท ตัวอย่าง จำกัด',
      company: 'บริษัท ตัวอย่าง จำกัด',
      phone: '038-123-456',
      line: '@example',
      creditTerm: 30,
      address: '123 หมู่ 1 ต.ทุ่งสุขลา อ.ศรีราชา จ.ชลบุรี 20230',
      taxId: '0105560000001',
    },
  },
  {
    key: 'drivers',
    firestoreCollection: 'drivers',
    supabaseTables: ['drivers'],
    thaiName: 'ทะเบียนคนขับรถ (Drivers)',
    csvHeaders: ['id', 'name', 'phone', 'licenseNo', 'expiryDate', 'vehicleLicense', 'status'],
    sampleRow: {
      id: 'DRV-001',
      name: 'นายสมชาย ขับดี',
      phone: '081-234-5678',
      licenseNo: 'ท.3-123456',
      expiryDate: '2028-12-31',
      vehicleLicense: '70-1234 ชลบุรี',
      status: 'Available',
    },
  },
  {
    key: 'vehicles',
    firestoreCollection: 'vehicles',
    supabaseTables: ['vehicles'],
    thaiName: 'ทะเบียนรถ/หางพ่วง (Vehicles)',
    csvHeaders: ['licensePlate', 'type', 'brand', 'year', 'actExpiry', 'insExpiry', 'status', 'ownerType', 'driverId'],
    sampleRow: {
      licensePlate: '70-1234 ชลบุรี',
      type: 'หัวลาก 10 ล้อ',
      brand: 'HINO',
      year: '2023',
      actExpiry: '2027-06-30',
      insExpiry: '2027-06-30',
      status: 'Available',
      ownerType: 'company',
      driverId: '',
    },
  },
  {
    key: 'employees',
    firestoreCollection: 'employees',
    supabaseTables: ['employees'],
    thaiName: 'ทะเบียนพนักงาน (Employees)',
    csvHeaders: ['id', 'name', 'position', 'department', 'phone', 'salary', 'startDate'],
    sampleRow: {
      id: 'EMP-001',
      name: 'น.ส.สุภา ใจดี',
      position: 'เจ้าหน้าที่บัญชี',
      department: 'บัญชีและการเงิน',
      phone: '089-000-1111',
      salary: 20000,
      startDate: '2025-01-01',
    },
  },
  {
    key: 'jobs',
    firestoreCollection: 'transport_jobs',
    supabaseTables: ['transport_jobs', 'jobs'],
    thaiName: 'แผนการวิ่งงาน (Transport Jobs)',
    csvHeaders: [
      'jobNo',
      'date',
      'customerId',
      'customerName',
      'origin',
      'destination',
      'vehicleLicense',
      'driverName',
      'vehicleType',
      'bookingNo',
      'shipper',
      'totalAmount',
      'status',
      'jobType',
      'containerSize',
      'notes',
    ],
    sampleRow: {
      jobNo: 'JOB-20260801-001',
      date: '2026-08-01',
      customerId: 'CUST-001',
      customerName: 'บริษัท ตัวอย่าง จำกัด',
      origin: 'LCB',
      destination: 'อมตะนคร',
      vehicleLicense: '70-1234 ชลบุรี',
      driverName: 'นายสมชาย ขับดี',
      vehicleType: 'หัวลาก 10 ล้อ',
      bookingNo: 'BKK260001',
      shipper: 'SHIPPER A',
      totalAmount: 5500,
      status: 'ส่งแล้ว',
      jobType: 'Import',
      containerSize: '40HC',
      notes: '',
    },
  },
  {
    key: 'expenses',
    firestoreCollection: 'daily_expenses',
    supabaseTables: ['daily_expenses', 'expenses'],
    thaiName: 'ค่าใช้จ่ายรายวัน / ภาษี 1% คนขับรถ',
    csvHeaders: [
      'id',
      'date',
      'type',
      'expenseCategory',
      'description',
      'amount',
      'jobNo',
      'containerNo',
      'vehicleLicense',
      'driverName',
      'billType',
      'note',
    ],
    sampleRow: {
      id: 'EXP-20260801-001',
      date: '2026-08-01',
      type: 'ค่าจ้างคนขับรถ',
      expenseCategory: 'driver',
      description: 'ค่าจ้างคนขับรถเที่ยวแหลมฉบัง',
      amount: 10000,
      jobNo: 'JOB-20260801-001',
      containerNo: 'TEMU1234567',
      vehicleLicense: '70-1234 ชลบุรี',
      driverName: 'นายสมชาย ขับดี',
      billType: 'Normal',
      note: '',
    },
  },
  {
    key: 'incomes',
    firestoreCollection: 'credit_incomes',
    supabaseTables: ['credit_incomes', 'incomes'],
    thaiName: 'ลูกหนี้การค้า / เครดิต (Credit Income)',
    csvHeaders: ['id', 'customerName', 'billingDate', 'creditTerms', 'dueDate', 'amount', 'status'],
    sampleRow: {
      id: 'KTT-2026-08-0001',
      customerName: 'บริษัท ตัวอย่าง จำกัด',
      billingDate: '2026-08-01',
      creditTerms: 30,
      dueDate: '2026-08-31',
      amount: 15000,
      status: 'ยังไม่ถึงกำหนด',
    },
  },
  {
    key: 'invoices',
    firestoreCollection: 'invoices',
    supabaseTables: ['invoices'],
    thaiName: 'ใบแจ้งหนี้ / ใบวางบิล (Invoices)',
    csvHeaders: [
      'invoiceNo',
      'date',
      'customerId',
      'customerName',
      'jobNo',
      'invoiceType',
      'bookingNo',
      'shipper',
      'subtotal',
      'withholdingTax',
      'vatAmount',
      'grandTotal',
      'status',
      'remark',
    ],
    sampleRow: {
      invoiceNo: 'KTT-2026-08-0001',
      date: '2026-08-01',
      customerId: 'CUST-001',
      customerName: 'บริษัท ตัวอย่าง จำกัด',
      jobNo: 'JOB-20260801-001',
      invoiceType: 'Transport',
      bookingNo: 'BKK260001',
      shipper: 'SHIPPER A',
      subtotal: 5500,
      withholdingTax: 0,
      vatAmount: 0,
      grandTotal: 5500,
      status: 'ยังไม่จ่าย',
      remark: '',
    },
  },
  {
    key: 'receipts',
    firestoreCollection: 'receipts',
    supabaseTables: ['receipts'],
    thaiName: 'ใบเสร็จรับเงิน (Receipts)',
    csvHeaders: ['receiptNo', 'date', 'invoiceNo', 'customerName', 'amount', 'paymentMethod', 'receiptType', 'remark'],
    sampleRow: {
      receiptNo: 'RC-TR-2026-0001',
      date: '2026-08-15',
      invoiceNo: 'KTT-2026-08-0001',
      customerName: 'บริษัท ตัวอย่าง จำกัด',
      amount: 5500,
      paymentMethod: 'โอนเงิน',
      receiptType: 'Transport',
      remark: '',
    },
  },
  {
    key: 'partnerPaymentDocs',
    firestoreCollection: 'subcontractor_payment_docs',
    supabaseTables: ['subcontractor_payment_docs', 'partner_payment_docs'],
    thaiName: 'เอกสารทำจ่ายรถร่วม (Subcontractor Payouts)',
    csvHeaders: [
      'id',
      'paymentNo',
      'date',
      'partnerName',
      'vehicleLicense',
      'paymentCycle',
      'subtotalPrice',
      'subtotalOt',
      'totalBeforeDeductions',
      'advanceDeduction',
      'withholdingTax',
      'grandTotal',
      'status',
      'note',
    ],
    sampleRow: {
      id: 'SUB-001',
      paymentNo: 'KTT-AP-2026-08001',
      date: '2026-08-31',
      partnerName: 'หจก.รถร่วมตัวอย่าง',
      vehicleLicense: '71-9999 ชลบุรี',
      paymentCycle: 'สิงหาคม 2026',
      subtotalPrice: 20000,
      subtotalOt: 1000,
      totalBeforeDeductions: 21000,
      advanceDeduction: 2000,
      withholdingTax: 210,
      grandTotal: 18790,
      status: 'ยังไม่ได้จ่าย',
      note: '',
    },
  },
  {
    key: 'partnerPayments',
    firestoreCollection: 'partner_payments',
    supabaseTables: ['partner_payments'],
    thaiName: 'บัญชีจ่ายรถร่วม / รถเช่า (Partner Payments)',
    csvHeaders: ['id', 'date', 'partnerName', 'jobNo', 'paymentType', 'revenue', 'expensesDeduction', 'netPaid', 'status'],
    sampleRow: {
      id: 'PPM-001',
      date: '2026-08-01',
      partnerName: 'นายสมศักดิ์ (รถเช่า)',
      jobNo: 'JOB-20260801-001',
      paymentType: 'RENT_CAR',
      revenue: 4000,
      expensesDeduction: 400,
      netPaid: 3600,
      status: 'จ่ายแล้ว',
    },
  },
  {
    key: 'withholdingTaxes',
    firestoreCollection: 'withholding_taxes',
    supabaseTables: ['withholding_taxes'],
    thaiName: 'ทะเบียนหัก ณ ที่จ่าย (Withholding Taxes)',
    csvHeaders: ['id', 'date', 'payeeName', 'taxIDNumber', 'baseAmount', 'rate', 'taxAmount', 'type'],
    sampleRow: {
      id: 'WHT-001',
      date: '2026-08-01',
      payeeName: 'นายสมชาย ขับดี',
      taxIDNumber: '1234567890123',
      baseAmount: 10000,
      rate: 1,
      taxAmount: 100,
      type: 'Transportation',
    },
  },
  {
    key: 'payroll',
    firestoreCollection: 'payroll',
    supabaseTables: ['payroll', 'payrolls'],
    thaiName: 'สลิปเงินเดือนพนักงาน (Payroll)',
    csvHeaders: ['id', 'employeeId', 'employeeName', 'role', 'payDate', 'salary', 'ot', 'bonus', 'deduction', 'netSalary', 'status'],
    sampleRow: {
      id: 'PAY-001',
      employeeId: 'EMP-001',
      employeeName: 'น.ส.สุภา ใจดี',
      role: 'Staff',
      payDate: '2026-08-31',
      salary: 20000,
      ot: 1500,
      bonus: 0,
      deduction: 750,
      netSalary: 20750,
      status: 'Paid',
    },
  },
  {
    key: 'managerEntries',
    firestoreCollection: 'manager_entries',
    supabaseTables: ['manager_entries'],
    thaiName: 'บันทึกรายรับ-รายจ่าย (ผู้จัดการ)',
    csvHeaders: ['id', 'date', 'type', 'category', 'title', 'amount', 'recordedBy', 'referenceNo', 'note'],
    sampleRow: {
      id: 'MGR-001',
      date: '2026-08-01',
      type: 'EXPENSE',
      category: 'ค่าบริหารจัดการ',
      title: 'ค่าเช่าสำนักงานประจำเดือน',
      amount: 15000,
      recordedBy: 'ผู้จัดการ',
      referenceNo: 'REF-001',
      note: '',
    },
  },
  {
    key: 'taxRules',
    firestoreCollection: 'tax_rules',
    supabaseTables: ['tax_rules'],
    thaiName: 'ตั้งค่าอัตราหัก ณ ที่จ่าย (% รายการ)',
    csvHeaders: ['id', 'name', 'taxRate', 'isActive', 'note'],
    sampleRow: {
      id: 'RULE-XRAY',
      name: 'X-ray',
      taxRate: 1,
      isActive: 'true',
      note: 'ค่าบริการ X-ray ตู้สินค้า',
    },
  },
];

// ==========================================
// Helper Parsers & Normalizers
// ==========================================

function cleanStr(val: unknown): string {
  if (val === undefined || val === null) return '';
  return String(val).trim();
}

function parseNumber(val: unknown): number {
  if (typeof val === 'number') {
    return Number.isFinite(val) ? Math.round(val * 100) / 100 : 0;
  }
  if (val === undefined || val === null) return 0;
  const cleaned = String(val).replace(/[฿,\s]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function normalizeDate(val: unknown): string {
  const s = cleanStr(val);
  if (!s) return new Date().toISOString().split('T')[0];

  // ISO datetime -> YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const year = Number(s.slice(0, 4));
    if (year > 2400) {
      return `${year - 543}${s.slice(4, 10)}`;
    }
    return s.slice(0, 10);
  }

  // DD/MM/YYYY or DD-MM-YYYY (supports Buddhist Era 2568 -> 2025)
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    const day = dmy[1].padStart(2, '0');
    const month = dmy[2].padStart(2, '0');
    let year = Number(dmy[3]);
    if (year > 2400) year -= 543;
    return `${year}-${month}-${day}`;
  }

  return s.slice(0, 50);
}

function parseJsonArray<T>(val: unknown): T[] {
  if (Array.isArray(val)) return val as T[];
  if (typeof val === 'string' && val.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Picks the first non-empty field matching any candidate key (case/space/underscore-insensitive)
 */
function pickField(raw: Record<string, any>, aliases: string[]): any {
  for (const key of aliases) {
    if (raw[key] !== undefined && raw[key] !== null && raw[key] !== '') {
      return raw[key];
    }
  }
  const normalizedMap = new Map<string, any>();
  for (const [k, v] of Object.entries(raw)) {
    const norm = k.toLowerCase().replace(/[\s_\-\.]/g, '');
    if (!normalizedMap.has(norm)) {
      normalizedMap.set(norm, v);
    }
  }
  for (const alias of aliases) {
    const norm = alias.toLowerCase().replace(/[\s_\-\.]/g, '');
    const found = normalizedMap.get(norm);
    if (found !== undefined && found !== null && found !== '') {
      return found;
    }
  }
  return undefined;
}

// ==========================================
// Row Mappers for All 14 Entities
// ==========================================

export function mapRawCustomer(raw: Record<string, any>, idx: number): Customer {
  const id = cleanStr(pickField(raw, ['id', 'customer_id', 'customerId', 'รหัสลูกค้า', 'รหัส'])) || `CUST-IMP-${idx + 1}`;
  const name = cleanStr(pickField(raw, ['name', 'customer_name', 'customerName', 'ชื่อลูกค้า', 'ชื่อ'])) || id;
  const company = cleanStr(pickField(raw, ['company', 'company_name', 'ชื่อบริษัท', 'บริษัท'])) || name;
  return {
    id,
    name,
    company,
    phone: cleanStr(pickField(raw, ['phone', 'tel', 'เบอร์โทร', 'โทรศัพท์'])),
    line: cleanStr(pickField(raw, ['line', 'line_id', 'ไลน์'])),
    creditTerm: Math.max(0, Math.min(3650, parseNumber(pickField(raw, ['creditTerm', 'credit_term', 'เครดิต', 'วันเครดิต'])))),
    address: cleanStr(pickField(raw, ['address', 'ที่อยู่'])),
    taxId: cleanStr(pickField(raw, ['taxId', 'tax_id', 'เลขผู้เสียภาษี', 'เลขประจำตัวผู้เสียภาษี'])),
  };
}

export function mapRawDriver(raw: Record<string, any>, idx: number): Driver {
  const id = cleanStr(pickField(raw, ['id', 'driver_id', 'รหัสคนขับ', 'รหัส'])) || `DRV-IMP-${idx + 1}`;
  const name = cleanStr(pickField(raw, ['name', 'driver_name', 'ชื่อคนขับ', 'ชื่อ'])) || id;
  const statusRaw = cleanStr(pickField(raw, ['status', 'สถานะ']));
  return {
    id,
    name,
    phone: cleanStr(pickField(raw, ['phone', 'tel', 'เบอร์โทร'])),
    licenseNo: cleanStr(pickField(raw, ['licenseNo', 'license_no', 'ใบขับขี่', 'เลขใบขับขี่'])),
    expiryDate: cleanStr(pickField(raw, ['expiryDate', 'expiry_date', 'วันหมดอายุ'])) ? normalizeDate(pickField(raw, ['expiryDate', 'expiry_date', 'วันหมดอายุ'])) : '',
    vehicleLicense: cleanStr(pickField(raw, ['vehicleLicense', 'vehicle_license', 'ทะเบียนรถ'])),
    status: statusRaw === 'On Duty' || statusRaw === 'กำลังปฏิบัติงาน' ? 'On Duty' : 'Available',
  };
}

export function mapRawVehicle(raw: Record<string, any>, idx: number): Vehicle {
  const licensePlate =
    cleanStr(pickField(raw, ['licensePlate', 'license_plate', 'vehicle_license', 'ทะเบียนรถ', 'ทะเบียน'])) ||
    `VEH-IMP-${idx + 1}`;
  const statusRaw = cleanStr(pickField(raw, ['status', 'สถานะ']));
  const ownerRaw = cleanStr(pickField(raw, ['ownerType', 'owner_type', 'ประเภทรถ', 'เจ้าของ']));
  return {
    licensePlate,
    type: cleanStr(pickField(raw, ['type', 'vehicle_type', 'ประเภท'])) || 'หัวลาก 10 ล้อ',
    brand: cleanStr(pickField(raw, ['brand', 'ยี่ห้อ'])),
    year: cleanStr(pickField(raw, ['year', 'ปี'])),
    actExpiry: cleanStr(pickField(raw, ['actExpiry', 'act_expiry', 'วันหมดอายุพรบ', 'พรบ']))
      ? normalizeDate(pickField(raw, ['actExpiry', 'act_expiry', 'วันหมดอายุพรบ', 'พรบ']))
      : '',
    insExpiry: cleanStr(pickField(raw, ['insExpiry', 'ins_expiry', 'วันหมดอายุประกัน', 'ประกัน']))
      ? normalizeDate(pickField(raw, ['insExpiry', 'ins_expiry', 'วันหมดอายุประกัน', 'ประกัน']))
      : '',
    status: statusRaw === 'Maintenance' || statusRaw === 'ซ่อมบำรุง' ? 'Maintenance' : 'Available',
    ownerType: ownerRaw === 'subcontractor' || ownerRaw.includes('รถร่วม') ? 'subcontractor' : 'company',
    driverId: cleanStr(pickField(raw, ['driverId', 'driver_id', 'รหัสคนขับ'])),
  };
}

export function mapRawEmployee(raw: Record<string, any>, idx: number): Employee {
  const id = cleanStr(pickField(raw, ['id', 'employee_id', 'รหัสพนักงาน', 'รหัส'])) || `EMP-IMP-${idx + 1}`;
  const name = cleanStr(pickField(raw, ['name', 'employee_name', 'ชื่อพนักงาน', 'ชื่อ'])) || id;
  return {
    id,
    name,
    position: cleanStr(pickField(raw, ['position', 'ตำแหน่ง'])),
    department: cleanStr(pickField(raw, ['department', 'แผนก'])),
    phone: cleanStr(pickField(raw, ['phone', 'tel', 'เบอร์โทร'])),
    salary: Math.max(0, parseNumber(pickField(raw, ['salary', 'เงินเดือน']))),
    startDate: cleanStr(pickField(raw, ['startDate', 'start_date', 'วันเริ่มงาน']))
      ? normalizeDate(pickField(raw, ['startDate', 'start_date', 'วันเริ่มงาน']))
      : '',
  };
}

export function mapRawJob(raw: Record<string, any>, idx: number): TransportJob {
  const jobNo = cleanStr(pickField(raw, ['jobNo', 'job_no', 'เลขที่งาน', 'รหัสงาน', 'JobNo'])) || `JOB-IMP-${idx + 1}`;
  const driverName = cleanStr(pickField(raw, ['driverName', 'driver_name', 'คนขับ', 'ชื่อคนขับ']));
  const rawDriverNames = parseJsonArray<string>(pickField(raw, ['driverNames', 'driver_names']));
  const driverNames =
    rawDriverNames.length > 0
      ? rawDriverNames.map(cleanStr).filter(Boolean).slice(0, 10)
      : driverName.includes(',')
        ? driverName.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 10)
        : [];

  const containersRaw = parseJsonArray<ContainerDetail>(pickField(raw, ['containers']));
  const validStatuses = ['รอดำเนินการ', 'กำลังขนส่ง', 'ส่งแล้ว', 'วางบิลแล้ว', 'รับเงินแล้ว'];
  const statusRaw = cleanStr(pickField(raw, ['status', 'สถานะ']));
  const status = (validStatuses.includes(statusRaw) ? statusRaw : 'รอดำเนินการ') as TransportJob['status'];
  const jobTypeRaw = cleanStr(pickField(raw, ['jobType', 'job_type', 'ประเภทงาน']));

  return {
    jobNo,
    date: normalizeDate(pickField(raw, ['date', 'วันที่'])),
    customerId: cleanStr(pickField(raw, ['customerId', 'customer_id', 'รหัสลูกค้า'])),
    customerName: cleanStr(pickField(raw, ['customerName', 'customer_name', 'ชื่อลูกค้า', 'ลูกค้า'])),
    origin: cleanStr(pickField(raw, ['origin', 'ต้นทาง'])),
    destination: cleanStr(pickField(raw, ['destination', 'ปลายทาง'])),
    vehicleLicense: cleanStr(pickField(raw, ['vehicleLicense', 'vehicle_license', 'ทะเบียนรถ'])),
    driverName,
    driverNames,
    vehicleType: cleanStr(pickField(raw, ['vehicleType', 'vehicle_type', 'ประเภทรถ'])),
    bookingNo: cleanStr(pickField(raw, ['bookingNo', 'booking_no', 'บุ๊คกิ้ง', 'Booking'])),
    shipper: cleanStr(pickField(raw, ['shipper', 'ผู้ส่งออก', 'Shipper'])),
    containers: containersRaw,
    totalAmount: Math.max(0, parseNumber(pickField(raw, ['totalAmount', 'total_amount', 'ยอดรวม', 'จำนวนเงิน']))),
    status,
    jobType: jobTypeRaw === 'Export' || jobTypeRaw === 'ขาออก' ? 'Export' : 'Import',
    quantity: Math.max(1, parseNumber(pickField(raw, ['quantity', 'จำนวนตู้'])) || containersRaw.length || 1),
    containerSize: cleanStr(pickField(raw, ['containerSize', 'container_size', 'ขนาดตู้'])) || '40HC',
    shipAgent: cleanStr(pickField(raw, ['shipAgent', 'ship_agent', 'เอเย่นต์เรือ'])),
    pickupAt: cleanStr(pickField(raw, ['pickupAt', 'pickup_at'])),
    loadAt: cleanStr(pickField(raw, ['loadAt', 'load_at'])),
    returnAt: cleanStr(pickField(raw, ['returnAt', 'return_at'])),
    pickupLocation: cleanStr(pickField(raw, ['pickupLocation', 'pickup_location', 'สถานที่รับตู้'])),
    returnLocation: cleanStr(pickField(raw, ['returnLocation', 'return_location', 'สถานที่คืนตู้'])),
    notes: cleanStr(pickField(raw, ['notes', 'note', 'หมายเหตุ'])),
  };
}

export function mapRawExpense(raw: Record<string, any>, idx: number): DailyExpense {
  const id = cleanStr(pickField(raw, ['id', 'expense_id', 'รหัสรายการ', 'รหัส'])) || `EXP-IMP-${Date.now()}-${idx + 1}`;
  const rawType = cleanStr(pickField(raw, ['type', 'expense_type', 'ประเภท', 'ประเภทค่าใช้จ่าย']));
  const matchedType: DailyExpenseType = (ALL_EXPENSE_TYPES as string[]).includes(rawType)
    ? (rawType as DailyExpenseType)
    : rawType.includes('คนขับ') || rawType.includes('เที่ยวรถ')
      ? 'ค่าจ้างคนขับรถ'
      : rawType.includes('น้ำมัน')
        ? 'ค่าน้ำมัน'
        : rawType.includes('อาหาร')
          ? 'ค่าอาหาร'
          : rawType.includes('ทางด่วน')
            ? 'ค่าทางด่วน'
            : rawType.includes('ซ่อม')
              ? 'ค่าซ่อม'
              : 'อื่นๆ';

  const catRaw = cleanStr(pickField(raw, ['expenseCategory', 'expense_category', 'หมวดหมู่'])).toLowerCase();
  const expenseCategory =
    catRaw === 'driver' || catRaw.includes('คนขับ')
      ? 'driver'
      : catRaw === 'general' || catRaw.includes('ทั่วไป')
        ? 'general'
        : isDriverExpenseType(matchedType)
          ? 'driver'
          : 'general';

  const billTypeRaw = cleanStr(pickField(raw, ['billType', 'bill_type', 'ประเภทบิล']));

  return normalizeExpenseRecord({
    id,
    jobNo: cleanStr(pickField(raw, ['jobNo', 'job_no', 'เลขที่งาน'])),
    containerNo: cleanStr(pickField(raw, ['containerNo', 'container_no', 'เบอร์ตู้'])),
    date: normalizeDate(pickField(raw, ['date', 'วันที่'])),
    type: matchedType,
    expenseCategory,
    description: cleanStr(pickField(raw, ['description', 'รายละเอียด', 'รายการ'])) || matchedType,
    vehicleLicense: cleanStr(pickField(raw, ['vehicleLicense', 'vehicle_license', 'ทะเบียนรถ'])),
    driverName: cleanStr(pickField(raw, ['driverName', 'driver_name', 'คนขับ', 'ชื่อคนขับ'])),
    amount: Math.max(0, parseNumber(pickField(raw, ['amount', 'จำนวนเงิน', 'ยอดก่อนหัก']))),
    note: cleanStr(pickField(raw, ['note', 'หมายเหตุ'])),
    billType: billTypeRaw === 'Adv' || billTypeRaw === 'Advance' ? 'Adv' : 'Normal',
  });
}

export function mapRawCreditIncome(raw: Record<string, any>, idx: number): CreditIncome {
  const id = cleanStr(pickField(raw, ['id', 'invoice_no', 'เลขที่บิล', 'รหัส'])) || `INC-IMP-${idx + 1}`;
  const validStatuses = ['ยังไม่ถึงกำหนด', 'ใกล้ครบกำหนด', 'เกินกำหนด', 'รับเงินแล้ว'];
  const statusRaw = cleanStr(pickField(raw, ['status', 'สถานะ']));
  return {
    id,
    customerName: cleanStr(pickField(raw, ['customerName', 'customer_name', 'ลูกค้า', 'ชื่อลูกค้า'])),
    billingDate: normalizeDate(pickField(raw, ['billingDate', 'billing_date', 'วันที่วางบิล'])),
    creditTerms: Math.max(0, parseNumber(pickField(raw, ['creditTerms', 'credit_terms', 'วันเครดิต']))),
    dueDate: normalizeDate(pickField(raw, ['dueDate', 'due_date', 'วันครบกำหนด'])),
    amount: Math.max(0, parseNumber(pickField(raw, ['amount', 'จำนวนเงิน', 'ยอดเงิน']))),
    status: (validStatuses.includes(statusRaw) ? statusRaw : 'ยังไม่ถึงกำหนด') as CreditIncome['status'],
  };
}

export function mapRawInvoice(raw: Record<string, any>, idx: number): Invoice {
  const invoiceNo =
    cleanStr(pickField(raw, ['invoiceNo', 'invoice_no', 'เลขที่ใบแจ้งหนี้', 'เลขที่บิล'])) ||
    `INV-IMP-${idx + 1}`;
  const subtotal = Math.max(0, parseNumber(pickField(raw, ['subtotal', 'รวมเงิน', 'ยอดรวม'])));
  const withholdingTax = Math.max(0, parseNumber(pickField(raw, ['withholdingTax', 'withholding_tax', 'หักณที่จ่าย'])));
  const vatAmount = Math.max(0, parseNumber(pickField(raw, ['vatAmount', 'vat_amount', 'ภาษีมูลค่าเพิ่ม', 'vat'])));
  const grandTotal = Math.max(
    0,
    parseNumber(pickField(raw, ['grandTotal', 'grand_total', 'ยอดสุทธิ'])) ||
      Math.max(0, subtotal + vatAmount - withholdingTax)
  );
  const invTypeRaw = cleanStr(pickField(raw, ['invoiceType', 'invoice_type', 'ประเภทบิล']));
  const statusRaw = cleanStr(pickField(raw, ['status', 'สถานะ']));
  const totalText = cleanStr(pickField(raw, ['totalText', 'total_text', 'ตัวอักษร'])) || arabicToThaiBaht(grandTotal);

  return {
    invoiceNo,
    date: normalizeDate(pickField(raw, ['date', 'วันที่'])),
    customerId: cleanStr(pickField(raw, ['customerId', 'customer_id', 'รหัสลูกค้า'])),
    customerName: cleanStr(pickField(raw, ['customerName', 'customer_name', 'ชื่อลูกค้า', 'ลูกค้า'])),
    jobNo: cleanStr(pickField(raw, ['jobNo', 'job_no', 'เลขที่งาน'])),
    invoiceType: invTypeRaw === 'Advance' ? 'Advance' : 'Transport',
    bookingNo: cleanStr(pickField(raw, ['bookingNo', 'booking_no', 'บุ๊คกิ้ง'])),
    shipper: cleanStr(pickField(raw, ['shipper', 'ผู้ส่งออก'])),
    containers: parseJsonArray<ContainerDetail>(pickField(raw, ['containers'])),
    advanceItems: parseJsonArray<AdvanceItem>(pickField(raw, ['advanceItems', 'advance_items'])),
    extraItems: parseJsonArray<ExtraInvoiceItem>(pickField(raw, ['extraItems', 'extra_items'])),
    subtotal,
    withholdingTax,
    vatAmount,
    grandTotal,
    totalText,
    status: statusRaw === 'จ่ายแล้ว' ? 'จ่ายแล้ว' : 'ยังไม่จ่าย',
    remark: cleanStr(pickField(raw, ['remark', 'note', 'หมายเหตุ'])),
  };
}

export function mapRawReceipt(raw: Record<string, any>, idx: number): Receipt {
  const receiptNo =
    cleanStr(pickField(raw, ['receiptNo', 'receipt_no', 'เลขที่ใบเสร็จ'])) ||
    `RC-IMP-${idx + 1}`;
  const validMethods = ['เงินสด', 'โอนเงิน', 'เช็ค'];
  const methodRaw = cleanStr(pickField(raw, ['paymentMethod', 'payment_method', 'ช่องทางชำระ']));
  const recTypeRaw = cleanStr(pickField(raw, ['receiptType', 'receipt_type', 'ประเภทใบเสร็จ']));
  return {
    receiptNo,
    date: normalizeDate(pickField(raw, ['date', 'วันที่'])),
    invoiceNo: cleanStr(pickField(raw, ['invoiceNo', 'invoice_no', 'เลขที่ใบแจ้งหนี้'])),
    customerName: cleanStr(pickField(raw, ['customerName', 'customer_name', 'ชื่อลูกค้า', 'ลูกค้า'])),
    amount: Math.max(0, parseNumber(pickField(raw, ['amount', 'จำนวนเงิน', 'ยอดรับ']))),
    paymentMethod: (validMethods.includes(methodRaw) ? methodRaw : 'โอนเงิน') as Receipt['paymentMethod'],
    receiptType: recTypeRaw === 'Advance' ? 'Advance' : 'Transport',
    remark: cleanStr(pickField(raw, ['remark', 'note', 'หมายเหตุ'])),
  };
}

export function mapRawManagerEntry(raw: Record<string, any>, idx: number): ManagerEntry {
  const id = cleanStr(pickField(raw, ['id', 'รหัส'])) || `MGR-IMP-${idx + 1}`;
  const typeRaw = cleanStr(pickField(raw, ['type', 'ประเภท'])).toUpperCase();
  return {
    id,
    date: normalizeDate(pickField(raw, ['date', 'วันที่'])),
    type: typeRaw === 'INCOME' || typeRaw.includes('รับ') ? 'INCOME' : 'EXPENSE',
    category: cleanStr(pickField(raw, ['category', 'หมวดหมู่'])) || 'ทั่วไป',
    title: cleanStr(pickField(raw, ['title', 'รายการ', 'description'])) || id,
    amount: Math.max(0, parseNumber(pickField(raw, ['amount', 'จำนวนเงิน']))),
    recordedBy: cleanStr(pickField(raw, ['recordedBy', 'recorded_by', 'ผู้บันทึก'])),
    referenceNo: cleanStr(pickField(raw, ['referenceNo', 'reference_no', 'เลขที่อ้างอิง'])),
    note: cleanStr(pickField(raw, ['note', 'หมายเหตุ'])),
  };
}

export function mapRawSubcontractorDoc(raw: Record<string, any>, idx: number): SubcontractorPaymentDoc {
  const id = cleanStr(pickField(raw, ['id', 'รหัส'])) || `SUB-IMP-${idx + 1}`;
  const paymentNo = cleanStr(pickField(raw, ['paymentNo', 'payment_no', 'เลขที่เอกสาร'])) || id;
  const statusRaw = cleanStr(pickField(raw, ['status', 'สถานะ']));
  return {
    id,
    paymentNo,
    date: normalizeDate(pickField(raw, ['date', 'วันที่'])),
    partnerName: cleanStr(pickField(raw, ['partnerName', 'partner_name', 'ชื่อรถร่วม', 'ผู้รับเงิน'])),
    vehicleLicense: cleanStr(pickField(raw, ['vehicleLicense', 'vehicle_license', 'ทะเบียนรถ'])),
    paymentCycle: cleanStr(pickField(raw, ['paymentCycle', 'payment_cycle', 'รอบทำจ่าย'])),
    trips: parseJsonArray<SubcontractorTripItem>(pickField(raw, ['trips'])),
    subtotalPrice: parseNumber(pickField(raw, ['subtotalPrice', 'subtotal_price', 'ค่าเที่ยวรวม'])),
    subtotalOt: parseNumber(pickField(raw, ['subtotalOt', 'subtotal_ot', 'ค่าล่วงเวลา'])),
    totalBeforeDeductions: parseNumber(pickField(raw, ['totalBeforeDeductions', 'total_before_deductions', 'ยอดก่อนหัก'])),
    advanceDeduction: parseNumber(pickField(raw, ['advanceDeduction', 'advance_deduction', 'หักเบิกล่วงหน้า'])),
    withholdingTax: parseNumber(pickField(raw, ['withholdingTax', 'withholding_tax', 'หักณที่จ่าย'])),
    grandTotal: parseNumber(pickField(raw, ['grandTotal', 'grand_total', 'ยอดสุทธิ'])),
    status: statusRaw === 'จ่ายแล้ว' ? 'จ่ายแล้ว' : 'ยังไม่ได้จ่าย',
    note: cleanStr(pickField(raw, ['note', 'หมายเหตุ'])),
  };
}

export function mapRawPartnerPayment(raw: Record<string, any>, idx: number): PartnerPayment {
  const id = cleanStr(pickField(raw, ['id', 'รหัส'])) || `PPM-IMP-${idx + 1}`;
  const pType = cleanStr(pickField(raw, ['paymentType', 'payment_type', 'ประเภท']));
  const statusRaw = cleanStr(pickField(raw, ['status', 'สถานะ']));
  return {
    id,
    date: normalizeDate(pickField(raw, ['date', 'วันที่'])),
    partnerName: cleanStr(pickField(raw, ['partnerName', 'partner_name', 'ชื่อรถร่วม'])),
    jobNo: cleanStr(pickField(raw, ['jobNo', 'job_no', 'เลขที่งาน'])),
    paymentType: pType === 'RENT_CAR' ? 'RENT_CAR' : 'PAY_PARTNER',
    revenue: parseNumber(pickField(raw, ['revenue', 'รายรับ', 'ยอดเงิน'])),
    expensesDeduction: parseNumber(pickField(raw, ['expensesDeduction', 'expenses_deduction', 'หักค่าใช้จ่าย'])),
    netPaid: parseNumber(pickField(raw, ['netPaid', 'net_paid', 'ยอดสุทธิ'])),
    status: statusRaw === 'จ่ายแล้ว' ? 'จ่ายแล้ว' : 'ยังไม่ได้เคลียร์',
  };
}

export function mapRawWithholdingTax(raw: Record<string, any>, idx: number): WithholdingTaxRecord {
  const id = cleanStr(pickField(raw, ['id', 'รหัส'])) || `WHT-IMP-${idx + 1}`;
  const baseAmount = Math.max(0, parseNumber(pickField(raw, ['baseAmount', 'base_amount', 'ยอดก่อนหัก', 'จำนวนเงิน'])));
  const rate = Math.max(0, Math.min(100, parseNumber(pickField(raw, ['rate', 'อัตราภาษี'])) || 1));
  const taxAmount = Math.max(
    0,
    parseNumber(pickField(raw, ['taxAmount', 'tax_amount', 'ยอดภาษี'])) ||
      Math.round(baseAmount * (rate / 100) * 100) / 100
  );
  const typeRaw = cleanStr(pickField(raw, ['type', 'ประเภท']));
  return {
    id,
    date: normalizeDate(pickField(raw, ['date', 'วันที่'])),
    payeeName: cleanStr(pickField(raw, ['payeeName', 'payee_name', 'ผู้ถูกหักภาษี', 'ชื่อ'])),
    taxIDNumber: cleanStr(pickField(raw, ['taxIDNumber', 'tax_id_number', 'tax_id', 'เลขผู้เสียภาษี'])),
    baseAmount,
    rate,
    taxAmount,
    type: typeRaw === 'Service' || typeRaw === 'Other' ? typeRaw : 'Transportation',
  };
}

export function mapRawPayroll(raw: Record<string, any>, idx: number): PayrollRecord {
  const id = cleanStr(pickField(raw, ['id', 'รหัส'])) || `PAY-IMP-${idx + 1}`;
  const roleRaw = cleanStr(pickField(raw, ['role', 'ตำแหน่ง', 'ประเภท']));
  const statusRaw = cleanStr(pickField(raw, ['status', 'สถานะ']));
  const salary = Math.max(0, parseNumber(pickField(raw, ['salary', 'เงินเดือน'])));
  const ot = Math.max(0, parseNumber(pickField(raw, ['ot', 'ค่าล่วงเวลา'])));
  const bonus = Math.max(0, parseNumber(pickField(raw, ['bonus', 'โบนัส'])));
  const deduction = Math.max(0, parseNumber(pickField(raw, ['deduction', 'หัก'])));
  const netSalary = parseNumber(pickField(raw, ['netSalary', 'net_salary', 'สุทธิ'])) || salary + ot + bonus - deduction;
  return {
    id,
    employeeId: cleanStr(pickField(raw, ['employeeId', 'employee_id', 'รหัสพนักงาน'])),
    employeeName: cleanStr(pickField(raw, ['employeeName', 'employee_name', 'ชื่อพนักงาน'])),
    role: roleRaw === 'Driver' || roleRaw.includes('คนขับ') ? 'Driver' : 'Staff',
    payDate: normalizeDate(pickField(raw, ['payDate', 'pay_date', 'วันที่จ่าย'])),
    salary,
    ot,
    bonus,
    deduction,
    netSalary,
    status: statusRaw === 'Paid' || statusRaw === 'จ่ายแล้ว' ? 'Paid' : 'Unpaid',
  };
}

export function mapRowsForDataset(key: DatasetKey, rows: Record<string, any>[]): any[] {
  switch (key) {
    case 'customers':
      return rows.map(mapRawCustomer);
    case 'drivers':
      return rows.map(mapRawDriver);
    case 'vehicles':
      return rows.map(mapRawVehicle);
    case 'employees':
      return rows.map(mapRawEmployee);
    case 'jobs':
      return rows.map(mapRawJob);
    case 'expenses':
      return rows.map(mapRawExpense);
    case 'incomes':
      return rows.map(mapRawCreditIncome);
    case 'invoices':
      return rows.map(mapRawInvoice);
    case 'receipts':
      return rows.map(mapRawReceipt);
    case 'managerEntries':
      return rows.map(mapRawManagerEntry);
    case 'partnerPaymentDocs':
      return rows.map(mapRawSubcontractorDoc);
    case 'partnerPayments':
      return rows.map(mapRawPartnerPayment);
    case 'withholdingTaxes':
      return rows.map(mapRawWithholdingTax);
    case 'payroll':
      return rows.map(mapRawPayroll);
    case 'taxRules':
      return rows.map((raw, idx): TaxRuleItem => ({
        id: cleanStr(pickField(raw, ['id', 'รหัส'])) || `RULE-IMP-${idx + 1}`,
        name: cleanStr(pickField(raw, ['name', 'รายการ', 'ชื่อรายการ'])) || `รายการ ${idx + 1}`,
        aliases: Array.isArray(raw.aliases)
          ? raw.aliases.map(cleanStr).filter(Boolean)
          : cleanStr(raw.aliases)
            ? cleanStr(raw.aliases).split(',').map((s) => s.trim()).filter(Boolean)
            : [],
        taxRate: Math.max(0, Math.min(100, parseNumber(pickField(raw, ['taxRate', 'tax_rate', 'rate', 'เปอร์เซ็นต์'])))),
        isActive: raw.isActive === false || raw.isActive === 'false' ? false : true,
        note: cleanStr(pickField(raw, ['note', 'หมายเหตุ'])),
      }));
  }
}

// ==========================================
// 1. Supabase REST API Paginated Fetcher
// ==========================================

async function fetchSupabaseTableAll(
  baseUrl: string,
  anonKey: string,
  tableName: string
): Promise<Record<string, any>[] | null> {
  const cleanUrl = baseUrl.replace(/\/+$/, '');
  const pageSize = 1000;
  let offset = 0;
  const allRows: Record<string, any>[] = [];

  while (true) {
    const endpoint = `${cleanUrl}/rest/v1/${encodeURIComponent(tableName)}?select=*&limit=${pageSize}&offset=${offset}`;
    const res = await fetch(endpoint, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });
    if (res.status === 404) {
      return offset === 0 ? null : allRows;
    }
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Supabase [${tableName}] HTTP ${res.status}: ${errText.slice(0, 160)}`);
    }
    const batch = (await res.json()) as Record<string, any>[];
    if (!Array.isArray(batch)) break;
    allRows.push(...batch);
    if (batch.length < pageSize) break;
    offset += pageSize;
  }

  return allRows;
}

export interface SupabaseFetchResult {
  dataset: AppDataState;
  counts: Record<DatasetKey, number>;
  totalRows: number;
  foundTables: string[];
}

export async function fetchAllFromSupabase(
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<SupabaseFetchResult> {
  const dataset: AppDataState = {
    customers: [],
    drivers: [],
    vehicles: [],
    employees: [],
    jobs: [],
    expenses: [],
    incomes: [],
    invoices: [],
    receipts: [],
    partnerPayments: [],
    withholdingTaxes: [],
    payroll: [],
    managerEntries: [],
    partnerPaymentDocs: [],
    taxRules: [],
  };
  const counts = {} as Record<DatasetKey, number>;
  const foundTables: string[] = [];
  let totalRows = 0;

  for (const meta of DATASET_CATALOG) {
    let rawRows: Record<string, any>[] = [];
    for (const candidateTable of meta.supabaseTables) {
      const fetched = await fetchSupabaseTableAll(supabaseUrl, supabaseAnonKey, candidateTable);
      if (fetched !== null) {
        foundTables.push(`${candidateTable} (${fetched.length})`);
        rawRows = fetched;
        break;
      }
    }
    const mapped = mapRowsForDataset(meta.key, rawRows);
    (dataset as any)[meta.key] = mapped;
    counts[meta.key] = mapped.length;
    totalRows += mapped.length;
  }

  return { dataset, counts, totalRows, foundTables };
}

// ==========================================
// 2. Google Sheets & CSV / JSON Importers
// ==========================================

export function parseCsvText(csvText: string): Record<string, string>[] {
  const clean = csvText.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    const next = clean[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentField += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentField += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      currentRow.push(currentField);
      currentField = '';
    } else if (ch === '\r' && next === '\n') {
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
      i++;
    } else if (ch === '\n' || ch === '\r') {
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
    } else {
      currentField += ch;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  const nonEmptyRows = rows.filter((r) => r.some((cell) => cell.trim() !== ''));
  if (nonEmptyRows.length < 2) return [];

  const headers = nonEmptyRows[0].map((h) => h.trim());
  return nonEmptyRows.slice(1).map((cells) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      if (h) obj[h] = (cells[idx] ?? '').trim();
    });
    return obj;
  });
}

export function buildGoogleSheetCsvUrl(sheetUrlOrId: string, sheetTabName?: string): string {
  const input = sheetUrlOrId.trim();
  const idMatch = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9_\-]+)/);
  const spreadsheetId = idMatch ? idMatch[1] : /^[a-zA-Z0-9_\-]{20,}$/.test(input) ? input : '';
  if (!spreadsheetId) {
    throw new Error('ลิงก์ Google Sheet ไม่ถูกต้อง กรุณาวางลิงก์เต็มจาก Google Sheets');
  }

  const gidMatch = input.match(/[#&?]gid=(\d+)/);
  if (sheetTabName && sheetTabName.trim()) {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetTabName.trim())}`;
  }
  if (gidMatch) {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gidMatch[1]}`;
  }
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`;
}

export async function fetchGoogleSheetAsDataset(
  sheetUrlOrId: string,
  targetKey: DatasetKey,
  sheetTabName?: string
): Promise<Partial<AppDataState>> {
  const trimmed = sheetUrlOrId.trim();

  // Support Google Apps Script Web App JSON endpoint directly
  if (trimmed.includes('script.google.com/macros/')) {
    const res = await fetch(trimmed);
    if (!res.ok) {
      throw new Error(`ไม่สามารถดึงข้อมูลจาก Apps Script ได้ (HTTP ${res.status})`);
    }
    const json = await res.json();
    return parseBackupOrAppsScriptJson(json, targetKey);
  }

  const csvUrl = buildGoogleSheetCsvUrl(trimmed, sheetTabName);
  const res = await fetch(csvUrl);
  if (!res.ok) {
    throw new Error(
      `ไม่สามารถดึงข้อมูลจาก Google Sheet ได้ (HTTP ${res.status}) กรุณาตั้งค่าแชร์เป็น "ทุกคนที่มีลิงก์สามารถดูได้" หรือดาวน์โหลดเป็นไฟล์ CSV แล้วอัปโหลดแทน`
    );
  }
  const text = await res.text();
  if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
    throw new Error(
      'Google Sheet นี้ยังไม่ได้เปิดแชร์สาธารณะ กรุณาเปิดแชร์แบบ "ทุกคนที่มีลิงก์ดูได้" หรือไปที่ ไฟล์ > ดาวน์โหลด > CSV แล้วอัปโหลดไฟล์แทน'
    );
  }
  const rawRows = parseCsvText(text);
  return {
    [targetKey]: mapRowsForDataset(targetKey, rawRows),
  } as Partial<AppDataState>;
}

export function parseBackupOrAppsScriptJson(
  rawJson: any,
  fallbackKey?: DatasetKey
): Partial<AppDataState> {
  const result: Partial<AppDataState> = {};

  if (Array.isArray(rawJson) && fallbackKey) {
    (result as any)[fallbackKey] = mapRowsForDataset(fallbackKey, rawJson);
    return result;
  }

  const root = rawJson?.data && typeof rawJson.data === 'object' ? rawJson.data : rawJson;
  if (!root || typeof root !== 'object') return result;

  const keyAliases: Record<DatasetKey, string[]> = {
    customers: ['customers', 'Customers', 'customer'],
    drivers: ['drivers', 'Drivers', 'driver'],
    vehicles: ['vehicles', 'Vehicles', 'vehicle'],
    employees: ['employees', 'Employees', 'employee'],
    jobs: ['jobs', 'transport_jobs', 'TransportJobs', 'Jobs'],
    expenses: ['expenses', 'daily_expenses', 'DailyExpenses', 'Expenses'],
    incomes: ['incomes', 'credit_incomes', 'CreditIncomes'],
    invoices: ['invoices', 'Invoices'],
    receipts: ['receipts', 'Receipts'],
    managerEntries: ['managerEntries', 'manager_entries', 'ManagerEntries'],
    partnerPaymentDocs: ['partnerPaymentDocs', 'subcontractor_payment_docs', 'partner_payment_docs'],
    partnerPayments: ['partnerPayments', 'partner_payments', 'PartnerPayments'],
    withholdingTaxes: ['withholdingTaxes', 'withholding_taxes', 'WithholdingTaxes'],
    payroll: ['payroll', 'payrolls', 'Payroll'],
    taxRules: ['taxRules', 'tax_rules', 'TaxRules'],
  };

  for (const meta of DATASET_CATALOG) {
    for (const alias of keyAliases[meta.key]) {
      if (Array.isArray(root[alias])) {
        (result as any)[meta.key] = mapRowsForDataset(meta.key, root[alias]);
        break;
      }
    }
  }

  return result;
}

// ==========================================
// 3. Firebase Bulk Upsert Migration Engine
// ==========================================

export interface MigrationProgress {
  currentCollection: string;
  completed: number;
  total: number;
}

export interface MigrationReportItem {
  key: DatasetKey;
  thaiName: string;
  attempted: number;
  succeeded: number;
  failed: number;
  errors: string[];
}

export interface MigrationReport {
  items: MigrationReportItem[];
  totalAttempted: number;
  totalSucceeded: number;
  totalFailed: number;
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>
): Promise<void> {
  let index = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const current = index++;
      await worker(items[current]);
    }
  });
  await Promise.all(runners);
}

async function saveSingleRecord(key: DatasetKey, record: any, actorUid: string): Promise<void> {
  switch (key) {
    case 'customers':
      return fbSaveCustomer(record, actorUid);
    case 'drivers':
      return fbSaveDriver(record, actorUid);
    case 'vehicles':
      return fbSaveVehicle(record, actorUid);
    case 'employees':
      return fbSaveEmployee(record, actorUid);
    case 'jobs':
      return fbSaveJob(record, actorUid);
    case 'expenses':
      return fbSaveExpense(record, actorUid);
    case 'incomes':
      return fbSaveCreditIncome(record, actorUid);
    case 'invoices':
      return fbMigrateInvoiceDirect(record, actorUid);
    case 'receipts':
      return fbMigrateReceiptDirect(record, actorUid);
    case 'managerEntries':
      return fbSaveManagerEntry(record, actorUid);
    case 'partnerPaymentDocs':
      return fbSaveSubcontractorPaymentDoc(record, actorUid);
    case 'partnerPayments':
      return fbSavePartnerPayment(record, actorUid);
    case 'withholdingTaxes':
      return fbSaveWithholdingTax(record, actorUid);
    case 'payroll':
      return fbSavePayroll(record, actorUid);
    case 'taxRules':
      return fbSaveTaxRule(record, actorUid);
  }
}

export async function migrateDatasetToFirebase(
  partialDataset: Partial<AppDataState>,
  actorUid: string,
  onProgress?: (progress: MigrationProgress) => void
): Promise<MigrationReport> {
  const items: MigrationReportItem[] = [];
  let totalAttempted = 0;
  let totalSucceeded = 0;
  let totalFailed = 0;

  const totalWork = DATASET_CATALOG.reduce((sum, meta) => {
    const arr = (partialDataset as any)[meta.key];
    return sum + (Array.isArray(arr) ? arr.length : 0);
  }, 0);

  let completed = 0;

  for (const meta of DATASET_CATALOG) {
    const records: any[] = Array.isArray((partialDataset as any)[meta.key])
      ? (partialDataset as any)[meta.key]
      : [];

    if (records.length === 0) continue;

    let succeeded = 0;
    let failed = 0;
    const errors: string[] = [];

    await runWithConcurrency(records, 12, async (rec) => {
      try {
        await saveSingleRecord(meta.key, rec, actorUid);
        succeeded++;
      } catch (err: any) {
        failed++;
        if (errors.length < 5) {
          errors.push(err?.message || String(err));
        }
      } finally {
        completed++;
        onProgress?.({
          currentCollection: meta.thaiName,
          completed,
          total: totalWork,
        });
      }
    });

    items.push({
      key: meta.key,
      thaiName: meta.thaiName,
      attempted: records.length,
      succeeded,
      failed,
      errors,
    });
    totalAttempted += records.length;
    totalSucceeded += succeeded;
    totalFailed += failed;
  }

  return {
    items,
    totalAttempted,
    totalSucceeded,
    totalFailed,
  };
}

// ==========================================
// 4. Backup Exporters (Full JSON & CSV BOM)
// ==========================================

function escapeCsvCell(val: unknown): string {
  if (val === undefined || val === null) return '';
  const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsvForCollection(meta: DatasetMeta, rows: any[]): string {
  const headers = meta.csvHeaders;
  const lines: string[] = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsvCell(row[h])).join(','));
  }
  return '\uFEFF' + lines.join('\r\n');
}

export function buildTemplateCsv(meta: DatasetMeta): string {
  return buildCsvForCollection(meta, [meta.sampleRow]);
}

export function buildFullBackupJson(state: AppDataState): string {
  const payload = {
    app: 'Khemthit Transport Management System',
    version: '2.0',
    exportedAt: new Date().toISOString(),
    source: 'Firebase Cloud Firestore',
    counts: Object.fromEntries(
      DATASET_CATALOG.map((m) => [m.key, ((state as any)[m.key] || []).length])
    ),
    data: {
      ...EMPTY_APP_STATE,
      ...state,
    },
  };
  return JSON.stringify(payload, null, 2);
}

export function triggerFileDownload(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
