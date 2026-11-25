import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Truck,
  AlertCircle,
  Users,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Percent,
  Wallet,
  UserCheck,
  Plus,
} from 'lucide-react';
import {
  Customer,
  Driver,
  Vehicle,
  TransportJob,
  DailyExpense,
  Invoice,
  Receipt,
} from '../types';
import {
  formatCurrency,
  formatDate,
  getStatusStyle,
  normalizeExpenseRecord,
} from '../utils';
import { StatCard } from './ui/DesignSystem';

interface DashboardViewProps {
  jobs: TransportJob[];
  expenses: DailyExpense[];
  invoices: Invoice[];
  receipts: Receipt[];
  drivers: Driver[];
  vehicles: Vehicle[];
  customers: Customer[];
  onNavigate?: (dest: string) => void;
  onQuickAddExpense?: () => void;
}

const THAI_MONTHS_SHORT = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

const THAI_MONTHS_FULL = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

export function DashboardView({
  jobs,
  expenses,
  invoices,
  drivers,
  vehicles,
  customers,
  onNavigate,
  onQuickAddExpense,
}: DashboardViewProps) {
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [selectedJob, setSelectedJob] = useState<TransportJob | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const normalizedExpenses = useMemo(
    () => expenses.map((e) => normalizeExpenseRecord(e)),
    [expenses]
  );

  // Core 4 Business KPIs (real Firestore calculations)
  const kpi = useMemo(() => {
    const totalExpenses = normalizedExpenses.reduce((s, e) => s + e.amount, 0);
    const driverExpensesList = normalizedExpenses.filter(
      (e) => e.expenseCategory === 'driver'
    );
    const driverExpenses = driverExpensesList.reduce((s, e) => s + e.amount, 0);
    const totalWht = normalizedExpenses.reduce(
      (s, e) => s + e.withholdingTaxAmount,
      0
    );
    const totalNet = normalizedExpenses.reduce((s, e) => s + e.netAmount, 0);

    // Build real 6-month mini sparkline series
    const now = new Date();
    const monthsKeys: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthsKeys.push(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      );
    }

    const totalSeries = monthsKeys.map((mk) =>
      normalizedExpenses
        .filter((e) => e.date.startsWith(mk))
        .reduce((s, e) => s + e.amount, 0)
    );
    const driverSeries = monthsKeys.map((mk) =>
      driverExpensesList
        .filter((e) => e.date.startsWith(mk))
        .reduce((s, e) => s + e.amount, 0)
    );
    const whtSeries = monthsKeys.map((mk) =>
      normalizedExpenses
        .filter((e) => e.date.startsWith(mk))
        .reduce((s, e) => s + e.withholdingTaxAmount, 0)
    );
    const netSeries = monthsKeys.map((mk) =>
      normalizedExpenses
        .filter((e) => e.date.startsWith(mk))
        .reduce((s, e) => s + e.netAmount, 0)
    );

    return {
      totalExpenses,
      driverExpenses,
      driverCount: driverExpensesList.length,
      totalWht,
      totalNet,
      totalSeries,
      driverSeries,
      whtSeries,
      netSeries,
    };
  }, [normalizedExpenses]);

  const todayIncomeCount = jobs.filter((j) => j.date === todayStr).length;
  const totalCreditIncomeWait = invoices
    .filter((i) => i.status === 'ยังไม่จ่าย')
    .reduce((sum, i) => sum + i.grandTotal, 0);
  const runningTrucksCount = vehicles.filter((v) => v.status === 'Available').length;
  const onDutyDriversCount = drivers.filter((d) => d.status === 'On Duty').length;

  const recentJobs = useMemo(
    () =>
      [...jobs]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5),
    [jobs]
  );

  const recentExpenses = useMemo(
    () =>
      [...normalizedExpenses]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5),
    [normalizedExpenses]
  );

  // Real 6-Month Financial Comparison from Firestore invoices & expenses
  const monthlyData = useMemo(() => {
    const now = new Date();
    const list: { name: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const income = invoices
        .filter((inv) => inv.date.startsWith(ym))
        .reduce((sum, inv) => sum + inv.grandTotal, 0);
      const expense = normalizedExpenses
        .filter((exp) => exp.date.startsWith(ym))
        .reduce((sum, exp) => sum + exp.netAmount, 0);
      list.push({
        name: THAI_MONTHS_SHORT[d.getMonth()],
        income,
        expense,
      });
    }
    return list;
  }, [invoices, normalizedExpenses]);

  const maxChartValue = Math.max(
    ...monthlyData.map((d) => Math.max(d.income, d.expense)),
    1
  );

  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  return (
    <div className="space-y-6">
      {/* Light Soft Pastel Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#1D4ED8]">
            <span>ภาพรวมระบบบริหารงานขนส่งและบัญชี</span>
            <span className="text-slate-300">•</span>
            <span className="font-mono text-slate-500">{formatDate(todayStr)}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            บริษัท เข็มทิศ ทรานสปอร์ต จำกัด
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm">
            สรุปค่าใช้จ่าย ภาษีหัก ณ ที่จ่าย 1% คนขับรถ แผนการวิ่งงาน และสถานะกองรถแบบเรียลไทม์
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onQuickAddExpense && (
            <button
              type="button"
              onClick={onQuickAddExpense}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              เพิ่มรายการค่าใช้จ่าย
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigate?.('TAX_REPORT')}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#FDF2F8] hover:bg-[#FCE7F3] text-[#BE185D] border border-[#FBCFE8] text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Percent className="w-4 h-4" />
            รายงานภาษี 1%
          </button>
        </div>
      </div>

      {/* Primary 4 Pastel KPI Cards with Mini Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="ค่าใช้จ่ายทั้งหมด"
          value={formatCurrency(kpi.totalExpenses)}
          subtitle={`ทั้งหมด ${normalizedExpenses.length} รายการ (ก่อนหักภาษี)`}
          tone="blue"
          icon={<DollarSign className="w-5 h-5" />}
          miniSeries={kpi.totalSeries}
          onClick={() => onNavigate?.('DAILY_EXPENSE')}
        />
        <StatCard
          title="ค่าใช้จ่ายคนขับรถ"
          value={formatCurrency(kpi.driverExpenses)}
          subtitle={`${kpi.driverCount} รายการเข้าเกณฑ์หัก 1%`}
          tone="orange"
          icon={<UserCheck className="w-5 h-5" />}
          miniSeries={kpi.driverSeries}
          onClick={() => onNavigate?.('DRIVER_EXPENSE')}
        />
        <StatCard
          title="ภาษีหัก ณ ที่จ่าย (1%)"
          value={formatCurrency(kpi.totalWht)}
          subtitle="คำนวณเฉพาะหมวดคนขับรถ"
          tone="pink"
          icon={<Percent className="w-5 h-5" />}
          miniSeries={kpi.whtSeries}
          onClick={() => onNavigate?.('TAX_REPORT')}
        />
        <StatCard
          title="ยอดจ่ายสุทธิ"
          value={formatCurrency(kpi.totalNet)}
          subtitle="ยอดสุทธิหลังหักภาษี ณ ที่จ่าย"
          tone="green"
          icon={<Wallet className="w-5 h-5" />}
          miniSeries={kpi.netSeries}
          onClick={() => onNavigate?.('EXPENSE_SUMMARY')}
        />
      </div>

      {/* Main Analytics Row: 6-Month Chart + Fleet & Operations Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Monthly Financial Trend Chart */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                แนวโน้มรายรับ-รายจ่ายจริง (6 เดือนล่าสุด)
              </h3>
              <p className="text-slate-500 text-xs">
                คำนวณจากยอดใบแจ้งหนี้และค่าใช้จ่ายจ่ายสุทธิบนฐานข้อมูลจริง
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#60A5FA] inline-block" />
                รายรับวางบิล
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#FB923C] inline-block" />
                รายจ่ายสุทธิ
              </span>
            </div>
          </div>

          <div className="h-56 flex items-end gap-3 sm:gap-6 pt-6 border-b border-slate-100">
            {monthlyData.map((d, i) => {
              const incomeHeight = `${Math.max(4, Math.round((d.income / maxChartValue) * 88))}%`;
              const expenseHeight = `${Math.max(4, Math.round((d.expense / maxChartValue) * 88))}%`;
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-2 h-full justify-end relative group"
                >
                  <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[11px] p-2.5 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 w-40 shadow-lg leading-relaxed font-mono tabular-nums">
                    <p className="text-sky-300 font-semibold">
                      รายรับ: {formatCurrency(d.income)}
                    </p>
                    <p className="text-orange-300">
                      รายจ่าย: {formatCurrency(d.expense)}
                    </p>
                  </div>

                  <div className="w-full flex justify-center gap-1.5 items-end h-full">
                    <div
                      style={{ height: incomeHeight }}
                      className="w-3.5 sm:w-5 bg-[#60A5FA] hover:bg-[#3B82F6] rounded-t-md transition-all"
                    />
                    <div
                      style={{ height: expenseHeight }}
                      className="w-3.5 sm:w-5 bg-[#FB923C] hover:bg-[#F97316] rounded-t-md transition-all"
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{d.name}</span>
                </div>
              );
            })}
          </div>

          {/* Secondary Quick KPI Row inside chart card */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-[#ECFDF5]/60 border border-[#A7F3D0]/60">
              <span className="text-[11px] text-[#047857] font-semibold block">
                รายได้รอรอบเครดิต
              </span>
              <span className="text-sm font-mono font-bold tabular-nums text-slate-900">
                {formatCurrency(totalCreditIncomeWait)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#EFF6FF]/60 border border-[#BFDBFE]/60">
              <span className="text-[11px] text-[#1D4ED8] font-semibold block">
                งานขนส่งวันนี้
              </span>
              <span className="text-sm font-mono font-bold tabular-nums text-slate-900">
                {todayIncomeCount} งาน
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#F5F3FF]/60 border border-[#DDD6FE]/60 col-span-2 sm:col-span-1">
              <span className="text-[11px] text-[#6D28D9] font-semibold block">
                ใบแจ้งหนี้ทั้งหมด
              </span>
              <span className="text-sm font-mono font-bold tabular-nums text-slate-900">
                {invoices.length} ฉบับ
              </span>
            </div>
          </div>
        </div>

        {/* Fleet & Personnel Status Panel */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">
              สถานะกองรถและบุคลากร
            </h3>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#EFF6FF]/60 border border-[#BFDBFE]/70">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white text-[#1D4ED8] flex items-center justify-center shrink-0 border border-[#BFDBFE]">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-800 text-xs block truncate">
                      คนขับปฏิบัติหน้าที่
                    </span>
                    <span className="text-[11px] text-slate-500">
                      จากทั้งหมด {drivers.length} คน
                    </span>
                  </div>
                </div>
                <span className="font-mono text-sm font-bold tabular-nums text-[#1D4ED8] shrink-0">
                  {onDutyDriversCount} คน
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#ECFDF5]/60 border border-[#A7F3D0]/70">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white text-[#047857] flex items-center justify-center shrink-0 border border-[#A7F3D0]">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-800 text-xs block truncate">
                      รถขนส่งพร้อมใช้งาน
                    </span>
                    <span className="text-[11px] text-slate-500">
                      จากทั้งหมด {vehicles.length} คัน
                    </span>
                  </div>
                </div>
                <span className="font-mono text-sm font-bold tabular-nums text-[#047857] shrink-0">
                  {runningTrucksCount} คัน
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F5F3FF]/60 border border-[#DDD6FE]/70">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white text-[#6D28D9] flex items-center justify-center shrink-0 border border-[#DDD6FE]">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-800 text-xs block truncate">
                      คู่ค้าลูกค้าในระบบ
                    </span>
                    <span className="text-[11px] text-slate-500">
                      ฐานข้อมูลเครดิตเทอม
                    </span>
                  </div>
                </div>
                <span className="font-mono text-sm font-bold tabular-nums text-[#6D28D9] shrink-0">
                  {customers.length} ราย
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-xl p-3 text-[#9A3412] text-xs flex gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#C2410C]" />
            <div>
              <span className="font-bold block">ตรวจสอบ พ.ร.บ. และประกันรถ</span>
              <span className="text-[11px] text-[#9A3412]/80">
                ตรวจสอบวันหมดอายุ พ.ร.บ. และใบขับขี่ได้ที่เมนูทะเบียนฐานข้อมูล
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Transport Calendar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                ตารางแผนงานวิ่งขนส่งรายเดือน
              </h3>
              <p className="text-slate-500 text-xs">
                จัดสรรรถและคนขับตามวันที่ปฏิบัติงาน
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1">
              <button
                type="button"
                onClick={() =>
                  setCalendarDate(new Date(currentYear, currentMonth - 1, 1))
                }
                className="min-h-[34px] min-w-[34px] flex items-center justify-center hover:bg-white text-slate-600 rounded-lg transition-colors"
                title="เดือนก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-xs text-slate-700 px-3 min-w-[120px] text-center">
                {THAI_MONTHS_FULL[currentMonth]} {currentYear + 543}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCalendarDate(new Date(currentYear, currentMonth + 1, 1))
                }
                className="min-h-[34px] min-w-[34px] flex items-center justify-center hover:bg-white text-slate-600 rounded-lg transition-colors"
                title="เดือนถัดไป"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="min-h-[42px] bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 px-3 py-2 rounded-xl border border-slate-200 outline-none cursor-pointer"
            >
              <option value="all">-- รถขนส่งทุกคัน --</option>
              {vehicles.map((v) => (
                <option key={v.licensePlate} value={v.licensePlate}>
                  {v.licensePlate} ({v.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-7 gap-1.5 text-center font-semibold text-xs text-slate-500 mb-1.5">
              <div className="py-2 bg-[#FDF2F8] text-[#BE185D] rounded-lg">อา</div>
              <div className="py-2 bg-slate-50 text-slate-600 rounded-lg">จ</div>
              <div className="py-2 bg-slate-50 text-slate-600 rounded-lg">อ</div>
              <div className="py-2 bg-slate-50 text-slate-600 rounded-lg">พ</div>
              <div className="py-2 bg-slate-50 text-slate-600 rounded-lg">พฤ</div>
              <div className="py-2 bg-slate-50 text-slate-600 rounded-lg">ศ</div>
              <div className="py-2 bg-[#EFF6FF] text-[#1D4ED8] rounded-lg">ส</div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="min-h-[96px] bg-slate-50/40 border border-slate-100 rounded-xl"
                />
              ))}

              {Array.from({ length: totalDaysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(
                  2,
                  '0'
                )}-${String(dayNum).padStart(2, '0')}`;
                const dayJobs = jobs.filter((job) => {
                  const matchesDate = job.date === dateStr;
                  const matchesVehicle =
                    selectedVehicle === 'all' ||
                    job.vehicleLicense === selectedVehicle;
                  return matchesDate && matchesVehicle;
                });
                const isToday = todayStr === dateStr;

                return (
                  <div
                    key={`day-${dayNum}`}
                    className={`min-h-[104px] p-2 border rounded-xl flex flex-col justify-between transition-colors ${
                      isToday
                        ? 'bg-[#EFF6FF]/60 border-[#93C5FD]'
                        : 'bg-white border-slate-200/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-mono font-bold ${
                          isToday
                            ? 'bg-[#2563EB] text-white w-6 h-6 flex items-center justify-center rounded-lg'
                            : 'text-slate-600'
                        }`}
                      >
                        {dayNum}
                      </span>
                      {dayJobs.length > 0 && (
                        <span className="text-[10px] font-semibold text-[#1D4ED8]">
                          {dayJobs.length} งาน
                        </span>
                      )}
                    </div>

                    <div className="flex-1 space-y-1 overflow-y-auto max-h-[70px] sidebar-scroll">
                      {dayJobs.map((job) => (
                        <button
                          type="button"
                          key={job.jobNo}
                          onClick={() => setSelectedJob(job)}
                          className="w-full text-left p-1.5 rounded-lg text-[10px] leading-tight border border-slate-200/80 bg-slate-50 hover:bg-[#EFF6FF] hover:border-[#BFDBFE] text-slate-700 transition-colors"
                        >
                          <div className="font-semibold text-slate-900 truncate">
                            {job.customerName}
                          </div>
                          <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                            <span className="truncate max-w-[54px]">
                              {job.vehicleLicense}
                            </span>
                            <span>{job.jobType || 'Import'}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/45 backdrop-blur-[2px] p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-[#EFF6FF] border-b border-[#BFDBFE] p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-[#1D4ED8] uppercase tracking-wider">
                  รายละเอียดงานขนส่ง
                </span>
                <h4 className="font-bold text-sm text-slate-900 font-mono">
                  {selectedJob.jobNo}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-[#BFDBFE] text-slate-600 hover:text-slate-900 text-xs font-semibold"
              >
                ปิด
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-slate-400 text-[11px] block">วันที่ปฏิบัติงาน</span>
                  <span className="font-bold font-mono">{formatDate(selectedJob.date)}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">ประเภทงาน</span>
                  <span className="font-bold text-[#1D4ED8]">
                    {selectedJob.jobType || 'Import'} ({selectedJob.containerSize || '40HC'})
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block">ลูกค้า</span>
                <span className="font-bold text-slate-900">{selectedJob.customerName}</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 text-[11px] block">ทะเบียนรถ</span>
                  <span className="font-bold font-mono text-slate-800">
                    {selectedJob.vehicleLicense}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">คนขับรถ</span>
                  <span className="font-bold text-slate-800">{selectedJob.driverName}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block">เส้นทาง</span>
                <span className="font-semibold text-slate-900">
                  {selectedJob.origin} ➔ {selectedJob.destination}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[11px] block">ยอดรวมค่าขนส่ง</span>
                  <span className="font-mono font-bold text-sm tabular-nums text-slate-900">
                    {formatCurrency(selectedJob.totalAmount)}
                  </span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${getStatusStyle(
                    selectedJob.status
                  )}`}
                >
                  {selectedJob.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activities Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Recent Jobs */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-sm">งานขนส่งล่าสุด</h4>
            <button
              type="button"
              onClick={() => onNavigate?.('PLAN_JOB')}
              className="text-xs font-semibold text-[#1D4ED8] hover:text-blue-800 flex items-center gap-0.5 bg-[#EFF6FF] px-3 py-1.5 rounded-xl border border-[#BFDBFE]"
            >
              ดูทั้งหมด <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                  <th className="p-3 font-semibold">เลขงาน</th>
                  <th className="p-3 font-semibold">วันที่</th>
                  <th className="p-3 font-semibold">ลูกค้า</th>
                  <th className="p-3 font-semibold text-right">ค่าขนส่ง</th>
                  <th className="p-3 font-semibold text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentJobs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">
                      ยังไม่มีรายการงานขนส่ง
                    </td>
                  </tr>
                ) : (
                  recentJobs.map((j) => (
                    <tr key={j.jobNo} className="hover:bg-slate-50/70 text-slate-700">
                      <td className="p-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                        {j.jobNo}
                      </td>
                      <td className="p-3 font-mono tabular-nums whitespace-nowrap">
                        {formatDate(j.date)}
                      </td>
                      <td className="p-3 truncate max-w-[140px]" title={j.customerName}>
                        {j.customerName}
                      </td>
                      <td className="p-3 font-mono font-semibold tabular-nums text-right text-slate-900 whitespace-nowrap">
                        {formatCurrency(j.totalAmount)}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getStatusStyle(
                            j.status
                          )}`}
                        >
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

        {/* Recent Expenses with 1% WHT & Net Amount */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-sm">
              รายการค่าใช้จ่ายล่าสุด (พร้อมภาษี 1%)
            </h4>
            <button
              type="button"
              onClick={() => onNavigate?.('DAILY_EXPENSE')}
              className="text-xs font-semibold text-[#047857] hover:text-emerald-800 flex items-center gap-0.5 bg-[#ECFDF5] px-3 py-1.5 rounded-xl border border-[#A7F3D0]"
            >
              ดูทั้งหมด <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                  <th className="p-3 font-semibold">วันที่</th>
                  <th className="p-3 font-semibold">รายการ</th>
                  <th className="p-3 font-semibold text-right">ก่อนหัก</th>
                  <th className="p-3 font-semibold text-right">หัก 1%</th>
                  <th className="p-3 font-semibold text-right">จ่ายสุทธิ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">
                      ยังไม่มีรายการค่าใช้จ่าย
                    </td>
                  </tr>
                ) : (
                  recentExpenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/70 text-slate-700">
                      <td className="p-3 font-mono tabular-nums whitespace-nowrap">
                        {formatDate(e.date)}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{e.type}</div>
                        <div className="text-[10px] text-slate-400">
                          {e.expenseCategory === 'driver' ? 'คนขับรถ (1%)' : 'ทั่วไป (0%)'}
                          {e.driverName ? ` • ${e.driverName}` : ''}
                        </div>
                      </td>
                      <td className="p-3 font-mono tabular-nums text-right whitespace-nowrap">
                        {formatCurrency(e.amount)}
                      </td>
                      <td className="p-3 font-mono tabular-nums text-right whitespace-nowrap text-[#BE185D]">
                        {e.withholdingTaxAmount > 0
                          ? `-${formatCurrency(e.withholdingTaxAmount)}`
                          : '฿0.00'}
                      </td>
                      <td className="p-3 font-mono font-bold tabular-nums text-right text-[#047857] whitespace-nowrap">
                        {formatCurrency(e.netAmount)}
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
