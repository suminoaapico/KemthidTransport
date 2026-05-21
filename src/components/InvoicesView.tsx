import React, { useState } from 'react';
import { 
  Plus, Edit2, Trash2, Search, X, FileText, Printer, Save, 
  HelpCircle, Layers, Check, Calculator, ChevronRight
} from 'lucide-react';
import { Invoice, Customer, TransportJob, ContainerDetail, AdvanceItem } from '../types';
import { arabicToThaiBaht, formatCurrency, getStatusStyle } from '../utils';

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

    if (invoiceType === 'Transport') {
      // TRANSPORT: 1% Withholding Tax, NO VAT
      subtotal = containers.reduce((sum, c) => 
        sum + c.transportation + c.portCharge + c.containerHandling + c.liftOnOff, 0
      );
      withholdingTax = Math.round(subtotal * 0.01 * 100) / 100;
      vatAmount = 0;
      grandTotal = subtotal - withholdingTax;
    } else {
      // ADVANCE: 7% VAT, NO Withholding Tax
      subtotal = advanceItems.reduce((sum, item) => sum + item.amount, 0);
      withholdingTax = 0;
      vatAmount = Math.round(subtotal * 0.07 * 100) / 100;
      grandTotal = subtotal + vatAmount;
    }

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
                      <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-5 gap-3 relative">
                        <button
                          type="button"
                          onClick={() => setContainers(containers.filter((_, i) => i !== idx))}
                          className="absolute right-2 top-2 text-red-500 hover:text-red-700 bg-white border border-slate-200 p-1.5 rounded-lg text-xs"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Port Charge</label>
                          <input 
                            type="number" 
                            value={c.portCharge || ''}
                            onChange={(e) => {
                              const list = [...containers];
                              list[idx].portCharge = parseFloat(e.target.value) || 0;
                              setContainers(list);
                            }}
                            className="bg-white w-full text-xs font-mono border border-slate-200 rounded p-2 outline-none text-right"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Handling Fee</label>
                          <input 
                            type="number" 
                            value={c.containerHandling || ''}
                            onChange={(e) => {
                              const list = [...containers];
                              list[idx].containerHandling = parseFloat(e.target.value) || 0;
                              setContainers(list);
                            }}
                            className="bg-white w-full text-xs font-mono border border-slate-200 rounded p-2 outline-none text-right"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Lift On/Off</label>
                          <input 
                            type="number" 
                            value={c.liftOnOff || ''}
                            onChange={(e) => {
                              const list = [...containers];
                              list[idx].liftOnOff = parseFloat(e.target.value) || 0;
                              setContainers(list);
                            }}
                            className="bg-white w-full text-xs font-mono border border-slate-200 rounded p-2 outline-none text-right"
                          />
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
            <div className="bg-slate-950 text-white p-5 rounded-xl border border-slate-800 flex justify-end">
              <div className="w-full sm:w-80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">ค่าใช้จ่ายรวม/เบิกเงินสุทธิ:</span>
                  <span className="font-mono text-slate-200">
                    {formatCurrency(
                      invoiceType === 'Transport' 
                        ? containers.reduce((sum, c) => sum + c.transportation + c.portCharge + c.containerHandling + c.liftOnOff, 0)
                        : advanceItems.reduce((sum, item) => sum + item.amount, 0)
                    )}
                  </span>
                </div>
                {invoiceType === 'Transport' ? (
                  <div className="flex justify-between text-red-400 font-semibold border-b border-slate-800 pb-2">
                    <span>หักภาษี ณ ที่จ่าย 1% สะสม:</span>
                    <span className="font-mono">
                      -{formatCurrency(
                        Math.round(containers.reduce((sum, c) => sum + c.transportation + c.portCharge + c.containerHandling + c.liftOnOff, 0) * 0.01 * 100) / 100
                      )}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between text-emerald-400 font-semibold border-b border-slate-800 pb-2">
                    <span>บวกภาษีมูลค่าเพิ่ม VAT 7%:</span>
                    <span className="font-mono">
                      +{formatCurrency(
                        Math.round(advanceItems.reduce((sum, item) => sum + item.amount, 0) * 0.07 * 100) / 100
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-2 text-white font-extrabold font-mono">
                  <span>เงินรวมทำจ่ายสุทธิสุทธิ:</span>
                  <span className="text-emerald-400">
                    {formatCurrency(
                      invoiceType === 'Transport'
                        ? containers.reduce((sum, c) => sum + c.transportation + c.portCharge + c.containerHandling + c.liftOnOff, 0) - Math.round(containers.reduce((sum, c) => sum + c.transportation + c.portCharge + c.containerHandling + c.liftOnOff, 0) * 0.01 * 100) / 100
                        : advanceItems.reduce((sum, item) => sum + item.amount, 0) + Math.round(advanceItems.reduce((sum, item) => sum + item.amount, 0) * 0.07 * 100) / 100
                    )}
                  </span>
                </div>
              </div>
            </div>

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
                className="bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1 transition-colors border border-slate-200"
              >
                สั่งพิมพ์ (Print)
              </button>
              <button
                onClick={() => setPreviewInvoice(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-2 px-4 rounded-lg transition-colors border border-slate-700"
              >
                ย้อนกลับ (Close)
              </button>
            </div>
          </div>

          {/* Paper A4 Container design for real printing preview */}
          <div className="bg-white text-slate-900 p-8 md:p-12 border border-slate-350 shadow-lg rounded-xl max-w-4xl mx-auto font-sans text-xs relative leading-relaxed overflow-x-auto print-view">
            {/* Standard styles override for printing layout */}
            <style>
              {`
                @media print {
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
                  }
                  .no-print {
                    display: none !important;
                  }
                }
              `}
            </style>

            {/* Corporate Header Section matching align */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-slate-950 pb-6">
              <div className="space-y-1">
                <h1 className="text-xl font-black tracking-tight text-slate-900 font-sans block">บริษัท เข็มทิศ ทานสปอร์ต จำกัด</h1>
                <p className="text-slate-600 block">102/51 หมู่ 10 ต.ทุ่งสุขลา อ.ศรีราชา จ.ชลบุรี 20230</p>
                <div className="text-[11px] text-slate-500 font-mono space-y-0.5 block">
                  <div>โทร : <span className="font-bold text-slate-800 text-[11px]">095-7757467</span></div>
                  <div>เลขประจำตัวผู้เสียภาษี : <span className="font-bold text-slate-800 text-[11px]">0205568017041</span> (สำนักงานใหญ่)</div>
                </div>
              </div>
              <div className="text-right space-y-1">
                {previewInvoice.invoiceType === 'Transport' ? (
                  <h2 className="text-lg font-black text-indigo-700 bg-indigo-50 border border-indigo-200 p-2.5 rounded-lg inline-block whitespace-nowrap">
                    ใบแจ้งหนี้ค่าขนส่ง (LOGISTICS INVOICE)
                  </h2>
                ) : (
                  <h2 className="text-lg font-black text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-lg inline-block whitespace-nowrap">
                    ใบแจ้งหนี้เงินทดรองจ่าย (ADVANCE STATEMENT)
                  </h2>
                )}
                <div className="font-mono text-[11px] text-slate-500 space-y-0.5 pt-2">
                  <div>เลขที่เอกสาร No: <span className="font-bold text-slate-800 text-[11px]">{previewInvoice.invoiceNo}</span></div>
                  <div>วันที่เอกสาร Date: <span className="font-bold text-slate-800 text-[11px]">{previewInvoice.date}</span></div>
                </div>
              </div>
            </div>

            {/* Client address details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-slate-200">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block">ลูกค้าผู้รับบริการ (Bill To):</span>
                <span className="text-sm font-extrabold text-slate-900 block">{previewInvoice.customerName}</span>
                <p className="text-slate-600 font-serif leading-relaxed text-[11px]">
                  ที่อยู่จดทะเบียน: {customers.find(c => c.name === previewInvoice.customerName)?.address || 'ต.ศรีราชา อ.ศรีราชา จ.ชลบุรี'}
                </p>
                <span className="text-slate-500 font-mono text-[11px] block">
                  โทร: {customers.find(c => c.name === previewInvoice.customerName)?.phone || '081-xxxxxxx'}
                </span>
              </div>
              <div className="space-y-1 sm:text-right font-mono text-[11px] text-slate-600 bg-slate-50/55 p-3.5 rounded-lg border border-slate-150">
                <div>รหัสผู้ทำรายการ Booking No: <span className="font-bold text-slate-900">{previewInvoice.bookingNo || '-'}</span></div>
                <div>ตัวแทนสายเรือจัดส่ง Shipper: <span className="font-bold text-slate-900">{previewInvoice.shipper || '-'}</span></div>
                <div>เลขแผนปฏิบัติการวิ่งงาน Job: <span className="font-bold text-slate-900">{previewInvoice.jobNo || '-'}</span></div>
              </div>
            </div>

            {/* Invoiced Items Table */}
            <div className="py-6">
              {previewInvoice.invoiceType === 'Transport' ? (
                <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
                      <th className="p-2 border-r border-slate-300 font-bold">ตู้คอนเทนเนอร์ (Container No)</th>
                      <th className="p-2 border-r border-slate-300 font-bold text-right">ค่าขนส่ง (Transportation)</th>
                      <th className="p-2 border-r border-slate-300 font-bold text-right">ค่าบริการท่าเรือ (Port Charge)</th>
                      <th className="p-2 border-r border-slate-300 font-bold text-right">ค่าภาระยกย้ายตู้ (Handling)</th>
                      <th className="p-2 border-r border-slate-300 font-bold text-right">ค่ายกขึ้น-ลงตู้ (Lift On/Off)</th>
                      <th className="p-2 font-bold text-right text-slate-950">รวมค่าขนส่ง</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {previewInvoice.containers.map((c, i) => {
                      const totalC = c.transportation + c.portCharge + c.containerHandling + c.liftOnOff;
                      return (
                        <tr key={i} className="hover:bg-slate-50/40">
                          <td className="p-2 border-r border-slate-300 font-mono font-bold text-slate-800">{c.containerNo}</td>
                          <td className="p-2 border-r border-slate-300 text-right font-mono">{formatCurrency(c.transportation)}</td>
                          <td className="p-2 border-r border-slate-300 text-right font-mono">{formatCurrency(c.portCharge)}</td>
                          <td className="p-2 border-r border-slate-300 text-right font-mono">{formatCurrency(c.containerHandling)}</td>
                          <td className="p-2 border-r border-slate-300 text-right font-mono">{formatCurrency(c.liftOnOff)}</td>
                          <td className="p-2 text-right font-mono font-extrabold text-slate-900">{formatCurrency(totalC)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
                      <th className="p-2.5 border-r border-slate-300 font-bold text-center w-12">ลำดับ</th>
                      <th className="p-2.5 border-r border-slate-300 font-bold">รายละเอียดเงินทดรองจ่าย (Advance Items)</th>
                      <th className="p-2.5 font-bold text-right text-slate-950 w-44">จำนวนเงินสำรองจ่าย</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {previewInvoice.advanceItems.map((item, i) => (
                      <tr key={item.id} className="hover:bg-slate-50/40">
                        <td className="p-2.5 border-r border-slate-300 text-center font-mono">{i + 1}</td>
                        <td className="p-2.5 border-r border-slate-300 font-medium">{item.description}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Calculations and Thai Baht words inside elegant design dotted borders */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-200">
              <div className="md:col-span-2 flex items-center">
                <div className="w-full border-2 border-dotted border-slate-400 p-4 rounded bg-slate-50 flex items-center justify-center min-h-[50px] relative">
                  <span className="text-[10px] text-slate-400 font-bold absolute top-1 left-2 uppercase tracking-wide">จำนวนยอดเงินตัวอักษรไทย (Thai Baht Text)</span>
                  <span className="text-xs font-semibold text-slate-800 text-center font-serif">
                    ({previewInvoice.totalText})
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] border bg-slate-50/30 p-4 rounded-lg border-slate-200">
                <div className="flex justify-between text-slate-500 font-mono">
                  <span>ยอดมูลค่าก่อนคำนวณ:</span>
                  <span className="font-bold">{formatCurrency(previewInvoice.subtotal)}</span>
                </div>
                {previewInvoice.invoiceType === 'Transport' ? (
                  <div className="flex justify-between text-red-600 font-bold border-b border-slate-200 pb-1.5 font-mono">
                    <span>หักภาษี ณ ที่จ่าย 1%:</span>
                    <span>-{formatCurrency(previewInvoice.withholdingTax)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-emerald-600 font-bold border-b border-slate-200 pb-1.5 font-mono">
                    <span>ภาษีมูลค่าเพิ่ม VAT 7%:</span>
                    <span>+{formatCurrency(previewInvoice.vatAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-serif font-black text-slate-950 pt-1 font-mono">
                  <span>ยอดชำระสุทธิสุทธิ:</span>
                  <span className="text-indigo-700 text-sm font-bold">{formatCurrency(previewInvoice.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Signatures Section */}
            <div className="grid grid-cols-2 gap-12 pt-16 text-center text-[10px]">
              <div className="space-y-12">
                <div className="border-b border-slate-400 h-1 flex items-end justify-center"></div>
                <div>
                  <p className="font-bold">น.ส. สมศรี รักงาน</p>
                  <p className="text-slate-400">ผู้จัดทำเอกสารและบัญชี (Prepared By)</p>
                </div>
              </div>
              <div className="space-y-12">
                <div className="border-b border-slate-400 h-1 flex items-end justify-center"></div>
                <div>
                  <p className="font-bold text-slate-800">ลงชื่อยินยอม/ประทับตราประทับ</p>
                  <p className="text-slate-400">ผู้มีอำนาจลงนามอนุมัติ (Authorized Signature)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
