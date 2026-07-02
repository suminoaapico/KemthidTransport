import React, { useState } from 'react';
import { 
  BarChart2, TrendingUp, TrendingDown, DollarSign, Truck, Calendar, Printer,
  FileText, Users, Award, MapPin, ChevronRight, PieChart, Tag, Briefcase, 
  ChevronDown, CalendarDays, Percent, ArrowUpRight
} from 'lucide-react';
import { 
  Customer, Driver, Vehicle, Employee, TransportJob, 
  DailyExpense, Invoice, Receipt, PartnerPayment, 
  WithholdingTaxRecord, PayrollRecord 
} from '../types';
import { formatCurrency, getStatusStyle } from '../utils';

interface ReportsViewProps {
  jobs: TransportJob[];
  expenses: DailyExpense[];
  invoices: Invoice[];
  receipts: Receipt[];
  drivers: Driver[];
  vehicles: Vehicle[];
  customers: Customer[];
  partnerPayments: PartnerPayment[];
  payroll: PayrollRecord[];
  employees: Employee[];
}

export function ReportsView({
  jobs, expenses, invoices, receipts, drivers, vehicles, customers, partnerPayments, payroll, employees
}: ReportsViewProps) {
  // Filter settings
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // Default to start of current month
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  const [incomeGroupBy, setIncomeGroupBy] = useState<'customer' | 'shipper' | 'route'>('customer');
  const [activeTab, setActiveTab] = useState<'summary' | 'income' | 'expense' | 'all-transactions'>('summary');

  // Quick Range Selector
  const setQuickRange = (range: 'this-month' | 'last-month' | 'this-quarter' | 'all') => {
    const today = new Date();
    if (range === 'this-month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (range === 'last-month') {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    } else if (range === 'this-quarter') {
      const quarter = Math.floor(today.getMonth() / 3);
      const start = new Date(today.getFullYear(), quarter * 3, 1);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (range === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Date Filtering Helper
  const isWithinRange = (dateStr: string) => {
    if (!dateStr) return false;
    const cleanDate = dateStr.split('T')[0];
    if (startDate && cleanDate < startDate) return false;
    if (endDate && cleanDate > endDate) return false;
    return true;
  };

  // --- REPORT CALCULATIONS ---
  
  // 1. Filtered Datasets
  const filteredJobs = jobs.filter(j => isWithinRange(j.date));
  const filteredExpenses = expenses.filter(e => isWithinRange(e.date));
  const filteredInvoices = invoices.filter(inv => isWithinRange(inv.date));
  const filteredReceipts = receipts.filter(r => isWithinRange(r.date));
  const filteredPartnerPayments = partnerPayments.filter(p => isWithinRange(p.date));
  const filteredPayroll = payroll.filter(p => isWithinRange(p.payDate));

  // 2. Calculations for Income
  // Incomes can be represented as:
  // - Total calculated revenue from jobs completed
  // - Or actual billing invoiced
  // Consistent with the Profit & Loss tab, we'll calculate:
  // - Total Invoiced amount during the period (subtotal)
  const totalInvoicedSum = filteredInvoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0);
  const totalInvoicedVat = filteredInvoices.reduce((sum, inv) => sum + (inv.vatAmount || 0), 0);
  const totalInvoicedGrand = filteredInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  
  // actual jobs run total amount as direct booked logistics revenue
  const totalJobsBookedSum = filteredJobs.reduce((sum, j) => sum + (j.totalAmount || 0), 0);
  const totalJobsCompletedCount = filteredJobs.filter(j => j.status === 'ส่งแล้ว' || j.status === 'วางบิลแล้ว' || j.status === 'รับเงินแล้ว').length;
  const totalJobsPendingCount = filteredJobs.filter(j => j.status === 'รอดำเนินการ' || j.status === 'กำลังขนส่ง').length;

  // 3. Calculation for Expenses (broken down in parts)
  // Fuel (น้ำมัน)
  const expenseFuel = filteredExpenses
    .filter(e => e.type === 'น้ำมัน')
    .reduce((sum, e) => sum + e.amount, 0);

  // Tolls (ค่าทางด่วน)
  const expenseTolls = filteredExpenses
    .filter(e => e.type === 'ค่าทางด่วน')
    .reduce((sum, e) => sum + e.amount, 0);

  // Maintenance (ค่าซ่อม)
  const expenseMaintenance = filteredExpenses
    .filter(e => e.type === 'ค่าซ่อม')
    .reduce((sum, e) => sum + e.amount, 0);

  // Additional Driver Allowances / Trip wages recorded in daily expenses
  const expenseExtraWages = filteredExpenses
    .filter(e => e.type === 'ค่าแรง')
    .reduce((sum, e) => sum + e.amount, 0);

  // Food Allowance
  const expenseFood = filteredExpenses
    .filter(e => e.type === 'ค่าอาหาร')
    .reduce((sum, e) => sum + e.amount, 0);

  // Others Daily Expense
  const expenseOthers = filteredExpenses
    .filter(e => e.type === 'อื่นๆ')
    .reduce((sum, e) => sum + e.amount, 0);

  // Partner Fleet outsourcing / leases payouts (รถร่วมขนส่ง / เช่ารถ)
  const expensePartnerOutsourced = filteredPartnerPayments
    .reduce((sum, p) => sum + p.netPaid, 0);

  // Employee Payroll salary payouts (Drivers & admin staff)
  const expensePayrollPaid = filteredPayroll
    .reduce((sum, pr) => sum + pr.netSalary, 0);

  // Total calculated cumulative operating expenses
  const totalOperatingExpenses = 
    expenseFuel + 
    expenseTolls + 
    expenseMaintenance + 
    expenseExtraWages + 
    expenseFood + 
    expenseOthers + 
    expensePartnerOutsourced + 
    expensePayrollPaid;

  // Margin Net Summary
  // Let's use totalJobsBookedSum (actual job capacity) as gross revenues OR totalInvoicedSum. 
  // Let's provide an option or use totalJobsBookedSum which aligns directly with "รายรับแสดงจำนวนงานที่วิ่งได้ ได้จากไหน" (Revenue from completed runs)
  const totalGrossRevenue = totalJobsBookedSum;
  const netProfit = totalGrossRevenue - totalOperatingExpenses;
  const marginPercentage = totalGrossRevenue > 0 ? (netProfit / totalGrossRevenue) * 100 : 0;

  // --- INCOME DETAILS: "รายรับแสดงจำนวนงานที่วิ่งได้ ได้จากไหน" GROUPINGS ---
  
  // Group by Customers
  const customerIncomeMap: { [key: string]: { name: string; totalRuns: number; completedRuns: number; amount: number } } = {};
  filteredJobs.forEach(j => {
    const key = j.customerName || 'ผู้ว่าจ้างทั่วไป';
    if (!customerIncomeMap[key]) {
      customerIncomeMap[key] = { name: key, totalRuns: 0, completedRuns: 0, amount: 0 };
    }
    customerIncomeMap[key].totalRuns += 1;
    if (j.status === 'ส่งแล้ว' || j.status === 'วางบิลแล้ว' || j.status === 'รับเงินแล้ว') {
      customerIncomeMap[key].completedRuns += 1;
    }
    customerIncomeMap[key].amount += j.totalAmount || 0;
  });
  const customerIncomeList = Object.values(customerIncomeMap).sort((a, b) => b.amount - a.amount);

  // Group by Shippers
  const shipperIncomeMap: { [key: string]: { name: string; totalRuns: number; completedRuns: number; amount: number } } = {};
  filteredJobs.forEach(j => {
    const key = j.shipper?.trim() || 'ไม่ระบุผู้ส่งสินค้า';
    if (!shipperIncomeMap[key]) {
      shipperIncomeMap[key] = { name: key, totalRuns: 0, completedRuns: 0, amount: 0 };
    }
    shipperIncomeMap[key].totalRuns += 1;
    if (j.status === 'ส่งแล้ว' || j.status === 'วางบิลแล้ว' || j.status === 'รับเงินแล้ว') {
      shipperIncomeMap[key].completedRuns += 1;
    }
    shipperIncomeMap[key].amount += j.totalAmount || 0;
  });
  const shipperIncomeList = Object.values(shipperIncomeMap).sort((a, b) => b.amount - a.amount);

  // Group by Routes (Origin-Destination)
  const routeIncomeMap: { [key: string]: { route: string; totalRuns: number; completedRuns: number; amount: number } } = {};
  filteredJobs.forEach(j => {
    const key = `${j.origin || 'ต้นทาง'} ➔ ${j.destination || 'ปลายทาง'}`;
    if (!routeIncomeMap[key]) {
      routeIncomeMap[key] = { route: key, totalRuns: 0, completedRuns: 0, amount: 0 };
    }
    routeIncomeMap[key].totalRuns += 1;
    if (j.status === 'ส่งแล้ว' || j.status === 'วางบิลแล้ว' || j.status === 'รับเงินแล้ว') {
      routeIncomeMap[key].completedRuns += 1;
    }
    routeIncomeMap[key].amount += j.totalAmount || 0;
  });
  const routeIncomeList = Object.values(routeIncomeMap).sort((a, b) => b.amount - a.amount);

  // Handle Printing
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header and Date Filter Controller Widget */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-sans font-black tracking-tight text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              รายงานสรุปรายได้และสรุปรายจ่ายส่วนเดินรถ (Job & Cost Balance Ledger)
            </h2>
            <p className="text-slate-500 text-xs text-sans">
              วิเคราะห์เที่ยววิ่งงานสะสมสลับต้นทาง-ปลายทาง และกระจายสัดส่วนต้นทุนน้ำมัน ทางด่วน รถรวม และเงินเดือน
            </p>
          </div>
          <button 
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all self-start md:self-auto border-b-2 border-slate-950"
          >
            <Printer className="w-4 h-4" /> พิมพ์รายงาน (A4 PDF)
          </button>
        </div>

        {/* Date Filter Bar */}
        <div className="pt-2 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-bold flex items-center gap-1.5 mr-2">
              <Calendar className="w-4 h-4 text-slate-400" /> ช่วงเวลาที่ดู:
            </span>
            <button 
              onClick={() => setQuickRange('this-month')}
              className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-xs font-bold transition-all text-slate-600"
            >
              เดือนนี้
            </button>
            <button 
              onClick={() => setQuickRange('last-month')}
              className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-xs font-bold transition-all text-slate-600"
            >
              เดือนที่แล้ว
            </button>
            <button 
              onClick={() => setQuickRange('this-quarter')}
              className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-xs font-bold transition-all text-slate-600"
            >
              ไตรมาสนี้
            </button>
            <button 
              onClick={() => setQuickRange('all')}
              className="px-3 py-1 bg-slate-150 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-xs font-bold transition-all text-slate-600"
            >
              ดูทั้งหมด
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">ระหว่างวันที่</span>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-1.5 border border-slate-300 rounded-lg font-mono text-slate-700 focus:border-indigo-500 outline-none"
            />
            <span className="text-slate-400">ถึง</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="p-1.5 border border-slate-300 rounded-lg font-mono text-slate-700 focus:border-indigo-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. TAB CONTROLLERS */}
      <div className="flex bg-slate-200/50 p-1 rounded-xl border border-slate-200/60 w-max text-xs font-bold no-print">
        <button 
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'summary' ? 'bg-white text-indigo-750 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <PieChart className="w-4 h-4 text-indigo-500" />
          สรุปภาพรวมทางการเงิน
        </button>
        <button 
          onClick={() => setActiveTab('income')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'income' ? 'bg-white text-indigo-750 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          สรุปรายรับตามเที่ยววิ่ง ({filteredJobs.length} เที่ยว)
        </button>
        <button 
          onClick={() => setActiveTab('expense')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'expense' ? 'bg-white text-indigo-750 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <TrendingDown className="w-4 h-4 text-rose-500" />
          รายละเอียดต้นทุนค่าใช้จ่าย
        </button>
        <button 
          onClick={() => setActiveTab('all-transactions')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'all-transactions' ? 'bg-white text-indigo-750 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <FileText className="w-4 h-4 text-slate-500" />
          บันทึกธุรการช่วงกรองข้อมูล
        </button>
      </div>

      {/* 3. REPORT RENDERS */}
      
      {/* SECTION A: OVERALL BUSINESS PERFORMANCE */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* KPI Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Box 1: Total Jobs Trips */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-50/50 rounded-bl-full flex items-center justify-center select-none pointer-events-none">
                <Truck className="w-10 h-10 text-indigo-300/30 opacity-90" />
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">เที่ยววิ่งสะสมสะท้อนงานทั้งหมด</span>
                <div className="text-2xl font-black text-slate-900 tracking-tight font-sans">
                  {filteredJobs.length} <span className="text-xs text-slate-500 font-bold">เที่ยว</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 space-y-1 block font-sans">
                <div className="flex justify-between">
                  <span>ส่งสัญญางานสำเร็จ:</span>
                  <span className="font-extrabold text-emerald-600">{totalJobsCompletedCount} งาน</span>
                </div>
                <div className="flex justify-between">
                  <span>กำลังรอจัดขนส่ง:</span>
                  <span className="font-bold text-amber-500">{totalJobsPendingCount} งาน</span>
                </div>
              </div>
            </div>

            {/* Box 2: Total Income/Gross Booking Revenue */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50/50 rounded-bl-full flex items-center justify-center select-none pointer-events-none">
                <DollarSign className="w-10 h-10 text-emerald-300/30 opacity-90" />
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">รายรับมูลค่างานวิ่งรวม (Gross)</span>
                <div className="text-2xl font-black text-slate-950 tracking-tight font-sans">
                  {formatCurrency(totalGrossRevenue)}
                </div>
              </div>
              <div className="text-[11px] text-slate-500 space-y-1 block font-sans">
                <div className="flex justify-between">
                  <span>เฉลี่ยต่อเที่ยววิ่ง:</span>
                  <span className="font-bold text-slate-800">
                    {filteredJobs.length > 0 ? formatCurrency(totalGrossRevenue / filteredJobs.length) : '฿0.00'}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>ช่วงเวลา:</span>
                  <span>{startDate || 'เปิดเสรี'} ➔ {endDate}</span>
                </div>
              </div>
            </div>

            {/* Box 3: Total Cumulative Expenditures */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-red-50/40 rounded-bl-full flex items-center justify-center select-none pointer-events-none">
                <TrendingDown className="w-10 h-10 text-red-300/20 opacity-80" />
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">รายจ่ายรวมทุกแผนกฝั่งเดินรถ</span>
                <div className="text-2xl font-black text-slate-900 tracking-tight font-sans">
                  {formatCurrency(totalOperatingExpenses)}
                </div>
              </div>
              <div className="text-[11px] text-slate-500 space-y-1 block font-sans">
                <div className="flex justify-between">
                  <span>ค่าน้ำมัน & ทางด่วน:</span>
                  <span className="font-bold text-rose-600">{formatCurrency(expenseFuel + expenseTolls)}</span>
                </div>
                <div className="flex justify-between">
                  <span>อัตราส่วนรายจ่าย / รายรับ:</span>
                  <span className="font-bold text-slate-800">
                    {totalGrossRevenue > 0 ? ((totalOperatingExpenses / totalGrossRevenue) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Box 4: Estimated Net Income */}
            <div className="p-5 rounded-2xl shadow-xs space-y-3 relative overflow-hidden border border-emerald-500/20 bg-emerald-500/5">
              <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full flex items-center justify-center select-none pointer-events-none">
                <TrendingUp className="w-10 h-10 text-emerald-400/20 opacity-90" />
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">กำไรขั้นต้นสรุป (Net Profit)</span>
                <div className={`text-2xl font-black tracking-tight font-sans ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatCurrency(netProfit)}
                </div>
              </div>
              <div className="text-[11px] space-y-1 block font-sans">
                <div className="flex justify-between text-slate-650">
                  <span>เปอร์เซ็นต์อัตรากำไรกาล:</span>
                  <span className={`font-extrabold ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {marginPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>สถานะการดำเนินงาน:</span>
                  <span className="font-bold text-slate-650">{netProfit >= 0 ? 'งบเป็นบวก (Good)' : 'เกิดขาดทุนช่วงคราว'}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Visual Balance Analysis Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Graph Panel: Expense Distribution Category Map */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                  <Tag className="w-4 h-4 text-rose-500" />
                  สัดส่วนกระจายแผนกรายจ่าย (Cost Allocation Segment)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">จำแนกค่าสิทธิ น้ำมันทางด่วน เงินเดือน และกำลังรถซ่อมแซมบำรุงรถขนส่ง</p>
              </div>

              {/* Expense horizontal bar indicators */}
              <div className="space-y-4 pt-2">
                {[
                  { label: "1. ค่าน้ำมันหลักเดินรถ (Diesel Fuel)", amount: expenseFuel, color: "bg-amber-500", rawColor: "#f59e0b" },
                  { label: "2. ค่าตั๋วทางพิเศษ (Expressway Tolls)", amount: expenseTolls, color: "bg-blue-500", rawColor: "#3b82f6" },
                  { label: "3. ค่าซ่อมและบำรุงรักษารถ (Fleet Maintenance)", amount: expenseMaintenance, color: "bg-rose-500", rawColor: "#f43f5e" },
                  { label: "4. เบี้ยเลี้ยงพนักงานสะสม (Driver Incentives/Food)", amount: expenseExtraWages + expenseFood, color: "bg-emerald-500", rawColor: "#10b981" },
                  { label: "5. ปันส่วนจัดจ่ายกองงานรถร่วม (Co-Loader Leases)", amount: expensePartnerOutsourced, color: "bg-indigo-500", rawColor: "#6366f1" },
                  { label: "6. เงินเดือนพนักงานหลัก (Administrative Payroll)", amount: expensePayrollPaid, color: "bg-violet-500", rawColor: "#8b5cf6" },
                  { label: "7. ค่าส่วนอื่นๆ ทั่วไป (Overheads / Other Fees)", amount: expenseOthers, color: "bg-slate-400", rawColor: "#94a3b8" }
                ].map((item, index) => {
                  const pct = totalOperatingExpenses > 0 ? (item.amount / totalOperatingExpenses) * 100 : 0;
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700">{item.label}</span>
                        <div className="space-x-2 font-mono">
                          <span className="text-slate-900 font-extrabold">{formatCurrency(item.amount)}</span>
                          <span className="text-slate-400 font-medium">({pct.toFixed(1)}%)</span>
                        </div>
                      </div>
                      <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${item.color} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Panel: Runs & Performance Diagnostics */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-black text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                    <Award className="w-4 h-4 text-emerald-500" />
                    สัมประสิทธิ์เฉลี่ยประสิทธิภาพคุ้มทุน (Trip Yield Optimization)
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">ตัวเลขอัตราเฉลี่ยสำหรับการรับขนตู้ตู้คอนเทนเนอร์ช่วงเวลาคัดเลือก</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 text-xs">
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                    <span className="text-slate-500 font-bold block">รายรับเฉลี่ยต่องาน (Average Ticket):</span>
                    <span className="text-lg font-black text-slate-900 font-mono">
                      {filteredJobs.length > 0 ? formatCurrency(totalGrossRevenue / filteredJobs.length) : '฿0.00'}
                    </span>
                    <p className="text-[10px] text-slate-400 leading-normal">มูลค่านิติบัญญัติรวมเบ็ดเสร็จก่อนหักภาษี 1% ณ ที่จ่าย</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                    <span className="text-slate-500 font-bold block">ต้นทุนเฉลี่ยต่องาน (Avg. Operational Cost):</span>
                    <span className="text-lg font-black text-slate-900 font-mono text-rose-600">
                      {filteredJobs.length > 0 ? formatCurrency(totalOperatingExpenses / filteredJobs.length) : '฿0.00'}
                    </span>
                    <p className="text-[10px] text-slate-400 leading-normal">รวมปันส่วนเบี้ยคนขับ ค่าน้ำมัน ค่าทางด่วนประกัน และค่าแอดมิน</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                    <span className="text-slate-500 font-bold block">กำไรเฉลี่ยต่องาน (Avg. Margin per Trip):</span>
                    <span className={`text-lg font-black font-mono ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {filteredJobs.length > 0 ? formatCurrency(netProfit / filteredJobs.length) : '฿0.00'}
                    </span>
                    <p className="text-[10px] text-slate-400 leading-normal">มูลค่าสะระรวมเมื่อลบรายรับด้วยกำลังจ่ายรวม</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-2 flex flex-col justify-between">
                    <span className="text-slate-500 font-bold block">ระดับคุ้มทุนน้ำมัน (Fuel Cost Ratio):</span>
                    <span className="text-lg font-black text-amber-600 font-mono">
                      {totalGrossRevenue > 0 ? ((expenseFuel / totalGrossRevenue) * 100).toFixed(1) : 0}%
                    </span>
                    <p className="text-[10px] text-slate-400 leading-normal">สัดส่วนค่าเชื้อเพลิงทางตรงต่องานรับ</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3.5 text-[11px] text-slate-500 flex items-start gap-2.5">
                <Briefcase className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  <span className="font-black text-slate-800">คู่มือแนะนำกำจัดน้ำมัน:</span> หากอัตราส่วนน้ำมัน (Fuel Ratio) มีสัดส่วน 
                  <span className="text-rose-600 font-bold"> เกิน 35%</span> ควรตรวจสอบมาตรฐานพฤติกรรมขับขี่ประหยัดน้ำมันของคนคุ้มรถนั้นๆ 
                  เพื่อหลีกเลี่ยงการสั่นคลอนของผลกำไรงามช่วงเดินเรือ
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SECTION B: DETAILED INCOME GROUPING ANALYSIS ("รายรับจากงานที่วิ่งได้ ได้จากไหน") */}
      {activeTab === 'income' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            
            {/* View selectors */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <h3 className="text-xs font-black text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  รายรับจากเที่ยววิ่งตามกลุ่มข้อมูล (Grouped Revenue Diagnostics)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">เลือกมิติเพื่อตรวจสอบแหล่งที่มาของงานวิ่ง พร้อมสรุปรายละเอียดความมั่งคั่ง</p>
              </div>

              {/* Mapping Selector */}
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 w-max text-xs font-semibold">
                <button 
                  onClick={() => setIncomeGroupBy('customer')}
                  className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${incomeGroupBy === 'customer' ? 'bg-indigo-650 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <Users className="w-3.5 h-3.5" /> แยกตามผู้ว่าจ้าง (Customer)
                </button>
                <button 
                  onClick={() => setIncomeGroupBy('shipper')}
                  className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${incomeGroupBy === 'shipper' ? 'bg-indigo-650 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <Briefcase className="w-3.5 h-3.5" /> แยกตามชิปเปอร์ (Shipper)
                </button>
                <button 
                  onClick={() => setIncomeGroupBy('route')}
                  className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${incomeGroupBy === 'route' ? 'bg-indigo-650 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <MapPin className="w-3.5 h-3.5" /> แยกตามเส้นทาง (Route O➔D)
                </button>
              </div>
            </div>

            {/* Render selected grouped income reports */}
            <div className="space-y-3 pt-2">
              {incomeGroupBy === 'customer' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 font-mono text-slate-600 font-bold">
                          <th className="p-3 pl-4"># ลำดับ</th>
                          <th className="p-3">ชื่อบริษัทผู้ว่าจ้าง / ลูกค้าสัญกรณ์</th>
                          <th className="p-3 text-center">จำนวนงานที่วิ่งได้ (วิ่งจริง)</th>
                          <th className="p-3 text-center">ส่งสัญญาสำเร็จแล้ว</th>
                          <th className="p-3 text-right">ยอดรวมค่าขนส่งเบื้องต้น (Revenue)</th>
                          <th className="p-3 text-right pr-4">เกณฑ์เฉลี่ยค่าขนส่ง / เที่ยว</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {customerIncomeList.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400 font-sans font-bold">
                              ❌ ไม่พบเที่ยวเดินรถในช่วงวันที่กรอง สำหรับระบุกลุ่มผู้ว่าจ้างรายรับ
                            </td>
                          </tr>
                        ) : (
                          customerIncomeList.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="p-3 pl-4 font-mono text-slate-400">{idx + 1}</td>
                              <td className="p-3 font-sans font-bold text-slate-900">{item.name}</td>
                              <td className="p-3 text-center font-mono font-bold text-indigo-650">{item.totalRuns} งาน</td>
                              <td className="p-3 text-center font-mono">
                                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 font-bold">
                                  {item.completedRuns} / {item.totalRuns} เที่ยว
                                </span>
                              </td>
                              <td className="p-3 text-right font-mono font-black text-slate-950">{formatCurrency(item.amount)}</td>
                              <td className="p-3 text-right font-mono text-slate-500 pr-4">
                                {item.totalRuns > 0 ? formatCurrency(item.amount / item.totalRuns) : '฿0.00'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Horizontal Bar Graphic analysis */}
                  <div className="bg-slate-50/50 border border-slate-150 p-5 rounded-2xl space-y-4">
                    <span className="text-[11px] font-black text-slate-800 uppercase block tracking-wider">ผืนวิเคราะห์ภูมิภาครายรับ (Customer Share Indicator)</span>
                    <div className="space-y-3 font-medium">
                      {customerIncomeList.slice(0, 5).map((item, id) => {
                        const proportion = totalGrossRevenue > 0 ? (item.amount / totalGrossRevenue) * 100 : 0;
                        return (
                          <div key={id} className="space-y-1 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-700">{item.name}</span>
                              <span className="font-mono text-indigo-750 font-black">{proportion.toFixed(1)}% ({formatCurrency(item.amount)})</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full" style={{ width: `${proportion}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {incomeGroupBy === 'shipper' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 font-mono text-slate-600 font-bold">
                          <th className="p-3 pl-4"># ลำดับ</th>
                          <th className="p-3">ผู้ส่งสินค้าต้นสาย (Shipper)</th>
                          <th className="p-3 text-center">จำนวนเที่ยวตู้ที่วิ่งได้</th>
                          <th className="p-3 text-center">ส่งตู้สำเร็จ</th>
                          <th className="p-3 text-right">ยอดรวมสะสม (Total Booking Amount)</th>
                          <th className="p-3 text-right pr-4">สัดส่วนต่อค่ารวม</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {shipperIncomeList.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400 font-sans font-bold">
                              ❌ ไม่พบเกณฑ์ขนส่งช่วงวันที่คัดสำหรับวิเคราะห์ผู้ส่งสินค้า (Shippers)
                            </td>
                          </tr>
                        ) : (
                          shipperIncomeList.map((item, idx) => {
                            const ratio = totalGrossRevenue > 0 ? (item.amount / totalGrossRevenue) * 100 : 0;
                            return (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="p-3 pl-4 font-mono text-slate-400">{idx + 1}</td>
                                <td className="p-3 font-sans font-bold text-slate-900">{item.name}</td>
                                <td className="p-3 text-center font-mono font-bold text-indigo-650">{item.totalRuns} ตู้ / งาน</td>
                                <td className="p-3 text-center font-mono">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-semibold">
                                    {item.completedRuns} / {item.totalRuns}
                                  </span>
                                </td>
                                <td className="p-3 text-right font-mono font-black text-slate-950">{formatCurrency(item.amount)}</td>
                                <td className="p-3 text-right font-mono font-bold pr-4 text-indigo-650">{ratio.toFixed(1)}%</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {incomeGroupBy === 'route' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 font-mono text-slate-600 font-bold">
                          <th className="p-3 pl-4"># ลำดับ</th>
                          <th className="p-3">เส้นทางวิ่งงานหลัก (ต้นทาง ➔ ปลายทาง)</th>
                          <th className="p-3 text-center">ความหนาแน่นเที่ยววิ่ง (Runs)</th>
                          <th className="p-3 text-center">สำเร็จตามสัดส่วน</th>
                          <th className="p-3 text-right">รายรับมูลค่าสะสม (Accumulated Revenue)</th>
                          <th className="p-3 text-right pr-4">เกณฑ์เฉลี่ยรายเที่ยว</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {routeIncomeList.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">
                              ❌ ไม่พบคู่สถานีจำเนียรเที่ยวงานวิ่งตามคัดกรองวันที่ระบุ
                            </td>
                          </tr>
                        ) : (
                          routeIncomeList.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="p-3 pl-4 font-mono text-slate-400">{idx + 1}</td>
                              <td className="p-3 font-mono font-bold text-slate-900">{item.route}</td>
                              <td className="p-3 text-center font-mono font-bold text-slate-900">{item.totalRuns} ตู้วิ่ง</td>
                              <td className="p-3 text-center font-mono">
                                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">
                                  {item.completedRuns} สำเร็จ
                                </span>
                              </td>
                              <td className="p-3 text-right font-mono font-black text-slate-950">{formatCurrency(item.amount)}</td>
                              <td className="p-3 text-right font-mono text-slate-500 pr-4">
                                {item.totalRuns > 0 ? formatCurrency(item.amount / item.totalRuns) : '฿0.00'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* SECTION C: DETAILED COST & OPERATING EXPENSES RECORD */}
      {activeTab === 'expense' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Box-Type 1: Daily operational fuel and tolls details */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 md:col-span-2">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  บันทึกเบี้ยจ่ายรายย่อย & ทางวิ่งเสริมประจำวัน (Daily Trip Expense Ledger)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">บันทึกเบอร์บิลน้ำมัน บัตรทางด่วน และค่าจัดซื้อจัดซ่อมที่กรองตามขอบเขตเวลา</p>
              </div>

              <div className="overflow-x-auto border border-slate-150 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono font-bold">
                      <th className="p-3 pl-4">วันที่บิล</th>
                      <th className="p-3">ประเภทจ่าย</th>
                      <th className="p-3">ทะเบียนรถ / รถวิ่ง</th>
                      <th className="p-3">พนักงานคนคุ้ม</th>
                      <th className="p-3">รายละเอียดการชำระ</th>
                      <th className="p-3 text-right pr-4">ยอดเงินจ่าย</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-705">
                    {filteredExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400 font-bold">
                          ❌ ไม่พบบันทึกการเบิกค่าน้ำมันหรือทางด่วนในช่วงนี้
                        </td>
                      </tr>
                    ) : (
                      filteredExpenses.map((e, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3 pl-4 font-mono text-[11px] whitespace-nowrap">{e.date}</td>
                          <td className="p-3 font-sans">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              e.type === 'น้ำมัน' ? 'bg-amber-100 text-amber-800' :
                              e.type === 'ค่าทางด่วน' ? 'bg-blue-100 text-blue-805' :
                              e.type === 'ค่าซ่อม' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'
                            }`}>
                              {e.type}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-[11px] text-slate-900">{e.vehicleLicense}</td>
                          <td className="p-3 font-sans">{e.driverName || '-'}</td>
                          <td className="p-3 text-[11px] text-slate-500 max-w-[150px] truncate" title={e.description}>
                            {e.description || e.note || '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-extrabold text-slate-950 pr-4">{formatCurrency(e.amount)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Box-Type 2: Co-Worker & Partner fleet outsourcing and leasing layout */}
            <div className="space-y-6">
              
              {/* Outsourced partners brief */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">รถร่วมพ่วงเที่ยววิ่งปันส่วน</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">สรุปงวดทำจ่ายตามใบเคลียร์บิล Co-Loader พาร์ทเนอร์</p>
                </div>

                <div className="space-y-3 font-mono text-[11px]">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">จำนวนใบเคลียร์ช่วงกรอง:</span>
                    <span className="font-bold text-slate-900">{filteredPartnerPayments.length} รายการ</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">รวมรายรับสะสมรถนอก:</span>
                    <span className="font-semibold text-emerald-600">{formatCurrency(filteredPartnerPayments.reduce((s, p) => s + p.revenue, 0))}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">หักเบิกสำรองทางเรียบ:</span>
                    <span className="font-semibold text-rose-550">{formatCurrency(filteredPartnerPayments.reduce((s, p) => s + p.expensesDeduction, 0))}</span>
                  </div>
                  <div className="flex justify-between text-xs pt-1">
                    <span className="font-bold text-slate-800">ยอดสุทธิที่ทำจ่ายรถร่วม (Net Paid):</span>
                    <span className="font-black text-indigo-750">{formatCurrency(expensePartnerOutsourced)}</span>
                  </div>
                </div>
              </div>

              {/* Administrative main staff salaries */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">เงินเดือนและเบี้ยคนขับ (Administrative Salaries)</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">ยอดเบิกจ่ายพนักงานพาร์ทไทม์ และคนขับประจำสถานีขนส่ง</p>
                </div>

                <div className="space-y-3 font-mono text-[11px]">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">ฐานเงินเดือนหลัก:</span>
                    <span className="font-bold text-slate-800">
                      {formatCurrency(filteredPayroll.reduce((s, p) => s + p.salary, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">ค่าโอทีสะสม (OT):</span>
                    <span className="font-semibold text-emerald-600">
                      {formatCurrency(filteredPayroll.reduce((s, p) => s + p.ot, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">โบนัสขยันพิเศษ:</span>
                    <span className="font-bold text-indigo-600">
                      {formatCurrency(filteredPayroll.reduce((s, p) => s + p.bonus, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">หักเบิกล่วงหน้าน้ำมัน:</span>
                    <span className="font-bold text-rose-500">
                      -{formatCurrency(filteredPayroll.reduce((s, p) => s + p.deduction, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs pt-1">
                    <span className="font-black text-slate-900">เงินเดือนโอนจำหน่ายงวดสะสม:</span>
                    <span className="font-black text-indigo-750">{formatCurrency(expensePayrollPaid)}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* SECTION D: LITERAL TRANSACTION LOGGING LIST (for verification Audit) */}
      {activeTab === 'all-transactions' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-500" />
                ตารางบันทึกเที่ยวแผนงาน และรายรับเปรียบเทียบในงวด (Diagnostic Registry Ledger)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">รวมเที่ยววิ่งทั้งหมดที่ดำเนินพิสูจน์สิทธิ์ตามช่วงกรองเวลาสากล</p>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono font-bold">
                    <th className="p-3 pl-4">รหัสงาน</th>
                    <th className="p-3">วันที่สัญกรณ์</th>
                    <th className="p-3">ชื่อบริษัทผู้จัดหา</th>
                    <th className="p-3">ชิปเปอร์ / Shippers</th>
                    <th className="p-3">สถานี (ต้นทาง ➔ ปลายทาง)</th>
                    <th className="p-3">ตู้คอนเทนเนอร์</th>
                    <th className="p-3 text-center">สถานะขนส่ง</th>
                    <th className="p-3 text-right pr-4">ยอดเงินเดินรถรวม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredJobs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                        ❌ ไม่พบโครงสร้างงานวิ่งในช่วงเวลากรอก
                      </td>
                    </tr>
                  ) : (
                    filteredJobs.map((j, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/40 text-[11px]">
                        <td className="p-3 pl-4 font-mono font-bold text-slate-900">{j.jobNo}</td>
                        <td className="p-3 font-mono whitespace-nowrap">{j.date}</td>
                        <td className="p-3 font-sans font-bold text-slate-800">{j.customerName}</td>
                        <td className="p-3 font-sans text-slate-500">{j.shipper || '-'}</td>
                        <td className="p-3 font-mono">{j.origin} ➔ {j.destination}</td>
                        <td className="p-3 font-mono">{j.containers?.length || 1} ตู้</td>
                        <td className="p-3 text-center text-[10px]">
                          <span className={`px-2 py-0.5 rounded font-bold border ${getStatusStyle(j.status)}`}>
                            {j.status}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-black text-slate-950 pr-4">{formatCurrency(j.totalAmount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. PRINT REPORT CONTAINER BLOCK: ALWAYS VISIBLE DURING WINDOWS PRINT() & HIDDEN DURING WEB PREVIEWS */}
      <div className="hidden print:block bg-white text-slate-950 p-6 max-w-4xl mx-auto font-sans text-xs relative leading-relaxed overflow-x-auto print-friendly-reports">
        <style>
          {`
            @media print {
              @page {
                size: A4 portrait;
                margin: 1.2cm;
              }
              body * {
                visibility: hidden;
              }
              .print-friendly-reports, .print-friendly-reports * {
                visibility: visible;
              }
              .print-friendly-reports {
                position: absolute;
                left: 0;
                top: 0;
                width: 100% !important;
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
                background: white !important;
                color: black !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}
        </style>

        {/* Corporate header letterhead */}
        <div className="flex flex-row justify-between items-center gap-6 border-b border-slate-300 pb-5">
          <div className="flex gap-4 items-center">
            {/* Clear Brand Logo */}
            <div className="w-16 h-16 flex items-center justify-center shrink-0">
              <img 
                src="https://lh3.googleusercontent.com/d/14sHmuOzVEZbKgOZP5p7COS1rfXJvi5w_" 
                alt="บริษัท เข็มทิศ ทรานสปอร์ต จำกัด" 
                className="w-full h-full object-contain filter drop-shadow-sm"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-[14px] font-extrabold tracking-tight text-slate-900 block">บริษัท เข็มทิศ ทรานสปอร์ต จำกัด</h1>
              <p className="text-slate-600 block text-[10px] font-medium font-sans">102/51 ม.10 ต.ทุ่งสุขลา อ.ศรีราชา จ.ชลบุรี 20230</p>
              <div className="text-[10px] text-slate-600 space-y-0.5 block font-mono">
                <div>เลขประจำตัวผู้เสียภาษี : <span className="font-bold text-slate-800">0205568017041</span></div>
              </div>
            </div>
          </div>
          <div className="text-right space-y-1 shrink-0">
            <h2 className="text-lg font-black tracking-[0.05em] text-slate-900 font-serif leading-none uppercase">Financial Report</h2>
            <p className="text-[10px] text-slate-800 font-bold">รายงานสรุปรายได้และค่าใช้จ่ายสะสมประจำงวด</p>
            <div className="text-[10px] text-slate-500 font-mono">
              ข้อมูลช่วง: {startDate || 'เริ่มต้น'} ➔ {endDate || 'ปัจจุบัน'}
            </div>
          </div>
        </div>

        {/* Financial metrics list (table structure with border lines for clean output) */}
        <div className="py-4 space-y-4">
          <h3 className="font-sans font-bold text-sm text-slate-900 pb-1 border-b border-slate-200">1. สรุปดุลสะสมทางการเงินส่วนปฏิบัติการ</h3>
          
          <div className="grid grid-cols-2 gap-4 text-[11px] font-mono leading-relaxed">
            <div className="space-y-1 p-3 bg-slate-50 border border-slate-200 rounded">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">ยอดรายรับสะสมรวม (Gross Booking):</span>
                <span className="font-black text-slate-950">{formatCurrency(totalGrossRevenue)}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[10px]">
                <span>จำนวนเที่ยววิ่งงานที่ทำรายการรวม:</span>
                <span>{filteredJobs.length} ตู้</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[10px]">
                <span>เฉลี่ยต่องาน:</span>
                <span>{filteredJobs.length > 0 ? formatCurrency(totalGrossRevenue / filteredJobs.length) : '฿0.00'}</span>
              </div>
            </div>

            <div className="space-y-1 p-3 bg-slate-50 border border-slate-200 rounded">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">ยอดรายจ่ายสะสมรวม (Operational Costs):</span>
                <span className="font-black text-slate-950">{formatCurrency(totalOperatingExpenses)}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[10px]">
                <span>สัดส่วนต้นทุนจากเป้ารายรับ:</span>
                <span>{totalGrossRevenue > 0 ? ((totalOperatingExpenses / totalGrossRevenue) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[10px]">
                <span>เฉลี่ยรายเที่ยว:</span>
                <span>{filteredJobs.length > 0 ? formatCurrency(totalOperatingExpenses / filteredJobs.length) : '฿0.00'}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center p-3.5 bg-indigo-50/50 border border-indigo-200 rounded mt-2">
            <span className="font-bold text-indigo-900">กำไรประกอบการสุทธิประจำช่วงงวดคัดเลือก (Estimated Net Profit):</span>
            <span className={`text-sm font-black font-mono ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {formatCurrency(netProfit)} ({marginPercentage.toFixed(1)}%)
            </span>
          </div>

          {/* Section 2: Detailed income components */}
          <h3 className="font-sans font-bold text-sm text-slate-900 pt-3 pb-1 border-b border-slate-200">2. รายรับจำนวนงานวิ่ง คัดแยกกลุ่มผู้ว่าจ้าง (Top Clients)</h3>
          <table className="w-full text-left text-[11px] border-collapse mt-1">
            <thead>
              <tr className="border-b border-slate-400 text-slate-500 font-bold">
                <th className="py-2">รายชื่อผู้ว่าจ้าง / ชิปเปอร์</th>
                <th className="py-2 text-center">จำนวนเที่ยววิ่งได้ (ตู้)</th>
                <th className="py-2 text-right">รายรับมูลค่างานรวม</th>
                <th className="py-2 text-right">เกณฑ์สัดส่วนสถิติ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {customerIncomeList.slice(0, 10).map((item, idx) => {
                const ratio = totalGrossRevenue > 0 ? (item.amount / totalGrossRevenue) * 100 : 0;
                return (
                  <tr key={idx} className="py-1">
                    <td className="py-1.5 font-sans font-bold">{item.name}</td>
                    <td className="py-1.5 text-center font-mono">{item.totalRuns} ตู้</td>
                    <td className="py-1.5 text-right font-mono font-bold">{formatCurrency(item.amount)}</td>
                    <td className="py-1.5 text-right font-mono text-slate-500">{ratio.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Section 3: Expense components table inside the print report */}
          <h3 className="font-sans font-bold text-sm text-slate-900 pt-4 pb-1 border-b border-slate-200">3. รายการสรุปและกระจายสัดส่วนสัดส่วนรายจ่ายเดินรถ (Expenses Split)</h3>
          <table className="w-full text-left text-[11px] border-collapse mt-1">
            <thead>
              <tr className="border-b border-slate-400 text-slate-500 font-bold">
                <th className="py-2">หมวดค่าใช้จ่ายประเมินทรัพย์สิน</th>
                <th className="py-2 text-right">ยอดจัดจ่ายสะสมรวม</th>
                <th className="py-2 text-right">อัตราส่วนจากต้นทุนรวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {[
                { label: "1. ค่าน้ำมันหลักเดินรถ (Diesel Fuel Costs)", amount: expenseFuel },
                { label: "2. ค่าตั๋วทางพิเศษ (Expressway Toll Fees)", amount: expenseTolls },
                { label: "3. ค่าซ่อมบำรุงและจัดดูแลส่วนยานพาหนะ (Maintenance)", amount: expenseMaintenance },
                { label: "4. เบี้ยเลี้ยงพนักงานวิ่งสะสม (Drivers Allowance / Food)", amount: expenseExtraWages + expenseFood },
                { label: "5. ปันส่วนจัดจ่ายรถร่วมพ่วงเที่ยววิ่ง (Partners Outsource)", amount: expensePartnerOutsourced },
                { label: "6. เงินเดือนพนักงานหลักและแอดมินประจำการ (Payroll)", amount: expensePayrollPaid },
                { label: "7. ค่าส่วนอื่นๆ ทั่วไป (Miscellaneous Operations)", amount: expenseOthers }
              ].map((item, idx) => {
                const ratio = totalOperatingExpenses > 0 ? (item.amount / totalOperatingExpenses) * 105 / 1.05 : 0;
                if (item.amount === 0) return null;
                return (
                  <tr key={idx} className="py-1">
                    <td className="py-1.5 font-sans font-medium text-slate-800">{item.label}</td>
                    <td className="py-1.5 text-right font-black text-slate-900">{formatCurrency(item.amount)}</td>
                    <td className="py-1.5 text-right text-slate-500">{ratio.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Corporate seal validation signatures area */}
        <div className="grid grid-cols-2 gap-12 pt-16 text-center text-[11px] mt-12">
          <div className="space-y-10">
            <div className="h-6"></div>
            <div className="space-y-1.5">
              <p className="font-bold flex justify-center gap-2">
                <span>....................................................................</span>
              </p>
              <p className="font-bold text-slate-800">ผู้ตรวจสอบฐานระดับบัญชี (Audited By)</p>
              <p className="text-slate-500 flex justify-center gap-1">
                <span>วันที่</span>
                <span>.............................../................../..................</span>
              </p>
            </div>
          </div>
          <div className="space-y-10">
            <div className="h-6"></div>
            <div className="space-y-1.5">
              <p className="font-bold text-slate-800 font-medium">บริษัท เข็มทิศ ทรานสปอร์ต จำกัด</p>
              <p className="font-bold flex justify-center gap-2">
                <span>....................................................................</span>
              </p>
              <p className="font-bold text-slate-800">ผู้รับมอบอำนาจอนุมัติ (Authorized Signatory)</p>
              <p className="text-slate-500 flex justify-center gap-1">
                <span>วันที่</span>
                <span>.............................../................../..................</span>
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
