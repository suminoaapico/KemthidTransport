import { createClient } from '@supabase/supabase-js';
import { 
  Customer, Driver, Vehicle, Employee, TransportJob, 
  DailyExpense, Invoice, Receipt, PartnerPayment, 
  WithholdingTaxRecord, PayrollRecord 
} from './types';

const SUPABASE_URL = "https://uxdonakrhqhxktrvssxr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4ZG9uYWtyaHFoeGt0cnZzc3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMzY2NzUsImV4cCI6MjA5NDkxMjY3NX0.lh7MnqP5Y6i3scThWEJ0WZ0Nl3G4dVx21xcchrg9QSo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const SQL_SCHEMA = `-- ==========================================
-- SUPABASE POSTGRESQL SCHEMAS FOR KHEMTHIT LOGISTICS
-- ==========================================

-- 1. Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  line TEXT,
  credit_term INTEGER DEFAULT 30,
  address TEXT,
  tax_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
  license_plate TEXT PRIMARY KEY,
  type TEXT,
  brand TEXT,
  year TEXT,
  act_expiry TEXT,
  ins_expiry TEXT,
  status TEXT CHECK (status IN ('Available', 'Maintenance')) DEFAULT 'Available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Drivers Table
CREATE TABLE IF NOT EXISTS drivers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  license_no TEXT,
  expiry_date TEXT,
  vehicle_license TEXT REFERENCES vehicles(license_plate) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('Available', 'On Duty')) DEFAULT 'Available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Employees Table
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT,
  department TEXT,
  phone TEXT,
  salary NUMERIC DEFAULT 0,
  start_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Transport Jobs Table
-- Note: the containers JSONB schema represents an array of container details:
--   - containerNo (TEXT)
--   - transportation (NUMERIC)
--   - portCharge (NUMERIC)
--   - containerHandling (NUMERIC)
--   - liftOnOff (NUMERIC)
--   - otherExpenseName (TEXT, Optional) - รายการค่าใช้จ่ายอื่น ๆ นอกเหนือจาก 4 รายการหลัก
--   - otherExpenseAmount (NUMERIC, Optional) - จำนวนเงินของรายการอื่น ๆ เพิ่มเติม
CREATE TABLE IF NOT EXISTS transport_jobs (
  job_no TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT,
  origin TEXT,
  destination TEXT,
  vehicle_license TEXT REFERENCES vehicles(license_plate) ON DELETE SET NULL,
  driver_name TEXT,
  vehicle_type TEXT,
  booking_no TEXT,
  shipper TEXT,
  containers JSONB DEFAULT '[]'::jsonb,
  total_amount NUMERIC DEFAULT 0,
  status TEXT CHECK (status IN ('รอดำเนินการ', 'กำลังขนส่ง', 'ส่งแล้ว', 'วางบิลแล้ว', 'รับเงินแล้ว')) DEFAULT 'รอดำเนินการ',
  job_type TEXT DEFAULT 'Import',
  quantity INT DEFAULT 1,
  container_size TEXT DEFAULT '40HC',
  ship_agent TEXT,
  pickup_at TEXT,
  load_at TEXT,
  return_at TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Daily Expenses Table
CREATE TABLE IF NOT EXISTS daily_expenses (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  type TEXT CHECK (type IN ('น้ำมัน', 'ค่าทางด่วน', 'ค่าซ่อม', 'ค่าแรง', 'ค่าอาหาร', 'อื่นๆ')),
  description TEXT,
  vehicle_license TEXT REFERENCES vehicles(license_plate) ON DELETE SET NULL,
  driver_name TEXT,
  amount NUMERIC DEFAULT 0,
  note TEXT,
  bill_type TEXT CHECK (bill_type IN ('Normal', 'Adv')) DEFAULT 'Normal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. Invoices Table
-- Note: the containers JSONB schema contains the same array format as transport_jobs.containers
CREATE TABLE IF NOT EXISTS invoices (
  invoice_no TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT,
  job_no TEXT,
  invoice_type TEXT CHECK (invoice_type IN ('Transport', 'Advance')),
  booking_no TEXT,
  shipper TEXT,
  containers JSONB DEFAULT '[]'::jsonb,
  advance_items JSONB DEFAULT '[]'::jsonb,
  subtotal NUMERIC DEFAULT 0,
  withholding_tax NUMERIC DEFAULT 0,
  vat_amount NUMERIC DEFAULT 0,
  grand_total NUMERIC DEFAULT 0,
  total_text TEXT,
  status TEXT CHECK (status IN ('ยังไม่จ่าย', 'จ่ายแล้ว')) DEFAULT 'ยังไม่จ่าย',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. Receipts Table
CREATE TABLE IF NOT EXISTS receipts (
  receipt_no TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  invoice_no TEXT REFERENCES invoices(invoice_no) ON DELETE SET NULL,
  customer_name TEXT,
  amount NUMERIC DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('เงินสด', 'โอนเงิน', 'เช็ค')),
  receipt_type TEXT CHECK (receipt_type IN ('Transport', 'Advance')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 9. Partner Payments Table
CREATE TABLE IF NOT EXISTS partner_payments (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  partner_name TEXT,
  job_no TEXT,
  payment_type TEXT CHECK (payment_type IN ('PAY_PARTNER', 'RENT_CAR')),
  revenue NUMERIC DEFAULT 0,
  expenses_deduction NUMERIC DEFAULT 0,
  net_paid NUMERIC DEFAULT 0,
  status TEXT CHECK (status IN ('ยังไม่ได้เคลียร์', 'จ่ายแล้ว')) DEFAULT 'ยังไม่ได้เคลียร์',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 10. Withholding Taxes Table
CREATE TABLE IF NOT EXISTS withholding_taxes (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  payee_name TEXT,
  tax_id_number TEXT,
  base_amount NUMERIC DEFAULT 0,
  rate NUMERIC DEFAULT 1,
  tax_amount NUMERIC DEFAULT 0,
  type TEXT CHECK (type IN ('Transportation', 'Service', 'Other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 11. Payroll Table
CREATE TABLE IF NOT EXISTS payroll (
  id TEXT PRIMARY KEY,
  employee_id TEXT,
  employee_name TEXT,
  role TEXT CHECK (role IN ('Driver', 'Staff')),
  pay_date TEXT NOT NULL,
  salary NUMERIC DEFAULT 0,
  ot NUMERIC DEFAULT 0,
  bonus NUMERIC DEFAULT 0,
  deduction NUMERIC DEFAULT 0,
  net_salary NUMERIC DEFAULT 0,
  status TEXT CHECK (status IN ('Paid', 'Unpaid')) DEFAULT 'Unpaid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Row Level Security (RLS) Enable for All Tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE withholding_taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;

-- Create Select/Insert/Update/Delete Anonymous Policies for client bypass 
CREATE POLICY "Allow public select of customers" ON customers FOR SELECT USING (true);
CREATE POLICY "Allow public insert of customers" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update of customers" ON customers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete of customers" ON customers FOR DELETE USING (true);

-- Repeat for vehicles
CREATE POLICY "Allow public select of vehicles" ON vehicles FOR SELECT USING (true);
CREATE POLICY "Allow public insert of vehicles" ON vehicles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update of vehicles" ON vehicles FOR UPDATE USING (true);
CREATE POLICY "Allow public delete of vehicles" ON vehicles FOR DELETE USING (true);

-- Repeat for drivers
CREATE POLICY "Allow public select of drivers" ON drivers FOR SELECT USING (true);
CREATE POLICY "Allow public insert of drivers" ON drivers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update of drivers" ON drivers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete of drivers" ON drivers FOR DELETE USING (true);

-- Repeat for employees
CREATE POLICY "Allow public select of employees" ON employees FOR SELECT USING (true);
CREATE POLICY "Allow public insert of employees" ON employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update of employees" ON employees FOR UPDATE USING (true);
CREATE POLICY "Allow public delete of employees" ON employees FOR DELETE USING (true);

-- Repeat for transport_jobs
CREATE POLICY "Allow public select of transport_jobs" ON transport_jobs FOR SELECT USING (true);
CREATE POLICY "Allow public insert of transport_jobs" ON transport_jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update of transport_jobs" ON transport_jobs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete of transport_jobs" ON transport_jobs FOR DELETE USING (true);

-- Repeat for daily_expenses
CREATE POLICY "Allow public select of daily_expenses" ON daily_expenses FOR SELECT USING (true);
CREATE POLICY "Allow public insert of daily_expenses" ON daily_expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update of daily_expenses" ON daily_expenses FOR UPDATE USING (true);
CREATE POLICY "Allow public delete of daily_expenses" ON daily_expenses FOR DELETE USING (true);

-- Repeat for invoices
CREATE POLICY "Allow public select of invoices" ON invoices FOR SELECT USING (true);
CREATE POLICY "Allow public insert of invoices" ON invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update of invoices" ON invoices FOR UPDATE USING (true);
CREATE POLICY "Allow public delete of invoices" ON invoices FOR DELETE USING (true);

-- Repeat for receipts
CREATE POLICY "Allow public select of receipts" ON receipts FOR SELECT USING (true);
CREATE POLICY "Allow public insert of receipts" ON receipts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update of receipts" ON receipts FOR UPDATE USING (true);
CREATE POLICY "Allow public delete of receipts" ON receipts FOR DELETE USING (true);

-- Repeat for partner_payments
CREATE POLICY "Allow public select of partner_payments" ON partner_payments FOR SELECT USING (true);
CREATE POLICY "Allow public insert of partner_payments" ON partner_payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update of partner_payments" ON partner_payments FOR UPDATE USING (true);
CREATE POLICY "Allow public delete of partner_payments" ON partner_payments FOR DELETE USING (true);

-- Repeat for withholding_taxes
CREATE POLICY "Allow public select of withholding_taxes" ON withholding_taxes FOR SELECT USING (true);
CREATE POLICY "Allow public insert of withholding_taxes" ON withholding_taxes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update of withholding_taxes" ON withholding_taxes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete of withholding_taxes" ON withholding_taxes FOR DELETE USING (true);

-- Repeat for payroll
CREATE POLICY "Allow public select of payroll" ON payroll FOR SELECT USING (true);
CREATE POLICY "Allow public insert of payroll" ON payroll FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update of payroll" ON payroll FOR UPDATE USING (true);
CREATE POLICY "Allow public delete of payroll" ON payroll FOR DELETE USING (true);
`;

export const SEED_SQL_DATA = `
-- ==========================================
-- REALISTIC LOGISTICS SAMPLE SEED DATA (10 RECORDS FOR ALL BASE MODULES)
-- ==========================================

-- 1. Clean existing tables if needed
TRUNCATE TABLE receipts, invoices, transport_jobs, payroll, daily_expenses, withholding_taxes, partner_payments, employees, drivers, customers, vehicles CASCADE;

-- 2. Seed Customers
INSERT INTO customers (id, name, company, phone, line, credit_term, address, tax_id) VALUES
('CUST-001', 'ศรีราชา คอนเทนเนอร์ บลู บูล', 'บจก. ศรีราชาทรานสปอร์ตคลับ', '081-2345678', 'sri_con_lg', 30, '99/9 ม.5 ต.ทุ่งสุขลา อ.ศรีราชา จ.ชลบุรี', '0105564019280'),
('CUST-002', 'แหลมฉบัง ซัพพลาย แอนด์ โลจิสติกส์', 'บจก. แหลมฉบังทรานสปอร์ต กรุ๊ป', '089-8765432', 'lcb_supply', 60, '102/51 หมู่ 10 ต.ทุ่งสุขลา อ.ศรีราชา จ.ชลบุรี', '0105559021234'),
('CUST-003', 'ซีจี คาร์โก้ โลจิสติกส์', 'บจก. ซีจี คาร์โก เอเชีย', '038-123456', 'cg_cargo', 30, '45/1 ม.3 ต.หนองขาม อ.ศรีราชา จ.ชลบุรี', '0205568019999'),
('CUST-004', 'ชลบุรี อินเตอร์เทรด 2026', 'บจก. ชลบุรีอินเตอร์คอมเพล็กซ์', '02-999-8888', 'cb_inter', 45, '200 ถนนลงหาดบางแสน ต.แสนสุข อ.เมือง จ.ชลบุรี', '0105562013890'),
('CUST-005', 'ไทย ซิปปิ้ง โซลูชั่นส์', 'บจก. ไทยซิปปิ้งแอนด์พอร์ต', '081-111-2222', 'th_shipping', 30, '15/9 ถ.สุขุมวิท ต.บึง อ.ศรีราชา จ.ชลบุรี', '0205567083111'),
('CUST-006', 'อีสเทิร์น โลจิสติคส์ ฮับ', 'บจก. อีสเทิร์น ทรานสปอร์ต โซลูชั่นส์', '085-333-4444', 'east_logis', 30, '120 ม.4 ต.พิณทอง อ.ศรีราชา จ.ชลบุรี', '0105565012345'),
('CUST-007', 'รวมโชคการค้า แหลมฉบัง', 'หจก. รวมโชคทรานสปอร์ตแอนด์เทรด', '086-777-1111', 'ruamchok_lcb', 60, '18/2 ม.8 ต.สุรศักดิ์ อ.ศรีราชา จ.ชลบุรี', '0205566023456'),
('CUST-008', 'อมตะ ดีเวลลอปเมนท์ แมนูแฟคเจอริ่ง', 'บจก. อมตะ แมนูแฟคเจอริ่ง จรุงจิต', '038-777-666', 'amata_dev', 45, '700/12 ม.1 นิคมอุตสาหกรรมอมตะ ชลบุรี', '0105563034567'),
('CUST-009', 'โกลบอล บอร์เดอร์ ลิ้งค์', 'บจก. โกลบอล แทร็กกิ้ง ประเทศไทย', '02-555-9999', 'global_border', 30, '555 อาคารโกลบอล ถ.รุ่งเรือง เขตคลองเตย กรุงเทพฯ', '0105562045678'),
('CUST-010', 'แปซิฟิก คีย์ ซิปปิ้ง', 'บจก. แปซิฟิก ซิปปิ้ง ซัพพอร์ต', '083-999-0000', 'pacific_keys', 45, '88 ม.2 ต.บางพระ อ.ศรีราชา จ.ชลบุรี', '0105561056789');

-- 3. Seed Vehicles
INSERT INTO vehicles (license_plate, type, brand, year, act_expiry, ins_expiry, status) VALUES
('70-1234 ชลบุรี', 'หัวลาก 10 ล้อ', 'ISUZU', '2021', '2027-01-10', '2027-03-15', 'Available'),
('70-5678 ชลบุรี', 'หางรถพ่วง FLATBED', 'HINO', '2022', '2026-11-20', '2026-12-05', 'Available'),
('70-9999 ชลบุรี', 'หัวลาก 12 ล้อ', 'SCANIA', '2023', '2027-05-15', '2027-06-20', 'Available'),
('70-8888 ชลบุรี', 'หางพ่วง CONTAINER SKELETAL', 'VALX', '2024', '2027-08-30', '2027-09-01', 'Available'),
('70-7777 ชลบุรี', 'รถบรรทุก 6 ล้อตู้ทึบ', 'ISUZU', '2020', '2026-12-10', '2027-01-15', 'Available'),
('70-6666 ชลบุรี', 'หัวลาก 10 ล้อพ่วงสิบล้อ', 'VOLVO', '2023', '2027-04-12', '2027-05-18', 'Available'),
('70-5555 ชลบุรี', 'หางพ่วง 3 เพลา', 'VALX', '2022', '2027-02-28', '2027-03-30', 'Available'),
('70-4444 ชลบุรี', 'รถบรรทุก 4 ล้อใหญ่ตู้เย็น', 'TOYOTA', '2021', '2026-10-15', '2026-11-20', 'Available'),
('70-3333 ชลบุรี', 'หัวลากเดี่ยว 10 ล้อ', 'FUSO', '2019', '2026-11-11', '2026-12-15', 'Maintenance'),
('70-2222 ชลบุรี', 'หางพ่วงดัมพ์ 2 เพลา', 'HINO', '2021', '2027-03-05', '2027-04-10', 'Available');

-- 4. Seed Drivers
INSERT INTO drivers (id, name, phone, license_no, expiry_date, vehicle_license, status) VALUES
('DRV-001', 'นาย สมชาย มีทอง', '085-1112223', 'DL-654321', '2028-12-31', '70-1234 ชลบุรี', 'Available'),
('DRV-002', 'นาย อภิชาต ขับดี', '086-4445556', 'DL-987654', '2027-06-15', '70-5678 ชลบุรี', 'On Duty'),
('DRV-003', 'นาย เกียรติศักดิ์ ใจกล้า', '081-999-5555', 'DL-112233', '2029-01-10', '70-9999 ชลบุรี', 'Available'),
('DRV-004', 'นาย มานพ รักพ่วง', '082-555-6666', 'DL-445566', '2028-09-22', '70-8888 ชลบุรี', 'Available'),
('DRV-005', 'นาย สุรชัย ใจดี', '089-777-8888', 'DL-778899', '2027-11-05', '70-7777 ชลบุรี', 'Available'),
('DRV-006', 'นาย นเรศ สายดิ่ง', '087-333-2222', 'DL-223344', '2028-03-12', '70-6666 ชลบุรี', 'Available'),
('DRV-007', 'นาย วิโรจน์ ขับสนุก', '083-444-9999', 'DL-556677', '2029-07-20', '70-5555 ชลบุรี', 'Available'),
('DRV-008', 'นาย สมบัติ แสนรัก', '081-555-0101', 'DL-889900', '2028-10-30', '70-4444 ชลบุรี', 'Available'),
('DRV-009', 'นาย ปราโมทย์ ดลใจ', '085-666-3333', 'DL-001122', '2027-02-15', '70-3333 ชลบุรี', 'Available'),
('DRV-010', 'นาย อัสนี โลหะ', '088-222-7777', 'DL-334455', '2028-05-19', '70-2222 ชลบุรี', 'Available');

-- 5. Seed Employees
INSERT INTO employees (id, name, position, department, phone, salary, start_date) VALUES
('EMP-001', 'น.ส. สมศรี รักงาน', 'ผู้จัดการธุรการ', 'บัญชีและการเงิน', '091-8889999', 28000, '2023-01-15'),
('EMP-002', 'นาย ธวัช ขยันงาน', 'ช่างซ่อมบำรุง', 'เทคนิคยานยนต์', '083-4441112', 20000, '2024-03-01'),
('EMP-003', 'น.ส. ลัดดา มีทรัพย์', 'พนักงานบัญชีฝั่งจ่าย', 'บัญชีและการเงิน', '081-333-4444', 18000, '2025-05-10'),
('EMP-004', 'นาย สราวุฒิ มั่นคง', 'เจ้าหน้าที่จัดรถ (Dispatcher)', 'จราจรและขนส่ง', '086-555-4444', 22000, '2024-11-01'),
('EMP-005', 'น.ส. นภา แสงสวย', 'Customer Service', 'ฝ่ายปฏิบัติการ', '084-777-3333', 17500, '2025-01-20');

-- 6. Seed Transport Jobs
INSERT INTO transport_jobs (job_no, date, customer_id, customer_name, origin, destination, vehicle_license, driver_name, vehicle_type, booking_no, shipper, containers, total_amount, status) VALUES
('JOB-20260521-001', '2026-05-21', 'CUST-001', 'ศรีราชา คอนเทนเนอร์ บลู บูล', 'ท่าเรือแหลมฉบัง C3', 'คลังสินค้า สุมทรปราการ', '70-1234 ชลบุรี', 'นาย สมชาย มีทอง', 'หัวลาก 10 ล้อ', 'BK-998822A', 'MAERSK LINE CO., LTD', '[{"containerNo": "MSKU8822019", "transportation": 4000, "portCharge": 500, "containerHandling": 200, "liftOnOff": 300}, {"containerNo": "MSKU8822047", "transportation": 4000, "portCharge": 500, "containerHandling": 200, "liftOnOff": 300}]'::jsonb, 10000, 'วางบิลแล้ว'),
('JOB-20260521-002', '2026-05-21', 'CUST-002', 'แหลมฉบัง ซัพพลาย แอนด์ โลจิสติกส์', 'ลานคู้ ข้าวแหลมฉบัง', 'โรงเบียร์แหลมฉบัง', '70-5678 ชลบุรี', 'นาย อภิชาต ขับดี', 'หางรถพ่วง FLATBED', 'BK-HLC9912', 'HAPAG-LLOYD THAILAND', '[{"containerNo": "HLXU4291880", "transportation": 3200, "portCharge": 300, "containerHandling": 150, "liftOnOff": 250}]'::jsonb, 3900, 'กำลังขนส่ง'),
('JOB-20260521-003', '2026-05-21', 'CUST-003', 'ซีจี คาร์โก้ โลจิสติกส์', 'คลังสินค้า หนองขาม', 'นิคมอุตสาหกรรมอมตะซิตี้ ระยอง', '70-9999 ชลบุรี', 'นาย เกียรติศักดิ์ ใจกล้า', 'หัวลาก 12 ล้อ', 'BK-ONE88012', 'OCEAN NETWORK EXPRESS', '[{"containerNo": "ONEY9922880", "transportation": 5500, "portCharge": 400, "containerHandling": 200, "liftOnOff": 300}]'::jsonb, 6400, 'รอดำเนินการ'),
('JOB-20260521-004', '2026-05-21', 'CUST-004', 'ชลบุรี อินเตอร์เทรด 2026', 'ลานตู้ เกตเวย์ ชลบุรี', 'โรงงาน ต.บ้านบึง ชลบุรี', '70-8888 ชลบุรี', 'นาย มานพ รักพ่วง', 'หางพ่วง CONTAINER SKELETAL', 'BK-COSC9222', 'COSCO SHIPPING LINE', '[{"containerNo": "COSU4499123", "transportation": 3500, "portCharge": 300, "containerHandling": 100, "liftOnOff": 200}]'::jsonb, 4100, 'ส่งแล้ว'),
('JOB-20260521-005', '2026-05-21', 'CUST-005', 'ไทย ซิปปิ้ง โซลูชั่นส์', 'ท่าเรือแหลมฉบัง B2', 'โรงงาน อมตะนคร ชลบุรี', '70-7777 ชลบุรี', 'นาย สุรชัย ใจดี', 'รถบรรทุก 6 ล้อตู้ทึบ', 'BK-MSC5502', 'MSC THAILAND CO.,LTD', '[{"containerNo": "MSCU9902334", "transportation": 2800, "portCharge": 200, "containerHandling": 100, "liftOnOff": 150}]'::jsonb, 3250, 'ส่งแล้ว'),
('JOB-20260521-006', '2026-05-21', 'CUST-006', 'อีสเทิร์น โลจิสติคส์ ฮับ', 'ท่าเรือแหลมฉบัง A1', 'คลังสินค้านนทบุรีี่', '70-6666 ชลบุรี', 'นาย นเรศ สายดิ่ง', 'หัวลาก 10 ล้อพ่วงสิบล้อ', 'BK-MSK92211', 'MAERSK LINE', '[{"containerNo": "MAEU8800213", "transportation": 5800, "portCharge": 450, "containerHandling": 200, "liftOnOff": 300}]'::jsonb, 6750, 'รอดำเนินการ'),
('JOB-20260521-007', '2026-05-21', 'CUST-007', 'รวมโชคการค้า แหลมฉบัง', 'ลานตู้ศรีราชา', 'โรงสีตราก้ามปู ฉะเชิงเทรา', '70-5555 ชลบุรี', 'นาย วิโรจน์ ขับสนุก', 'หางพ่วง 3 เพลา', 'BK-CMA99812', 'CMA CGM LOGISTICS', '[{"containerNo": "CMAU4129930", "transportation": 4500, "portCharge": 300, "containerHandling": 150, "liftOnOff": 200}]'::jsonb, 5150, 'รอดำเนินการ'),
('JOB-20260521-008', '2026-05-21', 'CUST-008', 'อมตะ ดีเวลลอปเมนท์ แมนูแฟคเจอริ่ง', 'ท่าเรือแหลมฉบัง C2', 'คลังบางพลี สมุทรปราการ', '70-4444 ชลบุรี', 'นาย สมบัติ แสนรัก', 'รถบรรทุก 4 ล้อใหญ่ตู้เย็น', 'BK-YML92102', 'YANG MING LINE', '[{"containerNo": "YMLU1122849", "transportation": 3000, "portCharge": 200, "containerHandling": 100, "liftOnOff": 150}]'::jsonb, 3450, 'ส่งแล้ว'),
('JOB-20260521-009', '2026-05-21', 'CUST-009', 'โกลบอล บอร์เดอร์ ลิ้งค์', 'คลังสินค้าคลองเตย', 'นิคมอุตสาหกรรมแหลมฉบัง', '70-2222 ชลบุรี', 'นาย อัสนี โลหะ', 'หางพ่วงดัมพ์ 2 เพลา', 'BK-OOCL8829', 'OOCL CO., LTD', '[{"containerNo": "OOLU8122930", "transportation": 4600, "portCharge": 300, "containerHandling": 150, "liftOnOff": 200}]'::jsonb, 5250, 'ส่งแล้ว'),
('JOB-20260521-010', '2026-05-21', 'CUST-010', 'แปซิฟิก คีย์ ซิปปิ้ง', 'ท่าเรือแหลมฉบัง C3', 'นิคมอุตสาหกรรมเกตเวย์ โลจิสต์', '70-1234 ชลบุรี', 'นาย สมชาย มีทอง', 'หัวลาก 10 ล้อ', 'BK-ONE12093', 'OCEAN NETWORK EXPRESS', '[{"containerNo": "ONEY1122550", "transportation": 3800, "portCharge": 300, "containerHandling": 100, "liftOnOff": 200}]'::jsonb, 4400, 'รอดำเนินการ');

-- 7. Seed Daily Expenses
INSERT INTO daily_expenses (id, date, type, description, vehicle_license, driver_name, amount, note, bill_type) VALUES
('EXP-001', '2026-05-21', 'น้ำมัน', 'เติมน้ำมัน ปตท. แหลมฉบัง', '70-1234 ชลบุรี', 'นาย สมชาย มีทอง', 1500, 'เติมเต็มถังสำหรับการวิ่งงานกรุงเทพฯ-ชลบุรี', 'Normal'),
('EXP-002', '2026-05-21', 'ค่าทางด่วน', 'ด่านบางปะกง มอเตอร์เวย์', '70-5678 ชลบุรี', 'นาย อภิชาต ขับดี', 120, 'งานวิ่งเบียร์แหลมฉบัง', 'Adv'),
('EXP-003', '2026-05-21', 'ค่าซ่อม', 'ปะยางล้อซ้ายหัวลาก', '70-9999 ชลบุรี', 'นาย เกียรติศักดิ์ ใจกล้า', 450, 'ยางรั่วจากตะปูระหว่างจอดรอ', 'Normal'),
('EXP-004', '2026-05-21', 'ค่าแรง', 'เบี้ยเลี้ยงพิเศษ วิ่งงานดึก', '70-8888 ชลบุรี', 'นาย มานพ รักพ่วง', 500, 'วิ่งงานเร่งส่งตู้ Cosco', 'Normal'),
('EXP-005', '2026-05-21', 'ค่าอาหาร', 'เบี้ยเลี้ยงมื้อกลางวันวิ่งทางไกล', '70-7777 ชลบุรี', 'นาย สุรชัย ใจดี', 150, 'งานอมตะ ชลบุรี', 'Normal'),
('EXP-006', '2026-05-21', 'น้ำมัน', 'เติมน้ำมันเชลล์ บายพาสชลบุรี', '70-6666 ชลบุรี', 'นาย นเรศ สายดิ่ง', 2200, 'งานนนทบุรี วิ่งไกลพ่วงใหญ่พิเศษ', 'Normal'),
('EXP-007', '2026-05-21', 'ค่าอาหาร', 'เบี้ยเลี้ยงเดินทางต่างจังหวัด', '70-5555 ชลบุรี', 'นาย วิโรจน์ ขับสนุก', 200, 'วิ่งงานฉะเชิงเทรา', 'Normal'),
('EXP-008', '2026-05-21', 'ค่าทางด่วน', 'ด่านลาดกระบัง มอเตอร์เวย์', '70-4444 ชลบุรี', 'นาย สมบัติ แสนรัก', 60, 'วิ่งงานส่งบางพลีตู้แช่', 'Adv'),
('EXP-009', '2026-05-21', 'ค่าซ่อม', 'เปลี่ยนหลอดไฟท้ายชำรุด', '70-3333 ชลบุรี', 'นาย ปราโมทย์ ดลใจ', 300, 'ไฟท้ายขาดขณะตรวจสภาพรอบเช้า', 'Normal'),
('EXP-010', '2026-05-21', 'น้ำมัน', 'เติมน้ำมัน ปตท. ถ.สาย 36', '70-2222 ชลบุรี', 'นาย อัสนี โลหะ', 1800, 'งานเทเกลือ ระยอง', 'Normal');

-- 8. Seed Invoices
INSERT INTO invoices (invoice_no, date, customer_id, customer_name, job_no, invoice_type, booking_no, shipper, containers, advance_items, subtotal, withholding_tax, vat_amount, grand_total, total_text, status) VALUES
('INV-2026-0001', '2026-05-21', 'CUST-001', 'ศรีราชา คอนเทนเนอร์ บลู บูล', 'JOB-20260521-001', 'Transport', 'BK-998822A', 'MAERSK LINE CO., LTD', '[{"containerNo": "MSKU8822019", "transportation": 4200, "portCharge": 0, "containerHandling": 0, "liftOnOff": 0}]'::jsonb, '[]'::jsonb, 4200, 42, 0, 4158, 'สี่พันหนึ่งร้อยห้าสิบแปดบาทถ้วน', 'จ่ายแล้ว'),
('INV-2026-0002', '2026-05-21', 'CUST-001', 'ศรีราชา คอนเทนเนอร์ บลู บูล', 'JOB-20260521-001', 'Advance', 'BK-998822A', 'MAERSK LINE CO., LTD', '[]'::jsonb, '[{"id": "ADV-I-001", "description": "ค่ารับคืนและยกตู้เปล่าท่าเรือแหลมฉบัง", "amount": 1847.48}]'::jsonb, 1847.48, 0, 129.32, 1976.80, 'หนึ่งพันเก้าร้อยเจ็ดสิบหกบาทแปดสิบสตางค์', 'ยังไม่จ่าย'),
('INV-2026-0004', '2026-05-21', 'CUST-004', 'ชลบุรี อินเตอร์เทรด 2026', 'JOB-20260521-004', 'Transport', 'BK-COSC9222', 'COSCO SHIPPING LINE', '[{"containerNo": "COSU4499123", "transportation": 3500, "portCharge": 0, "containerHandling": 0, "liftOnOff": 0}]'::jsonb, '[]'::jsonb, 3500, 35, 0, 3465, 'สามพันสี่ร้อยหกสิบห้าบาทถ้วน', 'ยังไม่จ่าย'),
('INV-2026-0005', '2026-05-21', 'CUST-005', 'ไทย ซิปปิ้ง โซลูชั่นส์', 'JOB-20260521-005', 'Advance', 'BK-MSC5502', 'MSC THAILAND CO.,LTD', '[]'::jsonb, '[{"id": "ADV-I-001", "description": "ค่าผ่านท่าและค่าลานฝากตู้", "amount": 1200.00}]'::jsonb, 1200.00, 0, 84.00, 1284.00, 'หนึ่งพันสองร้อยแปดสิบสี่บาทถ้วน', 'ยังไม่จ่าย'),
('INV-2026-0006', '2026-05-21', 'CUST-008', 'อมตะ ดีเวลลอปเมนท์ แมนูแฟคเจอริ่ง', 'JOB-20260521-008', 'Transport', 'BK-YML92102', 'YANG MING LINE', '[{"containerNo": "YMLU1122849", "transportation": 3000, "portCharge": 0, "containerHandling": 0, "liftOnOff": 0}]'::jsonb, '[]'::jsonb, 3000, 30, 0, 2970, 'สองพันเก้าร้อยเจ็ดสิบบาทถ้วน', 'ยังไม่จ่าย');

-- 9. Seed Receipts
INSERT INTO receipts (receipt_no, date, invoice_no, customer_name, amount, payment_method, receipt_type) VALUES
('RE-2026-0001', '2026-05-21', 'INV-2026-0001', 'ศรีราชา คอนเทนเนอร์ บลู บูล', 4158, 'โอนเงิน', 'Transport');

-- 10. Seed Partner Payments
INSERT INTO partner_payments (id, date, partner_name, job_no, payment_type, revenue, expenses_deduction, net_paid, status) VALUES
('PPM-001', '2026-05-21', 'บจก. ยูเนี่ยน โลจิสแอลไลแอนซ์', 'JOB-20260521-001', 'PAY_PARTNER', 5000, 500, 4500, 'ยังไม่ได้เคลียร์'),
('PPM-002', '2026-05-21', 'นาย ประมวล วงศ์สุข (รถเช่า)', 'JOB-20260521-002', 'RENT_CAR', 3500, 300, 3200, 'จ่ายแล้ว'),
('PPM-003', '2026-05-21', 'บจก. เคเอ็นพี โลจิสติกส์การขนส่ง', 'JOB-20260521-003', 'PAY_PARTNER', 6200, 600, 5600, 'ยังไม่ได้เคลียร์'),
('PPM-004', '2026-05-21', 'นาย ชาญชัย วรดี (รถเช่า)', 'JOB-20260521-004', 'RENT_CAR', 4000, 400, 3600, 'จ่ายแล้ว'),
('PPM-005', '2026-05-21', 'บจก. ศรันย์พงศ์ ทรานสปอร์ต แทร็ก', 'JOB-20260521-005', 'PAY_PARTNER', 3200, 200, 3000, 'ยังไม่ได้เคลียร์');

-- 11. Seed Withholding Taxes
INSERT INTO withholding_taxes (id, date, payee_name, tax_id_number, base_amount, rate, tax_amount, type) VALUES
('WHT-001', '2026-05-21', 'บจก. ยูเนี่ยน โลจิสแอลไลแอนซ์', '0205568019999', 5000, 1, 50, 'Transportation'),
('WHT-002', '2026-05-21', 'บจก. เอส เอส เค คอมเมิร์ซ', '0105559021234', 8000, 3, 240, 'Service'),
('WHT-003', '2026-05-21', 'บจก. เคเอ็นพี โลจิสติกส์การขนส่ง', '0205567083111', 6200, 1, 62, 'Transportation'),
('WHT-004', '2026-05-21', 'บจก. แบรนด์ลอยัลตี้ โฮลดิ้งการขนส่ง', '0105562013890', 4500, 3, 135, 'Service'),
('WHT-005', '2026-05-21', 'บจก. ศรันย์พงศ์ ทรานสปอร์ต แทร็ก', '0205564019280', 3200, 1, 32, 'Transportation');

-- 12. Seed Payroll
INSERT INTO payroll (id, employee_id, employee_name, role, pay_date, salary, ot, bonus, deduction, net_salary, status) VALUES
('PAY-001', 'DRV-001', 'นาย สมชาย มีทอง', 'Driver', '2026-05-30', 15000, 2500, 1000, 500, 18000, 'Unpaid'),
('PAY-002', 'EMP-001', 'น.ส. สมศรี รักงาน', 'Staff', '2026-05-30', 28000, 1500, 2000, 0, 31500, 'Unpaid'),
('PAY-003', 'DRV-002', 'นาย อภิชาต ขับดี', 'Driver', '2026-05-30', 16000, 3000, 1200, 0, 20200, 'Unpaid'),
('PAY-004', 'EMP-002', 'นาย ธวัช ขยันงาน', 'Staff', '2026-05-30', 20000, 2000, 500, 400, 22100, 'Unpaid'),
('PAY-005', 'DRV-003', 'นาย เกียรติศักดิ์ ใจกล้า', 'Driver', '2026-05-30', 15500, 1800, 800, 300, 17800, 'Unpaid');
`;

export interface SupabaseDataState {
  customers: Customer[];
  drivers: Driver[];
  vehicles: Vehicle[];
  employees: Employee[];
  jobs: TransportJob[];
  expenses: DailyExpense[];
  invoices: Invoice[];
  receipts: Receipt[];
  partnerPayments: PartnerPayment[];
  withholdingTaxes: WithholdingTaxRecord[];
  payroll: PayrollRecord[];
}

/**
 * Check if the connection to Supabase database is active and if the tables exist
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string; tablesReady: boolean }> {
  try {
    const { data, error } = await supabase.from('customers').select('id').limit(1);
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('not found') || error.message.includes('does not exist')) {
        return { success: true, message: "เชื่อมต่อ Supabase API สำเร็จ แต่ยังไม่ได้สร้าง PostgreSQL Tables", tablesReady: false };
      }
      return { success: false, message: error.message, tablesReady: false };
    }
    return { success: true, message: "เชื่อมต่อ Supabase และตารางฐานข้อมูลพร้อมใช้งาน 100%!", tablesReady: true };
  } catch (err: any) {
    return { success: false, message: err.message || "Network Error Connection to Supabase", tablesReady: false };
  }
}

/**
 * Fetch all Khemthit Logistics tables from Supabase databases
 */
export async function fetchAllSupabaseData(): Promise<SupabaseDataState> {
  const [
    custRes,
    drvRes,
    vehRes,
    empRes,
    jobRes,
    expRes,
    invRes,
    recRes,
    partnerRes,
    whtRes,
    payrollRes
  ] = await Promise.all([
    supabase.from('customers').select('*').order('id'),
    supabase.from('drivers').select('*').order('id'),
    supabase.from('vehicles').select('*').order('license_plate'),
    supabase.from('employees').select('*').order('id'),
    supabase.from('transport_jobs').select('*').order('job_no'),
    supabase.from('daily_expenses').select('*').order('id'),
    supabase.from('invoices').select('*').order('invoice_no'),
    supabase.from('receipts').select('*').order('receipt_no'),
    supabase.from('partner_payments').select('*').order('id'),
    supabase.from('withholding_taxes').select('*').order('id'),
    supabase.from('payroll').select('*').order('id')
  ]);

  // Throw if any critical error occurs so caller can catch
  if (custRes.error) throw new Error(`Customers table missing: ${custRes.error.message}`);
  if (drvRes.error) throw new Error(`Drivers table missing: ${drvRes.error.message}`);
  if (vehRes.error) throw new Error(`Vehicles table missing: ${vehRes.error.message}`);
  if (empRes.error) throw new Error(`Employees table missing: ${empRes.error.message}`);
  if (jobRes.error) throw new Error(`Jobs table missing: ${jobRes.error.message}`);
  if (expRes.error) throw new Error(`Expenses table missing: ${expRes.error.message}`);
  if (invRes.error) throw new Error(`Invoices table missing: ${invRes.error.message}`);
  if (recRes.error) throw new Error(`Receipts table missing: ${recRes.error.message}`);
  if (partnerRes.error) throw new Error(`Partner payments table missing: ${partnerRes.error.message}`);
  if (whtRes.error) throw new Error(`Withholding tax table missing: ${whtRes.error.message}`);
  if (payrollRes.error) throw new Error(`Payroll table missing: ${payrollRes.error.message}`);

  return {
    customers: (custRes.data || []).map(r => ({
      id: r.id,
      name: r.name,
      company: r.company || '',
      phone: r.phone || '',
      line: r.line || '',
      creditTerm: r.credit_term || 0,
      address: r.address || '',
      taxId: r.tax_id || ''
    })),
    drivers: (drvRes.data || []).map(r => ({
      id: r.id,
      name: r.name,
      phone: r.phone || '',
      licenseNo: r.license_no || '',
      expiryDate: r.expiry_date || '',
      vehicleLicense: r.vehicle_license || '',
      status: r.status as any || 'Available'
    })),
    vehicles: (vehRes.data || []).map(r => ({
      licensePlate: r.license_plate,
      type: r.type || '',
      brand: r.brand || '',
      year: r.year || '',
      actExpiry: r.act_expiry || '',
      insExpiry: r.ins_expiry || '',
      status: r.status as any || 'Available'
    })),
    employees: (empRes.data || []).map(r => ({
      id: r.id,
      name: r.name,
      position: r.position || '',
      department: r.department || '',
      phone: r.phone || '',
      salary: parseFloat(r.salary) || 0,
      startDate: r.start_date || ''
    })),
    jobs: (jobRes.data || []).map(r => ({
      jobNo: r.job_no, // Fix mapping from r.job_no column in PostgreSQL
      date: r.date,
      customerId: r.customer_id || '',
      customerName: r.customer_name || '',
      origin: r.origin || '',
      destination: r.destination || '',
      vehicleLicense: r.vehicle_license || '',
      driverName: r.driver_name || '',
      vehicleType: r.vehicle_type || '',
      bookingNo: r.booking_no || '',
      shipper: r.shipper || '',
      containers: typeof r.containers === 'string' ? JSON.parse(r.containers) : (r.containers || []),
      totalAmount: parseFloat(r.total_amount) || 0,
      status: r.status as any || 'รอดำเนินการ',
      jobType: r.job_type || 'Import',
      quantity: r.quantity || 1,
      containerSize: r.container_size || '40HC',
      shipAgent: r.ship_agent || '',
      pickupAt: r.pickup_at || '',
      loadAt: r.load_at || '',
      returnAt: r.return_at || ''
    })),
    expenses: (expRes.data || []).map(r => {
      const idStr = r.id || '';
      const jobNo = idStr.includes('/') ? idStr.split('/')[0] : '';
      return {
        id: idStr,
        jobNo: jobNo,
        date: r.date,
        type: r.type as any || 'อื่นๆ',
        description: r.description || '',
        vehicleLicense: r.vehicle_license || '',
        driverName: r.driver_name || '',
        amount: parseFloat(r.amount) || 0,
        note: r.note || '',
        billType: r.bill_type as any || 'Normal'
      };
    }),
    invoices: (invRes.data || []).map(r => ({
      invoiceNo: r.invoice_no,
      date: r.date,
      customerId: r.customer_id || '',
      customerName: r.customer_name || '',
      jobNo: r.job_no || '',
      invoiceType: r.invoice_type as any || 'Transport',
      bookingNo: r.booking_no || '',
      shipper: r.shipper || '',
      containers: typeof r.containers === 'string' ? JSON.parse(r.containers) : (r.containers || []),
      advanceItems: typeof r.advance_items === 'string' ? JSON.parse(r.advance_items) : (r.advance_items || []),
      subtotal: parseFloat(r.subtotal) || 0,
      withholdingTax: parseFloat(r.withholding_tax) || 0,
      vatAmount: parseFloat(r.vat_amount) || 0,
      grandTotal: parseFloat(r.grand_total) || 0,
      totalText: r.total_text || '',
      status: r.status as any || 'ยังไม่จ่าย'
    })),
    receipts: (recRes.data || []).map(r => ({
      receiptNo: r.receipt_no,
      date: r.date,
      invoiceNo: r.invoice_no || '',
      customerName: r.customer_name || '',
      amount: parseFloat(r.amount) || 0,
      paymentMethod: r.payment_method as any || 'โอนเงิน',
      receiptType: r.receipt_type as any || 'Transport'
    })),
    partnerPayments: (partnerRes.data || []).map(r => ({
      id: r.id,
      date: r.date,
      partnerName: r.partner_name || '',
      jobNo: r.job_no || '',
      paymentType: r.payment_type as any || 'PAY_PARTNER',
      revenue: parseFloat(r.revenue) || 0,
      expensesDeduction: parseFloat(r.expenses_deduction) || 0,
      netPaid: parseFloat(r.net_paid) || 0,
      status: r.status as any || 'ยังไม่ได้เคลียร์'
    })),
    withholdingTaxes: (whtRes.data || []).map(r => ({
      id: r.id,
      date: r.date,
      payeeName: r.payee_name || '',
      taxIDNumber: r.tax_id_number || '',
      baseAmount: parseFloat(r.base_amount) || 0,
      rate: parseFloat(r.rate) || 1,
      taxAmount: parseFloat(r.tax_amount) || 0,
      type: r.type as any || 'Transportation'
    })),
    payroll: (payrollRes.data || []).map(r => ({
      id: r.id,
      employeeId: r.employee_id || '',
      employeeName: r.employee_name || '',
      role: r.role as any || 'Staff',
      payDate: r.pay_date || '',
      salary: parseFloat(r.salary) || 0,
      ot: parseFloat(r.ot) || 0,
      bonus: parseFloat(r.bonus) || 0,
      deduction: parseFloat(r.deduction) || 0,
      netSalary: parseFloat(r.net_salary) || 0,
      status: r.status as any || 'Unpaid'
    }))
  };
}

/**
 * Sync Local data into Supabase directly (Upsert records)
 */
export async function pushAllLocalDataToSupabase(state: SupabaseDataState): Promise<void> {
  // Push Customers
  if (state.customers.length > 0) {
    const custData = state.customers.map(c => ({
      id: c.id,
      name: c.name,
      company: c.company,
      phone: c.phone,
      line: c.line,
      credit_term: c.creditTerm,
      address: c.address,
      tax_id: c.taxId || ''
    }));
    await supabase.from('customers').upsert(custData);
  }

  // Push Vehicles
  if (state.vehicles.length > 0) {
    const vehData = state.vehicles.map(v => ({
      license_plate: v.licensePlate,
      type: v.type,
      brand: v.brand,
      year: v.year,
      act_expiry: v.actExpiry,
      ins_expiry: v.insExpiry,
      status: v.status
    }));
    await supabase.from('vehicles').upsert(vehData);
  }

  // Push Drivers
  const validCustomers = new Set(state.customers.map((c: any) => c.id));
  const validVehicles = new Set(state.vehicles.map((v: any) => v.licensePlate));
  const validInvoices = new Set(state.invoices.map((inv: any) => inv.invoiceNo));

  if (state.drivers.length > 0) {
    const drvData = state.drivers.map((d: any) => {
      const vehExists = d.vehicleLicense && validVehicles.has(d.vehicleLicense);
      return {
        id: d.id,
        name: d.name,
        phone: d.phone,
        license_no: d.licenseNo,
        expiry_date: d.expiryDate,
        vehicle_license: vehExists ? d.vehicleLicense : null,
        status: d.status
      };
    });
    await supabase.from('drivers').upsert(drvData);
  }

  // Push Employees
  if (state.employees.length > 0) {
    const empData = state.employees.map((e: any) => ({
      id: e.id,
      name: e.name,
      position: e.position,
      department: e.department,
      phone: e.phone,
      salary: e.salary,
      start_date: e.startDate
    }));
    await supabase.from('employees').upsert(empData);
  }

  // Push Jobs
  if (state.jobs.length > 0) {
    const jobsData = state.jobs.map((j: any) => {
      const custExists = j.customerId && validCustomers.has(j.customerId);
      const vehExists = j.vehicleLicense && validVehicles.has(j.vehicleLicense);
      return {
        job_no: j.jobNo,
        date: j.date,
        customer_id: custExists ? j.customerId : null,
        customer_name: j.customerName,
        origin: j.origin,
        destination: j.destination,
        vehicle_license: vehExists ? j.vehicleLicense : null,
        driver_name: j.driverName,
        vehicle_type: j.vehicleType,
        booking_no: j.bookingNo,
        shipper: j.shipper,
        containers: j.containers,
        total_amount: j.totalAmount,
        status: j.status,
        job_type: j.jobType || 'Import',
        quantity: j.quantity || 1,
        container_size: j.containerSize || '40HC',
        ship_agent: j.shipAgent || '',
        pickup_at: j.pickupAt || '',
        load_at: j.loadAt || '',
        return_at: j.returnAt || ''
      };
    });
    await supabase.from('transport_jobs').upsert(jobsData);
  }

  // Push Expenses
  if (state.expenses.length > 0) {
    const expData = state.expenses.map((e: any) => {
      const vehExists = e.vehicleLicense && validVehicles.has(e.vehicleLicense);
      return {
        id: e.id,
        date: e.date,
        type: e.type,
        description: e.description,
        vehicle_license: vehExists ? e.vehicleLicense : null,
        driver_name: e.driverName,
        amount: e.amount,
        note: e.note,
        bill_type: e.billType
      };
    });
    await supabase.from('daily_expenses').upsert(expData);
  }

  // Push Invoices
  if (state.invoices.length > 0) {
    const invData = state.invoices.map((inv: any) => {
      const custExists = inv.customerId && validCustomers.has(inv.customerId);
      return {
        invoice_no: inv.invoiceNo,
        date: inv.date,
        customer_id: custExists ? inv.customerId : null,
        customer_name: inv.customerName,
        job_no: inv.jobNo,
        invoice_type: inv.invoiceType,
        booking_no: inv.bookingNo,
        shipper: inv.shipper,
        containers: inv.containers,
        advance_items: inv.advanceItems,
        subtotal: inv.subtotal,
        withholding_tax: inv.withholdingTax,
        vat_amount: inv.vatAmount,
        grand_total: inv.grandTotal,
        total_text: inv.totalText,
        status: inv.status
      };
    });
    await supabase.from('invoices').upsert(invData);
  }

  // Push Receipts
  if (state.receipts.length > 0) {
    const recData = state.receipts.map((r: any) => {
      const invExists = r.invoiceNo && validInvoices.has(r.invoiceNo);
      return {
        receipt_no: r.receiptNo,
        date: r.date,
        invoice_no: invExists ? r.invoiceNo : null,
        customer_name: r.customerName,
        amount: r.amount,
        payment_method: r.paymentMethod,
        receipt_type: r.receiptType
      };
    });
    await supabase.from('receipts').upsert(recData);
  }

  // Push Partner Payments
  if (state.partnerPayments.length > 0) {
    const partnerData = state.partnerPayments.map((p: any) => ({
      id: p.id,
      date: p.date,
      partner_name: p.partnerName,
      job_no: p.jobNo,
      payment_type: p.paymentType,
      revenue: p.revenue,
      expenses_deduction: p.expensesDeduction,
      net_paid: p.netPaid,
      status: p.status
    }));
    await supabase.from('partner_payments').upsert(partnerData);
  }

  // Push Withholding Taxes
  if (state.withholdingTaxes.length > 0) {
    const whtData = state.withholdingTaxes.map((w: any) => ({
      id: w.id,
      date: w.date,
      payee_name: w.payeeName,
      tax_id_number: w.taxIDNumber,
      base_amount: w.baseAmount,
      rate: w.rate,
      tax_amount: w.taxAmount,
      type: w.type
    }));
    await supabase.from('withholding_taxes').upsert(whtData);
  }

  // Push Payroll
  if (state.payroll.length > 0) {
    const payrollData = state.payroll.map((pr: any) => ({
      id: pr.id,
      employee_id: pr.employeeId || null,
      employee_name: pr.employeeName,
      role: pr.role,
      pay_date: pr.payDate,
      salary: pr.salary,
      ot: pr.ot,
      bonus: pr.bonus,
      deduction: pr.deduction,
      net_salary: pr.netSalary,
      status: pr.status
    }));
    await supabase.from('payroll').upsert(payrollData);
  }
}

/**
 * Specific Table Mutation Operatives for CRUD 100%
 */

// 1. Customers
export async function dbSaveCustomer(cust: Customer) {
  const { error } = await supabase.from('customers').upsert({
    id: cust.id,
    name: cust.name,
    company: cust.company,
    phone: cust.phone,
    line: cust.line,
    credit_term: cust.creditTerm,
    address: cust.address,
    tax_id: cust.taxId || ''
  });
  if (error) throw error;
}

export async function dbDeleteCustomer(id: string) {
  const { error } = await supabase.from('customers').delete().eq('id', id);
  if (error) throw error;
}

// 2. Drivers
export async function dbSaveDriver(drv: Driver) {
  let vehicleLicense: string | null = drv.vehicleLicense || null;
  if (vehicleLicense) {
    const { data } = await supabase.from('vehicles').select('license_plate').eq('license_plate', vehicleLicense);
    if (!data || data.length === 0) vehicleLicense = null;
  }

  const { error } = await supabase.from('drivers').upsert({
    id: drv.id,
    name: drv.name,
    phone: drv.phone,
    license_no: drv.licenseNo,
    expiry_date: drv.expiryDate,
    vehicle_license: vehicleLicense,
    status: drv.status
  });
  if (error) throw error;
}

export async function dbDeleteDriver(id: string) {
  const { error } = await supabase.from('drivers').delete().eq('id', id);
  if (error) throw error;
}

// 3. Vehicles
export async function dbSaveVehicle(v: Vehicle) {
  const { error } = await supabase.from('vehicles').upsert({
    license_plate: v.licensePlate,
    type: v.type,
    brand: v.brand,
    year: v.year,
    act_expiry: v.actExpiry,
    ins_expiry: v.insExpiry,
    status: v.status
  });
  if (error) throw error;
}

export async function dbDeleteVehicle(plate: string) {
  const { error } = await supabase.from('vehicles').delete().eq('license_plate', plate);
  if (error) throw error;
}

// 4. Employees
export async function dbSaveEmployee(emp: Employee) {
  const { error } = await supabase.from('employees').upsert({
    id: emp.id,
    name: emp.name,
    position: emp.position,
    department: emp.department,
    phone: emp.phone,
    salary: emp.salary,
    start_date: emp.startDate
  });
  if (error) throw error;
}

export async function dbDeleteEmployee(id: string) {
  const { error } = await supabase.from('employees').delete().eq('id', id);
  if (error) throw error;
}

// 5. Jobs
export async function dbSaveJob(j: TransportJob) {
  let customerId: string | null = j.customerId || null;
  if (customerId) {
    const { data } = await supabase.from('customers').select('id').eq('id', customerId);
    if (!data || data.length === 0) customerId = null;
  }

  let vehicleLicense: string | null = j.vehicleLicense || null;
  if (vehicleLicense) {
    const { data } = await supabase.from('vehicles').select('license_plate').eq('license_plate', vehicleLicense);
    if (!data || data.length === 0) vehicleLicense = null;
  }

  const { error } = await supabase.from('transport_jobs').upsert({
    job_no: j.jobNo,
    date: j.date,
    customer_id: customerId,
    customer_name: j.customerName,
    origin: j.origin,
    destination: j.destination,
    vehicle_license: vehicleLicense,
    driver_name: j.driverName,
    vehicle_type: j.vehicleType,
    booking_no: j.bookingNo,
    shipper: j.shipper,
    containers: j.containers,
    total_amount: j.totalAmount,
    status: j.status,
    job_type: j.jobType || 'Import',
    quantity: j.quantity || 1,
    container_size: j.containerSize || '40HC',
    ship_agent: j.shipAgent || '',
    pickup_at: j.pickupAt || '',
    load_at: j.loadAt || '',
    return_at: j.returnAt || ''
  });
  if (error) throw error;
}

export async function dbDeleteJob(jobNo: string) {
  const { error } = await supabase.from('transport_jobs').delete().eq('job_no', jobNo);
  if (error) throw error;
}

// 6. Expenses
export async function dbSaveExpense(e: DailyExpense) {
  let vehicleLicense: string | null = e.vehicleLicense || null;
  if (vehicleLicense) {
    const { data } = await supabase.from('vehicles').select('license_plate').eq('license_plate', vehicleLicense);
    if (!data || data.length === 0) vehicleLicense = null;
  }

  const { error } = await supabase.from('daily_expenses').upsert({
    id: e.id,
    date: e.date,
    type: e.type,
    description: e.description,
    vehicle_license: vehicleLicense,
    driver_name: e.driverName,
    amount: e.amount,
    note: e.note,
    bill_type: e.billType
  });
  if (error) throw error;
}

export async function dbDeleteExpense(id: string) {
  const { error } = await supabase.from('daily_expenses').delete().eq('id', id);
  if (error) throw error;
}

// 7. Invoices
export async function dbSaveInvoice(inv: Invoice) {
  let customerId: string | null = inv.customerId || null;
  if (customerId) {
    const { data } = await supabase.from('customers').select('id').eq('id', customerId);
    if (!data || data.length === 0) customerId = null;
  }

  const { error } = await supabase.from('invoices').upsert({
    invoice_no: inv.invoiceNo,
    date: inv.date,
    customer_id: customerId,
    customer_name: inv.customerName,
    job_no: inv.jobNo,
    invoice_type: inv.invoiceType,
    booking_no: inv.bookingNo,
    shipper: inv.shipper,
    containers: inv.containers,
    advance_items: inv.advanceItems,
    subtotal: inv.subtotal,
    withholding_tax: inv.withholdingTax,
    vat_amount: inv.vatAmount,
    grand_total: inv.grandTotal,
    total_text: inv.totalText,
    status: inv.status
  });
  if (error) throw error;
  
  // also auto set transport job status if relevant
  if (inv.jobNo) {
    await supabase.from('transport_jobs')
      .update({ status: 'วางบิลแล้ว' })
      .eq('job_no', inv.jobNo);
  }
}

export async function dbDeleteInvoice(invoiceNo: string) {
  const { error } = await supabase.from('invoices').delete().eq('invoice_no', invoiceNo);
  if (error) throw error;
}

// 8. Receipts
export async function dbSaveReceipt(r: Receipt) {
  let invoiceNo: string | null = r.invoiceNo || null;
  if (invoiceNo) {
    const { data } = await supabase.from('invoices').select('invoice_no').eq('invoice_no', invoiceNo);
    if (!data || data.length === 0) invoiceNo = null;
  }

  const { error } = await supabase.from('receipts').upsert({
    receipt_no: r.receiptNo,
    date: r.date,
    invoice_no: invoiceNo,
    customer_name: r.customerName,
    amount: r.amount,
    payment_method: r.paymentMethod,
    receipt_type: r.receiptType
  });
  if (error) throw error;

  // set invoice status
  if (r.invoiceNo) {
    await supabase.from('invoices')
      .update({ status: 'จ่ายแล้ว' })
      .eq('invoice_no', r.invoiceNo);
  }
}

export async function dbDeleteReceipt(receiptNo: string) {
  const { error } = await supabase.from('receipts').delete().eq('receipt_no', receiptNo);
  if (error) throw error;
}

// 9. Partner Payments
export async function dbSavePartnerPayment(p: PartnerPayment) {
  const { error } = await supabase.from('partner_payments').upsert({
    id: p.id,
    date: p.date,
    partner_name: p.partnerName,
    job_no: p.jobNo,
    payment_type: p.paymentType,
    revenue: p.revenue,
    expenses_deduction: p.expensesDeduction,
    net_paid: p.netPaid,
    status: p.status
  });
  if (error) throw error;
}

export async function dbDeletePartnerPayment(id: string) {
  const { error } = await supabase.from('partner_payments').delete().eq('id', id);
  if (error) throw error;
}

// 10. Withholding Taxes
export async function dbSaveWithholdingTax(w: WithholdingTaxRecord) {
  const { error } = await supabase.from('withholding_taxes').upsert({
    id: w.id,
    date: w.date,
    payee_name: w.payeeName,
    tax_id_number: w.taxIDNumber,
    base_amount: w.baseAmount,
    rate: w.rate,
    tax_amount: w.taxAmount,
    type: w.type
  });
  if (error) throw error;
}

export async function dbDeleteWithholdingTax(id: string) {
  const { error } = await supabase.from('withholding_taxes').delete().eq('id', id);
  if (error) throw error;
}

// 11. Payroll
export async function dbSavePayroll(pr: PayrollRecord) {
  const { error } = await supabase.from('payroll').upsert({
    id: pr.id,
    employee_id: pr.employeeId || null,
    employee_name: pr.employeeName,
    role: pr.role,
    pay_date: pr.payDate,
    salary: pr.salary,
    ot: pr.ot,
    bonus: pr.bonus,
    deduction: pr.deduction,
    net_salary: pr.netSalary,
    status: pr.status
  });
  if (error) throw error;
}

export async function dbDeletePayroll(id: string) {
  const { error } = await supabase.from('payroll').delete().eq('id', id);
  if (error) throw error;
}

/**
 * JS-based database trigger to clear and insert 10 robust logistics records into all 11 tables 
 * direct from client-side over Supabase-JS.
 */
export async function seedSupabaseTablesJS(): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Vehicles
    const vehiclesData = [
      { license_plate: '70-1234 ชลบุรี', type: 'หัวลาก 10 ล้อ', brand: 'ISUZU', year: '2021', act_expiry: '2027-01-10', ins_expiry: '2027-03-15', status: 'Available' },
      { license_plate: '70-5678 ชลบุรี', type: 'หางรถพ่วง FLATBED', brand: 'HINO', year: '2022', act_expiry: '2026-11-20', ins_expiry: '2026-12-05', status: 'Available' },
      { license_plate: '70-9999 ชลบุรี', type: 'หัวลาก 12 ล้อ', brand: 'SCANIA', year: '2023', act_expiry: '2027-05-15', ins_expiry: '2027-06-20', status: 'Available' },
      { license_plate: '70-8888 ชลบุรี', type: 'หางพ่วง CONTAINER SKELETAL', brand: 'VALX', year: '2024', act_expiry: '2027-08-30', ins_expiry: '2027-09-01', status: 'Available' },
      { license_plate: '70-7777 ชลบุรี', type: 'รถบรรทุก 6 ล้อตู้ทึบ', brand: 'ISUZU', year: '2020', act_expiry: '2026-12-10', ins_expiry: '2027-01-15', status: 'Available' },
      { license_plate: '70-6666 ชลบุรี', type: 'หัวลาก 10 ล้อพ่วงสิบล้อ', brand: 'VOLVO', year: '2023', act_expiry: '2027-04-12', ins_expiry: '2027-05-18', status: 'Available' },
      { license_plate: '70-5555 ชลบุรี', type: 'หางพ่วง 3 เพลา', brand: 'VALX', year: '2022', act_expiry: '2027-02-28', ins_expiry: '2027-03-30', status: 'Available' },
      { license_plate: '70-4444 ชลบุรี', type: 'รถบรรทุก 4 ล้อใหญ่ตู้เย็น', brand: 'TOYOTA', year: '2021', act_expiry: '2026-10-15', ins_expiry: '2026-11-20', status: 'Available' },
      { license_plate: '70-3333 ชลบุรี', type: 'หัวลากเดี่ยว 10 ล้อ', brand: 'FUSO', year: '2019', act_expiry: '2026-11-11', ins_expiry: '2026-12-15', status: 'Maintenance' },
      { license_plate: '70-2222 ชลบุรี', type: 'หางพ่วงดัมพ์ 2 เพลา', brand: 'HINO', year: '2021', act_expiry: '2027-03-05', ins_expiry: '2027-04-10', status: 'Available' }
    ];
    await supabase.from('vehicles').upsert(vehiclesData);

    // 2. Customers
    const customersData = [
      { id: 'CUST-001', name: 'ศรีราชา คอนเทนเนอร์ บลู บูล', company: 'บจก. ศรีราชาทรานสปอร์ตคลับ', phone: '081-2345678', line: 'sri_con_lg', credit_term: 30, address: '99/9 ม.5 ต.ทุ่งสุขลา อ.ศรีราชา จ.ชลบุรี', tax_id: '0105564019280' },
      { id: 'CUST-002', name: 'แหลมฉบัง ซัพพลาย แอนด์ โลจิสติกส์', company: 'บจก. แหลมฉบังทรานสปอร์ต กรุ๊ป', phone: '089-8765432', line: 'lcb_supply', credit_term: 60, address: '102/51 หมู่ 10 ต.ทุ่งสุขลา อ.ศรีราชา จ.ชลบุรี', tax_id: '0105559021234' },
      { id: 'CUST-003', name: 'ซีจี คาร์โก้ โลจิสติกส์', company: 'บจก. ซีจี คาร์โก เอเชีย', phone: '038-123456', line: 'cg_cargo', credit_term: 30, address: '45/1 ม.3 ต.หนองขาม อ.ศรีราชา จ.ชลบุรี', tax_id: '0205568019999' },
      { id: 'CUST-004', name: 'ชลบุรี อินเตอร์เทรด 2026', company: 'บจก. ชลบุรีอินเตอร์คอมเพล็กซ์', phone: '02-999-8888', line: 'cb_inter', credit_term: 45, address: '200 ถนนลงหาดบางแสน ต.แสนสุข อ.เมือง จ.ชลบุรี', tax_id: '0105562013890' },
      { id: 'CUST-005', name: 'ไทย ซิปปิ้ง โซลูชั่นส์', company: 'บจก. ไทยซิปปิ้งแอนด์พอร์ต', phone: '081-111-2222', line: 'th_shipping', credit_term: 30, address: '15/9 ถ.สุขุมวิท ต.บึง อ.ศรีราชา จ.ชลบุรี', tax_id: '0205567083111' },
      { id: 'CUST-006', name: 'อีสเทิร์น โลจิสติคส์ ฮับ', company: 'บจก. อีสเทิร์น ทรานสปอร์ต โซลูชั่นส์', phone: '085-333-4444', line: 'east_logis', credit_term: 30, address: '120 ม.4 ต.พิณทอง อ.ศรีราชา จ.ชลบุรี', tax_id: '0105565012345' },
      { id: 'CUST-007', name: 'รวมโชคการค้า แหลมฉบัง', company: 'หจก. รวมโชคทรานสปอร์ตแอนด์เทรด', phone: '086-777-1111', line: 'ruamchok_lcb', credit_term: 60, address: '18/2 ม.8 ต.สุรศักดิ์ อ.ศรีราชา จ.ชลบุรี', tax_id: '0205566023456' },
      { id: 'CUST-008', name: 'อมตะ ดีเวลลอปเมนท์ แมนูแฟคเจอริ่ง', company: 'บจก. อมตะ แมนูแฟคเจอริ่ง จรุงจิต', phone: '038-777-666', line: 'amata_dev', credit_term: 45, address: '700/12 ม.1 นิคมอุตสาหกรรมอมตะ ชลบุรี', tax_id: '0105563034567' },
      { id: 'CUST-009', name: 'โกลบอล บอร์เดอร์ ลิ้งค์', company: 'บจก. โกลบอล แทร็กกิ้ง ประเทศไทย', phone: '02-555-9999', line: 'global_border', credit_term: 30, address: '555 อาคารโกลบอล ถ.รุ่งเรือง เขตคลองเตย กรุงเทพฯ', tax_id: '0105562045678' },
      { id: 'CUST-010', name: 'แปซิฟิก คีย์ ซิปปิ้ง', company: 'บจก. แปซิฟิก ซิปปิ้ง ซัพพอร์ต', phone: '083-999-0000', line: 'pacific_keys', credit_term: 45, address: '88 ม.2 ต.บางพระ อ.ศรีราชา จ.ชลบุรี', tax_id: '0105561056789' }
    ];
    await supabase.from('customers').upsert(customersData);

    // 3. Drivers
    const driversData = [
      { id: 'DRV-001', name: 'นาย สมชาย มีทอง', phone: '085-1112223', license_no: 'DL-654321', expiry_date: '2028-12-31', vehicle_license: '70-1234 ชลบุรี', status: 'Available' },
      { id: 'DRV-002', name: 'นาย อภิชาต ขับดี', phone: '086-4445556', license_no: 'DL-987654', expiry_date: '2027-06-15', vehicle_license: '70-5678 ชลบุรี', status: 'On Duty' },
      { id: 'DRV-003', name: 'นาย เกียรติศักดิ์ ใจกล้า', phone: '081-999-5555', license_no: 'DL-112233', expiry_date: '2029-01-10', vehicle_license: '70-9999 ชลบุรี', status: 'Available' },
      { id: 'DRV-004', name: 'นาย มานพ รักพ่วง', phone: '082-555-6666', license_no: 'DL-445566', expiry_date: '2028-09-22', vehicle_license: '70-8888 ชลบุรี', status: 'Available' },
      { id: 'DRV-005', name: 'นาย สุรชัย ใจดี', phone: '089-777-8888', license_no: 'DL-778899', expiry_date: '2027-11-05', vehicle_license: '70-7777 ชลบุรี', status: 'Available' },
      { id: 'DRV-006', name: 'นาย นเรศ สายดิ่ง', phone: '087-333-2222', license_no: 'DL-223344', expiry_date: '2028-03-12', vehicle_license: '70-6666 ชลบุรี', status: 'Available' },
      { id: 'DRV-007', name: 'นาย วิโรจน์ ขับสนุก', phone: '083-444-9999', license_no: 'DL-556677', expiry_date: '2029-07-20', vehicle_license: '70-5555 ชลบุรี', status: 'Available' },
      { id: 'DRV-008', name: 'นาย สมบัติ แสนรัก', phone: '081-555-0101', license_no: 'DL-889900', expiry_date: '2028-10-30', vehicle_license: '70-4444 ชลบุรี', status: 'Available' },
      { id: 'DRV-009', name: 'นาย ปราโมทย์ ดลใจ', phone: '085-666-3333', license_no: 'DL-001122', expiry_date: '2027-02-15', vehicle_license: '70-3333 ชลบุรี', status: 'Available' },
      { id: 'DRV-010', name: 'นาย อัสนี โลหะ', phone: '088-222-7777', license_no: 'DL-334455', expiry_date: '2028-05-19', vehicle_license: '70-2222 ชลบุรี', status: 'Available' }
    ];
    await supabase.from('drivers').upsert(driversData);

    // 4. Employees
    const employeesData = [
      { id: 'EMP-001', name: 'น.ส. สมศรี รักงาน', position: 'ผู้จัดการธุรการ', department: 'บัญชีและการเงิน', phone: '091-8889999', salary: 28000, start_date: '2023-01-15' },
      { id: 'EMP-002', name: 'นาย ธวัช ขยันงาน', position: 'ช่างซ่อมบำรุง', department: 'เทคนิคยานยนต์', phone: '083-4441112', salary: 20000, start_date: '2024-03-01' },
      { id: 'EMP-003', name: 'น.ส. ลัดดา มีทรัพย์', position: 'พนักงานบัญชีฝั่งจ่าย', department: 'บัญชีและการเงิน', phone: '081-333-4444', salary: 18000, start_date: '2025-05-10' },
      { id: 'EMP-004', name: 'นาย สราวุฒิ มั่นคง', position: 'เจ้าหน้าที่จัดรถ (Dispatcher)', department: 'จราจรและขนส่ง', phone: '086-555-4444', salary: 22000, start_date: '2024-11-01' },
      { id: 'EMP-005', name: 'น.ส. นภา แสงสวย', position: 'Customer Service', department: 'ฝ่ายปฏิบัติการ', phone: '084-777-3333', salary: 17500, start_date: '2025-01-20' }
    ];
    await supabase.from('employees').upsert(employeesData);

    // 5. Jobs
    const jobsData = [
      {
        job_no: 'JOB-20260521-001',
        date: '2026-05-21',
        customer_id: 'CUST-001',
        customer_name: 'ศรีราชา คอนเทนเนอร์ บลู บูล',
        origin: 'ท่าเรือแหลมฉบัง C3',
        destination: 'คลังสินค้า สุมทรปราการ',
        vehicle_license: '70-1234 ชลบุรี',
        driver_name: 'นาย สมชาย มีทอง',
        vehicle_type: 'หัวลาก 10 ล้อ',
        booking_no: 'BK-998822A',
        shipper: 'MAERSK LINE CO., LTD',
        containers: [
          { containerNo: 'MSKU8822019', transportation: 4000, portCharge: 500, containerHandling: 200, liftOnOff: 300 },
          { containerNo: 'MSKU8822047', transportation: 4000, portCharge: 500, containerHandling: 200, liftOnOff: 300 }
        ],
        total_amount: 10000,
        status: 'วางบิลแล้ว'
      },
      {
        job_no: 'JOB-20260521-002',
        date: '2026-05-21',
        customer_id: 'CUST-002',
        customer_name: 'แหลมฉบัง ซัพพลาย แอนด์ โลจิสติกส์',
        origin: 'ลานคู้ ข้าวแหลมฉบัง',
        destination: 'โรงเบียร์แหลมฉบัง',
        vehicle_license: '70-5678 ชลบุรี',
        driver_name: 'นาย อภิชาต ขับดี',
        vehicle_type: 'หางรถพ่วง FLATBED',
        booking_no: 'BK-HLC9912',
        shipper: 'HAPAG-LLOYD THAILAND',
        containers: [
          { containerNo: 'HLXU4291880', transportation: 3200, portCharge: 300, containerHandling: 150, liftOnOff: 250 }
        ],
        total_amount: 3900,
        status: 'กำลังขนส่ง'
      },
      {
        job_no: 'JOB-20260521-003',
        date: '2026-05-21',
        customer_id: 'CUST-003',
        customer_name: 'ซีจี คาร์โก้ โลจิสติกส์',
        origin: 'คลังสินค้า หนองขาม',
        destination: 'นิคมอุตสาหกรรมอมตะซิตี้ ระยอง',
        vehicle_license: '70-9999 ชลบุรี',
        driver_name: 'นาย เกียรติศักดิ์ ใจกล้า',
        vehicle_type: 'หัวลาก 12 ล้อ',
        booking_no: 'BK-ONE88012',
        shipper: 'OCEAN NETWORK EXPRESS',
        containers: [
          { containerNo: 'ONEY9922880', transportation: 5500, portCharge: 400, containerHandling: 200, liftOnOff: 300 }
        ],
        total_amount: 6400,
        status: 'รอดำเนินการ'
      },
      {
        job_no: 'JOB-20260521-004',
        date: '2026-05-21',
        customer_id: 'CUST-004',
        customer_name: 'ชลบุรี อินเตอร์เทรด 2026',
        origin: 'ลานตู้ เกตเวย์ ชลบุรี',
        destination: 'โรงงาน ต.บ้านบึง ชลบุรี',
        vehicle_license: '70-8888 ชลบุรี',
        driver_name: 'นาย มานพ รักพ่วง',
        vehicle_type: 'หางพ่วง CONTAINER SKELETAL',
        booking_no: 'BK-COSC9222',
        shipper: 'COSCO SHIPPING LINE',
        containers: [
          { containerNo: 'COSU4499123', transportation: 3500, portCharge: 300, containerHandling: 100, liftOnOff: 200 }
        ],
        total_amount: 4100,
        status: 'ส่งแล้ว'
      },
      {
        job_no: 'JOB-20260521-005',
        date: '2026-05-21',
        customer_id: 'CUST-005',
        customer_name: 'ไทย ซิปปิ้ง โซลูชั่นส์',
        origin: 'ท่าเรือแหลมฉบัง B2',
        destination: 'โรงงาน อมตะนคร ชลบุรี',
        vehicle_license: '70-7777 ชลบุรี',
        driver_name: 'นาย สุรชัย ใจดี',
        vehicle_type: 'รถบรรทุก 6 ล้อตู้ทึบ',
        booking_no: 'BK-MSC5502',
        shipper: 'MSC THAILAND CO.,LTD',
        containers: [
          { containerNo: 'MSCU9902334', transportation: 2800, portCharge: 200, containerHandling: 100, liftOnOff: 150 }
        ],
        total_amount: 3250,
        status: 'ส่งแล้ว'
      }
    ];
    await supabase.from('transport_jobs').upsert(jobsData);

    // 6. Expenses
    const expensesData = [
      { id: 'JOB-20260521-001/EXP-001', date: '2026-05-21', type: 'น้ำมัน', description: 'เติมน้ำมัน ปตท. แหลมฉบัง', vehicle_license: '70-1234 ชลบุรี', driver_name: 'นาย สมชาย มีทอง', amount: 1500, note: 'เติมเต็มถังสำหรับการวิ่งงานกรุงเทพฯ-ชลบุรี', bill_type: 'Normal' },
      { id: 'JOB-20260521-002/EXP-002', date: '2026-05-21', type: 'ค่าทางด่วน', description: 'ด่านบางปะกง มอเตอร์เวย์', vehicle_license: '70-5678 ชลบุรี', driver_name: 'นาย อภิชาต ขับดี', amount: 120, note: 'งานวิ่งเบียร์แหลมฉบัง', bill_type: 'Adv' },
      { id: 'JOB-20260521-003/EXP-003', date: '2026-05-21', type: 'ค่าซ่อม', description: 'ปะยางล้อซ้ายหัวลาก', vehicle_license: '70-9999 ชลบุรี', driver_name: 'นาย เกียรติศักดิ์ ใจกล้า', amount: 450, note: 'ยางรั่วจากตะปูระหว่างจอดรอ', bill_type: 'Normal' },
      { id: 'JOB-20260521-004/EXP-004', date: '2026-05-21', type: 'ค่าแรง', description: 'เบี้ยเลี้ยงพิเศษ วิ่งงานดึก', vehicle_license: '70-8888 ชลบุรี', driver_name: 'นาย มานพ รักพ่วง', amount: 500, note: 'วิ่งงานเร่งส่งตู้ Cosco', bill_type: 'Normal' },
      { id: 'JOB-20260521-005/EXP-005', date: '2026-05-21', type: 'ค่าอาหาร', description: 'เบี้ยเลี้ยงมื้อกลางวันวิ่งทางไกล', vehicle_license: '70-7777 ชลบุรี', driver_name: 'นาย สุรชัย ใจดี', amount: 150, note: 'งานอมตะ ชลบุรี', bill_type: 'Normal' }
    ];
    await supabase.from('daily_expenses').upsert(expensesData);

    // 7. Invoices
    const invoicesData = [
      {
        invoice_no: 'INV-2026-0001',
        date: '2026-05-21',
        customer_id: 'CUST-001',
        customer_name: 'ศรีราชา คอนเทนเนอร์ บลู บูล',
        job_no: 'JOB-20260521-001',
        invoice_type: 'Transport',
        booking_no: 'BK-998822A',
        shipper: 'MAERSK LINE CO., LTD',
        containers: [
          { containerNo: 'MSKU8822019', transportation: 4200, portCharge: 0, containerHandling: 0, liftOnOff: 0 }
        ],
        advance_items: [],
        subtotal: 4200,
        withholding_tax: 42,
        vat_amount: 0,
        grand_total: 4158,
        total_text: 'สี่พันหนึ่งร้อยห้าสิบแปดบาทถ้วน',
        status: 'จ่ายแล้ว'
      },
      {
        invoice_no: 'INV-2026-0002',
        date: '2026-05-21',
        customer_id: 'CUST-001',
        customer_name: 'ศรีราชา คอนเทนเนอร์ บลู บูล',
        job_no: 'JOB-20260521-001',
        invoice_type: 'Advance',
        booking_no: 'BK-998822A',
        shipper: 'MAERSK LINE CO., LTD',
        containers: [],
        advance_items: [
          { id: 'ADV-I-001', description: 'ค่ารับคืนและยกตู้เปล่าท่าเรือแหลมฉบัง', amount: 1847.48 }
        ],
        subtotal: 1847.48,
        withholding_tax: 0,
        vat_amount: 129.32,
        grand_total: 1976.80,
        total_text: 'หนึ่งพันเก้าร้อยเจ็ดสิบหกบาทแปดสิบสตางค์',
        status: 'ยังไม่จ่าย'
      }
    ];
    await supabase.from('invoices').upsert(invoicesData);

    // 8. Receipts
    const receiptsData = [
      { receipt_no: 'RE-2026-0001', date: '2026-05-21', invoice_no: 'INV-2026-0001', customer_name: 'ศรีราชา คอนเทนเนอร์ บลู บูล', amount: 4158, payment_method: 'โอนเงิน', receipt_type: 'Transport' }
    ];
    await supabase.from('receipts').upsert(receiptsData);

    // 9. Partner Payments
    const partnerPaymentsData = [
      { id: 'PPM-001', date: '2026-05-21', partner_name: 'บจก. ยูเนี่ยน โลจิสแอลไลแอนซ์', job_no: 'JOB-20260521-001', payment_type: 'PAY_PARTNER', revenue: 5000, expenses_deduction: 500, net_paid: 4500, status: 'ยังไม่ได้เคลียร์' },
      { id: 'PPM-002', date: '2026-05-21', partner_name: 'นาย ประมวล วงศ์สุข (รถเช่า)', job_no: 'JOB-20260521-002', payment_type: 'RENT_CAR', revenue: 3500, expenses_deduction: 300, net_paid: 3200, status: 'จ่ายแล้ว' }
    ];
    await supabase.from('partner_payments').upsert(partnerPaymentsData);

    // 10. Withholding Taxes
    const withholdingTaxesData = [
      { id: 'WHT-001', date: '2026-05-21', payee_name: 'บจก. ยูเนี่ยน โลจิสแอลไลแอนซ์', tax_id_number: '0205568019999', base_amount: 5000, rate: 1, tax_amount: 50, type: 'Transportation' },
      { id: 'WHT-002', date: '2026-05-21', payee_name: 'บจก. เอส เอส เค คอมเมิร์ซ', tax_id_number: '0105559021234', base_amount: 8000, rate: 3, tax_amount: 240, type: 'Service' }
    ];
    await supabase.from('withholding_taxes').upsert(withholdingTaxesData);

    // 11. Payroll
    const payrollData = [
      { id: 'PAY-001', employee_id: 'DRV-001', employee_name: 'นาย สมชาย มีทอง', role: 'Driver', pay_date: '2026-05-30', salary: 15000, ot: 2500, bonus: 1000, deduction: 500, net_salary: 18000, status: 'Unpaid' },
      { id: 'PAY-002', employee_id: 'EMP-001', employee_name: 'น.ส. สมศรี รักงาน', role: 'Staff', pay_date: '2026-05-30', salary: 28000, ot: 1500, bonus: 2000, deduction: 0, net_salary: 31500, status: 'Unpaid' }
    ];
    await supabase.from('payroll').upsert(payrollData);

    return { success: true, message: 'เขียนชุดตารางตัวอย่าง (Seeded) 10 รายการเสร็จสมบูรณ์เรียบร้อยแล้ว!' };
  } catch (err: any) {
    console.error('JS Seeding error:', err);
    return { success: false, message: `เกิดความผิดพลาด: ${err.message}` };
  }
}

