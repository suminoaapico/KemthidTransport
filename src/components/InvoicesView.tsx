import React, { useState } from 'react';
import { 
  Plus, Edit2, Trash2, Search, X, FileText, Printer, Save, 
  HelpCircle, Layers, Check, Calculator, ChevronRight
} from 'lucide-react';
import { Invoice, Customer, TransportJob, ContainerDetail, AdvanceItem } from '../types';
import { arabicToThaiBaht, formatCurrency, getStatusStyle } from '../utils';

function formatInvoiceDate(dateStr: string) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

export function calculateInvoiceTotals(invoiceType: 'Transport' | 'Advance', containers: ContainerDetail[], advanceItems: AdvanceItem[]) {
  let subtotal = 0;
  let withholdingTax = 0;
  let vatAmount = 0;
  let grandTotal = 0;

  if (invoiceType === 'Transport') {
    let transportSum = 0;
    let overtimeSum = 0;
    let xraySum = 0;
    let otherSum = 0;

    containers.forEach(c => {
      transportSum += c.transportation || 0;
      
      let hasOvertimeInExpenses = false;
      let hasXrayInExpenses = false;
      if (c.expenses) {
        hasOvertimeInExpenses = c.expenses.some(exp => exp.name === 'Overtime');
        hasXrayInExpenses = c.expenses.some(exp => exp.name === 'X-ray' || exp.name === 'X-rey' || exp.name === 'ค่า X-ray' || exp.name === 'ค่า X-rey');
      }

      // legacy fields
      otherSum += (c.portCharge || 0) + (c.containerHandling || 0) + (c.liftOnOff || 0);
      if (c.otherExpenseAmount && c.otherExpenseAmount > 0) {
        const name = c.otherExpenseName || '';
        if (name === 'Overtime') {
          if (!hasOvertimeInExpenses) {
            overtimeSum += c.otherExpenseAmount;
          }
        } else if (name === 'X-ray' || name === 'X-rey' || name === 'ค่า X-ray' || name === 'ค่า X-rey') {
          if (!hasXrayInExpenses) {
            xraySum += c.otherExpenseAmount;
          }
        } else {
          otherSum += c.otherExpenseAmount;
        }
      }

      if (c.expenses) {
        c.expenses.forEach(exp => {
          const name = exp.name || '';
          if (name === 'Overtime') {
            overtimeSum += exp.amount || 0;
          } else if (name === 'X-ray' || name === 'X-rey' || name === 'ค่า X-ray' || name === 'ค่า X-rey') {
            xraySum += exp.amount || 0;
          } else {
            otherSum += exp.amount || 0;
          }
        });
      }
    });

    subtotal = transportSum + overtimeSum + xraySum + otherSum;
    withholdingTax = Math.round((transportSum + overtimeSum + xraySum) * 0.01 * 100) / 100;
    vatAmount = 0;
    grandTotal = subtotal - withholdingTax;
  } else {
    subtotal = advanceItems.reduce((sum, item) => sum + item.amount, 0);
    withholdingTax = 0;
    vatAmount = Math.round(subtotal * 0.07 * 100) / 100;
    grandTotal = subtotal + vatAmount;
  }

  return { subtotal, withholdingTax, vatAmount, grandTotal };
}

interface InvoicesViewProps {
  invoices: Invoice[];
  customers: Customer[];
  jobs: TransportJob[];
  onSaveInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceNo: string) => void;
}

export function InvoicesView({ invoices, customers, jobs, onSaveInvoice, onDeleteInvoice }: InvoicesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form State
  const [invoiceNo, setInvoiceNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerId, setCustomerId] = useState('');
  const [jobNo, setJobNo] = useState(''); // job linked to
  const [invoiceType, setInvoiceType] = useState<Invoice['invoiceType']>('Transport');
  const [bookingNo, setBookingNo] = useState('');
  const [shipper, setShipper] = useState('');
  
  // Custom list of containers (Imported or added manually)
  const [containers, setContainers] = useState<ContainerDetail[]>([]);
  
  // Custom list of advance payment items
  const [advanceItems, setAdvanceItems] = useState<AdvanceItem[]>([]);

  // Filter and Search
  const filteredInvoices = invoices.filter(i => 
    i.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.invoiceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setIsEditMode(false);
    setInvoiceNo(`INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(4, '0')}`);
    setDate(new Date().toISOString().split('T')[0]);
    setCustomerId(customers[0]?.id || '');
    setJobNo('');
    setInvoiceType('Transport');
    setBookingNo('');
    setShipper('');
    setContainers([]);
    setAdvanceItems([{ id: 'ADV-I-001', description: 'ค่าผ่านประตูท่าเรือแหลมฉบัง LCB', amount: 1200 }]);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  // Import containers directly from a selected Job to save time!
  const handleImportJobDetails = (jobNum: string) => {
    const job = jobs.find(j => j.jobNo === jobNum);
    if (job) {
      setCustomerId(job.customerId);
      setBookingNo(job.bookingNo);
      setShipper(job.shipper);
      setContainers(job.containers.map(c => ({ ...c })));
    }
  };

  const handleAddAdvanceItem = () => {
    const nextId = `ADV-I-${String(advanceItems.length + 1).padStart(3, '0')}`;
    setAdvanceItems([...advanceItems, { id: nextId, description: '', amount: 0 }]);
  };

  const handleRemoveAdvanceItem = (index: number) => {
    if (advanceItems.length === 1) return;
    setAdvanceItems(advanceItems.filter((_, i) => i !== index));
  };

  const updateAdvanceItemField = (index: number, field: keyof AdvanceItem, value: any) => {
    const updated = [...advanceItems];
    if (field === 'description') {
      updated[index][field] = value;
    } else {
      updated[index][field] = parseFloat(value) || 0;
    }
    setAdvanceItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCust = customers.find(c => c.id === customerId);
    if (!selectedCust) {
      alert("กรุณาเลือกชื่อลูกค้าในระบบ");
      return;
    }

    let subtotal = 0;
    let withholdingTax = 0;
    let vatAmount = 0;
    let grandTotal = 0;

    const totals = calculateInvoiceTotals(invoiceType, containers, advanceItems);
    subtotal = totals.subtotal;
    withholdingTax = totals.withholdingTax;
    vatAmount = totals.vatAmount;
    grandTotal = totals.grandTotal;

    const totalText = arabicToThaiBaht(grandTotal);

    const originalStatus = isEditMode
      ? (invoices.find(i => i.invoiceNo === invoiceNo)?.status || 'ยังไม่จ่าย')
      : 'ยังไม่จ่าย';

    const newInvoice: Invoice = {
      invoiceNo,
      date,
      customerId,
      customerName: selectedCust.name,
      jobNo,
      invoiceType,
      bookingNo,
      shipper,
      containers: invoiceType === 'Transport' ? containers : [],
      advanceItems: invoiceType === 'Advance' ? advanceItems : [],
      subtotal,
      withholdingTax,
      vatAmount,
      grandTotal,
      totalText,
      status: originalStatus
    };

    onSaveInvoice(newInvoice);
    setIsFormOpen(false);
  };

  // Launch browser printing engine
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* List / Control Bar */}
      {!isFormOpen && !previewInvoice && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-800 font-sans flex items-center gap-1.5">
                <FileText className="text-indigo-600 w-5 h-5" />
                ใบแจ้งหนี้เพื่อการวางบิล (Billing & Invoices)
              </h2>
              <p className="text-slate-400 text-xs">ออกใบแจ้งหนี้ค่าขนส่ง (หัก ณ ที่จ่าย 1% มี/ไม่มีตู้) หรือ ใบวางเงินรับทดรองจ่าย (บวก VAT 7%)</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="ค้นหาตามใบวางบิล..."
                  className="bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 pl-9 pr-4 py-2 rounded-lg border border-slate-200 outline-none w-full sm:w-48 transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={handleOpenAdd}
                className="flex items-center gap-1 bg-slate-900 text-white font-semibold text-xs py-2 px-3.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-4 h-4" /> สร้างใบแจ้งหนี้
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100/90 font-mono text-slate-700">
                    <th className="p-2 border border-slate-200 font-bold whitespace-nowrap text-center">เลขใบแจ้งหนี้ No</th>
                    <th className="p-2 border border-slate-200 font-semibold text-center whitespace-nowrap">วันที่ออก</th>
                    <th className="p-2 border border-slate-200 font-semibold whitespace-nowrap">ชื่อลูกค้าเรียกเก็บเงิน</th>
                    <th className="p-2 border border-slate-200 font-semibold text-center whitespace-nowrap">ประเภทบัญชีกลุ่ม</th>
                    <th className="p-2 border border-slate-200 font-semibold text-right whitespace-nowrap">ยอดก่อนภาษี</th>
                    <th className="p-2 border border-slate-200 font-semibold text-right whitespace-nowrap">WHT (1%)</th>
                    <th className="p-2 border border-slate-200 font-semibold text-right whitespace-nowrap">VAT (7%)</th>
                    <th className="p-2 border border-slate-200 font-semibold text-right text-slate-950 whitespace-nowrap">ยอดชำระสุทธิ</th>
                    <th className="p-2 border border-slate-200 font-semibold text-center whitespace-nowrap">สถานะวางบิล</th>
                    <th className="p-2 border border-slate-200 text-center whitespace-nowrap">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-6 text-center text-slate-400 font-mono border border-slate-200">
                        ยังไม่มีใบแจ้งหนี้เข้าระบบ (สามารถกดปุ่ม "+ สร้างใบแจ้งหนี้")
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.invoiceNo} className="hover:bg-slate-100/40 transition-colors odd:bg-white even:bg-slate-50/70">
                        <td className="p-2 border border-slate-200 font-mono font-bold align-middle text-center text-indigo-700">{inv.invoiceNo}</td>
                        <td className="p-2 border border-slate-200 font-mono text-center text-slate-500 whitespace-nowrap align-middle">
                          {inv.date}
                        </td>
                        <td className="p-2 border border-slate-200 align-middle font-semibold text-slate-900">
                          {inv.customerName}
                        </td>
                        <td className="p-2 border border-slate-200 text-center align-middle whitespace-nowrap font-sans">
                          {inv.invoiceType === 'Transport' ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-250 px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide font-mono">
                              ค่าขนส่ง (หัก 1%)
                            </span>
                          ) : (
                            <span className="bg-indigo-50 text-indigo-700 border border-indigo-255 px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide font-mono">
                              เงินทดรอง (VAT 7%)
                            </span>
                          )}
                        </td>
                        <td className="p-2 border border-slate-200 text-right font-mono text-slate-600 align-middle">
                          {formatCurrency(inv.subtotal)}
                        </td>
                        <td className="p-2 border border-slate-200 text-right font-mono text-red-600 align-middle">
                          {inv.withholdingTax > 0 ? `-${formatCurrency(inv.withholdingTax)}` : '0.00'}
                        </td>
                        <td className="p-2 border border-slate-200 text-right font-mono text-emerald-600 align-middle">
                          {inv.vatAmount > 0 ? `+${formatCurrency(inv.vatAmount)}` : '0.00'}
                        </td>
                        <td className="p-2 border border-slate-200 text-right font-mono font-extrabold text-slate-900 align-middle whitespace-nowrap text-sm">
                          {formatCurrency(inv.grandTotal)}
                        </td>
                        <td className="p-2 border border-slate-200 text-center align-middle whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyle(inv.status)}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-2 border border-slate-200 text-center align-middle whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button 
                              onClick={() => setPreviewInvoice(inv)}
                              className="bg-indigo-55 hover:bg-indigo-150 border border-indigo-200 text-indigo-700 font-bold px-2 py-1 rounded text-[11px] transition-colors"
                            >
                              พิมพ์ (PDF)
                            </button>
                            <button 
                              onClick={() => {
                                setIsEditMode(true);
                                setInvoiceNo(inv.invoiceNo);
                                setDate(inv.date);
                                setCustomerId(inv.customerId || '');
                                setJobNo(inv.jobNo || '');
                                setInvoiceType(inv.invoiceType);
                                setBookingNo(inv.bookingNo || '');
                                setShipper(inv.shipper || '');
                                setContainers(inv.containers || []);
                                setAdvanceItems(inv.advanceItems || []);
                                setIsFormOpen(true);
                              }}
                              className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 p-1 rounded-lg transition-colors"
                              title="แก้ไขใบวางบิล"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => {
                                if (confirm(`ต้องการลบข้อมูลใบวางบิลเลขที่ ${inv.invoiceNo} หรือไม่?`)) {
                                  onDeleteInvoice(inv.invoiceNo);
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
        </>
      )}

      {/* Creation / Edit Invoice Mode Form */}
      {isFormOpen && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-800 font-sans block">
                {isEditMode ? `แก้ไขรายละเอียดใบวางบิลเลขที่: ${invoiceNo}` : 'สร้างเอกสารใบวางบิล / ใบแจ้งหนี้ใหม่'}
              </h3>
              <p className="text-slate-400 text-xs text-slate-500">เลือกประเภทการวางบิล และทำตามสูตรหัก ณ ที่จ่าย 1% หรือ บวกภาษีมูลค่าเพิ่ม 7% อย่างถูกต้อง</p>
            </div>
            <button 
              onClick={() => setIsFormOpen(false)}
              className="text-slate-400 hover:text-slate-800 bg-slate-100 p-1.5 rounded-lg transition-colors border border-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Split Type Selector */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">บิลประเภทอะไร ? (Invoice Style)</label>
                <select
                  value={invoiceType}
                  onChange={(e) => {
                    setInvoiceType(e.target.value as any);
                    setContainers([]);
                    setAdvanceItems([{ id: 'ADV-I-001', description: '', amount: 0 }]);
                  }}
                  className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-400"
                  disabled={isEditMode}
                >
                  <option value="Transport">บิลแบบ ค่าขนส่ง (TRANSPORT: หัก 1%, NO VAT)</option>
                  <option value="Advance">บิลแบบ เงินทดรองจ่าย (ADVANCE: VAT 7%, NO หักภาษี)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">เลขที่อ้างอิงใบแจ้งหนี้ No</label>
                <input 
                  type="text" 
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  className="w-full text-xs bg-slate-100 font-mono text-slate-600 font-bold border border-slate-200 rounded-lg p-2.5 outline-none"
                  required
                  readOnly={isEditMode}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">วันที่ออกเอกสาร</label>
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">เลือก บริษัท ของลูกค้าผู้รับเงิน</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full text-xs text-slate-800 bg-white border border-slate-300 rounded-lg p-2.5 outline-none"
                  required
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.company})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Import from Job Scheduler block */}
            <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="font-extrabold text-xs text-indigo-900 font-sans block">นำเข้าข้อมูลตู้จากตารางงาน (Import Logistics Job Profile)</span>
                <span className="text-[11px] text-indigo-700">อำนวยความสะดวก: นำเข้าบัญชีตู้คอนเทนเนอร์ Booking เที่ยววิ่งอัตโนมัติ ไม่ต้องกรอกใหม่</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={jobNo}
                  onChange={(e) => {
                    setJobNo(e.target.value);
                    handleImportJobDetails(e.target.value);
                  }}
                  className="text-xs bg-white text-indigo-850 p-2.5 rounded-lg border border-indigo-200 outline-none font-bold"
                >
                  <option value="">-- กรุณาเลือกประวัติงานขนส่ง --</option>
                  {jobs.map(j => (
                    <option key={j.jobNo} value={j.jobNo}>{j.jobNo} ({j.customerName})</option>
                  ))}
                </select>
                {jobNo && (
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-1.5 rounded-lg whitespace-nowrap">
                    นำเข้าสำเร็จ!
                  </span>
                )}
              </div>
            </div>

            {/* Shipper & Booking (Optional for both but useful for layout) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">ผู้จัดส่งเรือ (Shipper - หัว PDF)</label>
                <input 
                  type="text" 
                  value={shipper}
                  onChange={(e) => setShipper(e.target.value)}
                  placeholder="เช่น HAPAG-LLOYD CONTAINER SHIPPING"
                  className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">หมายเลข Booking No (หัว PDF)</label>
                <input 
                  type="text" 
                  value={bookingNo}
                  onChange={(e) => setBookingNo(e.target.value)}
                  placeholder="เช่น BK-M9281A"
                  className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none bg-white"
                />
              </div>
            </div>

            {/* Custom Interactive Table Based on Selection Type */}
            {invoiceType === 'Transport' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="font-extrabold text-sm text-slate-800 font-sans block">ตารางบัญชีกรอกค่าระวางขนส่งแยกคอนเทนเนอร์</h4>
                  <button
                    type="button"
                    onClick={() => setContainers([...containers, { containerNo: '', transportation: 4000, portCharge: 0, containerHandling: 0, liftOnOff: 0 }])}
                    className="text-xs bg-slate-100 hover:bg-slate-200 font-bold p-1.5 px-3 rounded-lg border border-slate-300"
                  >
                    + เพิ่มหมายเลขตู้คอนเทนเนอร์ในบิล
                  </button>
                </div>

                <div className="space-y-3">
                  {containers.length === 0 ? (
                    <div className="text-center p-6 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 text-xs">
                      กรุณากด นำเข้าราชการงานด้านบน หรือ กด "เพิ่มหมายเลขตู้" ด้วยตนเอง
                    </div>
                  ) : (
                    containers.map((c, idx) => (
                      <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 relative">
                        <button
                          type="button"
                          onClick={() => setContainers(containers.filter((_, i) => i !== idx))}
                          className="absolute right-2 top-2 text-red-500 hover:text-red-700 bg-white border border-slate-200 p-1.5 rounded-lg text-xs"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-0.5">ตู้คอนเทนเนอร์ No</label>
                            <input 
                              type="text" 
                              value={c.containerNo}
                              onChange={(e) => {
                                const list = [...containers];
                                list[idx].containerNo = e.target.value;
                                setContainers(list);
                              }}
                              placeholder="ตู้ที่..."
                              className="bg-white w-full text-xs font-mono font-bold border border-slate-200 rounded p-2 outline-none"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Transportation Fee</label>
                            <input 
                              type="number" 
                              value={c.transportation || ''}
                              onChange={(e) => {
                                const list = [...containers];
                                list[idx].transportation = parseFloat(e.target.value) || 0;
                                setContainers(list);
                              }}
                              className="bg-white w-full text-xs font-mono font-bold border border-slate-200 rounded p-2 outline-none text-right"
                              required
                            />
                          </div>
                        </div>

                        {/* Dynamic Expenses for Container - dropdown list of other charges */}
                        <div className="border border-slate-200/85 bg-slate-50/50 p-4 rounded-xl space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                            <span className="text-xs font-bold text-slate-700 block">
                              รายการค่าบริการ / ค่าใช้จ่ายอื่นๆ เพิ่มเติม
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const list = [...containers];
                                if (!list[idx].expenses) {
                                  list[idx].expenses = [];
                                }
                                list[idx].expenses.push({ name: 'Life on / Life off', amount: 0, qty: 1, rate: 0 });
                                setContainers(list);
                              }}
                              className="text-[10px] bg-white hover:bg-slate-50 text-slate-700 font-bold py-1 px-2.5 rounded-md border border-slate-300 transition-colors flex items-center gap-1 shadow-sm"
                            >
                              + เพิ่มรายการค่าใช้จ่าย / บริการอื่นๆ
                            </button>
                          </div>

                          {(!c.expenses || c.expenses.length === 0) ? (
                            <div className="text-[10px] text-slate-400 italic text-center py-2 bg-white/50 border border-dashed border-slate-200 rounded-lg">
                              ไม่มีรายการค่าใช้จ่ายเพิ่มเติมในตู้นี้ (กดปุ่ม "+ เพิ่มรายการค่าใช้จ่าย / บริการอื่นๆ" เพื่อระบุเพิ่มเติม)
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {c.expenses.map((exp, expIdx) => {
                                const isOvertime = exp.name === 'Overtime';
                                const isXray = exp.name === 'X-ray' || exp.name === 'X-rey' || exp.name === 'ค่า X-ray' || exp.name === 'ค่า X-rey';
                                return (
                                  <div key={expIdx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-white p-3 rounded-lg border border-slate-200 shadow-xs items-end">
                                    {/* Select Dropdown for Expense Name */}
                                    <div className="sm:col-span-5 space-y-0.5 text-left">
                                      <label className="text-[9px] font-bold text-slate-500 block">เลือกประเภทค่าบริการ/ค่าใช้จ่าย</label>
                                      <select
                                        value={exp.name}
                                        onChange={(e) => {
                                          const list = [...containers];
                                          const item = list[idx].expenses![expIdx];
                                          item.name = e.target.value;
                                          setContainers(list);
                                        }}
                                        className="w-full text-xs text-slate-800 border border-slate-250 rounded p-1.5 outline-none font-semibold focus:border-indigo-500"
                                      >
                                        <option value="Life on / Life off">Life on / Life off</option>
                                        <option value="Port Charge">Port Charge</option>
                                        <option value="Gate Charge">Gate Charge</option>
                                        <option value="Shore">Shore</option>
                                        <option value="Drop">Drop</option>
                                        <option value="Overtime">Overtime</option>
                                        <option value="X-ray">X-ray (ค่าเอ็กซ์เรย์)</option>
                                        <option value="Container Handling">Container Handling</option>
                                        <option value="ADMISSION FEE">ADMISSION FEE</option>
                                        <option value="Other">Other (อื่นๆ)</option>
                                      </select>
                                    </div>

                                    {/* QTY input */}
                                    <div className="sm:col-span-2 space-y-0.5 text-left">
                                      <label className="text-[9px] font-bold text-slate-500 block text-right">จำนวน (QTY)</label>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={exp.qty !== undefined ? exp.qty : 1}
                                        onChange={(e) => {
                                          const list = [...containers];
                                          const item = list[idx].expenses![expIdx];
                                          const q = parseFloat(e.target.value) || 0;
                                          item.qty = q;
                                          item.amount = Math.round(q * (item.rate || 0) * 100) / 100;
                                          setContainers(list);
                                        }}
                                        className="w-full text-xs font-mono border border-slate-250 rounded p-1.5 outline-none text-right font-bold"
                                        placeholder="1"
                                      />
                                    </div>

                                    {/* Rate input */}
                                    <div className="sm:col-span-2 space-y-0.5 text-left">
                                      <label className="text-[9px] font-bold text-slate-500 block text-right">หน่วยละ (Rate)</label>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={exp.rate !== undefined ? exp.rate : ''}
                                        onChange={(e) => {
                                          const list = [...containers];
                                          const item = list[idx].expenses![expIdx];
                                          const r = parseFloat(e.target.value) || 0;
                                          item.rate = r;
                                          item.amount = Math.round((item.qty !== undefined ? item.qty : 1) * r * 100) / 100;
                                          setContainers(list);
                                        }}
                                        className="w-full text-xs font-mono border border-slate-250 rounded p-1.5 outline-none text-right font-bold"
                                        placeholder="0.00"
                                      />
                                    </div>

                                    {/* Net display */}
                                    <div className="sm:col-span-2 text-right space-y-0.5 text-left">
                                      <span className="text-[9px] font-bold text-slate-500 block text-right">จำนวนเงิน</span>
                                      <span className="text-xs font-mono font-bold text-slate-900 block bg-slate-50 border border-slate-200 p-1.5 rounded text-right min-h-[32px] flex items-center justify-end">
                                        {formatCurrency(exp.amount || 0)}
                                      </span>
                                    </div>

                                    {/* Action button */}
                                    <div className="sm:col-span-1 flex justify-center pb-0.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const list = [...containers];
                                          list[idx].expenses = list[idx].expenses!.filter((_, i) => i !== expIdx);
                                          setContainers(list);
                                        }}
                                        className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                                        title="ลบรายการนี้"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>

                                    {/* WHT Indicator row if Overtime or X-ray */}
                                    {(isOvertime || isXray) && (
                                      <div className="sm:col-span-12 mt-1 px-2 py-1 bg-red-50 rounded border border-red-100 text-[10px] text-red-600 font-mono font-bold flex justify-between items-center">
                                        <span>** หัก ณ ที่จ่าย 1% อัตโนมัติ ({exp.name})</span>
                                        <span>-{formatCurrency(Math.round((exp.amount || 0) * 0.01 * 100) / 100)} บ.</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="font-extrabold text-sm text-slate-800 font-sans block">ตารางรายการเบิกเงินชดเชยสำรองจ่ายล่วงหน้า (Advance Items)</h4>
                  <button
                    type="button"
                    onClick={handleAddAdvanceItem}
                    className="text-xs bg-slate-100 hover:bg-slate-200 font-bold p-1.5 px-3 rounded-lg border border-slate-300"
                  >
                    + เพิ่มรายจ่ายเบิกเงินสำรอง
                  </button>
                </div>

                <div className="space-y-3">
                  {advanceItems.map((item, idx) => (
                    <div key={item.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                      <button
                        type="button"
                        onClick={() => handleRemoveAdvanceItem(idx)}
                        className="absolute right-2 top-2 text-red-500 hover:text-red-700 bg-white border border-slate-200 p-1 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">รายละเอียดเงินทดรองจ่าย</label>
                        <input 
                          type="text"
                          value={item.description}
                          onChange={(e) => updateAdvanceItemField(idx, 'description', e.target.value)}
                          placeholder="เช่น คืนตู้อ้างอิงลาน KCD, ค่ายกยกเปล่าตู้ท่าเรือแหลมฉบัง"
                          className="w-full text-xs bg-white text-slate-800 border border-slate-200 rounded p-2.5 outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">จำนวนเงินในรายการ (บาท)</label>
                        <input 
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.amount || ''}
                          onChange={(e) => updateAdvanceItemField(idx, 'amount', e.target.value)}
                          className="w-full text-xs font-mono font-bold bg-white text-slate-900 text-right border border-slate-200 rounded p-2.5 outline-none"
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Calculations Summary Section */}
            {(() => {
              const totals = calculateInvoiceTotals(invoiceType, containers, advanceItems);
              return (
                <div className="bg-slate-950 text-white p-5 rounded-xl border border-slate-800 flex justify-end">
                  <div className="w-full sm:w-80 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">ค่าใช้จ่ายรวม/เบิกเงินสุทธิ:</span>
                      <span className="font-mono text-slate-200">
                        {formatCurrency(totals.subtotal)}
                      </span>
                    </div>
                    {invoiceType === 'Transport' ? (
                      <div className="flex justify-between text-red-400 font-semibold border-b border-slate-800 pb-2">
                        <span>หักภาษี ณ ที่จ่าย 1% สะสม:</span>
                        <span className="font-mono">
                          -{formatCurrency(totals.withholdingTax)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-emerald-400 font-semibold border-b border-slate-800 pb-2">
                        <span>บวกภาษีมูลค่าเพิ่ม VAT 7%:</span>
                        <span className="font-mono">
                          +{formatCurrency(totals.vatAmount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm pt-2 text-white font-extrabold font-mono font-bold">
                      <span>เงินรวมทำจ่ายสุทธิ:</span>
                      <span className="text-emerald-400">
                        {formatCurrency(totals.grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Cancel & Save Form Buttons */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
              <button 
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-4 rounded-lg border border-slate-200 transition-colors"
              >
                ยกเลิกบันทึกหลัก
              </button>
              <button 
                type="submit"
                className="flex items-center gap-1.5 bg-slate-900 text-white font-bold text-xs py-2 px-5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Save className="w-4 h-4" /> บันทึกและสรุปภาษี
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Elegant printable Invoice Preview card */}
      {previewInvoice && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-xl shadow-md no-print">
            <div className="flex items-center gap-2">
              <Printer className="text-indigo-400 w-5 h-5" />
              <div>
                <h3 className="font-extrabold text-sm uppercase">พิมพ์ใบกำกับวางบิล / ใบแจ้งหนี้</h3>
                <p className="text-xs text-slate-400">ใบแจ้งหนี้รูปแบบที่พิมพ์ลงบนหน้าจอกระดาษ A4 เสมือนจริง</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm font-sans"
              >
                <Printer className="w-3.5 h-3.5" /> สั่งพิมพ์ (Print)
              </button>
              <button
                onClick={handlePrint}
                className="bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer shadow-sm font-sans"
              >
                <FileText className="w-3.5 h-3.5 text-red-500" /> บันทึก/ส่งออก PDF (Export PDF)
              </button>
              <button
                onClick={() => setPreviewInvoice(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-2 px-4 rounded-lg transition-colors border border-slate-700 cursor-pointer font-sans"
              >
                ย้อนกลับ (Close)
              </button>
            </div>
          </div>

          {/* PDF/Print Guidelines Alert Banner */}
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-xs flex items-start gap-2.5 max-w-4xl mx-auto no-print shadow-sm">
            <span className="text-base shrink-0 leading-none">💡</span>
            <div className="space-y-1">
              <div className="font-bold text-amber-950">คำแนะนำการพิมพ์และการดาวน์โหลดเอกสาร PDF จากเบราว์เซอร์:</div>
              <ul className="list-disc pl-4 space-y-0.5 text-amber-900 leading-relaxed font-sans">
                <li>เมื่อหน้าต่างพิมพ์ปรากฏขึ้น ให้เลือกเปลี่ยน <strong>"ปลายทาง" (Destination)</strong> เป็น <strong>"บันทึกเป็น PDF" (Save as PDF)</strong> สำหรับส่งออกไฟล์</li>
                <li>ภายใต้หัวข้อการตั้งค่าเพิ่มเติม ตรวจสอบให้แน่ใจว่าได้คลิกทำเครื่องหมายที่ <strong>"กราฟิกพื้นหลัง" (Background graphics)</strong> เพื่อแสดงสี พื้นหลัง และเส้นขอบตารางที่สมบูรณ์</li>
              </ul>
            </div>
          </div>

          {/* Paper A4 Container design for real printing preview */}
          <div className="bg-white text-slate-900 p-8 md:p-12 border border-slate-350 shadow-lg rounded-xl max-w-4xl mx-auto font-sans text-xs relative leading-relaxed overflow-x-auto print-view">
            {/* Standard styles override for printing layout */}
            <style>
              {`
                @media print {
                  @page {
                    size: A4 portrait;
                    margin: 1.2cm;
                  }
                  body {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    background: white !important;
                    color: black !important;
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
                    width: 100% !important;
                    border: none !important;
                    box-shadow: none !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                }
              `}
            </style>

            {/* Corporate Header Section matching align (using non-stackable flex for absolute print fidelity) */}
            <div className="flex flex-row justify-between items-center gap-6 border-b border-slate-300 pb-5">
              <div className="flex gap-4 items-center">
                {/* Clear High-Definition Brand Logo from Google Drive */}
                <div className="w-24 h-24 flex items-center justify-center shrink-0">
                  <img 
                    src="https://lh3.googleusercontent.com/d/14sHmuOzVEZbKgOZP5p7COS1rfXJvi5w_" 
                    alt="บริษัท เข็มทิศ ทรานสปอร์ต จำกัด" 
                    className="w-full h-full object-contain filter drop-shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-1">
                  <h1 className="text-[15px] font-extrabold tracking-tight text-slate-900 block">บริษัท เข็มทิศ ทรานสปอร์ต จำกัด</h1>
                  <p className="text-slate-600 block text-[11px] font-medium font-sans">102/51 ม.10 ต.ทุ่งสุขลา อ.ศรีราชา จ.ชลบุรี 20230</p>
                  <div className="text-[11px] text-slate-600 space-y-0.5 block font-mono">
                    <div>เลขประจำตัวผู้เสียภาษี : <span className="font-bold text-slate-800">0205568017041</span></div>
                  </div>
                </div>
              </div>

              <div className="text-right space-y-2 shrink-0">
                <div className="text-right">
                  <h2 className="text-2xl font-black tracking-[0.1em] text-slate-900 font-serif leading-none">INVOICE</h2>
                  <p className="text-[11px] text-slate-800 font-bold mt-1 font-sans">ใบวางบิล/ใบแจ้งหนี้</p>
                </div>
                <div className="text-[11px] text-slate-600 space-y-0.5 pt-1 font-mono">
                  <div className="flex justify-end gap-4">
                    <span className="text-slate-500">เลขที่</span>
                    <span className="font-extrabold text-slate-900 w-24 text-left">{previewInvoice.invoiceNo}</span>
                  </div>
                  <div className="flex justify-end gap-4">
                    <span className="text-slate-500">วันที่</span>
                    <span className="font-extrabold text-slate-900 w-24 text-left">{formatInvoiceDate(previewInvoice.date)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Client address details (Locked 2-column layout to prevent vertical print stacking) */}
            <div className="grid grid-cols-2 gap-6 py-5 border-b border-slate-200">
              <div className="space-y-1">
                <span className="text-slate-400 text-[10px] font-bold block uppercase tracking-wider">Customers</span>
                <span className="text-sm font-bold text-slate-900 block">{previewInvoice.customerName}</span>
                <p className="text-slate-700 leading-relaxed text-[11px] font-medium font-sans">
                  ที่อยู่ : {customers.find(c => c.name === previewInvoice.customerName || c.company === previewInvoice.customerName)?.address || 'ต.ศรีราชา อ.ศรีราชา จ.ชลบุรี'}
                </p>
                <div className="text-slate-600 text-[11px] font-mono space-y-0.5">
                  <div>โทร : <span className="font-bold text-slate-850">{customers.find(c => c.name === previewInvoice.customerName || c.company === previewInvoice.customerName)?.phone || '081-xxxxxxx'}</span></div>
                  {customers.find(c => c.name === previewInvoice.customerName || c.company === previewInvoice.customerName)?.phone && (
                    <div>เลขประจำตัวผู้เสียภาษี : <span className="font-bold text-slate-850">0205560001196</span> (สำนักงานใหญ่)</div>
                  )}
                </div>
              </div>
              <div className="text-right">
                {/* Clean blank space on the right, as requested by arrow relocation */}
              </div>
            </div>

            {/* Invoiced Items Table */}
            <div className="py-4">
              {previewInvoice.invoiceType === 'Transport' ? (
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-t border-slate-400 text-slate-505 font-bold text-[10px] bg-slate-50/50">
                      <th className="p-2 w-16 text-center">ลำดับ<br/>Item</th>
                      <th className="p-2 min-w-[250px]">รายการ<br/>Description</th>
                      <th className="p-2 w-20 text-center">จำนวน<br/>Quantity</th>
                      <th className="p-2 w-28 text-right">หน่วยละ<br/>Unit</th>
                      <th className="p-2 w-32 text-right text-slate-950">จำนวนเงินสุทธิ<br/>Net Amount (Baht)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* First row relocate Shipper & Booking No to the start of item rows */}
                    {(previewInvoice.shipper || previewInvoice.bookingNo) && (
                      <tr className="border-b border-slate-200">
                        <td className="p-2 text-center"></td>
                        <td className="p-2 font-mono text-[11px] text-slate-700 bg-slate-50/15" colSpan={4}>
                          <div className="grid grid-cols-2 gap-x-12 py-1">
                            <div className="flex">
                              <span className="w-24 text-slate-400 font-sans font-bold">Shipper</span>
                              <span className="font-extrabold text-slate-800">{previewInvoice.shipper || '-'}</span>
                            </div>
                            <div className="flex">
                              <span className="w-24 text-slate-400 font-sans font-bold">Booking no.</span>
                              <span className="font-extrabold text-slate-800">{previewInvoice.bookingNo || '-'}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}

                    {previewInvoice.containers.map((c, containerIndex) => {
                      const charges = [];
                      if (c.transportation > 0) {
                        charges.push({ name: 'Transportation', amount: c.transportation, qty: 1, rate: c.transportation });
                      }
                      if (c.portCharge > 0) {
                        charges.push({ name: 'Port Charge', amount: c.portCharge, qty: 1, rate: c.portCharge });
                      }
                      if (c.containerHandling > 0) {
                        charges.push({ name: 'Container Handling', amount: c.containerHandling, qty: 1, rate: c.containerHandling });
                      }
                      if (c.liftOnOff > 0) {
                        charges.push({ name: 'Life on / Life off', amount: c.liftOnOff, qty: 1, rate: c.liftOnOff });
                      }

                      let hasOvertimeInExpenses = false;
                      let hasXrayInExpenses = false;
                      if (c.expenses) {
                        hasOvertimeInExpenses = c.expenses.some(exp => exp.name === 'Overtime');
                        hasXrayInExpenses = c.expenses.some(exp => exp.name === 'X-ray' || exp.name === 'X-rey' || exp.name === 'ค่า X-ray' || exp.name === 'ค่า X-rey');
                      }

                      if (c.otherExpenseAmount && c.otherExpenseAmount > 0) {
                        const name = c.otherExpenseName || '';
                        const isOvertime = name === 'Overtime';
                        const isXray = name === 'X-ray' || name === 'X-rey' || name === 'ค่า X-ray' || name === 'ค่า X-rey';

                        let shouldPush = true;
                        if (isOvertime && hasOvertimeInExpenses) {
                          shouldPush = false;
                        }
                        if (isXray && hasXrayInExpenses) {
                          shouldPush = false;
                        }

                        if (shouldPush) {
                          charges.push({ 
                            name: c.otherExpenseName || 'Other Charge / ค่าบริการอื่นๆ', 
                            amount: c.otherExpenseAmount,
                            qty: isOvertime ? (c.overtimeQty || 1) : 1,
                            rate: isOvertime ? (c.overtimeRate || c.otherExpenseAmount) : c.otherExpenseAmount
                          });
                        }
                      }
                      if (c.expenses) {
                        c.expenses.forEach(exp => {
                          if (exp.amount > 0) {
                            charges.push({ name: exp.name, amount: exp.amount, qty: 1, rate: exp.amount });
                          }
                        });
                      }

                      return (
                        <React.Fragment key={containerIndex}>
                          <tr className="font-bold border-none">
                            <td className="p-2 text-center text-slate-700 font-sans">{containerIndex + 1}</td>
                            <td className="p-2 font-semibold text-slate-950 font-mono">
                              Cntr no. &nbsp;&nbsp;&nbsp;&nbsp; {c.containerNo || '-'}
                            </td>
                            <td className="p-2 text-center"></td>
                            <td className="p-2 text-right"></td>
                            <td className="p-2 text-right"></td>
                          </tr>

                          {charges.map((ch, chIdx) => (
                            <tr key={chIdx} className="text-slate-600 border-none">
                              <td className="p-1 px-2 text-center"></td>
                              <td className="p-1 px-2 pl-8 font-serif italic text-slate-650">
                                {ch.name}
                              </td>
                              <td className="p-1 px-2 text-center font-mono text-[10px]">{ch.qty}</td>
                              <td className="p-1 px-2 text-right font-mono">{formatCurrency(ch.rate)}</td>
                              <td className="p-1 px-2 text-right font-mono">{formatCurrency(ch.amount)}</td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-t border-slate-400 text-slate-505 font-bold text-[10px] bg-slate-50/50">
                      <th className="p-2 w-16 text-center">ลำดับ<br/>Item</th>
                      <th className="p-2 min-w-[250px]">รายการ<br/>Description</th>
                      <th className="p-2 w-20 text-center">จำนวน<br/>Quantity</th>
                      <th className="p-2 w-28 text-right">หน่วยละ<br/>Unit</th>
                      <th className="p-2 w-32 text-right text-slate-950">จำนวนเงินสุทธิ<br/>Net Amount (Baht)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* First row relocate Shipper & Booking No to the start of item rows if present */}
                    {(previewInvoice.shipper || previewInvoice.bookingNo) && (
                      <tr className="border-b border-slate-200">
                        <td className="p-2 text-center"></td>
                        <td className="p-2 font-mono text-[11px] text-slate-700 bg-slate-50/15" colSpan={4}>
                          <div className="grid grid-cols-2 gap-x-12 py-1">
                            <div className="flex">
                              <span className="w-24 text-slate-400 font-sans font-bold">Shipper</span>
                              <span className="font-extrabold text-slate-800">{previewInvoice.shipper || '-'}</span>
                            </div>
                            <div className="flex">
                              <span className="w-24 text-slate-400 font-sans font-bold">Booking no.</span>
                              <span className="font-extrabold text-slate-800">{previewInvoice.bookingNo || '-'}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}

                    {previewInvoice.advanceItems.map((item, i) => (
                      <tr key={item.id} className="text-slate-800">
                        <td className="p-2.5 text-center font-mono">{i + 1}</td>
                        <td className="p-2.5 font-medium">{item.description}</td>
                        <td className="p-2.5 text-center font-mono text-[10px]">1</td>
                        <td className="p-2.5 text-right font-mono">{formatCurrency(item.amount)}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Calculations and Thai Baht words inside static grid elements, preventing line wrapping or massive vertical gaps */}
            <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-300 mt-2">
              <div className="col-span-2 flex items-center">
                <div className="w-full border-2 border-dotted border-slate-400 p-4 rounded bg-slate-50 flex items-center justify-center min-h-[50px] relative">
                  <span className="text-[10px] text-slate-400 font-bold absolute top-1 left-2 uppercase tracking-wide">จำนวนยอดเงินตัวอักษรไทย (Thai Baht Text)</span>
                  <span className="text-xs font-semibold text-slate-805 text-center font-serif leading-none">
                    -- {previewInvoice.totalText} --
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-[11px] border bg-slate-50/30 p-3 rounded-lg border-slate-200 font-mono">
                <div className="flex justify-between text-slate-500">
                  <span>รวมเงิน / Total</span>
                  <span className="font-bold">{formatCurrency(previewInvoice.subtotal)}</span>
                </div>
                {previewInvoice.invoiceType === 'Transport' ? (
                  <div className="flex justify-between text-red-650 font-semibold border-b border-slate-200 pb-1">
                    <span>ภาษีหัก ณ ที่จ่าย 1%</span>
                    <span>{formatCurrency(previewInvoice.withholdingTax)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-emerald-655 font-semibold border-b border-slate-200 pb-1">
                    <span>ภาษีมูลค่าเพิ่ม / Vat 7%</span>
                    <span>{formatCurrency(previewInvoice.vatAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-serif font-black text-slate-950 pt-1.5 border-t border-slate-200 font-mono">
                  <span>ยอดชำระ / Total Net</span>
                  <span className="text-slate-950 text-sm font-bold">{formatCurrency(previewInvoice.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Signatures Section */}
            <div className="grid grid-cols-2 gap-12 pt-12 text-center text-[10px] relative">
              <div className="space-y-10">
                <div className="h-6"></div>
                <div className="space-y-1.5">
                  <p className="font-bold flex justify-center gap-2">
                    <span>....................................................................</span>
                  </p>
                  <p className="font-bold text-slate-800">ผู้รับวางบิล</p>
                  <p className="text-slate-505 flex justify-center gap-1">
                    <span>วันที่</span>
                    <span>.............................../................../..................</span>
                  </p>
                </div>
              </div>
              <div className="space-y-10 relative flex flex-col items-center">
                {/* Stamp visual decoration matching KTT seal compass */}
                <div className="absolute right-1/4 -top-6 w-24 h-24 rounded-full border-4 border-slate-300 border-double p-0.5 flex flex-col items-center justify-center opacity-45 select-none pointer-events-none rotate-6 text-slate-500">
                  <div className="text-[7px] font-black tracking-widest leading-none text-center">KHEMTHIT<br/>TRANSPORT</div>
                  <svg viewBox="0 0 100 100" className="w-8 h-8 text-slate-500 my-0.5">
                    <polygon points="50,15 55,45 50,50" fill="currentColor" />
                    <polygon points="50,85 45,55 50,50" fill="currentColor" />
                    <polygon points="85,50 55,45 50,50" fill="currentColor" />
                    <polygon points="15,50 45,55 50,50" fill="currentColor" />
                  </svg>
                  <div className="text-[7px] font-black leading-none text-center">ผู้วางบิล<br/>APPROVED</div>
                </div>

                <div className="h-6"></div>
                
                <div className="space-y-1.5 w-full">
                  <p className="font-bold text-slate-800 leading-relaxed block">บริษัท เข็มทิศ ทรานสปอร์ต จำกัด</p>
                  <p className="font-bold flex justify-center gap-2">
                    <span>....................................................................</span>
                  </p>
                  <p className="font-bold text-slate-800">ผู้วางบิล</p>
                  <p className="text-slate-505 flex justify-center gap-1">
                    <span>วันที่</span>
                    <span>.............................../................../..................</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
