import React, { useMemo, useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  Filter,
  RotateCcw,
  Percent,
  UserCheck,
  Wallet,
  Receipt,
  CheckCircle2,
  PieChart,
} from 'lucide-react';
import { DailyExpense, Driver } from '../types';
import {
  ALL_EXPENSE_TYPES,
  formatCurrency,
  formatDate,
  normalizeExpenseRecord,
} from '../utils';
import { EmptyState, StatCard, useToast } from './ui/DesignSystem';

interface TaxReportViewProps {
  expenses: DailyExpense[];
  drivers: Driver[];
  initialMode?: 'tax' | 'summary';
}

export function TaxReportView({
  expenses,
  drivers,
  initialMode = 'tax',
}: TaxReportViewProps) {
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState<'tax' | 'summary'>(initialMode);

  // Sync mode when switching Sidebar tab between "ภาษีหัก ณ ที่จ่าย" and "สรุปค่าใช้จ่าย"
  React.useEffect(() => {
    setViewMode(initialMode);
  }, [initialMode]);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'driver' | 'general'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [driverFilter, setDriverFilter] = useState<string>('all');
  const [billTypeFilter, setBillTypeFilter] = useState<'all' | 'Normal' | 'Adv'>('all');

  const normalized = useMemo(
    () => expenses.map((e) => normalizeExpenseRecord(e)),
    [expenses]
  );

  const uniqueDrivers = useMemo(() => {
    const set = new Set<string>();
    drivers.forEach((d) => {
      if (d.name) set.add(d.name);
    });
    normalized.forEach((e) => {
      if (e.driverName && e.driverName !== '-') set.add(e.driverName);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [drivers, normalized]);

  const filtered = useMemo(() => {
    return normalized.filter((e) => {
      if (startDate && e.date < startDate) return false;
      if (endDate && e.date > endDate) return false;
      if (categoryFilter !== 'all' && e.expenseCategory !== categoryFilter) return false;
      if (typeFilter !== 'all' && e.type !== typeFilter) return false;
      if (driverFilter !== 'all' && e.driverName !== driverFilter) return false;
      if (billTypeFilter !== 'all' && e.billType !== billTypeFilter) return false;
      return true;
    });
  }, [normalized, startDate, endDate, categoryFilter, typeFilter, driverFilter, billTypeFilter]);

  const metrics = useMemo(() => {
    const driverItems = filtered.filter((e) => e.expenseCategory === 'driver');
    const nonTaxItems = filtered.filter((e) => e.expenseCategory !== 'driver');
    const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);
    const driverAmount = driverItems.reduce((s, e) => s + e.amount, 0);
    const totalWht = filtered.reduce((s, e) => s + e.withholdingTaxAmount, 0);
    const totalNet = filtered.reduce((s, e) => s + e.netAmount, 0);
    const nonTaxAmount = nonTaxItems.reduce((s, e) => s + e.amount, 0);
    return {
      totalCount: filtered.length,
      driverCount: driverItems.length,
      nonTaxCount: nonTaxItems.length,
      totalAmount,
      driverAmount,
      totalWht,
      totalNet,
      nonTaxAmount,
    };
  }, [filtered]);

  // Grouped breakdown by expense type for Summary mode
  const summaryByType = useMemo(() => {
    const map = new Map<
      string,
      {
        type: string;
        category: 'driver' | 'general';
        count: number;
        amount: number;
        wht: number;
        net: number;
      }
    >();
    filtered.forEach((e) => {
      const existing = map.get(e.type);
      if (existing) {
        existing.count += 1;
        existing.amount += e.amount;
        existing.wht += e.withholdingTaxAmount;
        existing.net += e.netAmount;
      } else {
        map.set(e.type, {
          type: e.type,
          category: e.expenseCategory,
          count: 1,
          amount: e.amount,
          wht: e.withholdingTaxAmount,
          net: e.netAmount,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [filtered]);

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setCategoryFilter('all');
    setTypeFilter('all');
    setDriverFilter('all');
    setBillTypeFilter('all');
  };

  // Export CSV (UTF-8 with BOM for Thai Excel compatibility)
  const handleExportCSV = () => {
    if (filtered.length === 0) {
      showToast('ไม่มีข้อมูลสำหรับส่งออก CSV', 'info');
      return;
    }
    const headers = [
      'วันที่',
      'เลขจ๊อบอ้างอิง',
      'หมวดหมู่ภาษี',
      'ประเภทรายการ',
      'รายละเอียด',
      'คนขับรถ/ผู้รับเงิน',
      'ทะเบียนรถ',
      'กลุ่มรถ',
      'จำนวนเงินก่อนหัก',
      'อัตราภาษี (%)',
      'ภาษีหัก ณ ที่จ่าย',
      'ยอดจ่ายสุทธิ',
      'หมายเหตุ',
    ];
    const escapeCell = (val: string | number) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const rows = filtered.map((e) => [
      formatDate(e.date),
      e.jobNo || '-',
      e.expenseCategory === 'driver' ? 'คนขับรถ (หัก 1%)' : 'ทั่วไป (ไม่หักภาษี)',
      e.type,
      e.description,
      e.driverName || '-',
      e.vehicleLicense || '-',
      e.billType === 'Adv' ? 'รถร่วม' : 'รถบริษัท',
      e.amount.toFixed(2),
      e.withholdingTaxRate,
      e.withholdingTaxAmount.toFixed(2),
      e.netAmount.toFixed(2),
      e.note || '',
    ]);
    rows.push([
      'รวมทั้งหมด',
      '',
      `${metrics.driverCount} รายการหัก 1% / ${metrics.nonTaxCount} รายการไม่หัก`,
      '',
      '',
      '',
      '',
      '',
      metrics.totalAmount.toFixed(2),
      '',
      metrics.totalWht.toFixed(2),
      metrics.totalNet.toFixed(2),
      '',
    ]);

    const csvContent =
      '\uFEFF' + [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `khemthit-wht-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('ส่งออกไฟล์ CSV เรียบร้อยแล้ว', 'success');
  };

  // Export Excel (.xls HTML workbook compatible with MS Excel + Thai UTF-8)
  const handleExportExcel = () => {
    if (filtered.length === 0) {
      showToast('ไม่มีข้อมูลสำหรับส่งออก Excel', 'info');
      return;
    }
    const esc = (s: string) =>
      String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const rowsHtml = filtered
      .map(
        (e) => `
      <tr>
        <td>${esc(formatDate(e.date))}</td>
        <td>${esc(e.jobNo || '-')}</td>
        <td>${e.expenseCategory === 'driver' ? 'คนขับรถ (หัก 1%)' : 'ทั่วไป (ไม่หักภาษี)'}</td>
        <td>${esc(e.type)}</td>
        <td>${esc(e.description)}</td>
        <td>${esc(e.driverName || '-')}</td>
        <td>${esc(e.vehicleLicense || '-')}</td>
        <td style="text-align:right;">${e.amount.toFixed(2)}</td>
        <td style="text-align:center;">${e.withholdingTaxRate}%</td>
        <td style="text-align:right;color:#be185d;">${e.withholdingTaxAmount.toFixed(2)}</td>
        <td style="text-align:right;font-weight:bold;color:#047857;">${e.netAmount.toFixed(2)}</td>
      </tr>`
      )
      .join('');

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8" />
        <style>
          table { border-collapse: collapse; font-family: Tahoma, sans-serif; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; }
          th { background-color: #fdf2f8; color: #1e293b; font-weight: bold; }
          tfoot td { background-color: #f8fafc; font-weight: bold; }
        </style>
      </head>
      <body>
        <h3>บริษัท เข็มทิศ ทรานสปอร์ต จำกัด — รายงานภาษีหัก ณ ที่จ่าย 1% และสรุปค่าใช้จ่าย</h3>
        <p>ช่วงวันที่: ${startDate ? esc(formatDate(startDate)) : 'ทั้งหมด'} ถึง ${endDate ? esc(formatDate(endDate)) : 'ทั้งหมด'} | จำนวนรายการ: ${metrics.totalCount} รายการ</p>
        <table>
          <thead>
            <tr>
              <th>วันที่</th>
              <th>เลขจ๊อบ</th>
              <th>หมวดภาษี</th>
              <th>ประเภทรายการ</th>
              <th>รายละเอียด</th>
              <th>คนขับรถ</th>
              <th>ทะเบียนรถ</th>
              <th>จำนวนเงินก่อนหัก</th>
              <th>อัตราภาษี</th>
              <th>ภาษีหัก ณ ที่จ่าย</th>
              <th>ยอดจ่ายสุทธิ</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="7" style="text-align:right;">รวมทั้งสิ้น (${metrics.driverCount} รายการคนขับรถ / ${metrics.nonTaxCount} รายการไม่หักภาษี)</td>
              <td style="text-align:right;">${metrics.totalAmount.toFixed(2)}</td>
              <td style="text-align:center;">-</td>
              <td style="text-align:right;color:#be185d;">${metrics.totalWht.toFixed(2)}</td>
              <td style="text-align:right;color:#047857;">${metrics.totalNet.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF', html], {
      type: 'application/vnd.ms-excel;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `khemthit-wht-report-${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('ส่งออกไฟล์ Excel เรียบร้อยแล้ว', 'success');
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Print-Only Formal Header */}
      <div className="hidden print:block border-b-2 border-slate-800 pb-3 mb-4">
        <h2 className="text-lg font-bold text-slate-900">
          บริษัท เข็มทิศ ทรานสปอร์ต จำกัด (KHEMTHIT TRANSPORT CO.,LTD.)
        </h2>
        <p className="text-xs text-slate-700">
          รายงานสรุปภาษีหัก ณ ที่จ่าย 1% (เฉพาะค่าใช้จ่ายคนขับรถ) และสรุปค่าใช้จ่ายประจำงวด
        </p>
        <p className="text-[11px] text-slate-500 mt-1">
          ช่วงวันที่: {startDate ? formatDate(startDate) : 'ทั้งหมด'} ถึง{' '}
          {endDate ? formatDate(endDate) : 'ทั้งหมด'} | พิมพ์เมื่อ:{' '}
          {formatDate(new Date().toISOString().split('T')[0])}
        </p>
      </div>

      {/* Top Mode Switcher + Export Buttons */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 no-print">
        <div className="inline-flex bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 text-xs w-fit">
          <button
            type="button"
            onClick={() => setViewMode('tax')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              viewMode === 'tax'
                ? 'bg-[#FDF2F8] text-[#BE185D] border border-[#FBCFE8] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            รายงานภาษีหัก ณ ที่จ่าย 1%
          </button>
          <button
            type="button"
            onClick={() => setViewMode('summary')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              viewMode === 'summary'
                ? 'bg-[#F5F3FF] text-[#6D28D9] border border-[#DDD6FE] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            สรุปค่าใช้จ่ายตามประเภท
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#047857] border border-[#A7F3D0] text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <FileText className="w-4 h-4" />
            ส่งออก CSV
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1D4ED8] border border-[#BFDBFE] text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4" />
            ส่งออก Excel
          </button>
          <button
            type="button"
            onClick={handlePrintPDF}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#FDF2F8] hover:bg-[#FCE7F3] text-[#BE185D] border border-[#FBCFE8] text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            พิมพ์ / PDF
          </button>
        </div>
      </div>

      {/* 6 Summary KPIs in clean 2-row / 3-col Soft Pastel Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="จำนวนรายการทั้งหมด"
          value={`${metrics.totalCount} รายการ`}
          subtitle={`คนขับรถ ${metrics.driverCount} รายการ • ทั่วไป ${metrics.nonTaxCount} รายการ`}
          tone="blue"
          icon={<Receipt className="w-5 h-5" />}
        />
        <StatCard
          title="ยอดค่าใช้จ่ายคนขับรถ (ฐานภาษี 1%)"
          value={formatCurrency(metrics.driverAmount)}
          subtitle={`จากรายการคนขับรถทั้งหมด ${metrics.driverCount} รายการ`}
          tone="orange"
          icon={<UserCheck className="w-5 h-5" />}
        />
        <StatCard
          title="ยอดภาษีหัก ณ ที่จ่าย (1%)"
          value={formatCurrency(metrics.totalWht)}
          subtitle="คำนวณ 1% เฉพาะรายการหมวดคนขับรถ"
          tone="pink"
          icon={<Percent className="w-5 h-5" />}
        />
        <StatCard
          title="ยอดจ่ายสุทธิรวมทั้งหมด"
          value={formatCurrency(metrics.totalNet)}
          subtitle={`จากยอดก่อนหักรวม ${formatCurrency(metrics.totalAmount)}`}
          tone="green"
          icon={<Wallet className="w-5 h-5" />}
        />
        <StatCard
          title="รายการที่ไม่ถูกหักภาษี (0%)"
          value={formatCurrency(metrics.nonTaxAmount)}
          subtitle={`${metrics.nonTaxCount} รายการ (ค่าน้ำมัน, อาหาร, ทั่วไป ฯลฯ)`}
          tone="purple"
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
        <StatCard
          title="ยอดค่าใช้จ่ายก่อนหักรวม"
          value={formatCurrency(metrics.totalAmount)}
          subtitle="รวมทุกรายการตามช่วงวันที่และตัวกรอง"
          tone="slate"
          icon={<FileText className="w-5 h-5" />}
        />
      </div>

      {/* Multi-Criteria Filter Panel */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3 no-print">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Filter className="w-4 h-4 text-[#BE185D]" />
            <span>ตัวกรองรายงาน</span>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            ล้างตัวกรอง
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 block">วันที่เริ่มต้น</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full min-h-[40px] text-xs font-mono bg-slate-50 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-sky-400"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 block">วันที่สิ้นสุด</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full min-h-[40px] text-xs font-mono bg-slate-50 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-sky-400"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 block">หมวดหมู่ภาษี</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as 'all' | 'driver' | 'general')}
              className="w-full min-h-[40px] text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-sky-400"
            >
              <option value="all">ทั้งหมด</option>
              <option value="driver">คนขับรถ (หัก 1%)</option>
              <option value="general">ทั่วไป (ไม่หักภาษี 0%)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 block">ประเภทรายการ</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full min-h-[40px] text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-sky-400"
            >
              <option value="all">ทุกประเภท</option>
              {ALL_EXPENSE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 block">คนขับรถ</label>
            <select
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              className="w-full min-h-[40px] text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-sky-400"
            >
              <option value="all">คนขับรถทั้งหมด</option>
              {uniqueDrivers.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 block">กลุ่มรถ / สถานะ</label>
            <select
              value={billTypeFilter}
              onChange={(e) => setBillTypeFilter(e.target.value as 'all' | 'Normal' | 'Adv')}
              className="w-full min-h-[40px] text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-sky-400"
            >
              <option value="all">ทั้งหมด</option>
              <option value="Normal">รถบริษัท (Normal)</option>
              <option value="Adv">รถร่วม (Advance)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mode 2: Summary by Expense Type */}
      {viewMode === 'summary' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                สรุปค่าใช้จ่ายแยกตามประเภทรายการ
              </h3>
              <p className="text-xs text-slate-500">
                เปรียบเทียบสัดส่วนค่าใช้จ่าย ภาษีหัก ณ ที่จ่าย 1% และยอดจ่ายสุทธิในแต่ละหมวด
              </p>
            </div>
          </div>

          {summaryByType.length === 0 ? (
            <EmptyState
              title="ยังไม่มีข้อมูลสรุปค่าใช้จ่าย"
              description="ลองปรับเปลี่ยนช่วงวันที่หรือตัวกรองเพื่อดูข้อมูล"
            />
          ) : (
            <div className="space-y-3">
              {summaryByType.map((row) => {
                const pct =
                  metrics.totalAmount > 0
                    ? Math.round((row.amount / metrics.totalAmount) * 100)
                    : 0;
                const isDriver = row.category === 'driver';
                return (
                  <div
                    key={row.type}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{row.type}</span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                            isDriver
                              ? 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]'
                              : 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                          }`}
                        >
                          {isDriver ? 'คนขับรถ หัก 1%' : 'ทั่วไป 0%'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {row.count} รายการ ({pct}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
                        <span className="text-slate-600">
                          ก่อนหัก: <strong className="text-slate-900">{formatCurrency(row.amount)}</strong>
                        </span>
                        <span className="text-[#BE185D]">
                          หัก 1%: <strong>{formatCurrency(row.wht)}</strong>
                        </span>
                        <span className="text-[#047857] font-bold">
                          สุทธิ: {formatCurrency(row.net)}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-200/70 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.max(2, pct)}%` }}
                        className={`h-full rounded-full ${
                          isDriver ? 'bg-[#FB923C]' : 'bg-[#60A5FA]'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Detailed Report Table (Desktop & Print) */}
      <div className="hidden md:block print:block bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <EmptyState
            title="ไม่พบรายการในรายงาน"
            description="ไม่มีข้อมูลที่ตรงกับช่วงวันที่หรือตัวกรองที่เลือก"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FDF2F8]/60 border-b border-slate-200 text-slate-700">
                  <th className="py-3 px-3.5 font-semibold whitespace-nowrap">วันที่</th>
                  <th className="py-3 px-3.5 font-semibold whitespace-nowrap">รายการ</th>
                  <th className="py-3 px-3.5 font-semibold whitespace-nowrap">หมวดหมู่</th>
                  <th className="py-3 px-3.5 font-semibold">คนขับรถ / ทะเบียน</th>
                  <th className="py-3 px-3.5 font-semibold text-right whitespace-nowrap">จำนวนเงินก่อนหัก</th>
                  <th className="py-3 px-3.5 font-semibold text-center whitespace-nowrap">อัตรา</th>
                  <th className="py-3 px-3.5 font-semibold text-right whitespace-nowrap">ภาษีหัก ณ ที่จ่าย</th>
                  <th className="py-3 px-3.5 font-semibold text-right whitespace-nowrap">ยอดจ่ายสุทธิ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((e) => {
                  const isDriver = e.expenseCategory === 'driver';
                  return (
                    <tr key={e.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3.5 font-mono tabular-nums whitespace-nowrap">
                        {formatDate(e.date)}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <div className="font-semibold text-slate-900">{e.type}</div>
                        <div className="text-[11px] text-slate-500">{e.description}</div>
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                            isDriver
                              ? 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]'
                              : 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                          }`}
                        >
                          {isDriver ? 'คนขับรถ' : 'ทั่วไป'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <div>{e.driverName || '-'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {e.vehicleLicense || '-'}
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono tabular-nums">
                        {formatCurrency(e.amount)}
                      </td>
                      <td className="py-2.5 px-3.5 text-center font-mono tabular-nums">
                        {e.withholdingTaxRate}%
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono tabular-nums font-semibold text-[#BE185D]">
                        {formatCurrency(e.withholdingTaxAmount)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono tabular-nums font-bold text-[#047857]">
                        {formatCurrency(e.netAmount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-900">
                  <td colSpan={4} className="py-3 px-3.5 text-right">
                    รวมทั้งสิ้น ({metrics.totalCount} รายการ)
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono tabular-nums">
                    {formatCurrency(metrics.totalAmount)}
                  </td>
                  <td className="py-3 px-3.5 text-center font-mono">-</td>
                  <td className="py-3 px-3.5 text-right font-mono tabular-nums text-[#BE185D]">
                    {formatCurrency(metrics.totalWht)}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono tabular-nums text-[#047857]">
                    {formatCurrency(metrics.totalNet)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Mobile Card View for Tax Report (< md, hidden on print) */}
      <div className="md:hidden print:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl">
            <EmptyState
              title="ไม่พบรายการในรายงาน"
              description="ไม่มีข้อมูลที่ตรงกับตัวกรองที่เลือก"
            />
          </div>
        ) : (
          filtered.map((e) => {
            const isDriver = e.expenseCategory === 'driver';
            return (
              <div
                key={e.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{e.type}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {formatDate(e.date)} • {e.driverName || '-'}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                      isDriver
                        ? 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]'
                        : 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                    }`}
                  >
                    {isDriver ? 'หัก 1%' : 'ไม่หัก 0%'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-500 block">ก่อนหัก</span>
                    <span className="text-xs font-mono font-semibold tabular-nums">
                      {formatCurrency(e.amount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">หัก ณ ที่จ่าย</span>
                    <span className="text-xs font-mono font-semibold tabular-nums text-[#BE185D]">
                      {formatCurrency(e.withholdingTaxAmount)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">จ่ายสุทธิ</span>
                    <span className="text-xs font-mono font-bold tabular-nums text-[#047857]">
                      {formatCurrency(e.netAmount)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Print-Only Signature Footer */}
      <div className="hidden print:grid grid-cols-2 gap-12 pt-10 text-xs text-slate-700">
        <div className="text-center space-y-8">
          <div className="border-b border-slate-400 w-48 mx-auto pt-8" />
          <p>ผู้จัดทำรายงาน / ฝ่ายบัญชี</p>
        </div>
        <div className="text-center space-y-8">
          <div className="border-b border-slate-400 w-48 mx-auto pt-8" />
          <p>ผู้อนุมัติ / ผู้จัดการ</p>
        </div>
      </div>
    </div>
  );
}
