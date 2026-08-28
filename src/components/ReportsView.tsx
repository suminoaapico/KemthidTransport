import React, { useState } from 'react';
import { 
  Truck, Calendar, Printer, FileText, Search, Filter, 
  ChevronRight, DollarSign, TrendingUp, TrendingDown, 
  MapPin, CheckCircle2, AlertCircle, Clock, User, Briefcase,
  Layers, BarChart2, ShieldCheck, Download
} from 'lucide-react';
import { 
  Customer, Driver, Vehicle, TransportJob, 
  DailyExpense, Invoice, Receipt, PartnerPayment, 
  ManagerEntry, SubcontractorPaymentDoc
} from '../types';
import { formatCurrency, getStatusStyle, formatDate } from '../utils';

interface ReportsViewProps {
  jobs: TransportJob[];
  vehicles: Vehicle[];
  drivers: Driver[];
  customers: Customer[];
  expenses?: DailyExpense[];
  managerEntries?: ManagerEntry[];
  partnerPaymentDocs?: SubcontractorPaymentDoc[];
}

export function ReportsView({
  jobs,
  vehicles,
  drivers,
  customers,
  expenses = [],
  managerEntries = [],
  partnerPaymentDocs = []
}: ReportsViewProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'vehicle-trips' | 'manager-financial'>('vehicle-trips');

  // Filters for Vehicle Trips Report
  const [selectedVehicle, setSelectedVehicle] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Date Range Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // Start of month
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const setQuickRange = (range: 'today' | 'this-month' | 'last-month' | 'all') => {
    const today = new Date();
    if (range === 'today') {
      const todayStr = today.toISOString().split('T')[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (range === 'this-month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (range === 'last-month') {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    } else if (range === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  const isWithinRange = (dateStr: string) => {
    if (!dateStr) return false;
    const clean = dateStr.split('T')[0];
    if (startDate && clean < startDate) return false;
    if (endDate && clean > endDate) return false;
    return true;
  };

  // 1. Flatten all job trips pulled from Job Plan (TransportJob)
  interface TripRow {
    id: string;
    jobNo: string;
    date: string;
    vehicleLicense: string;
    vehicleType: string;
    driverName: string;
    customerName: string;
    shipper: string;
    bookingNo: string;
    containerNo: string;
    containerSize: string;
    origin: string;
    destination: string;
    pickupLocation?: string;
    returnLocation?: string;
    revenue: number;
    expenseIncurred: number;
    status: string;
    remark?: string;
  }

  const allTripRows: TripRow[] = [];

  jobs.forEach(job => {
    const matchedVehicle = vehicles.find(v => v.licensePlate === job.vehicleLicense);
    const matchedDriver = drivers.find(d => d.vehicleLicense === job.vehicleLicense || d.name === job.driverName);

    // Calculate job-specific expenses
    const jobExpenses = expenses
      .filter(e => e.jobNo === job.jobNo || (e.vehicleLicense === job.vehicleLicense && e.date === job.date))
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    if (job.containers && job.containers.length > 0) {
      job.containers.forEach((c, idx) => {
        let containerExp = 0;
        if (c.expenses) {
          containerExp = c.expenses.reduce((s, exp) => s + (exp.amount || 0), 0);
        }
        allTripRows.push({
          id: `${job.jobNo}-${idx}`,
          jobNo: job.jobNo,
          date: job.date,
          vehicleLicense: job.vehicleLicense || 'ไม่ระบุ',
          vehicleType: matchedVehicle?.type || 'หัวลาก',
          driverName: job.driverName || matchedDriver?.name || '-',
          customerName: job.customerName || '-',
          shipper: job.shipper || '-',
          bookingNo: job.bookingNo || '-',
          containerNo: c.containerNo || '-',
          containerSize: c.size || "40'",
          origin: job.origin || '-',
          destination: job.destination || '-',
          pickupLocation: job.pickupLocation,
          returnLocation: job.returnLocation,
          revenue: (c.transportation || 0) + (c.liftOnOff || 0) + (c.portCharge || 0) + (c.containerHandling || 0) + (c.otherExpenseAmount || 0),
          expenseIncurred: containerExp + (idx === 0 ? jobExpenses : 0),
          status: job.status,
          remark: job.notes
        });
      });
    } else {
      allTripRows.push({
        id: job.jobNo,
        jobNo: job.jobNo,
        date: job.date,
        vehicleLicense: job.vehicleLicense || 'ไม่ระบุ',
        vehicleType: matchedVehicle?.type || 'หัวลาก',
        driverName: job.driverName || matchedDriver?.name || '-',
        customerName: job.customerName || '-',
        shipper: job.shipper || '-',
        bookingNo: job.bookingNo || '-',
        containerNo: '-',
        containerSize: job.jobType || "40'",
        origin: job.origin || '-',
        destination: job.destination || '-',
        pickupLocation: job.pickupLocation,
        returnLocation: job.returnLocation,
        revenue: job.totalAmount || 0,
        expenseIncurred: jobExpenses,
        status: job.status,
        remark: job.notes
      });
    }
  });

  // Filtered Trip Rows based on vehicle & date & search
  const filteredTrips = allTripRows.filter(t => {
    const matchDate = isWithinRange(t.date);
    const matchVehicle = selectedVehicle === 'ALL' || t.vehicleLicense === selectedVehicle;
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchSearch = 
      t.jobNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.vehicleLicense.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.shipper.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.bookingNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.containerNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.destination.toLowerCase().includes(searchTerm.toLowerCase());

    return matchDate && matchVehicle && matchStatus && matchSearch;
  });

  // Metrics for selected vehicle / filtered trips
  const totalTripsCount = filteredTrips.length;
  const totalTripRevenue = filteredTrips.reduce((sum, t) => sum + (t.revenue || 0), 0);
  const totalTripExpenses = filteredTrips.reduce((sum, t) => sum + (t.expenseIncurred || 0), 0);
  const netTripProfit = totalTripRevenue - totalTripExpenses;

  // Group trips by vehicle for multi-vehicle breakdown
  const vehicleStatsMap: Record<string, {
    license: string;
    driver: string;
    type: string;
    tripsCount: number;
    revenue: number;
    expenses: number;
  }> = {};

  filteredTrips.forEach(t => {
    const vKey = t.vehicleLicense;
    if (!vehicleStatsMap[vKey]) {
      vehicleStatsMap[vKey] = {
        license: vKey,
        driver: t.driverName,
        type: t.vehicleType,
        tripsCount: 0,
        revenue: 0,
        expenses: 0
      };
    }
    vehicleStatsMap[vKey].tripsCount += 1;
    vehicleStatsMap[vKey].revenue += t.revenue;
    vehicleStatsMap[vKey].expenses += t.expenseIncurred;
  });

  // Manager Financial Aggregations
  const filteredManagerEntries = managerEntries.filter(e => isWithinRange(e.date));
  const managerIncome = filteredManagerEntries.filter(e => e.type === 'INCOME').reduce((s, e) => s + e.amount, 0);
  const managerExpense = filteredManagerEntries.filter(e => e.type === 'EXPENSE').reduce((s, e) => s + e.amount, 0);

  const totalCombinedRevenue = totalTripRevenue + managerIncome;
  const totalCombinedExpenses = totalTripExpenses + managerExpense;
  const overallNetProfit = totalCombinedRevenue - totalCombinedExpenses;

  return (
    <div className="space-y-5 font-sans">
      {/* Header & Tabs */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
              <BarChart2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              {activeTab === 'vehicle-trips' 
                ? 'รายงานรายละเอียดการวิ่งงานของรถแต่ละคัน (Vehicle Trip Detailed Report)' 
                : 'รายงานสรุปผลประกอบการและบัญชีรายรับ-รายจ่าย (Manager Financial Report)'}
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            ดึงข้อมูลละเอียดจากแผนการวิ่งงาน (Job Plan) เพื่อแยกดูตามรถแต่ละคัน และประมวลผลร่วมกับรายรับ-รายจ่ายของ Manager
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('vehicle-trips')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'vehicle-trips'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5 inline mr-1" />
              วิ่งงานแยกตามคัน
            </button>
            <button
              onClick={() => setActiveTab('manager-financial')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'manager-financial'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 inline mr-1" />
              สรุปรายรับ-รายจ่ายรวม
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> พิมพ์รายงาน
          </button>
        </div>
      </div>

      {/* Date Range Controls & Vehicle Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick Date Pills */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-500 mr-1">ช่วงเวลา:</span>
            <button
              onClick={() => setQuickRange('today')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors"
            >
              วันนี้
            </button>
            <button
              onClick={() => setQuickRange('this-month')}
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-200 transition-colors"
            >
              เดือนนี้
            </button>
            <button
              onClick={() => setQuickRange('last-month')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors"
            >
              เดือนที่แล้ว
            </button>
            <button
              onClick={() => setQuickRange('all')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors"
            >
              ทั้งหมด
            </button>
          </div>

          {/* Date Picker Range Inputs */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-bold">ตั้งแต่วันที่:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-slate-300 rounded-lg p-1.5 text-xs bg-slate-50 text-slate-800 outline-none font-sans"
            />
            <span className="text-slate-500 font-bold">ถึง:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-slate-300 rounded-lg p-1.5 text-xs bg-slate-50 text-slate-800 outline-none font-sans"
            />
          </div>
        </div>

        {/* Vehicle Selector & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 block">เลือกรถที่ต้องการดูรายงาน</label>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full text-xs font-bold bg-slate-50 text-slate-900 border border-slate-300 rounded-lg p-2 outline-none focus:border-indigo-500"
            >
              <option value="ALL">-- ดูรถทุกคัน (All Vehicles) --</option>
              {vehicles.map(v => (
                <option key={v.licensePlate} value={v.licensePlate}>
                  {v.licensePlate} ({v.type || 'หัวลาก'} - {v.ownerType || 'บริษัท'})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 block">สถานะเที่ยววิ่ง</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs font-bold bg-slate-50 text-slate-900 border border-slate-300 rounded-lg p-2 outline-none focus:border-indigo-500"
            >
              <option value="ALL">ทุกสถานะ (All Status)</option>
              <option value="รอดำเนินการ">รอดำเนินการ (Pending)</option>
              <option value="กำลังขนส่ง">กำลังขนส่ง (In Transit)</option>
              <option value="ส่งแล้ว">ส่งแล้ว (Delivered)</option>
              <option value="วางบิลแล้ว">วางบิลแล้ว (Invoiced)</option>
              <option value="รับเงินแล้ว">รับเงินแล้ว (Paid)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 block">ค้นหาข้อมูลในเที่ยววิ่ง</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="เลขงาน, คนขับ, บุ๊คกิ้ง, ตู้..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 focus:bg-white font-sans"
              />
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'vehicle-trips' ? (
        <>
          {/* Summary Metric Cards for Vehicle Report */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">จำนวนเที่ยววิ่งทั้งหมด</p>
                <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                  {totalTripsCount} <span className="text-xs font-normal text-slate-500">เที่ยว</span>
                </p>
              </div>
              <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
                <Truck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">รายได้ค่าเที่ยวรวม (Revenue)</p>
                <p className="text-2xl font-black text-emerald-600 font-mono mt-0.5">
                  {formatCurrency(totalTripRevenue)}
                </p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">ค่าใช้จ่ายระหว่างทาง (Expenses)</p>
                <p className="text-2xl font-black text-rose-600 font-mono mt-0.5">
                  {formatCurrency(totalTripExpenses)}
                </p>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">กำไรส่วนต่างค่าเที่ยว (Margin)</p>
                <p className="text-2xl font-black text-indigo-600 font-mono mt-0.5">
                  {formatCurrency(netTripProfit)}
                </p>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Detailed Run Logs Table per Vehicle */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  รายละเอียดการวิ่งงานของรถแต่ละเที่ยว (Trip Run Logs)
                  {selectedVehicle !== 'ALL' && <span className="text-indigo-600 ml-1.5 font-mono">[{selectedVehicle}]</span>}
                </h3>
                <p className="text-xs text-slate-500">ดึงข้อมูลจริงจากแผนการวิ่งงาน พร้อมรายการตู้คอนเทนเนอร์และเส้นทาง</p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1 rounded-lg border border-slate-200 font-mono">
                แสดง {filteredTrips.length} เที่ยววิ่ง
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse font-sans">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold text-[11px]">
                    <th className="p-3 text-center w-12">ลำดับ</th>
                    <th className="p-3 text-center">วันที่วิ่ง</th>
                    <th className="p-3">หมายเลขงาน</th>
                    <th className="p-3 text-center">ทะเบียนรถ</th>
                    <th className="p-3">พนักงานขับรถ</th>
                    <th className="p-3">ลูกค้า / ผู้ว่าจ้าง</th>
                    <th className="p-3">Shipper / Booking</th>
                    <th className="p-3">หมายเลขตู้ / ขนาด</th>
                    <th className="p-3">เส้นทาง (ต้นทาง ➔ ปลายทาง)</th>
                    <th className="p-3 text-right">ค่าบริการ (บาท)</th>
                    <th className="p-3 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTrips.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-400">
                        ไม่พบข้อมูลเที่ยววิ่งของรถตามเงื่อนไขที่เลือก
                      </td>
                    </tr>
                  ) : (
                    filteredTrips.map((trip, idx) => (
                      <tr key={trip.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3 text-center font-mono text-slate-700 font-semibold whitespace-nowrap">{formatDate(trip.date)}</td>
                        <td className="p-3 font-mono font-bold text-indigo-700 whitespace-nowrap">{trip.jobNo}</td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <span className="bg-slate-100 text-slate-900 font-bold font-mono px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                            {trip.vehicleLicense}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-800 whitespace-nowrap">{trip.driverName}</td>
                        <td className="p-3 font-semibold text-slate-900">{trip.customerName}</td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-800">{trip.shipper}</div>
                          <div className="text-[10px] font-mono text-slate-500">BK: {trip.bookingNo}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-mono font-bold text-slate-900">{trip.containerNo}</div>
                          <div className="text-[10px] text-slate-500">{trip.containerSize}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-slate-800 flex items-center gap-1">
                            <span>{trip.origin}</span>
                            <span className="text-slate-400">➔</span>
                            <span className="text-slate-900 font-bold">{trip.destination}</span>
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono font-extrabold text-slate-950 whitespace-nowrap text-sm">
                          {formatCurrency(trip.revenue)}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyle(trip.status)}`}>
                            {trip.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vehicle Fleet Breakdown Summary Grid */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-600" />
              สรุปภาพรวมรายได้และเที่ยววิ่งจำแนกตามรถแต่ละคัน (Fleet Performance Breakdown)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Object.values(vehicleStatsMap).map(v => (
                <div key={v.license} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-slate-900 text-sm bg-white px-2 py-0.5 rounded border border-slate-200">
                      {v.license}
                    </span>
                    <span className="text-xs font-bold text-indigo-700 font-mono">
                      {v.tripsCount} เที่ยว
                    </span>
                  </div>
                  <div className="text-xs text-slate-600">
                    คนขับ: <span className="font-semibold text-slate-800">{v.driver}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                    <span className="text-slate-500">รายได้ค่าเที่ยว:</span>
                    <span className="font-mono font-black text-emerald-600 text-sm">
                      {formatCurrency(v.revenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Manager Financial Summary Ledger */
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">รายรับรวมทั้งหมด (Logistics + Manager)</p>
              <p className="text-2xl font-black text-emerald-600 font-mono mt-0.5">
                +{formatCurrency(totalCombinedRevenue)}
              </p>
              <div className="text-[11px] text-slate-500 mt-2 space-y-0.5">
                <div>• ค่าเที่ยววิ่งงาน: {formatCurrency(totalTripRevenue)}</div>
                <div>• รายรับพิเศษ Manager: {formatCurrency(managerIncome)}</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">รายจ่ายรวมทั้งหมด (Expenses)</p>
              <p className="text-2xl font-black text-rose-600 font-mono mt-0.5">
                -{formatCurrency(totalCombinedExpenses)}
              </p>
              <div className="text-[11px] text-slate-500 mt-2 space-y-0.5">
                <div>• ค่าใช้จ่ายวิ่งงาน: {formatCurrency(totalTripExpenses)}</div>
                <div>• รายจ่ายบริหาร Manager: {formatCurrency(managerExpense)}</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">ผลประกอบการกำไรสุทธิ (Net P&L)</p>
              <p className={`text-2xl font-black font-mono mt-0.5 ${overallNetProfit >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                {formatCurrency(overallNetProfit)}
              </p>
              <div className="text-[11px] text-slate-500 mt-2">
                อัตรากำไรขั้นต้น: {totalCombinedRevenue > 0 ? `${Math.round((overallNetProfit / totalCombinedRevenue) * 100)}%` : '0%'}
              </div>
            </div>
          </div>

          {/* Manager Specific Extra Incomes and Expenses Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              รายการบันทึกเพิ่มเติมของ Manager (Manager Incomes & Operating Expenses)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse font-sans">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold text-[11px]">
                    <th className="p-3 text-center w-12">ลำดับ</th>
                    <th className="p-3 text-center">วันที่</th>
                    <th className="p-3 text-center">ประเภท</th>
                    <th className="p-3">หมวดหมู่</th>
                    <th className="p-3">หัวข้อรายการ</th>
                    <th className="p-3 text-center">เอกสารอ้างอิง</th>
                    <th className="p-3 text-right">จำนวนเงิน (บาท)</th>
                    <th className="p-3 text-center">ผู้บันทึก</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredManagerEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        ไม่มีข้อมูลรายการที่ Manager บันทึกเพิ่มเติมในช่วงเวลานี้
                      </td>
                    </tr>
                  ) : (
                    filteredManagerEntries.map((e, idx) => (
                      <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3 text-center font-mono text-slate-600">{e.date}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            e.type === 'INCOME' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {e.type === 'INCOME' ? '+ รายรับ' : '- รายจ่าย'}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-800">{e.category}</td>
                        <td className="p-3 font-bold text-slate-900">{e.title}</td>
                        <td className="p-3 text-center font-mono text-slate-500">{e.referenceNo || '-'}</td>
                        <td className={`p-3 text-right font-mono font-black text-sm ${
                          e.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {e.type === 'INCOME' ? '+' : '-'}{formatCurrency(e.amount)}
                        </td>
                        <td className="p-3 text-center text-slate-600">{e.recordedBy || 'Manager'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
