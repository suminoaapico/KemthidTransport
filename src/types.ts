export interface Customer {
  id: string;
  name: string;
  company: string;
  phone: string;
  line: string;
  creditTerm: number; // Days
  address: string;
  taxId?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNo: string;
  expiryDate: string;
  vehicleLicense: string;
  status: 'Available' | 'On Duty';
}

export interface Vehicle {
  licensePlate: string;
  type: string;
  brand: string;
  year: string;
  actExpiry: string;
  insExpiry: string;
  status: 'Available' | 'Maintenance';
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  phone: string;
  salary: number;
  startDate: string;
}

export interface ContainerExpense {
  name: string;
  amount: number;
  qty?: number;
  rate?: number;
}

export interface ContainerDetail {
  containerNo: string;
  transportation: number;
  portCharge: number;
  containerHandling: number;
  liftOnOff: number;
  otherExpenseName?: string;
  otherExpenseAmount?: number;
  overtimeQty?: number;
  overtimeRate?: number;
  expenses?: ContainerExpense[];
}

export interface AdvanceItem {
  id: string;
  description: string;
  amount: number;
}

export interface TransportJob {
  jobNo: string;
  date: string;
  customerId: string;
  customerName: string;
  origin: string;
  destination: string;
  vehicleLicense: string;
  driverName: string;
  vehicleType: string;
  bookingNo: string;
  shipper: string;
  containers: ContainerDetail[];
  totalAmount: number; // Calculated sum of transportation and charges
  status: 'รอดำเนินการ' | 'กำลังขนส่ง' | 'ส่งแล้ว' | 'วางบิลแล้ว' | 'รับเงินแล้ว';
  jobType?: 'Import' | 'Export';
  quantity?: number;
  containerSize?: string;
  shipAgent?: string;
  pickupAt?: string;
  loadAt?: string;
  returnAt?: string;
}

export interface DailyExpense {
  id: string;
  jobNo: string;
  containerNo?: string;
  date: string;
  type: 'น้ำมัน' | 'ค่าทางด่วน' | 'ค่าซ่อม' | 'ค่าแรง' | 'ค่าอาหาร' | 'อื่นๆ';
  description: string;
  vehicleLicense: string;
  driverName: string;
  amount: number;
  note: string;
  billType: 'Normal' | 'Adv'; // Normal_Expense vs Advance_Adv
}

export interface CreditIncome {
  id: string; // matches invoice no
  customerName: string;
  billingDate: string;
  creditTerms: number;
  dueDate: string;
  amount: number;
  status: 'ยังไม่ถึงกำหนด' | 'ใกล้ครบกำหนด' | 'เกินกำหนด' | 'รับเงินแล้ว';
}

export interface Invoice {
  invoiceNo: string;
  date: string;
  customerId: string;
  customerName: string;
  jobNo: string; // Commas separated or single
  invoiceType: 'Transport' | 'Advance';
  bookingNo: string;
  shipper: string;
  containers: ContainerDetail[]; // empty for advance
  advanceItems: AdvanceItem[]; // empty for transport
  subtotal: number;
  withholdingTax: number; // 1% for transport, 0 for advance
  vatAmount: number; // 7% for advance, 0 for transport
  grandTotal: number;
  totalText: string;
  status: 'ยังไม่จ่าย' | 'จ่ายแล้ว';
}

export interface Receipt {
  receiptNo: string;
  date: string;
  invoiceNo: string;
  customerName: string;
  amount: number;
  paymentMethod: 'เงินสด' | 'โอนเงิน' | 'เช็ค';
  receiptType: 'Transport' | 'Advance';
}

export interface PartnerPayment {
  id: string;
  date: string;
  partnerName: string; // Name of co-loader or license
  jobNo: string;
  paymentType: 'PAY_PARTNER' | 'RENT_CAR'; // Dual tab controller
  revenue: number;
  expensesDeduction: number;
  netPaid: number;
  status: 'ยังไม่ได้เคลียร์' | 'จ่ายแล้ว';
}

export interface WithholdingTaxRecord {
  id: string;
  date: string;
  payeeName: string;
  taxIDNumber: string;
  baseAmount: number;
  rate: number; // 1 or 3
  taxAmount: number;
  type: 'Transportation' | 'Service' | 'Other';
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  role: 'Driver' | 'Staff';
  payDate: string;
  salary: number;
  ot: number;
  bonus: number;
  deduction: number;
  netSalary: number;
  status: 'Paid' | 'Unpaid';
}
