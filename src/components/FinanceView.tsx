import React, { useState } from 'react';
import { 
  DollarSign, Percent, TrendingUp, Printer, FileText, Plus, Trash2, Edit2,
  Layers, CreditCard, ChevronRight, Calculator, PieChart, Users, AlertTriangle, X
} from 'lucide-react';
import { 
  PartnerPayment, WithholdingTaxRecord, PayrollRecord, 
  Invoice, DailyExpense, Employee, Driver 
} from '../types';
import { formatCurrency, getStatusStyle, arabicToThaiBaht } from '../utils';

interface FinanceViewProps {
  partnerPayments: PartnerPayment[];
  withholdingTaxes: WithholdingTaxRecord[];
  payroll: PayrollRecord[];
  invoices: Invoice[];
  expenses: DailyExpense[];
  drivers: Driver[];
  employees: Employee[];
  onSavePartnerPayment: (p: PartnerPayment) => void;
  onDeletePartnerPayment: (id: string) => void;
  onSaveWithholdingTax: (w: WithholdingTaxRecord) => void;
  onDeleteWithholdingTax: (id: string) => void;
  onSavePayroll: (pr: PayrollRecord) => void;
  onDeletePayroll: (id: string) => void;
}

export function FinanceView({
  partnerPayments, withholdingTaxes, payroll, invoices, expenses, drivers, employees,
  onSavePartnerPayment, onDeletePartnerPayment,
  onSaveWithholdingTax, onDeleteWithholdingTax,
  onSavePayroll, onDeletePayroll
}: FinanceViewProps) {
  const [activeFinTab, setActiveFinTab] = useState<'partners' | 'withholding' | 'payroll' | 'profit'>('partners');
  const [partnerTypeTab, setPartnerTypeTab] = useState<'PAY_PARTNER' | 'RENT_CAR'>('PAY_PARTNER');

  // Form toggles
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [previewPayrollSlip, setPreviewPayrollSlip] = useState<PayrollRecord | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState('');

  // 1. Partner Payment Form states
  const [pName, setPName] = useState('');
  const [pJob, setPJob] = useState('');
  const [pRevenue, setPRevenue] = useState(0);
  const [pDeduction, setPDeduction] = useState(0);

  // 2. Withholding Tax Form states
  const [wPayee, setWPayee] = useState('');
  const [wTaxID, setWTaxID] = useState('');
  const [wBase, setWBase] = useState(0);
  const [wRate, setWRate] = useState(1); // 1% or 3%
  const [wType, setWType] = useState<'Transportation' | 'Service'>('Transportation');

  // 3. Payroll Form states
  const [payTargetId, setPayTargetId] = useState(''); // Selected Driver or Staff
  const [payOt, setPayOt] = useState(0);
  const [payBonus, setPayBonus] = useState(0);
  const [payDeduction, setPayDeduction] = useState(0);

  // Profit & Loss calculations based on real lists
  const invoicesReceivedSum = invoices
    .filter(inv => inv.status === 'จ่ายแล้ว')
    .reduce((sum, inv) => sum + inv.grandTotal, 0);

  const invoicesOutstandingSum = invoices
    .filter(inv => inv.status === 'ยังไม่จ่าย')
    .reduce((sum, inv) => sum + inv.grandTotal, 0);

  const totalInvoicesSum = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

  const totalFuelCost = expenses
    .filter(e => e.type === 'น้ำมัน')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalRoadTollCost = expenses
    .filter(e => e.type === 'ค่าทางด่วน')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalMaintenanceCost = expenses
    .filter(e => e.type === 'ค่าซ่อม')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalOtherExpenses = expenses
    .filter(e => e.type !== 'น้ำมัน' && e.type !== 'ค่าทางด่วน' && e.type !== 'ค่าซ่อม')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalCOGS = totalFuelCost + totalRoadTollCost + totalMaintenanceCost;

  // Payroll Sum
  const totalPayrollPaid = payroll.reduce((sum, p) => sum + p.netSalary, 0);
  
  // Partner clearing pay sum
  const totalCoWorkersPaid = partnerPayments
    .filter(p => p.status === 'จ่ายแล้ว')
    .reduce((sum, p) => sum + p.netPaid, 0);

  const totalOverhead = totalPayrollPaid + totalCoWorkersPaid + totalOtherExpenses;
  const grandTotalCost = totalCOGS + totalOverhead;
  const netEarnings = totalInvoicesSum - grandTotalCost;

  const handleOpenAddForm = () => {
    setIsFormOpen(true);
    setIsEditMode(false);
    setEditId('');
    // Preset fields
    setPName(''); setPJob(''); setPRevenue(0); setPDeduction(0);
    setWPayee(''); setWTaxID(''); setWBase(0); setWRate(1); setWType('Transportation');
    setPayTargetId(''); setPayOt(0); setPayBonus(0); setPayDeduction(0);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateStr = new Date().toISOString().split('T')[0];

    if (activeFinTab === 'partners') {
      const id = isEditMode && editId ? editId : `PPM-${dateStr.replace(/-/g, '')}-${String(partnerPayments.length + 1).padStart(3, '0')}`;
      const netPaid = pRevenue - pDeduction; // Formula netPaid = revenue - deduction
      const currentPay = partnerPayments.find(p => p.id === id);
      onSavePartnerPayment({
        id, date: currentPay?.date || dateStr, partnerName: pName, jobNo: pJob,
        paymentType: partnerTypeTab, revenue: pRevenue, expensesDeduction: pDeduction,
        netPaid, status: currentPay?.status || 'ยังไม่ได้เคลียร์'
      });
    } else if (activeFinTab === 'withholding') {
      const id = isEditMode && editId ? editId : `WHT-${dateStr.replace(/-/g, '')}-${String(withholdingTaxes.length + 1).padStart(3, '0')}`;
      const taxAmount = Math.round(wBase * (wRate / 100) * 100) / 100; // Auto calculation base * rate%
      const currentTax = withholdingTaxes.find(w => w.id === id);
      onSaveWithholdingTax({
        id, date: currentTax?.date || dateStr, payeeName: wPayee, taxIDNumber: wTaxID,
        baseAmount: wBase, rate: wRate, taxAmount, type: wType
      });
    } else if (activeFinTab === 'payroll') {
      const id = isEditMode && editId ? editId : `PAY-${dateStr.replace(/-/g, '')}-${String(payroll.length + 1).padStart(3, '0')}`;
      
      // Look up target person in Drivers / Staff lists to resolve salary
      let name = '';
      let baseSal = 0;
      let role: 'Driver' | 'Staff' = 'Staff';

      const foundDriver = drivers.find(d => d.id === payTargetId);
      if (foundDriver) {
        name = foundDriver.name;
        baseSal = 15000; // Default driver salary
        role = 'Driver';
      } else {
        const foundEmp = employees.find(emp => emp.id === payTargetId);
        if (foundEmp) {
          name = foundEmp.name;
          baseSal = foundEmp.salary;
          role = 'Staff';
        }
      }

      if (!name) {
        alert("กรุณาเลือกพนักงานผู้รับเงิน");
        return;
      }

      const netSalary = baseSal + payOt + payBonus - payDeduction; // Formula
      const currentPay = payroll.find(pr => pr.id === id);

      onSavePayroll({
        id, employeeId: payTargetId, employeeName: name, role,
        payDate: currentPay?.payDate || dateStr, salary: baseSal, ot: payOt, bonus: payBonus,
        deduction: payDeduction, netSalary, status: currentPay?.status || 'Unpaid'
      });
    }

    setIsFormOpen(false);
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Tab Controller bar with full custom design */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 w-max text-xs font-semibold">
          <button 
            onClick={() => { setActiveFinTab('partners'); setIsFormOpen(false); }}
            className={`px-3.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${activeFinTab === 'partners' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <CreditCard className="w-4 h-4" />
            จ่ายขนส่งรถร่วม-รถเช่า
          </button>
          <button 
            onClick={() => { setActiveFinTab('withholding'); setIsFormOpen(false); }}
            className={`px-3.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${activeFinTab === 'withholding' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Percent className="w-4 h-4" />
            ภาษีหัก ณ ที่จ่าย (3%/1%)
          </button>
          <button 
            onClick={() => { setActiveFinTab('payroll'); setIsFormOpen(false); }}
            className={`px-3.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${activeFinTab === 'payroll' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Users className="w-4 h-4" />
            เงินเดือนพนักงาน & Payslips
          </button>
          <button 
            onClick={() => { setActiveFinTab('profit'); setIsFormOpen(false); }}
            className={`px-3.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${activeFinTab === 'profit' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <PieChart className="w-4 h-4" />
            งบกำไรขาดทุนสะสม (P&L)
          </button>
        </div>

        {activeFinTab !== 'profit' && !isFormOpen && !previewPayrollSlip && (
          <button 
            onClick={handleOpenAddForm}
            className="flex items-center gap-1 bg-slate-900 text-white font-semibold text-xs py-2 px-3.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" /> สรุปงวดบัญชีทำจ่าย
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {!isFormOpen && !previewPayrollSlip && (
        <>
          {/* TAB 1: ADVANCED CO-WORKERS / TRAILER PAYMENTS */}
          {activeFinTab === 'partners' && (
            <div className="space-y-4">
              {/* Dual Tab Controller for PAY_PARTNER and RENT_CAR */}
              <div className="flex bg-slate-150 p-1 rounded-lg border border-slate-200 w-max text-[11px] font-bold">
                <button 
                  onClick={() => setPartnerTypeTab('PAY_PARTNER')}
                  className={`px-3.5 py-1 rounded-md transition-all uppercase ${partnerTypeTab === 'PAY_PARTNER' ? 'bg-white text-indigo-700 shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  ทำจ่ายรถพ่วงเที่ยวร่วม (PAY_PARTNER)
                </button>
                <button 
                  onClick={() => setPartnerTypeTab('RENT_CAR')}
                  className={`px-3.5 py-1 rounded-md transition-all uppercase ${partnerTypeTab === 'RENT_CAR' ? 'bg-white text-indigo-700 shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  จ่ายสัญญาค่าเช่ารถขนส่ง (RENT_CAR)
                </button>
              </div>

              {/* Sheet style table representation */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse border border-slate-250">
                    <thead>
                      <tr className="bg-slate-100 font-mono text-slate-700">
                        <th className="p-2 border border-slate-200 font-bold whitespace-nowrap text-center">รหัสอ้างอิงจ่าย</th>
                        <th className="p-2 border border-slate-200 font-semibold text-center whitespace-nowrap">วันที่เคลียร์</th>
                        <th className="p-2 border border-slate-200 font-semibold whitespace-nowrap">ผู้ให้บริการคู่ค้าร่วม (รถร่วม/รถเช่า)</th>
                        <th className="p-2 border border-slate-200 font-semibold whitespace-nowrap">เลขอ้างอิง Job</th>
                        <th className="p-2 border border-slate-200 font-semibold text-right whitespace-nowrap">รายได้รวม</th>
                        <th className="p-2 border border-slate-200 font-semibold text-right whitespace-nowrap">รายจ่ายหักลบ</th>
                        <th className="p-2 border border-slate-200 font-semibold text-right text-slate-950 whitespace-nowrap">ยอดโอนจ่ายเคลียร์สุทธิ</th>
                        <th className="p-2 border border-slate-200 font-semibold text-center whitespace-nowrap">สถานะ</th>
                        <th className="p-2 border border-slate-200 text-center whitespace-nowrap">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700">
                      {partnerPayments.filter(p => p.paymentType === partnerTypeTab).length === 0 ? (
                        <tr><td colSpan={9} className="p-6 text-center text-slate-400 font-mono border border-slate-200">ไม่มีประวัติใบทำจ่ายบริการคู่ค้ารายนี้</td></tr>
                      ) : (
                        partnerPayments.filter(p => p.paymentType === partnerTypeTab).map((p) => (
                          <tr key={p.id} className="hover:bg-slate-100/40 transition-colors odd:bg-white even:bg-slate-50/70">
                            <td className="p-2 border border-slate-200 font-mono font-bold text-center text-indigo-750">{p.id}</td>
                            <td className="p-2 border border-slate-200 font-mono text-center text-slate-500 whitespace-nowrap">{p.date}</td>
                            <td className="p-2 border border-slate-200 font-semibold text-slate-900">{p.partnerName}</td>
                            <td className="p-2 border border-slate-200 font-mono text-slate-650 font-bold text-center">{p.jobNo}</td>
                            <td className="p-2 border border-slate-200 text-right font-mono text-slate-600">{formatCurrency(p.revenue)}</td>
                            <td className="p-2 border border-slate-200 text-right font-mono text-red-500">-{formatCurrency(p.expensesDeduction)}</td>
                            <td className="p-2 border border-slate-200 text-right font-mono font-extrabold text-slate-900 text-sm">{formatCurrency(p.netPaid)}</td>
                            <td className="p-2 border border-slate-200 text-center whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${getStatusStyle(p.status)}`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="p-2 border border-slate-200 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <button 
                                  onClick={() => {
                                    setIsEditMode(true);
                                    setEditId(p.id);
                                    setPName(p.partnerName);
                                    setPJob(p.jobNo);
                                    setPRevenue(p.revenue);
                                    setPDeduction(p.expensesDeduction);
                                    setPartnerTypeTab(p.paymentType);
                                    setIsFormOpen(true);
                                  }}
                                  className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 p-1 rounded-lg transition-colors"
                                  title="แก้ไข"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => {
                                    if (confirm(`คุณต้องการลบรายงานคู่ค้ารหัส ${p.id} หรือไม่?`)) {
                                      onDeletePartnerPayment(p.id);
                                    }
                                  }}
                                  className="bg-red-50 hover:bg-red-100 text-red-500 p-1.5 rounded-lg border border-red-200 transition-colors"
                                  title="ลบออก"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WITHHOLDING TAX REGISTRY */}
          {activeFinTab === 'withholding' && (
            <div className="space-y-3">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-white flex justify-between items-center">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-wider block text-slate-400">สรุปภาษีหักสะสม</span>
                  <span className="text-xl font-bold font-mono text-amber-400">
                    {formatCurrency(withholdingTaxes.reduce((sum, w) => sum + w.taxAmount, 0))}
                  </span>
                </div>
                <div className="text-right text-xs text-slate-400 font-mono">
                  ใช้สำหรับการทำรายงานเสนอ ภ.ง.ด. 1, 3 และ 53
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse border border-slate-250">
                    <thead>
                      <tr className="bg-slate-100 font-mono text-slate-700">
                        <th className="p-2 border border-slate-200 font-bold text-center whitespace-nowrap">ใบสำคัญหักเลข</th>
                        <th className="p-2 border border-slate-200 font-semibold text-center whitespace-nowrap">วันที่ทำรายการ</th>
                        <th className="p-2 border border-slate-200 font-semibold whitespace-nowrap">ผู้รับเงิน / ผู้ให้บริการ</th>
                        <th className="p-2 border border-slate-200 font-semibold whitespace-nowrap">เลขประจำตัวผู้เสียภาษี</th>
                        <th className="p-2 border border-slate-200 font-semibold text-right whitespace-nowrap">มูลค่าฐานเงินเบิกจ่าย</th>
                        <th className="p-2 border border-slate-200 font-semibold text-center whitespace-nowrap font-mono">อัตรา (%)</th>
                        <th className="p-2 border border-slate-200 font-semibold text-right text-slate-950 whitespace-nowrap">ภาษีหักนำส่ง</th>
                        <th className="p-2 border border-slate-200 font-semibold whitespace-nowrap">ประเภทกลุ่มภาษี</th>
                        <th className="p-2 border border-slate-200 text-center whitespace-nowrap">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700">
                      {withholdingTaxes.length === 0 ? (
                        <tr><td colSpan={9} className="p-6 text-center text-slate-400 font-mono border border-slate-200">ไม่มีทะเบียนหักภาษี ณ ที่จ่ายเข้าระบบ</td></tr>
                      ) : (
                        withholdingTaxes.map((w) => (
                          <tr key={w.id} className="hover:bg-slate-100/40 transition-colors odd:bg-white even:bg-slate-50/70">
                            <td className="p-2 border border-slate-200 font-mono font-bold text-center text-indigo-755">{w.id}</td>
                            <td className="p-2 border border-slate-200 font-mono text-center text-slate-500 whitespace-nowrap">{w.date}</td>
                            <td className="p-2 border border-slate-200 font-semibold text-slate-900">{w.payeeName}</td>
                            <td className="p-2 border border-slate-200 font-mono text-center">{w.taxIDNumber}</td>
                            <td className="p-2 border border-slate-200 text-right font-mono">{formatCurrency(w.baseAmount)}</td>
                            <td className="p-2 border border-slate-200 text-center font-bold text-indigo-700 font-mono">{w.rate}%</td>
                            <td className="p-2 border border-slate-200 text-right font-mono font-extrabold text-slate-900 text-sm">{formatCurrency(w.taxAmount)}</td>
                            <td className="p-2 border border-slate-200 font-sans whitespace-nowrap">
                              <span className="bg-slate-100/80 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200">
                                {w.type}
                              </span>
                            </td>
                            <td className="p-2 border border-slate-200 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <button 
                                  onClick={() => {
                                    setIsEditMode(true);
                                    setEditId(w.id);
                                    setWPayee(w.payeeName);
                                    setWTaxID(w.taxIDNumber);
                                    setWBase(w.baseAmount);
                                    setWRate(w.rate);
                                    setWType(w.type);
                                    setIsFormOpen(true);
                                  }}
                                  className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 p-1 rounded-lg transition-colors"
                                  title="แก้ไข"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => {
                                    if (confirm(`คุณต้องการลบข้อมูลภาษีเลขประหัส ${w.id} หรือไม่?`)) {
                                      onDeleteWithholdingTax(w.id);
                                    }
                                  }}
                                  className="bg-red-50 hover:bg-red-100 text-red-500 p-1.5 rounded-lg border border-red-200 transition-colors"
                                  title="ลบออก"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PAYROLL AND EMPLOYEE PAYSLIP SUMMARY */}
          {activeFinTab === 'payroll' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse border border-slate-250">
                  <thead>
                    <tr className="bg-slate-100 font-mono text-slate-700">
                      <th className="p-2 border border-slate-200 font-bold text-center whitespace-nowrap">รหัสอ้างอิงสลิป</th>
                      <th className="p-2 border border-slate-200 font-semibold text-center whitespace-nowrap">วันโอนชำระ</th>
                      <th className="p-2 border border-slate-200 font-semibold whitespace-nowrap">ชื่อพนักงานผู้รับทำบัญชี</th>
                      <th className="p-2 border border-slate-200 font-semibold whitespace-nowrap">ฝ่ายงานหลัก</th>
                      <th className="p-2 border border-slate-200 font-semibold text-right whitespace-nowrap">เงินเดือนสัญญา</th>
                      <th className="p-2 border border-slate-200 font-semibold text-right whitespace-nowrap">ค่าล่วงเวลา (OT)</th>
                      <th className="p-2 border border-slate-200 font-semibold text-right whitespace-nowrap">โบนัสขยันพิเศษ</th>
                      <th className="p-2 border border-slate-200 font-semibold text-right text-red-600 whitespace-nowrap">หักขาด/สาย</th>
                      <th className="p-2 border border-slate-200 font-semibold text-right text-slate-950 whitespace-nowrap font-bold">ยอดเงินโอนสุทธิสุทธิ</th>
                      <th className="p-2 border border-slate-200 text-center whitespace-nowrap">เดโมบัตรสลิป</th>
                      <th className="p-2 border border-slate-200 text-center whitespace-nowrap">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-700">
                    {payroll.length === 0 ? (
                      <tr><td colSpan={11} className="p-6 text-center text-slate-400 font-mono border border-slate-200">ไม่มีประวัติการทำจ่ายเงินเดือนงวดบัญชี</td></tr>
                    ) : (
                      payroll.map((pr) => (
                        <tr key={pr.id} className="hover:bg-slate-100/40 transition-colors odd:bg-white even:bg-slate-50/70">
                          <td className="p-2 border border-slate-200 font-mono font-bold text-center text-indigo-750">{pr.id}</td>
                          <td className="p-2 border border-slate-200 font-mono text-center text-slate-500 whitespace-nowrap">{pr.payDate}</td>
                          <td className="p-2 border border-slate-200 font-extrabold text-slate-950">{pr.employeeName}</td>
                          <td className="p-2 border border-slate-200 whitespace-nowrap text-center">
                            {pr.role === 'Driver' ? (
                              <span className="bg-sky-50 text-sky-700 font-bold px-1.5 py-0.5 rounded text-[9px] border border-sky-200">แผนกคนขับหัวลาก</span>
                            ) : (
                              <span className="bg-purple-50 text-purple-700 font-bold px-1.5 py-0.5 rounded text-[9px] border border-purple-200">เจ้าหน้าที่ธุรการ</span>
                            )}
                          </td>
                          <td className="p-2 border border-slate-200 text-right font-mono">{formatCurrency(pr.salary)}</td>
                          <td className="p-2 border border-slate-200 text-right font-mono text-slate-600">+{formatCurrency(pr.ot)}</td>
                          <td className="p-2 border border-slate-200 text-right font-mono text-emerald-600">+{formatCurrency(pr.bonus)}</td>
                          <td className="p-2 border border-slate-200 text-right font-mono text-red-500">-{formatCurrency(pr.deduction)}</td>
                          <td className="p-2 border border-slate-200 text-right font-mono font-black text-slate-900 text-sm">{formatCurrency(pr.netSalary)}</td>
                          <td className="p-2 border border-slate-200 text-center whitespace-nowrap">
                            <button 
                              onClick={() => setPreviewPayrollSlip(pr)}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-extrabold px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                            >
                              พิมพ์สลิป Payslip
                            </button>
                          </td>
                          <td className="p-2 border border-slate-200 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button 
                                onClick={() => {
                                  setIsEditMode(true);
                                  setEditId(pr.id);
                                  setPayTargetId(pr.employeeId);
                                  setPayOt(pr.ot);
                                  setPayBonus(pr.bonus);
                                  setPayDeduction(pr.deduction);
                                  setIsFormOpen(true);
                                }}
                                className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 p-1 rounded-lg transition-colors"
                                title="แก้ไข"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => {
                                  if (confirm(`คุณต้องการลบรายงานขบวนเงินเดือนรหัส ${pr.id} หรือไม่?`)) {
                                    onDeletePayroll(pr.id);
                                  }
                                }}
                                className="bg-red-50 hover:bg-red-105 text-red-600 p-1.5 rounded-lg border border-red-200 transition-all text-xs"
                                title="ลบออก"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: PROFIT & LOSS STATEMENT (P&L SYSTEM) */}
          {activeFinTab === 'profit' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm max-w-3xl mx-auto space-y-6">
              {/* Header Letterhead style */}
              <div className="border-b-2 border-slate-900 pb-4 text-center">
                <span className="font-sans font-black text-base text-slate-900 block">รายงานกำไรขาดทุนสะสมสุทธิประจำกาลเวลา</span>
                <span className="font-serif italic font-bold text-slate-500 text-xs">บริษัท เข็มทิศ ทานสปอร์ต จำกัด</span>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">วิเคราะห์เปรียบเทียบงวดต้นทุนการดำเนินงาน ข้อมูลอัปเดตเรียลไทม์จากระบบ Google Sheet</p>
              </div>

              {/* Data Rows sheet alignment design */}
              <div className="space-y-4 font-serif text-slate-800 text-xs">
                {/* Section A: Revenue */}
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-slate-950 font-sans border-b border-slate-200 pb-1 uppercase tracking-wide">
                    <span>1. รายได้รวมงวดปฏิบัติงาน (Operational revenues)</span>
                    <span className="font-mono">{formatCurrency(totalInvoicesSum)}</span>
                  </div>
                  <div className="flex justify-between pl-4 text-slate-500">
                    <span>- รายได้จากการออกวางบิลค่าขนส่ง (คีย์ตามสลิปวางบิลทั้งหมด):</span>
                    <span className="font-mono">{formatCurrency(totalInvoicesSum)}</span>
                  </div>
                </div>

                {/* Section B: COGS Operating Expenses */}
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-slate-950 font-sans border-b border-slate-200 pb-1 mt-3 uppercase tracking-wide">
                    <span>2. ต้นทุนเดินทางดำเนินการขบวนขนส่ง (COGS Traveling cost)</span>
                    <span className="font-mono text-red-600">-{formatCurrency(totalCOGS)}</span>
                  </div>
                  <div className="flex justify-between pl-4 text-slate-500">
                    <span>- ค่าน้ำมันเชื้อเพลิงวิ่งงานสะสม:</span>
                    <span className="font-mono">-{formatCurrency(totalFuelCost)}</span>
                  </div>
                  <div className="flex justify-between pl-4 text-slate-500">
                    <span>- ค่าผ่านทางพิเศษ ด่านทางด่วนและมอเตอร์เวย์:</span>
                    <span className="font-mono">-{formatCurrency(totalRoadTollCost)}</span>
                  </div>
                  <div className="flex justify-between pl-4 text-slate-500">
                    <span>- ค่าตรวจเปลี่ยนอะไหล่ ซ่อมบำรุงหัวลากและหางลาก:</span>
                    <span className="font-mono">-{formatCurrency(totalMaintenanceCost)}</span>
                  </div>
                </div>

                {/* Section C: Overhead Salaries & Co-loader Partner expenses */}
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-slate-950 font-sans border-b border-slate-200 pb-1 mt-3 uppercase tracking-wide">
                    <span>3. ค่าใช้จ่ายเชิงออฟฟิศและคู่ค้าร่วม (Operating Overhead)</span>
                    <span className="font-mono text-red-650 text-red-600">-{formatCurrency(totalOverhead)}</span>
                  </div>
                  <div className="flex justify-between pl-4 text-slate-500 font-mono">
                    <span>- รายจ่ายการโอนจ่ายเงินเดือนพนักงานรวมทั้งหมด:</span>
                    <span>-{formatCurrency(totalPayrollPaid)}</span>
                  </div>
                  <div className="flex justify-between pl-4 text-slate-500 font-mono">
                    <span>- เคลียร์ยอดเงินโอนสัญญารถเช่า/ร่วมบริการ co-loader:</span>
                    <span>-{formatCurrency(totalCoWorkersPaid)}</span>
                  </div>
                  <div className="flex justify-between pl-4 text-slate-500 font-mono">
                    <span>- ค่าน้ำ ผลไม้ เบี้ยเลี้ยง ค่าอาหาร อื่น ๆ หน้าร้าน:</span>
                    <span>-{formatCurrency(totalOtherExpenses)}</span>
                  </div>
                </div>

                {/* Final Net Line Double-Line style like Excel sheet */}
                <div className="border-t-2 border-b-4 border-slate-900 py-3 mt-6 flex justify-between items-center bg-slate-950 text-white p-4 rounded-lg shadow-inner">
                  <span className="font-sans font-black uppercase text-sm tracking-widest text-slate-200">
                    กำไรสุทธิคงเหลือสะสม (NET MARGIN EARNINGS)
                  </span>
                  <span className={`font-mono text-lg font-black ${netEarnings >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(netEarnings)}
                  </span>
                </div>
              </div>

              {/* Printable Letterhead bottom details */}
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-serif pt-4">
                <span>จัดพิมพ์โดย: ระบบ Khemthit Ledger Hub</span>
                <span>ลายมือเซ็นต์พิจารณาและตรวจสอบ.................................</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Dynamic Creation Form Modal dependence on category tab */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col">
            <div className="bg-slate-950 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase font-sans tracking-wide">
                {activeFinTab === 'partners' ? 'เคลียร์งวดจ่ายรถพ่วงขนส่งร่วม' : activeFinTab === 'withholding' ? 'บันทึกใบคัดส่งประกันหักภาษี 3%/1%' : 'สรุปยอดทำบัญชีเงินเดือนพนักงาน'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-white bg-slate-850 p-1.5 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {/* Partner form schema */}
              {activeFinTab === 'partners' && (
                <div className="space-y-4 text-xs font-semibold">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-700 block">ผู้ให้บริการรถร่วม/รถเช่า</label>
                      <input type="text" value={pName} onChange={(e) => setPName(e.target.value)} placeholder="เช่น หจก. แฟลตเบดศรีราชาทีม" className="w-full text-xs text-slate-800 border border-slate-200 rounded p-2.5 outline-none" required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700 block">เลขแผนอ้างอิงงวดขนส่ง JobNo</label>
                      <input type="text" value={pJob} onChange={(e) => setPJob(e.target.value)} placeholder="JOB-xxxxx" className="w-full text-xs text-slate-800 border border-slate-200 rounded p-2.5 outline-none font-mono" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 font-mono">
                    <div className="space-y-1">
                      <label className="text-slate-700 block font-sans">รายได้ขั้นต้นหลัก (Revenue)</label>
                      <input type="number" min="0" value={pRevenue || ''} onChange={(e) => setPRevenue(parseFloat(e.target.value) || 0)} className="w-full text-xs text-slate-800 border border-slate-200 rounded p-2.5 outline-none font-bold" required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700 block font-sans">หักลบค่าใช้จ่ายสิ้นเปลืองสิทธิงาน</label>
                      <input type="number" min="0" value={pDeduction || ''} onChange={(e) => setPDeduction(parseFloat(e.target.value) || 0)} className="w-full text-xs text-slate-850 border border-slate-200 rounded p-2.5 outline-none" required />
                    </div>
                  </div>
                </div>
              )}

              {/* Withholding Tax form schema */}
              {activeFinTab === 'withholding' && (
                <div className="space-y-4 text-xs font-semibold">
                  <div className="space-y-1">
                    <label className="text-slate-700 block">ชื่อบริษัท/ผู้รับเงินปลาทาง</label>
                    <input type="text" value={wPayee} onChange={(e) => setWPayee(e.target.value)} placeholder="เช่น บจก. พลอจิสติคส์ ซัพพลายคอร์ป" className="w-full text-xs text-slate-800 border border-slate-200 rounded p-2.5" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-700 block">เลขประจำตัวผู้เสียภาษี 13 หลัก</label>
                      <input type="text" value={wTaxID} onChange={(e) => setWTaxID(e.target.value)} placeholder="02055xxxxxxxx" className="w-full text-xs border border-slate-200 rounded p-2.5 font-mono" required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700 block">อัตราคิดหักอัตโนมัติ (%)</label>
                      <select value={wRate} onChange={(e) => setWRate(parseInt(e.target.value) || 1)} className="w-full text-xs border border-slate-200 rounded p-2.5 font-mono font-bold">
                        <option value={1}>1% (ค่านายหน้า/บริการขนส่งทางบกเรือ)</option>
                        <option value={3}>3% (ค่าว้างทำของและจัดบริการวิชาชีพ)</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-700 block">มูลค่าฐานเงินก่อนหักภาษี (บาท)</label>
                      <input type="number" min="0" value={wBase || ''} onChange={(e) => setWBase(parseFloat(e.target.value) || 0)} className="w-full text-xs border border-slate-200 rounded p-2.5 font-mono font-bold" required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700 block">ประเภทกลุ่มภาษีทำจ้าง</label>
                      <select value={wType} onChange={(e) => setWType(e.target.value as any)} className="w-full text-xs border border-slate-200 rounded p-2.5">
                        <option value="Transportation">Transportation (ค่าขนส่ง)</option>
                        <option value="Service">Service (บริการงานช่างเทคนิค)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Payroll salary form schema */}
              {activeFinTab === 'payroll' && (
                <div className="space-y-4 text-xs font-semibold">
                  <div className="space-y-1">
                    <label className="text-slate-700 block">เลือกรายชื่อพนักงานที่ต้องการคำนวณเงินเดือน</label>
                    <select
                      value={payTargetId}
                      onChange={(e) => setPayTargetId(e.target.value)}
                      className="w-full text-xs bg-white text-slate-800 border border-slate-200 rounded p-2.5 outline-none"
                      required
                    >
                      <option value="">-- กรุณาเลือกคนขับ หรือ พนักงาน --</option>
                      <optgroup label="พนักงานขับรถขนส่ง (ฐานเริ่มต้น 15,000 บาท)">
                        {drivers.map(d => (
                          <option key={d.id} value={d.id}>{d.name} ({d.id})</option>
                        ))}
                      </optgroup>
                      <optgroup label="พนักงานประจำสำนักงาน">
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name} (เงินเดือน: {emp.salary} บาท)</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-3 font-mono">
                    <div className="space-y-1">
                      <label className="text-slate-700 font-sans block">ค่าล่วงเวลา (OT)</label>
                      <input type="number" min="0" value={payOt || ''} onChange={(e) => setPayOt(parseFloat(e.target.value) || 0)} className="w-full text-xs border border-slate-200 rounded p-2.5 text-right text-slate-700" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700 font-sans block">โบนัสพนักงาน</label>
                      <input type="number" min="0" value={payBonus || ''} onChange={(e) => setPayBonus(parseFloat(e.target.value) || 0)} className="w-full text-xs border border-slate-200 rounded p-2.5 text-right text-emerald-700" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700 font-sans block text-red-500">หักขาด ลา มาสาย</label>
                      <input type="number" min="0" value={payDeduction || ''} onChange={(e) => setPayDeduction(parseFloat(e.target.value) || 0)} className="w-full text-xs border border-slate-200 rounded p-2.5 text-right text-red-600" />
                    </div>
                  </div>
                </div>
              )}

              {/* Shared footer buttons */}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 font-bold text-xs uppercase tracking-wide">
                <button type="button" onClick={() => setIsFormOpen(false)} className="bg-slate-100 text-slate-700 font-bold border border-slate-350 p-2.0 px-4 rounded">ยกเลิกปิดรับ</button>
                <button type="submit" className="bg-slate-950 text-white font-bold p-2.0 px-5 rounded">ประมวลผลเซฟตี้</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Payslip Preview block */}
      {previewPayrollSlip && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-xl shadow-md no-print">
            <div className="flex items-center gap-2">
              <Printer className="text-indigo-400 w-5 h-5" />
              <div>
                <h3 className="font-extrabold text-sm uppercase">สลิปเงินเดือนรายบุคคล (PAYSLIP PRINT)</h3>
                <p className="text-xs text-slate-400">สลิปเงินเดือนแสดงรายละเอียดของโบนัสและหักขาดสายนำไปจัดทำซองจดหมาย</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintSlip}
                className="bg-indigo-600 hover:bg-indigo-505 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" /> สั่งพิมพ์ (Print)
              </button>
              <button
                onClick={handlePrintSlip}
                className="bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer shadow-sm"
              >
                <FileText className="w-3.5 h-3.5 text-red-500" /> บันทึก/ส่งออก PDF (Export PDF)
              </button>
              <button
                onClick={() => setPreviewPayrollSlip(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-2 px-4 rounded-lg transition-colors border border-slate-705 cursor-pointer"
              >
                ย้อนกลับ (Close)
              </button>
            </div>
          </div>

          {/* PDF/Print Guidelines Alert Banner */}
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-xs flex items-start gap-2.5 max-w-2xl mx-auto no-print shadow-sm">
            <span className="text-base shrink-0 leading-none">💡</span>
            <div className="space-y-1">
              <div className="font-bold text-amber-950">คำแนะนำการพิมพ์และการดาวน์โหลดเอกสาร PDF จากเบราว์เซอร์:</div>
              <ul className="list-disc pl-4 space-y-0.5 text-amber-900 leading-relaxed font-sans">
                <li>เมื่อหน้าต่างพิมพ์ปรากฏขึ้น ให้เลือกเปลี่ยน <strong>"ปลายทาง" (Destination)</strong> เป็น <strong>"บันทึกเป็น PDF" (Save as PDF)</strong> สำหรับส่งออกไฟล์</li>
                <li>ภายใต้หัวข้อการตั้งค่าเพิ่มเติม ตรวจสอบให้แน่ใจว่าได้คลิกทำเครื่องหมายที่ <strong>"กราฟิกพื้นหลัง" (Background graphics)</strong> เพื่อแสดงสี พื้นหลัง และเส้นขอบตารางที่สมบูรณ์</li>
              </ul>
            </div>
          </div>

          <div className="bg-white text-slate-950 p-8 md:p-10 border border-slate-350 shadow-lg rounded-xl max-w-2xl mx-auto font-sans text-xs relative leading-relaxed overflow-x-auto print-view">
            <style>
              {`
                @media print {
                  body {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  body * {
                    visibility: hidden;
                  }
                  .print-view, .print-view * {
                    visibility: visible;
                  }
                  .print-view {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    border: none;
                    box-shadow: none;
                    padding: 0;
                    margin: 0;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                }
              `}
            </style>

            {/* Payslip Logo and company title alignment */}
            <div className="border-b-2 border-slate-900 pb-4 text-center">
              <h2 className="text-sm font-black text-slate-950 uppercase block tracking-wider">บริษัท เข็มทิศ ทานสปอร์ต จำกัด</h2>
              <span className="text-[11px] font-medium text-slate-500 block">102/51 หมู่ 10 ต.ทุ่งสุขลา อ.ศรีราชา จ.ชลบุรี 20230</span>
              <h3 className="text-xs bg-slate-950 text-white font-bold p-1 px-4 rounded mt-3 inline-block uppercase tracking-widest font-mono">
                ใบสำคัญจ่ายเงินเดือน / PAY SLIP
              </h3>
            </div>

            {/* Employee profile metadata */}
            <div className="grid grid-cols-2 gap-4 py-4 text-[11px] font-sans border-b border-slate-200">
              <div className="space-y-1 block">
                <div>รหัสพนักงาน: <span className="font-bold underline">{previewPayrollSlip.employeeId}</span></div>
                <div>ชื่อพนักงาน: <span className="font-bold text-slate-900">{previewPayrollSlip.employeeName}</span></div>
                <div>ประเภทฝ่าย: <span className="font-bold">{previewPayrollSlip.role === 'Driver' ? 'พนักงานดูแลรถหัวลากเทรลเลอร์' : 'พนักงานประจำธุรการออฟฟิศ'}</span></div>
              </div>
              <div className="text-right space-y-1 font-mono">
                <div>งวดวันที่จ่ายเงินเดือน: <span className="font-bold text-slate-800">{previewPayrollSlip.payDate}</span></div>
                <div>ช่องทางจ่ายเงิน: โอนผ่านเงินฝากกระแสธนาคาร</div>
              </div>
            </div>

            {/* Base Ledger Sheet style columns for base pay & deductions */}
            <div className="grid grid-cols-2 gap-6 py-4">
              {/* Earnings column */}
              <div className="space-y-2 border-r border-slate-200 pr-4">
                <span className="font-black text-slate-900 block border-b pb-1 font-sans">รายได้ที่รับ (EARNINGS)</span>
                <div className="flex justify-between font-mono">
                  <span>- เงินเดือนจ้างหลัก:</span>
                  <span>{formatCurrency(previewPayrollSlip.salary)}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>- ค่าล่วงเวลาการทำงาน (OT):</span>
                  <span>{formatCurrency(previewPayrollSlip.ot)}</span>
                </div>
                <div className="flex justify-between font-mono text-emerald-600">
                  <span>- โบนัสรางวัลพนักงาน:</span>
                  <span>{formatCurrency(previewPayrollSlip.bonus)}</span>
                </div>
              </div>

              {/* Deductions column */}
              <div className="space-y-2 pl-4">
                <span className="font-black text-slate-900 block border-b pb-1 font-sans text-red-650 text-red-500">รายหักค้างจ่าย (DEDUCTIONS)</span>
                <div className="flex justify-between font-mono">
                  <span>- หักขาด งาน ลา มาสาย:</span>
                  <span className="text-red-600">-{formatCurrency(previewPayrollSlip.deduction)}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>- อื่นๆ (เบิกงวดเงินสำรอง):</span>
                  <span>{formatCurrency(0)}</span>
                </div>
              </div>
            </div>

            {/* Net Salary summary wrapped with beautiful frame */}
            <div className="border-t-2 border-b-4 border-slate-950 py-3 mt-4 flex justify-between items-center bg-slate-50 p-4 rounded text-[11px] font-sans font-extrabold text-slate-900">
              <span className="uppercase tracking-wider">เงินได้สุทธิสะสมงวดนี้ (NET SALARY TRANSFER):</span>
              <span className="text-indigo-700 text-sm font-bold font-mono">{formatCurrency(previewPayrollSlip.netSalary)}</span>
            </div>

            <div className="border-2 border-dashed border-slate-400 p-3 rounded bg-slate-50/50 mt-4 text-center">
              <span className="text-xs font-semibold text-slate-800">
                ({arabicToThaiBaht(previewPayrollSlip.netSalary)})
              </span>
            </div>

            {/* Footer with sign line */}
            <div className="flex justify-between items-center text-[9px] text-slate-400 pt-16 font-serif">
              <div className="text-center w-36">
                <div className="border-b border-slate-350 h-1 mb-1"></div>
                <span>ผู้โอนชำระเงินคลังบัญชี</span>
              </div>
              <div className="text-center w-36">
                <div className="border-b border-slate-350 h-1 mb-1"></div>
                <span>ลงนามพนักงานผู้ยินยอมรับ</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
