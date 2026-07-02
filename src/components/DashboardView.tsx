import React, { useState } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Truck, AlertCircle, 
  Users, Fuel, CreditCard, ChevronRight, ChevronLeft, Activity, Calendar
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
  // Calendar State
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [selectedJob, setSelectedJob] = useState<TransportJob | null>(null);

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

      {/* Monthly Transport Calendar Section */}
      {(() => {
        const currentYear = calendarDate.getFullYear();
        const currentMonth = calendarDate.getMonth();
        const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
        const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        const handlePrevMonth = () => {
          setCalendarDate(new Date(currentYear, currentMonth - 1, 1));
        };

        const handleNextMonth = () => {
          setCalendarDate(new Date(currentYear, currentMonth + 1, 1));
        };

        const THAI_MONTHS = [
          'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
          'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
        ];

        return (
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-lg border border-indigo-100">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 font-sans text-sm sm:text-base">ตารางแผนงานวิ่งขนส่งรายเดือน (Monthly Transport Calendar)</h3>
                  <p className="text-slate-400 text-xs">ภาพรวมตารางการวิ่งรถ เพื่อช่วยจัดสรรรถและคนขับได้เหมาะสม</p>
                </div>
              </div>
              
              {/* Controls: Prev/Next & Vehicle Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1">
                  <button 
                    onClick={handlePrevMonth}
                    className="hover:bg-white text-slate-600 p-1.5 rounded transition-all"
                    title="เดือนก่อนหน้า"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-xs text-slate-700 px-3 min-w-[120px] text-center font-sans">
                    {THAI_MONTHS[currentMonth]} {currentYear + 543}
                  </span>
                  <button 
                    onClick={handleNextMonth}
                    className="hover:bg-white text-slate-600 p-1.5 rounded transition-all"
                    title="เดือนถัดไป"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Vehicle Select Filter */}
                <div className="relative">
                  <select
                    value={selectedVehicle}
                    onChange={(e) => setSelectedVehicle(e.target.value)}
                    className="bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 pl-3 pr-8 py-2 rounded-lg border border-slate-200 outline-none cursor-pointer appearance-none"
                  >
                    <option value="all">-- รถขนส่งทุกคัน --</option>
                    {vehicles.map((v) => (
                      <option key={v.licensePlate} value={v.licensePlate}>
                        ทะเบียน: {v.licensePlate} ({v.type})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                    ▼
                  </div>
                </div>
              </div>
            </div>

            {/* Calendar Grid Container */}
            <div className="overflow-x-auto">
              <div className="min-w-[760px]">
                {/* Days of week header */}
                <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-500 mb-1">
                  <div className="py-2 bg-rose-50 text-rose-600 rounded">อา (Sun)</div>
                  <div className="py-2 bg-slate-50 text-slate-700 rounded">จ (Mon)</div>
                  <div className="py-2 bg-slate-50 text-slate-700 rounded">อ (Tue)</div>
                  <div className="py-2 bg-slate-50 text-slate-700 rounded">พ (Wed)</div>
                  <div className="py-2 bg-slate-50 text-slate-700 rounded">พฤ (Thu)</div>
                  <div className="py-2 bg-slate-50 text-slate-700 rounded">ศ (Fri)</div>
                  <div className="py-2 bg-sky-50 text-sky-600 rounded">ส (Sat)</div>
                </div>

                {/* Calendar Days cells */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Render empty prefix cells */}
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="min-h-[100px] bg-slate-50/50 border border-slate-100 rounded-lg opacity-40"></div>
                  ))}

                  {/* Render days of the month */}
                  {Array.from({ length: totalDaysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    
                    // Filter jobs for this specific day & vehicle
                    const dayJobs = jobs.filter((job) => {
                      const matchesDate = job.date === dateStr;
                      const matchesVehicle = selectedVehicle === 'all' || job.vehicleLicense === selectedVehicle;
                      return matchesDate && matchesVehicle;
                    });

                    const isToday = todayStr === dateStr;

                    return (
                      <div 
                        key={`day-${dayNum}`} 
                        className={`min-h-[110px] p-2 border rounded-lg flex flex-col justify-between transition-all hover:shadow-sm ${
                          isToday 
                            ? 'bg-amber-50/40 border-amber-300 ring-2 ring-amber-300/30 ring-inset' 
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        {/* Day number label */}
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-mono font-extrabold ${
                            isToday ? 'bg-amber-500 text-white w-5 h-5 flex items-center justify-center rounded-full' : 'text-slate-600'
                          }`}>
                            {dayNum}
                          </span>
                          {dayJobs.length > 0 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {dayJobs.length} งาน
                            </span>
                          )}
                        </div>

                        {/* Jobs list */}
                        <div className="flex-1 space-y-1 overflow-y-auto max-h-[75px] scrollbar-thin">
                          {dayJobs.map((job) => (
                            <button
                              type="button"
                              key={job.jobNo}
                              onClick={() => setSelectedJob(job)}
                              className="w-full text-left p-1 rounded text-[10px] leading-tight transition-all block hover:scale-[1.02] border cursor-pointer border-slate-200 bg-slate-50 hover:bg-indigo-50/60 hover:border-indigo-200 text-slate-700 font-sans"
                            >
                              <div className="font-bold text-slate-900 truncate">{job.customerName}</div>
                              <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                                <span className="bg-slate-100 text-slate-700 px-1 rounded truncate max-w-[50px]">{job.vehicleLicense}</span>
                                <span className="truncate max-w-[50px]">{job.jobType || 'Import'}</span>
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
        );
      })()}

      {/* Calendar Job Detail Modal Popup */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Transport Schedule Details</span>
                <h4 className="font-extrabold text-sm font-sans">{selectedJob.jobNo}</h4>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedJob(null)}
                className="text-slate-400 hover:text-white bg-slate-800 p-1 rounded-lg transition-colors text-xs font-mono px-2"
              >
                ปิด [X]
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4 space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-2.5 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-slate-400 text-[10px] block">วันที่ปฏิบัติงาน</span>
                  <span className="font-bold font-mono">{selectedJob.date}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">ประเภทงาน</span>
                  <span className="font-bold text-indigo-600">{selectedJob.jobType || 'Import'} ({selectedJob.containerSize || '40HC'})</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block">ชื่อคู่ค้า / ลูกค้า</span>
                <span className="font-bold text-slate-900">{selectedJob.customerName}</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 font-sans">
                <div>
                  <span className="text-slate-400 text-[10px] block">หัวลากทะเบียน</span>
                  <span className="font-bold text-slate-800">{selectedJob.vehicleLicense}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">พนักงานคนขับ</span>
                  <span className="font-bold text-slate-800">{selectedJob.driverName}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-2 space-y-1">
                <div>
                  <span className="text-slate-400 text-[10px] block">เส้นทางขนส่งสินค้า</span>
                  <span className="font-bold text-slate-900">{selectedJob.origin} ➔ {selectedJob.destination}</span>
                </div>
                {selectedJob.shipper && (
                  <div>
                    <span className="text-slate-400 text-[10px] block">Shipper ผู้ว่าจ้างเรือ</span>
                    <span className="font-semibold text-slate-800">{selectedJob.shipper}</span>
                  </div>
                )}
                {selectedJob.bookingNo && (
                  <div>
                    <span className="text-slate-400 text-[10px] block">Booking No</span>
                    <span className="font-mono font-bold text-indigo-600">{selectedJob.bookingNo}</span>
                  </div>
                )}
              </div>

              {/* Containers list */}
              <div className="border-t border-slate-100 pt-2">
                <span className="text-slate-400 text-[10px] block mb-1">รายการตู้คอนเทนเนอร์:</span>
                <div className="max-h-24 overflow-y-auto space-y-1 bg-slate-50/50 p-2 rounded border border-slate-150">
                  {selectedJob.containers.map((c, index) => (
                    <div key={index} className="flex items-center justify-between font-mono text-[11px] text-slate-600">
                      <span>• {c.containerNo || `ตู้ที่ ${index + 1}`}</span>
                      <span className="font-bold text-slate-800">{formatCurrency(c.transportation)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Revenue & Status */}
              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] block">ยอดรวมค่าขนส่ง</span>
                  <span className="font-mono font-black text-sm text-slate-900">{formatCurrency(selectedJob.totalAmount)}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusStyle(selectedJob.status)}`}>
                  {selectedJob.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

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
