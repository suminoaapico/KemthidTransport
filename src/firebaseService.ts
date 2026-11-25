import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  limit,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import {
  db,
  OperationType,
  handleFirestoreError,
} from './firebase';
import {
  Customer,
  Driver,
  Vehicle,
  Employee,
  TransportJob,
  DailyExpense,
  CreditIncome,
  Invoice,
  Receipt,
  PartnerPayment,
  WithholdingTaxRecord,
  PayrollRecord,
  ManagerEntry,
  SubcontractorPaymentDoc,
  ContainerDetail,
  AdvanceItem,
  ExtraInvoiceItem,
  SubcontractorTripItem,
  DailyExpenseType,
} from './types';
import {
  ALL_EXPENSE_TYPES,
  calculateDriverExpenseTax,
  isDriverExpenseType,
  normalizeExpenseRecord,
} from './utils';

export const COLLECTIONS = {
  users: 'users',
  customers: 'customers',
  drivers: 'drivers',
  vehicles: 'vehicles',
  employees: 'employees',
  jobs: 'transport_jobs',
  expenses: 'daily_expenses',
  incomes: 'credit_incomes',
  invoices: 'invoices',
  receipts: 'receipts',
  managerEntries: 'manager_entries',
  partnerPaymentDocs: 'subcontractor_payment_docs',
  partnerPayments: 'partner_payments',
  withholdingTaxes: 'withholding_taxes',
  payroll: 'payroll',
} as const;

export interface AppDataState {
  customers: Customer[];
  drivers: Driver[];
  vehicles: Vehicle[];
  employees: Employee[];
  jobs: TransportJob[];
  expenses: DailyExpense[];
  incomes: CreditIncome[];
  invoices: Invoice[];
  receipts: Receipt[];
  partnerPayments: PartnerPayment[];
  withholdingTaxes: WithholdingTaxRecord[];
  payroll: PayrollRecord[];
  managerEntries: ManagerEntry[];
  partnerPaymentDocs: SubcontractorPaymentDoc[];
}

export const EMPTY_APP_STATE: AppDataState = {
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
};

export interface CollectionSchemaInfo {
  collection: string;
  thaiName: string;
  keyField: string;
  fields: string[];
}

export const FIRESTORE_SCHEMA_SUMMARY: CollectionSchemaInfo[] = [
  {
    collection: COLLECTIONS.customers,
    thaiName: 'ทะเบียนลูกค้า (Customers)',
    keyField: 'id',
    fields: ['id', 'name', 'company', 'phone', 'line', 'creditTerm', 'address', 'taxId'],
  },
  {
    collection: COLLECTIONS.drivers,
    thaiName: 'ทะเบียนคนขับรถ (Drivers)',
    keyField: 'id',
    fields: ['id', 'name', 'phone', 'licenseNo', 'expiryDate', 'vehicleLicense', 'status'],
  },
  {
    collection: COLLECTIONS.vehicles,
    thaiName: 'ทะเบียนรถ/หางพ่วง (Vehicles)',
    keyField: 'licensePlate',
    fields: ['licensePlate', 'type', 'brand', 'year', 'actExpiry', 'insExpiry', 'status', 'ownerType', 'driverId'],
  },
  {
    collection: COLLECTIONS.employees,
    thaiName: 'ทะเบียนพนักงาน (Employees)',
    keyField: 'id',
    fields: ['id', 'name', 'position', 'department', 'phone', 'salary', 'startDate'],
  },
  {
    collection: COLLECTIONS.jobs,
    thaiName: 'แผนการวิ่งงาน (Transport Jobs)',
    keyField: 'jobNo',
    fields: ['jobNo', 'date', 'customerId', 'customerName', 'origin', 'destination', 'vehicleLicense', 'driverName', 'driverNames', 'bookingNo', 'shipper', 'containers[]', 'totalAmount', 'status'],
  },
  {
    collection: COLLECTIONS.expenses,
    thaiName: 'ค่าใช้จ่ายและภาษีหัก ณ ที่จ่ายคนขับรถ (Daily Expenses)',
    keyField: 'id',
    fields: [
      'id',
      'jobNo',
      'containerNo',
      'date',
      'type',
      'expenseCategory',
      'description',
      'vehicleLicense',
      'driverName',
      'amount',
      'withholdingTaxRate',
      'withholdingTaxAmount',
      'netAmount',
      'note',
      'billType',
    ],
  },
  {
    collection: COLLECTIONS.incomes,
    thaiName: 'ลูกหนี้การค้า/เครดิต (Credit Income)',
    keyField: 'id',
    fields: ['id', 'customerName', 'billingDate', 'creditTerms', 'dueDate', 'amount', 'status'],
  },
  {
    collection: COLLECTIONS.invoices,
    thaiName: 'ใบแจ้งหนี้/วางบิล (Invoices)',
    keyField: 'invoiceNo',
    fields: ['invoiceNo', 'date', 'customerId', 'customerName', 'jobNo', 'invoiceType', 'bookingNo', 'shipper', 'containers[]', 'advanceItems[]', 'extraItems[]', 'subtotal', 'withholdingTax', 'vatAmount', 'grandTotal', 'totalText', 'status', 'remark'],
  },
  {
    collection: COLLECTIONS.receipts,
    thaiName: 'ใบเสร็จรับเงิน (Receipts)',
    keyField: 'receiptNo',
    fields: ['receiptNo', 'date', 'invoiceNo', 'customerName', 'amount', 'paymentMethod', 'receiptType', 'remark'],
  },
  {
    collection: COLLECTIONS.partnerPaymentDocs,
    thaiName: 'เอกสารทำจ่ายรถร่วม (Subcontractor Payouts)',
    keyField: 'id',
    fields: ['id', 'paymentNo', 'date', 'partnerName', 'vehicleLicense', 'paymentCycle', 'trips[]', 'subtotalPrice', 'subtotalOt', 'totalBeforeDeductions', 'advanceDeduction', 'withholdingTax', 'grandTotal', 'status', 'note'],
  },
  {
    collection: COLLECTIONS.partnerPayments,
    thaiName: 'บัญชีจ่ายรถร่วม/รถเช่า (Partner Payments)',
    keyField: 'id',
    fields: ['id', 'date', 'partnerName', 'jobNo', 'paymentType', 'revenue', 'expensesDeduction', 'netPaid', 'status'],
  },
  {
    collection: COLLECTIONS.withholdingTaxes,
    thaiName: 'ทะเบียนหัก ณ ที่จ่าย (Withholding Taxes)',
    keyField: 'id',
    fields: ['id', 'date', 'payeeName', 'taxIDNumber', 'baseAmount', 'rate', 'taxAmount', 'type'],
  },
  {
    collection: COLLECTIONS.payroll,
    thaiName: 'สลิปเงินเดือนพนักงาน (Payroll)',
    keyField: 'id',
    fields: ['id', 'employeeId', 'employeeName', 'role', 'payDate', 'salary', 'ot', 'bonus', 'deduction', 'netSalary', 'status'],
  },
  {
    collection: COLLECTIONS.managerEntries,
    thaiName: 'บันทึกรายรับ-รายจ่ายผู้จัดการ (Manager Entries)',
    keyField: 'id',
    fields: ['id', 'date', 'type', 'category', 'title', 'amount', 'recordedBy', 'referenceNo', 'note'],
  },
];

/**
 * Converts any business key (including Thai license plates or IDs with '/')
 * into a deterministic Firestore-safe document ID matching ^[a-zA-Z0-9_\-]+$ (<= 128 chars).
 */
export function toSafeDocId(rawKey: string): string {
  const trimmed = String(rawKey || '').trim();
  if (/^[a-zA-Z0-9_\-]+$/.test(trimmed) && trimmed.length >= 1 && trimmed.length <= 120) {
    return trimmed;
  }
  const bytes = new TextEncoder().encode(trimmed || `id_${Date.now()}`);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  if (hex.length <= 120) {
    return `doc_${hex}`;
  }
  // Fallback hash suffix if extremely long
  let hash = 2166136261;
  for (let i = 0; i < bytes.length; i++) {
    hash ^= bytes[i];
    hash = Math.imul(hash, 16777619);
  }
  return `doc_${hex.slice(0, 100)}_${(hash >>> 0).toString(16)}`;
}

function clampStr(val: unknown, maxLen: number): string {
  const s = val === undefined || val === null ? '' : String(val);
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function safeNonNegNum(val: unknown): number {
  const n = Number(val);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

function safeNum(val: unknown): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

function sanitizeContainers(containers: ContainerDetail[] | undefined): ContainerDetail[] {
  if (!Array.isArray(containers)) return [];
  return containers.slice(0, 50).map((c) => {
    const clean: ContainerDetail = {
      containerNo: clampStr(c.containerNo, 100),
      transportation: safeNonNegNum(c.transportation),
      portCharge: safeNonNegNum(c.portCharge),
      containerHandling: safeNonNegNum(c.containerHandling),
      liftOnOff: safeNonNegNum(c.liftOnOff),
    };
    if (c.driverName !== undefined) clean.driverName = clampStr(c.driverName, 200);
    if (c.vehicleLicense !== undefined) clean.vehicleLicense = clampStr(c.vehicleLicense, 100);
    if (c.otherExpenseName !== undefined) clean.otherExpenseName = clampStr(c.otherExpenseName, 200);
    if (c.otherExpenseAmount !== undefined) clean.otherExpenseAmount = safeNonNegNum(c.otherExpenseAmount);
    if (c.overtimeQty !== undefined) clean.overtimeQty = safeNonNegNum(c.overtimeQty);
    if (c.overtimeRate !== undefined) clean.overtimeRate = safeNonNegNum(c.overtimeRate);
    if (c.size !== undefined) clean.size = clampStr(c.size, 50);
    if (Array.isArray(c.expenses)) {
      clean.expenses = c.expenses.slice(0, 50).map((e) => {
        const exp: { name: string; amount: number; qty?: number; rate?: number } = {
          name: clampStr(e.name, 150),
          amount: safeNonNegNum(e.amount),
        };
        if (e.qty !== undefined) exp.qty = safeNonNegNum(e.qty);
        if (e.rate !== undefined) exp.rate = safeNonNegNum(e.rate);
        return exp;
      });
    }
    return clean;
  });
}

function sanitizeAdvanceItems(items: AdvanceItem[] | undefined): AdvanceItem[] {
  if (!Array.isArray(items)) return [];
  return items.slice(0, 100).map((item) => ({
    id: clampStr(item.id, 100),
    description: clampStr(item.description, 300),
    amount: safeNonNegNum(item.amount),
  }));
}

function sanitizeExtraItems(items: ExtraInvoiceItem[] | undefined): ExtraInvoiceItem[] {
  if (!Array.isArray(items)) return [];
  return items.slice(0, 100).map((item) => ({
    id: clampStr(item.id, 100),
    name: clampStr(item.name, 200),
    qty: safeNonNegNum(item.qty),
    rate: safeNonNegNum(item.rate),
    amount: safeNonNegNum(item.amount),
  }));
}

function sanitizeTrips(trips: SubcontractorTripItem[] | undefined): SubcontractorTripItem[] {
  if (!Array.isArray(trips)) return [];
  return trips.slice(0, 100).map((t) => {
    const clean: SubcontractorTripItem = {
      id: clampStr(t.id, 100),
      date: clampStr(t.date, 50),
      shipper: clampStr(t.shipper, 200),
      bookingNo: clampStr(t.bookingNo, 150),
      type: clampStr(t.type, 100),
      containerNo: clampStr(t.containerNo, 100),
      price: safeNum(t.price),
      ot: safeNum(t.ot),
      remark: clampStr(t.remark, 500),
    };
    if (t.jobNo !== undefined) clean.jobNo = clampStr(t.jobNo, 100);
    return clean;
  });
}

// Generic safe upsert respecting createdAt/updatedAt/ownerId security rules
async function upsertDocument(
  collectionName: string,
  docId: string,
  payload: Record<string, unknown>,
  uid: string
): Promise<void> {
  const safeId = toSafeDocId(docId);
  const docPath = `${collectionName}/${safeId}`;
  const ref = doc(db, collectionName, safeId);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        ...payload,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        ...payload,
        ownerId: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

async function removeDocument(collectionName: string, docId: string): Promise<void> {
  const safeId = toSafeDocId(docId);
  const docPath = `${collectionName}/${safeId}`;
  try {
    await deleteDoc(doc(db, collectionName, safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

// Real-time listeners for all 14 operational collections (shared company database)
export function subscribeAllCollections(
  onPatch: (patch: Partial<AppDataState>) => void,
  onReady: () => void,
  onError: (err: Error) => void
): Unsubscribe {
  const readySet = new Set<string>();
  const totalCollections = 14;
  const markReady = (key: string) => {
    readySet.add(key);
    if (readySet.size >= totalCollections) {
      onReady();
    }
  };

  const unsubscribers: Unsubscribe[] = [];

  const listen = <T,>(
    colName: string,
    stateKey: keyof AppDataState,
    mapper: (data: Record<string, any>) => T,
    sortFn?: (a: T, b: T) => number
  ) => {
    const colQuery = query(collection(db, colName), limit(5000));
    const unsub = onSnapshot(
      colQuery,
      (snapshot) => {
        const items = snapshot.docs.map((d) => mapper(d.data()));
        if (sortFn) items.sort(sortFn);
        onPatch({ [stateKey]: items } as Partial<AppDataState>);
        markReady(colName);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, colName);
        } catch (wrapped) {
          onError(wrapped as Error);
        }
      }
    );
    unsubscribers.push(unsub);
  };

  listen<Customer>(
    COLLECTIONS.customers,
    'customers',
    (d) => ({
      id: d.id || '',
      name: d.name || '',
      company: d.company || '',
      phone: d.phone || '',
      line: d.line || '',
      creditTerm: Number(d.creditTerm) || 0,
      address: d.address || '',
      taxId: d.taxId || '',
    }),
    (a, b) => a.id.localeCompare(b.id)
  );

  listen<Driver>(
    COLLECTIONS.drivers,
    'drivers',
    (d) => ({
      id: d.id || '',
      name: d.name || '',
      phone: d.phone || '',
      licenseNo: d.licenseNo || '',
      expiryDate: d.expiryDate || '',
      vehicleLicense: d.vehicleLicense || '',
      status: d.status === 'On Duty' ? 'On Duty' : 'Available',
    }),
    (a, b) => a.id.localeCompare(b.id)
  );

  listen<Vehicle>(
    COLLECTIONS.vehicles,
    'vehicles',
    (d) => ({
      licensePlate: d.licensePlate || '',
      type: d.type || '',
      brand: d.brand || '',
      year: d.year || '',
      actExpiry: d.actExpiry || '',
      insExpiry: d.insExpiry || '',
      status: d.status === 'Maintenance' ? 'Maintenance' : 'Available',
      ownerType: d.ownerType === 'subcontractor' ? 'subcontractor' : 'company',
      driverId: d.driverId || '',
    }),
    (a, b) => a.licensePlate.localeCompare(b.licensePlate)
  );

  listen<Employee>(
    COLLECTIONS.employees,
    'employees',
    (d) => ({
      id: d.id || '',
      name: d.name || '',
      position: d.position || '',
      department: d.department || '',
      phone: d.phone || '',
      salary: Number(d.salary) || 0,
      startDate: d.startDate || '',
    }),
    (a, b) => a.id.localeCompare(b.id)
  );

  listen<TransportJob>(
    COLLECTIONS.jobs,
    'jobs',
    (d) => ({
      jobNo: d.jobNo || '',
      date: d.date || '',
      customerId: d.customerId || '',
      customerName: d.customerName || '',
      origin: d.origin || '',
      destination: d.destination || '',
      vehicleLicense: d.vehicleLicense || '',
      driverName: d.driverName || '',
      driverNames: Array.isArray(d.driverNames) ? d.driverNames : [],
      vehicleType: d.vehicleType || '',
      bookingNo: d.bookingNo || '',
      shipper: d.shipper || '',
      containers: Array.isArray(d.containers) ? d.containers : [],
      totalAmount: Number(d.totalAmount) || 0,
      status: d.status || 'รอดำเนินการ',
      jobType: d.jobType === 'Export' ? 'Export' : 'Import',
      quantity: Number(d.quantity) || 1,
      containerSize: d.containerSize || '40HC',
      shipAgent: d.shipAgent || '',
      pickupAt: d.pickupAt || '',
      loadAt: d.loadAt || '',
      returnAt: d.returnAt || '',
      pickupLocation: d.pickupLocation || '',
      returnLocation: d.returnLocation || '',
      notes: d.notes || '',
    }),
    (a, b) => b.jobNo.localeCompare(a.jobNo)
  );

  listen<DailyExpense>(
    COLLECTIONS.expenses,
    'expenses',
    (d) =>
      normalizeExpenseRecord({
        id: d.id || '',
        jobNo: d.jobNo || '',
        containerNo: d.containerNo || '',
        date: d.date || '',
        type: (d.type || 'อื่นๆ') as DailyExpenseType,
        expenseCategory:
          d.expenseCategory === 'driver' || d.expenseCategory === 'general'
            ? d.expenseCategory
            : undefined,
        description: d.description || '',
        vehicleLicense: d.vehicleLicense || '',
        driverName: d.driverName || '',
        amount: Number(d.amount) || 0,
        note: d.note || '',
        billType: d.billType === 'Adv' ? 'Adv' : 'Normal',
      }),
    (a, b) => b.date.localeCompare(a.date)
  );

  listen<CreditIncome>(
    COLLECTIONS.incomes,
    'incomes',
    (d) => ({
      id: d.id || '',
      customerName: d.customerName || '',
      billingDate: d.billingDate || '',
      creditTerms: Number(d.creditTerms) || 0,
      dueDate: d.dueDate || '',
      amount: Number(d.amount) || 0,
      status: d.status || 'ยังไม่ถึงกำหนด',
    }),
    (a, b) => a.id.localeCompare(b.id)
  );

  listen<Invoice>(
    COLLECTIONS.invoices,
    'invoices',
    (d) => ({
      invoiceNo: d.invoiceNo || '',
      date: d.date || '',
      customerId: d.customerId || '',
      customerName: d.customerName || '',
      jobNo: d.jobNo || '',
      invoiceType: d.invoiceType === 'Advance' ? 'Advance' : 'Transport',
      bookingNo: d.bookingNo || '',
      shipper: d.shipper || '',
      containers: Array.isArray(d.containers) ? d.containers : [],
      advanceItems: Array.isArray(d.advanceItems) ? d.advanceItems : [],
      extraItems: Array.isArray(d.extraItems) ? d.extraItems : [],
      subtotal: Number(d.subtotal) || 0,
      withholdingTax: Number(d.withholdingTax) || 0,
      vatAmount: Number(d.vatAmount) || 0,
      grandTotal: Number(d.grandTotal) || 0,
      totalText: d.totalText || '',
      status: d.status === 'จ่ายแล้ว' ? 'จ่ายแล้ว' : 'ยังไม่จ่าย',
      remark: d.remark || '',
    }),
    (a, b) => b.invoiceNo.localeCompare(a.invoiceNo)
  );

  listen<Receipt>(
    COLLECTIONS.receipts,
    'receipts',
    (d) => ({
      receiptNo: d.receiptNo || '',
      date: d.date || '',
      invoiceNo: d.invoiceNo || '',
      customerName: d.customerName || '',
      amount: Number(d.amount) || 0,
      paymentMethod: d.paymentMethod || 'โอนเงิน',
      receiptType: d.receiptType === 'Advance' ? 'Advance' : 'Transport',
      remark: d.remark || '',
    }),
    (a, b) => b.receiptNo.localeCompare(a.receiptNo)
  );

  listen<ManagerEntry>(
    COLLECTIONS.managerEntries,
    'managerEntries',
    (d) => ({
      id: d.id || '',
      date: d.date || '',
      type: d.type === 'EXPENSE' ? 'EXPENSE' : 'INCOME',
      category: d.category || '',
      title: d.title || '',
      amount: Number(d.amount) || 0,
      recordedBy: d.recordedBy || '',
      referenceNo: d.referenceNo || '',
      note: d.note || '',
    }),
    (a, b) => b.date.localeCompare(a.date)
  );

  listen<SubcontractorPaymentDoc>(
    COLLECTIONS.partnerPaymentDocs,
    'partnerPaymentDocs',
    (d) => ({
      id: d.id || '',
      paymentNo: d.paymentNo || '',
      date: d.date || '',
      partnerName: d.partnerName || '',
      vehicleLicense: d.vehicleLicense || '',
      paymentCycle: d.paymentCycle || '',
      trips: Array.isArray(d.trips) ? d.trips : [],
      subtotalPrice: Number(d.subtotalPrice) || 0,
      subtotalOt: Number(d.subtotalOt) || 0,
      totalBeforeDeductions: Number(d.totalBeforeDeductions) || 0,
      advanceDeduction: Number(d.advanceDeduction) || 0,
      withholdingTax: Number(d.withholdingTax) || 0,
      grandTotal: Number(d.grandTotal) || 0,
      status: d.status === 'จ่ายแล้ว' ? 'จ่ายแล้ว' : 'ยังไม่ได้จ่าย',
      note: d.note || '',
    }),
    (a, b) => b.date.localeCompare(a.date)
  );

  listen<PartnerPayment>(
    COLLECTIONS.partnerPayments,
    'partnerPayments',
    (d) => ({
      id: d.id || '',
      date: d.date || '',
      partnerName: d.partnerName || '',
      jobNo: d.jobNo || '',
      paymentType: d.paymentType === 'RENT_CAR' ? 'RENT_CAR' : 'PAY_PARTNER',
      revenue: Number(d.revenue) || 0,
      expensesDeduction: Number(d.expensesDeduction) || 0,
      netPaid: Number(d.netPaid) || 0,
      status: d.status === 'จ่ายแล้ว' ? 'จ่ายแล้ว' : 'ยังไม่ได้เคลียร์',
    }),
    (a, b) => b.date.localeCompare(a.date)
  );

  listen<WithholdingTaxRecord>(
    COLLECTIONS.withholdingTaxes,
    'withholdingTaxes',
    (d) => ({
      id: d.id || '',
      date: d.date || '',
      payeeName: d.payeeName || '',
      taxIDNumber: d.taxIDNumber || '',
      baseAmount: Number(d.baseAmount) || 0,
      rate: Number(d.rate) || 1,
      taxAmount: Number(d.taxAmount) || 0,
      type: d.type === 'Service' || d.type === 'Other' ? d.type : 'Transportation',
    }),
    (a, b) => b.date.localeCompare(a.date)
  );

  listen<PayrollRecord>(
    COLLECTIONS.payroll,
    'payroll',
    (d) => ({
      id: d.id || '',
      employeeId: d.employeeId || '',
      employeeName: d.employeeName || '',
      role: d.role === 'Driver' ? 'Driver' : 'Staff',
      payDate: d.payDate || '',
      salary: Number(d.salary) || 0,
      ot: Number(d.ot) || 0,
      bonus: Number(d.bonus) || 0,
      deduction: Number(d.deduction) || 0,
      netSalary: Number(d.netSalary) || 0,
      status: d.status === 'Paid' ? 'Paid' : 'Unpaid',
    }),
    (a, b) => b.payDate.localeCompare(a.payDate)
  );

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}

// ==========================================
// CRUD Operations for All 14 Entities
// ==========================================

export async function fbSaveCustomer(cust: Customer, uid: string): Promise<void> {
  const payload: Record<string, unknown> = {
    id: clampStr(cust.id || `CUST-${Date.now()}`, 100),
    name: clampStr(cust.name || 'Unnamed Customer', 200),
    company: clampStr(cust.company, 200),
    phone: clampStr(cust.phone, 60),
    line: clampStr(cust.line, 100),
    creditTerm: Math.min(3650, safeNonNegNum(cust.creditTerm)),
    address: clampStr(cust.address, 500),
    taxId: clampStr(cust.taxId, 50),
  };
  await upsertDocument(COLLECTIONS.customers, cust.id, payload, uid);
}

export async function fbDeleteCustomer(id: string): Promise<void> {
  await removeDocument(COLLECTIONS.customers, id);
}

export async function fbSaveDriver(drv: Driver, uid: string): Promise<void> {
  const payload: Record<string, unknown> = {
    id: clampStr(drv.id || `DRV-${Date.now()}`, 100),
    name: clampStr(drv.name || 'Unnamed Driver', 200),
    phone: clampStr(drv.phone, 60),
    licenseNo: clampStr(drv.licenseNo, 100),
    expiryDate: clampStr(drv.expiryDate, 50),
    vehicleLicense: clampStr(drv.vehicleLicense, 100),
    status: drv.status === 'On Duty' ? 'On Duty' : 'Available',
  };
  await upsertDocument(COLLECTIONS.drivers, drv.id, payload, uid);
}

export async function fbDeleteDriver(id: string): Promise<void> {
  await removeDocument(COLLECTIONS.drivers, id);
}

export async function fbSaveVehicle(veh: Vehicle, uid: string): Promise<void> {
  const payload: Record<string, unknown> = {
    licensePlate: clampStr(veh.licensePlate, 100),
    type: clampStr(veh.type, 100),
    brand: clampStr(veh.brand, 100),
    year: clampStr(veh.year, 20),
    actExpiry: clampStr(veh.actExpiry, 50),
    insExpiry: clampStr(veh.insExpiry, 50),
    status: veh.status === 'Maintenance' ? 'Maintenance' : 'Available',
    ownerType: veh.ownerType === 'subcontractor' ? 'subcontractor' : 'company',
    driverId: clampStr(veh.driverId, 100),
  };
  await upsertDocument(COLLECTIONS.vehicles, veh.licensePlate, payload, uid);
}

export async function fbDeleteVehicle(licensePlate: string): Promise<void> {
  await removeDocument(COLLECTIONS.vehicles, licensePlate);
}

export async function fbSaveEmployee(emp: Employee, uid: string): Promise<void> {
  const payload: Record<string, unknown> = {
    id: clampStr(emp.id || `EMP-${Date.now()}`, 100),
    name: clampStr(emp.name || 'Unnamed Employee', 200),
    position: clampStr(emp.position, 150),
    department: clampStr(emp.department, 150),
    phone: clampStr(emp.phone, 60),
    salary: safeNonNegNum(emp.salary),
    startDate: clampStr(emp.startDate, 50),
  };
  await upsertDocument(COLLECTIONS.employees, emp.id, payload, uid);
}

export async function fbDeleteEmployee(id: string): Promise<void> {
  await removeDocument(COLLECTIONS.employees, id);
}

export async function fbSaveJob(job: TransportJob, uid: string): Promise<void> {
  const validStatuses = ['รอดำเนินการ', 'กำลังขนส่ง', 'ส่งแล้ว', 'วางบิลแล้ว', 'รับเงินแล้ว'];
  const status = validStatuses.includes(job.status) ? job.status : 'รอดำเนินการ';
  const payload: Record<string, unknown> = {
    jobNo: clampStr(job.jobNo, 100),
    date: clampStr(job.date, 50),
    customerId: clampStr(job.customerId, 100),
    customerName: clampStr(job.customerName, 200),
    origin: clampStr(job.origin, 300),
    destination: clampStr(job.destination, 300),
    vehicleLicense: clampStr(job.vehicleLicense, 100),
    driverName: clampStr(job.driverName, 200),
    driverNames: Array.isArray(job.driverNames)
      ? job.driverNames.slice(0, 10).map((n) => clampStr(n, 200))
      : [],
    vehicleType: clampStr(job.vehicleType, 100),
    bookingNo: clampStr(job.bookingNo, 150),
    shipper: clampStr(job.shipper, 200),
    containers: sanitizeContainers(job.containers),
    totalAmount: safeNonNegNum(job.totalAmount),
    status,
    jobType: job.jobType === 'Export' ? 'Export' : 'Import',
    quantity: safeNonNegNum(job.quantity ?? 1),
    containerSize: clampStr(job.containerSize || '40HC', 50),
    shipAgent: clampStr(job.shipAgent, 200),
    pickupAt: clampStr(job.pickupAt, 100),
    loadAt: clampStr(job.loadAt, 100),
    returnAt: clampStr(job.returnAt, 100),
    pickupLocation: clampStr(job.pickupLocation, 300),
    returnLocation: clampStr(job.returnLocation, 300),
    notes: clampStr(job.notes, 1000),
  };
  await upsertDocument(COLLECTIONS.jobs, job.jobNo, payload, uid);
}

export async function fbDeleteJob(jobNo: string): Promise<void> {
  await removeDocument(COLLECTIONS.jobs, jobNo);
}

export async function fbSaveExpense(exp: DailyExpense, uid: string): Promise<void> {
  const validType: DailyExpenseType = (ALL_EXPENSE_TYPES as string[]).includes(exp.type)
    ? exp.type
    : 'อื่นๆ';
  const resolvedCategory =
    exp.expenseCategory === 'driver' || exp.expenseCategory === 'general'
      ? exp.expenseCategory
      : isDriverExpenseType(validType)
        ? 'driver'
        : 'general';
  const tax = calculateDriverExpenseTax(safeNonNegNum(exp.amount), resolvedCategory);

  const payload: Record<string, unknown> = {
    id: clampStr(exp.id || `EXP-${Date.now()}`, 100),
    jobNo: clampStr(exp.jobNo, 100),
    containerNo: clampStr(exp.containerNo, 100),
    date: clampStr(exp.date, 50),
    type: validType,
    expenseCategory: tax.expenseCategory,
    description: clampStr(exp.description, 500),
    vehicleLicense: clampStr(exp.vehicleLicense, 100),
    driverName: clampStr(exp.driverName, 200),
    amount: tax.amount,
    withholdingTaxRate: tax.withholdingTaxRate,
    withholdingTaxAmount: tax.withholdingTaxAmount,
    netAmount: tax.netAmount,
    note: clampStr(exp.note, 500),
    billType: exp.billType === 'Adv' ? 'Adv' : 'Normal',
  };
  await upsertDocument(COLLECTIONS.expenses, exp.id, payload, uid);
}

export async function fbDeleteExpense(id: string): Promise<void> {
  await removeDocument(COLLECTIONS.expenses, id);
}

export async function fbSaveInvoice(inv: Invoice, uid: string): Promise<void> {
  const payload: Record<string, unknown> = {
    invoiceNo: clampStr(inv.invoiceNo, 100),
    date: clampStr(inv.date, 50),
    customerId: clampStr(inv.customerId, 100),
    customerName: clampStr(inv.customerName, 200),
    jobNo: clampStr(inv.jobNo, 200),
    invoiceType: inv.invoiceType === 'Advance' ? 'Advance' : 'Transport',
    bookingNo: clampStr(inv.bookingNo, 150),
    shipper: clampStr(inv.shipper, 200),
    containers: sanitizeContainers(inv.containers),
    advanceItems: sanitizeAdvanceItems(inv.advanceItems),
    extraItems: sanitizeExtraItems(inv.extraItems),
    subtotal: safeNonNegNum(inv.subtotal),
    withholdingTax: safeNonNegNum(inv.withholdingTax),
    vatAmount: safeNonNegNum(inv.vatAmount),
    grandTotal: safeNonNegNum(inv.grandTotal),
    totalText: clampStr(inv.totalText, 500),
    status: inv.status === 'จ่ายแล้ว' ? 'จ่ายแล้ว' : 'ยังไม่จ่าย',
    remark: clampStr(inv.remark, 1000),
  };
  await upsertDocument(COLLECTIONS.invoices, inv.invoiceNo, payload, uid);

  // Sync linked job status to 'วางบิลแล้ว' if job exists
  if (inv.jobNo) {
    const jobSafeId = toSafeDocId(inv.jobNo);
    const jobRef = doc(db, COLLECTIONS.jobs, jobSafeId);
    try {
      const jobSnap = await getDoc(jobRef);
      if (jobSnap.exists() && jobSnap.data().status !== 'รับเงินแล้ว') {
        await updateDoc(jobRef, { status: 'วางบิลแล้ว', updatedAt: serverTimestamp() });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.jobs}/${jobSafeId}`);
    }
  }
}

export async function fbDeleteInvoice(invoiceNo: string): Promise<void> {
  await removeDocument(COLLECTIONS.invoices, invoiceNo);
}

export async function fbSaveReceipt(rec: Receipt, uid: string): Promise<void> {
  const validMethods = ['เงินสด', 'โอนเงิน', 'เช็ค'];
  const payload: Record<string, unknown> = {
    receiptNo: clampStr(rec.receiptNo, 100),
    date: clampStr(rec.date, 50),
    invoiceNo: clampStr(rec.invoiceNo, 500),
    customerName: clampStr(rec.customerName, 200),
    amount: safeNonNegNum(rec.amount),
    paymentMethod: validMethods.includes(rec.paymentMethod) ? rec.paymentMethod : 'โอนเงิน',
    receiptType: rec.receiptType === 'Advance' ? 'Advance' : 'Transport',
    remark: clampStr(rec.remark, 1000),
  };
  await upsertDocument(COLLECTIONS.receipts, rec.receiptNo, payload, uid);

  // Mark referenced invoices as 'จ่ายแล้ว'
  const invNos = rec.invoiceNo
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const invNo of invNos) {
    const safeInvId = toSafeDocId(invNo);
    const invRef = doc(db, COLLECTIONS.invoices, safeInvId);
    try {
      const snap = await getDoc(invRef);
      if (snap.exists() && snap.data().status !== 'จ่ายแล้ว') {
        await updateDoc(invRef, { status: 'จ่ายแล้ว', updatedAt: serverTimestamp() });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.invoices}/${safeInvId}`);
    }
  }
}

export async function fbDeleteReceipt(receiptNo: string, linkedInvoiceNos: string[]): Promise<void> {
  await removeDocument(COLLECTIONS.receipts, receiptNo);

  for (const invNo of linkedInvoiceNos) {
    const safeInvId = toSafeDocId(invNo);
    const invRef = doc(db, COLLECTIONS.invoices, safeInvId);
    try {
      const snap = await getDoc(invRef);
      if (snap.exists() && snap.data().status === 'จ่ายแล้ว') {
        await updateDoc(invRef, { status: 'ยังไม่จ่าย', updatedAt: serverTimestamp() });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.invoices}/${safeInvId}`);
    }
  }
}

export async function fbSaveManagerEntry(entry: ManagerEntry, uid: string): Promise<void> {
  const payload: Record<string, unknown> = {
    id: clampStr(entry.id || `MGR-${Date.now()}`, 100),
    date: clampStr(entry.date, 50),
    type: entry.type === 'EXPENSE' ? 'EXPENSE' : 'INCOME',
    category: clampStr(entry.category, 150),
    title: clampStr(entry.title, 300),
    amount: safeNonNegNum(entry.amount),
    recordedBy: clampStr(entry.recordedBy, 150),
    referenceNo: clampStr(entry.referenceNo, 150),
    note: clampStr(entry.note, 1000),
  };
  await upsertDocument(COLLECTIONS.managerEntries, entry.id, payload, uid);
}

export async function fbDeleteManagerEntry(id: string): Promise<void> {
  await removeDocument(COLLECTIONS.managerEntries, id);
}

export async function fbSaveSubcontractorPaymentDoc(
  docData: SubcontractorPaymentDoc,
  uid: string
): Promise<void> {
  const payload: Record<string, unknown> = {
    id: clampStr(docData.id || `SUB-${Date.now()}`, 100),
    paymentNo: clampStr(docData.paymentNo, 100),
    date: clampStr(docData.date, 50),
    partnerName: clampStr(docData.partnerName, 200),
    vehicleLicense: clampStr(docData.vehicleLicense, 100),
    paymentCycle: clampStr(docData.paymentCycle, 100),
    trips: sanitizeTrips(docData.trips),
    subtotalPrice: safeNum(docData.subtotalPrice),
    subtotalOt: safeNum(docData.subtotalOt),
    totalBeforeDeductions: safeNum(docData.totalBeforeDeductions),
    advanceDeduction: safeNum(docData.advanceDeduction),
    withholdingTax: safeNum(docData.withholdingTax),
    grandTotal: safeNum(docData.grandTotal),
    status: docData.status === 'จ่ายแล้ว' ? 'จ่ายแล้ว' : 'ยังไม่ได้จ่าย',
    note: clampStr(docData.note, 1000),
  };
  await upsertDocument(COLLECTIONS.partnerPaymentDocs, docData.id, payload, uid);
}

export async function fbDeleteSubcontractorPaymentDoc(id: string): Promise<void> {
  await removeDocument(COLLECTIONS.partnerPaymentDocs, id);
}

export async function fbSavePartnerPayment(ppm: PartnerPayment, uid: string): Promise<void> {
  const payload: Record<string, unknown> = {
    id: clampStr(ppm.id || `PPM-${Date.now()}`, 100),
    date: clampStr(ppm.date, 50),
    partnerName: clampStr(ppm.partnerName, 200),
    jobNo: clampStr(ppm.jobNo, 100),
    paymentType: ppm.paymentType === 'RENT_CAR' ? 'RENT_CAR' : 'PAY_PARTNER',
    revenue: safeNum(ppm.revenue),
    expensesDeduction: safeNum(ppm.expensesDeduction),
    netPaid: safeNum(ppm.netPaid),
    status: ppm.status === 'จ่ายแล้ว' ? 'จ่ายแล้ว' : 'ยังไม่ได้เคลียร์',
  };
  await upsertDocument(COLLECTIONS.partnerPayments, ppm.id, payload, uid);
}

export async function fbDeletePartnerPayment(id: string): Promise<void> {
  await removeDocument(COLLECTIONS.partnerPayments, id);
}

export async function fbSaveWithholdingTax(wht: WithholdingTaxRecord, uid: string): Promise<void> {
  const validTypes = ['Transportation', 'Service', 'Other'];
  const payload: Record<string, unknown> = {
    id: clampStr(wht.id || `WHT-${Date.now()}`, 100),
    date: clampStr(wht.date, 50),
    payeeName: clampStr(wht.payeeName, 200),
    taxIDNumber: clampStr(wht.taxIDNumber, 50),
    baseAmount: safeNonNegNum(wht.baseAmount),
    rate: Math.min(100, safeNonNegNum(wht.rate)),
    taxAmount: safeNonNegNum(wht.taxAmount),
    type: validTypes.includes(wht.type) ? wht.type : 'Transportation',
  };
  await upsertDocument(COLLECTIONS.withholdingTaxes, wht.id, payload, uid);
}

export async function fbDeleteWithholdingTax(id: string): Promise<void> {
  await removeDocument(COLLECTIONS.withholdingTaxes, id);
}

export async function fbSavePayroll(pr: PayrollRecord, uid: string): Promise<void> {
  const payload: Record<string, unknown> = {
    id: clampStr(pr.id || `PAY-${Date.now()}`, 100),
    employeeId: clampStr(pr.employeeId, 100),
    employeeName: clampStr(pr.employeeName, 200),
    role: pr.role === 'Driver' ? 'Driver' : 'Staff',
    payDate: clampStr(pr.payDate, 50),
    salary: safeNonNegNum(pr.salary),
    ot: safeNonNegNum(pr.ot),
    bonus: safeNonNegNum(pr.bonus),
    deduction: safeNonNegNum(pr.deduction),
    netSalary: safeNum(pr.netSalary),
    status: pr.status === 'Paid' ? 'Paid' : 'Unpaid',
  };
  await upsertDocument(COLLECTIONS.payroll, pr.id, payload, uid);
}

export async function fbDeletePayroll(id: string): Promise<void> {
  await removeDocument(COLLECTIONS.payroll, id);
}

/**
 * Syncs updated customer name across existing jobs, invoices, and receipts in Firestore
 */
export async function fbSyncCustomerNameCascade(
  cust: Customer,
  oldCustomer: Customer | null,
  currentState: AppDataState,
  uid: string
): Promise<void> {
  const matchesOld = (name: string) =>
    oldCustomer ? name === oldCustomer.name || name === oldCustomer.company : false;

  const jobsToUpdate = currentState.jobs.filter(
    (j) => j.customerId === cust.id || matchesOld(j.customerName)
  );
  for (const job of jobsToUpdate) {
    await fbSaveJob({ ...job, customerId: cust.id, customerName: cust.name }, uid);
  }

  const invoicesToUpdate = currentState.invoices.filter(
    (inv) => inv.customerId === cust.id || matchesOld(inv.customerName)
  );
  for (const inv of invoicesToUpdate) {
    await fbSaveInvoice({ ...inv, customerId: cust.id, customerName: cust.name }, uid);
  }

  const receiptsToUpdate = currentState.receipts.filter((r) => matchesOld(r.customerName));
  for (const rec of receiptsToUpdate) {
    await fbSaveReceipt({ ...rec, customerName: cust.name }, uid);
  }
}
