import React from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Truck, AlertCircle, 
  Users, Fuel, CreditCard, ChevronRight, Activity, Calendar
} from 'lucide-react';
import { Customer, Driver, Vehicle, TransportJob, DailyExpense, CreditIncome, Invoice, Receipt } from '../types';
import { formatCurrency, getStatusStyle } from '../utils';

interface DashboardViewProps {
  jobs: TransportJob[];
  expenses: DailyExpense[];
  invoices: Invoice[];
  receipts: Receipt[];
  drivers: Driver[];
  vehicles: Vehicle[];
  customers: Customer[];
  onNavigate?: (tab: any) => void;
}

export function DashboardView({ jobs, expenses, invoices, receipts, drivers, vehicles, customers, onNavigate }: DashboardViewProps) {
  // Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  
  const todayExpenses = expenses
    .filter(e => e.date === todayStr)
    .reduce((sum, e) => sum + e.amount, 0);

  const todayIncomeCount = jobs.filter(j => j.date === todayStr).length;

  const totalCreditIncomeWait = invoices
    .filter(i => i.status === 'ยังไม่จ่าย')
    .reduce((sum, i) => sum + i.grandTotal, 0);

  const runningTrucksCount = vehicles.filter(v => v.status === 'Available').length;
  const onDutyDriversCount = drivers.filter(d => d.status === 'On Duty').length;

  // Fuel Total
  const fuelExpenses = expenses
    .filter(e => e.type === 'น้ำมัน')
    .reduce((sum, e) => sum + e.amount, 0);

  // Total Salary Expenses from Employees
  const activeWorkforce = drivers.length + vehicles.length;

  // Let's build lists of activities to show
  const recentJobs = [...jobs].slice(-5).reverse();
  const recentExpenses = [...expenses].slice(-5).reverse();

  // Monthly summary values for custom interactive charts
  const monthlyData = [
    { name: 'ม.ค.', income: 240000, expense: 180000 },
    { name: 'ก.พ.', income: 290000, expense: 210000 },
    { name: 'มี.ค.', income: 320000, expense: 240000 },
    { name: 'เม.ย.', income: 280000, expense: 195000 },
    { name: 'พ.ค.', income: totalCreditIncomeWait + 350000, expense: fuelExpenses + 250000 },
  ];

  const maxChartValue = Math.max(...monthlyData.map(d => Math.max(d.income, d.expense)));

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="z-10 space-y-1">
          <span className="text-emerald-400 font-mono text-xs tracking-wider uppercase">ระบบข้อมูลเชื่อมโยงเรียลไทม์</span>
          <h2 className="text-2xl font-bold font-sans tracking-tight">บริษัท เข็มทิศ ทานสปอร์ต จำกัด</h2>
          <p className="text-slate-400 text-sm">
            จัดการระบบขนส่ง, ใบแจ้งหนี้แยกตู้คอนเทนเนอร์, เบิกค่าใช้จ่ายสำรองจ่าย (Adv) และรายงานงบกำไรขาดทุนสะสม
          </p>
        </div>
        <div className="z-10 flex gap-3 text-sm font-mono bg-slate-800/80 p-3 rounded-lg border border-slate-700">
          <Activity className="text-emerald-400 w-5 h-5 animate-pulse" />
          <span>วันที่ระบบ: {todayStr}</span>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-full filter blur-3xl opacity-20 transform translate-x-12 -translate-y-12"></div>
      </div>

      {/* Grid of 4 Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white border border-slate-200 card-id-today-expense rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">ค่าใช้จ่ายวันนี้</span>
            <span className="text-2xl font-bold font-mono text-slate-900 block">
              {formatCurrency(todayExpenses)}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block animate-pulse"></span>
              จากการขนส่งและค่าซ่อมรายวัน
            </span>
          </div>
          <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-100">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-slate-200 card-id-credit-income rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">รายได้รอรอบเครดิต</span>
            <span className="text-2xl font-bold font-mono text-emerald-600 block">
              {formatCurrency(totalCreditIncomeWait)}
            </span>
            <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium bg-emerald-50 px-1.5 py-0.5 rounded w-max">
              ค้างชำระจากลูกค้า
            </span>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg border border-emerald-100">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-slate-200 card-id-fleet-status rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">งานขนส่งวันนี้</span>
            <span className="text-2xl font-bold font-mono text-slate-900 block">
              {todayIncomeCount} งาน
            </span>
            <span className="text-xs text-slate-400">
              สถานะ: ดำเนินงาน / เตรียมเอกสาร
            </span>
          </div>
          <div className="bg-blue-50 text-blue-600 p-3 rounded-lg border border-blue-100">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-slate-200 card-id-fuel-status rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">ค่าใช้จ่ายน้ำมันรวม</span>
            <span className="text-2xl font-bold font-mono text-amber-600 block">
              {formatCurrency(fuelExpenses)}
            </span>
            <span className="text-xs text-slate-400">
              ค่าใช้จ่ายสิ้นเปลืองน้ำมันหลัก
            </span>
          </div>
          <div className="bg-amber-50 text-amber-600 p-3 rounded-lg border border-amber-100">
            <Fuel className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid Content - Chart and Operational Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Custom Responsive Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 font-sans">แนวโน้มผลประกอบการและการเงินรายเดือน</h3>
              <p className="text-slate-400 text-xs">เปรียบเทียบระหว่าง รายได้รวม กับ รายจ่ายรอบเดือน</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-serif">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span> รายได้</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-slate-500 inline-block"></span> รายจ่าย</span>
            </div>
          </div>

          {/* SVG Custom Grid Bar Chart */}
          <div className="h-64 flex items-end gap-6 pt-4 border-b border-slate-100 font-serif text-slate-600">
            {monthlyData.map((d, i) => {
              const incomeHeight = `${(d.income / maxChartValue) * 85}%`;
              const expenseHeight = `${(d.expense / maxChartValue) * 85}%`;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end relative group">
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] p-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-10 w-36 shadow-lg leading-relaxed">
                    <p className="font-bold text-emerald-400">รายได้: {formatCurrency(d.income)}</p>
                    <p className="text-slate-300">รายจ่าย: {formatCurrency(d.expense)}</p>
                    <p className="text-slate-400 font-semibold">กำไรสุทธิ: {formatCurrency(d.income - d.expense)}</p>
                  </div>

                  <div className="w-full flex justify-center gap-1.5 items-end h-full">
                    {/* Income Bar */}
                    <div 
                      style={{ height: incomeHeight }} 
                      className="w-4 bg-emerald-500 hover:bg-emerald-600 rounded-t transition-all duration-300 shadow-sm"
                    ></div>
                    {/* Expense Bar */}
                    <div 
                      style={{ height: expenseHeight }} 
                      className="w-4 bg-slate-400 hover:bg-slate-500 rounded-t transition-all duration-300 shadow-sm"
                    ></div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 mt-1">{d.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Operational status panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 font-sans block">สถานะยานพาหนะและบุคลากร</h3>
          
          <div className="space-y-3">
            {/* Status Item 1 */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-120 hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-slate-700 text-sm block">คนขับปฏิบัติหน้าที่</span>
                  <span className="text-xs text-slate-400">{onDutyDriversCount} คน จากทั้งหมด {drivers.length} คน</span>
                </div>
              </div>
              <span className="font-mono text-sm font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">{onDutyDriversCount} อยู่ในหน้าที่</span>
            </div>

            {/* Status Item 2 */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-120 hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-slate-700 text-sm block">ทะเบียนรถพร้อมใช้งาน</span>
                  <span className="text-xs text-slate-400">{runningTrucksCount} คัน จากทั้งหมด {vehicles.length} คัน</span>
                </div>
              </div>
              <span className="font-mono text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">{runningTrucksCount} ทะเบียน</span>
            </div>

            {/* Status Item 3 */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-120 hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-slate-700 text-sm block">จำนวนรายชื่อคู่ค้าลูกค้า</span>
                  <span className="text-xs text-slate-400">{customers.length} บริษัท ลิสต์เครดิตเทอม</span>
                </div>
              </div>
              <span className="font-mono text-sm font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">{customers.length} รายการ</span>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-xs flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">แจ้งเตือนประกัน/พรบ. ยานพาหนะ</span>
              <span>ตรวจสอบสลิปและระยะพรบ. ประกันหมดอายุในเมนูฐานข้อมูลรถเพื่อความปลอดภัยในการวิ่งงานทางหลวง</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sheets Style Tables Overview */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Table 1: Recent Jobs */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-slate-800 font-sans">งานขนส่งล่าสุด (เรียงตาม Google Sheet)</h4>
            <button 
              onClick={() => onNavigate('PLAN_JOB')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-0.5 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200"
            >
              ดูทั้งหมด <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-150 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-slate-600 font-mono">
                  <th className="p-3 font-semibold border-r border-slate-150">เลขงาน Job</th>
                  <th className="p-3 font-semibold border-r border-slate-150">วันที่เดินทาง</th>
                  <th className="p-3 font-semibold border-r border-slate-150">ลูกค้าปลาทาง</th>
                  <th className="p-3 font-semibold border-r border-slate-150 text-right">ค่าขนส่งตู้</th>
                  <th className="p-3 font-semibold text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {recentJobs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-400 font-mono">ไม่มีประวัติงานขนส่ง</td>
                  </tr>
                ) : (
                  recentJobs.map((j) => (
                    <tr key={j.jobNo} className="hover:bg-slate-50/80 transition-colors odd:bg-white even:bg-slate-50/45 text-slate-700">
                      <td className="p-3 font-mono font-bold border-r border-slate-150">{j.jobNo}</td>
                      <td className="p-3 border-r border-slate-150">{j.date}</td>
                      <td className="p-3 border-r border-slate-150 truncate max-w-[140px]" title={j.customerName}>{j.customerName}</td>
                      <td className="p-3 border-r border-slate-150 font-mono font-bold text-right text-slate-900">
                        {formatCurrency(j.totalAmount)}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyle(j.status)}`}>
                          {j.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Recent Expenses */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-slate-800 font-sans">บันทึกค่าใช้จ่ายรายวันล่าสุด</h4>
            <button 
              onClick={() => onNavigate('DAILY_EXPENSE')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-0.5 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200"
            >
              ดูทั้งหมด <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-150 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-slate-600 font-mono">
                  <th className="p-3 font-semibold border-r border-slate-150">วันที่เบิก</th>
                  <th className="p-3 font-semibold border-r border-slate-150">ประเภทค่าใช้จ่าย</th>
                  <th className="p-3 font-semibold border-r border-slate-150">รายละเอียดการจ้างงาน</th>
                  <th className="p-3 font-semibold border-r border-slate-150">รถ/คนขับ</th>
                  <th className="p-3 font-semibold text-right">จำนวนยอดเบิก</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {recentExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-400 font-mono">ไม่พบข้อมูลใบเบิกค่าใช้จ่าย</td>
                  </tr>
                ) : (
                  recentExpenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/80 transition-colors odd:bg-white even:bg-slate-50/45 text-slate-700">
                      <td className="p-3 border-r border-slate-150 font-mono">{e.date}</td>
                      <td className="p-3 border-r border-slate-150 font-bold text-slate-900">{e.type}</td>
                      <td className="p-3 border-r border-slate-150 truncate max-w-[150px]" title={e.description}>{e.description}</td>
                      <td className="p-3 border-r border-slate-150 text-slate-500 font-mono text-[11px]">
                        <div>{e.vehicleLicense}</div>
                        <div className="text-slate-400">{e.driverName}</div>
                      </td>
                      <td className="p-3 font-mono font-bold text-right text-red-600">
                        -{formatCurrency(e.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
