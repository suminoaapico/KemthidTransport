import React, { useState } from 'react';
import { 
  Plus, Edit2, Trash2, Search, X, FileText, Printer, Save, 
  Layers, CheckCircle, HelpCircle
} from 'lucide-react';
import { Receipt, Invoice, Customer } from '../types';
import { arabicToThaiBaht, formatCurrency } from '../utils';

function formatReceiptDate(dateStr: string) {
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

interface ReceiptsViewProps {
  receipts: Receipt[];
  invoices: Invoice[];
  customers: Customer[];
  onSaveReceipt: (receipt: Receipt) => void;
  onDeleteReceipt: (receiptNo: string) => void;
}

export function ReceiptsView({ receipts, invoices, customers, onSaveReceipt, onDeleteReceipt }: ReceiptsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState<Receipt | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form State
  const [receiptNo, setReceiptNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<Receipt['paymentMethod']>('โอนเงิน');
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [selectedInvoiceNos, setSelectedInvoiceNos] = useState<string[]>([]);

  // Filter and Search
  const filteredReceipts = receipts.filter(r => 
    r.receiptNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setIsEditMode(false);
    setReceiptNo(`RE-${new Date().getFullYear()}-${String(receipts.length + 1).padStart(4, '0')}`);
    setDate(new Date().toISOString().split('T')[0]);
    setInvoiceNo('');
    setPaymentMethod('โอนเงิน');
    setSelectedCustomerName('');
    setSelectedInvoiceNos([]);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedInvoiceNos.length === 0) {
      alert("กรุณาเลือกใบแจ้งหนี้อย่างน้อย 1 รายการเพื่อออกใบเสร็จ");
      return;
    }

    const matchedInvoices = invoices.filter(inv => selectedInvoiceNos.includes(inv.invoiceNo));
    const totalAmount = matchedInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    const receiptType = matchedInvoices.some(inv => inv.invoiceType === 'Transport') ? 'Transport' : 'Advance';

    const newReceipt: Receipt = {
      receiptNo,
      date,
      invoiceNo: selectedInvoiceNos.join(', '),
      customerName: selectedCustomerName,
      amount: totalAmount,
      paymentMethod,
      receiptType
    };

    onSaveReceipt(newReceipt);
    setIsFormOpen(false);
  };

  // Trigger printable view
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Receipts Table Grid */}
      {!isFormOpen && !previewReceipt && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-800 font-sans flex items-center gap-1.5">
                <FileText className="text-emerald-600 w-5 h-5" />
                ใบเสร็จรับเงิน / ใบรับเงิน (Receipts Tracker)
              </h2>
              <p className="text-slate-400 text-xs">ควบคุมการรับชำระเงิน, ล็อกคู่ใบแจ้งหนี้, และตีพิมพ์สลักประทับตรายินยอม</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="ค้นหาใบเสร็จ..."
                  className="bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 pl-9 pr-4 py-2 rounded-lg border border-slate-200 outline-none w-full sm:w-44 transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={handleOpenAdd}
                className="flex items-center gap-1 bg-slate-900 text-white font-semibold text-xs py-2 px-3.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-4 h-4" /> ออกใบเสร็จรับเงิน
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100/90 font-mono text-slate-700">
                    <th className="p-2 border border-slate-200 font-bold text-center">เลขที่ใบเสร็จ No</th>
                    <th className="p-2 border border-slate-200 font-semibold text-center whitespace-nowrap">วันที่ชำระ</th>
                    <th className="p-2 border border-slate-200 font-semibold whitespace-nowrap">เลขอ้างอิงใบวางบิล</th>
                    <th className="p-2 border border-slate-200 font-semibold whitespace-nowrap">ชื่อลูกค้าผู้ชำระเงิน</th>
                    <th className="p-2 border border-slate-200 font-semibold whitespace-nowrap">ประเภทค่าบริการ</th>
                    <th className="p-2 border border-slate-200 font-semibold text-center whitespace-nowrap">ช่องทางการชำระ</th>
                    <th className="p-2 border border-slate-200 font-semibold text-right text-slate-950 whitespace-nowrap">จำนวนยอดเงินรับสุทธิ</th>
                    <th className="p-2 border border-slate-200 text-center whitespace-nowrap">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  {filteredReceipts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400 font-mono border border-slate-200">
                        ยังไม่มีประวัติการพิมพ์/ออกใบเสร็จรับเงินในระบบ
                      </td>
                    </tr>
                  ) : (
                    filteredReceipts.map((r) => (
                      <tr key={r.receiptNo} className="hover:bg-slate-100/40 transition-colors odd:bg-white even:bg-slate-50/70">
                        <td className="p-2 border border-slate-200 font-mono font-bold align-middle text-center text-indigo-700">{r.receiptNo}</td>
                        <td className="p-2 border border-slate-200 font-mono text-center text-slate-500 whitespace-nowrap align-middle">
                          {r.date}
                        </td>
                        <td className="p-2 border border-slate-200 font-mono text-slate-600 align-middle">
                          <div className="max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap" title={r.invoiceNo}>
                            {r.invoiceNo}
                          </div>
                          {r.invoiceNo.includes(',') && (
                            <span className="text-[10px] text-indigo-650 font-bold font-sans block mt-0.5">
                              ({r.invoiceNo.split(',').length} ใบแจ้งหนี้)
                            </span>
                          )}
                        </td>
                        <td className="p-2 border border-slate-200 font-bold text-slate-900 align-middle">
                          {r.customerName}
                        </td>
                        <td className="p-2 border border-slate-200 text-center align-middle whitespace-nowrap font-sans">
                          {r.receiptType === 'Transport' ? (
                            <span className="bg-emerald-50 text-emerald-850 border border-emerald-250 px-2 py-0.5 rounded text-[10px] font-bold">
                              ค่าขนส่ง (หัก ณ ที่จ่าย 1%)
                            </span>
                          ) : (
                            <span className="bg-indigo-50 text-indigo-850 border border-indigo-250 px-2 py-0.5 rounded text-[10px] font-bold">
                              เงินทดรอง (มี VAT 7%)
                            </span>
                          )}
                        </td>
                        <td className="p-2 border border-slate-200 text-center align-middle font-semibold text-slate-600 font-sans">
                          {r.paymentMethod}
                        </td>
                        <td className="p-2 border border-slate-200 text-right font-mono font-extrabold text-indigo-700 align-middle text-sm whitespace-nowrap">
                          {formatCurrency(r.amount)}
                        </td>
                        <td className="p-2 border border-slate-200 text-center align-middle whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button 
                              onClick={() => setPreviewReceipt(r)}
                              className="bg-emerald-50 hover:bg-emerald-150 border border-emerald-200 text-emerald-700 font-bold px-2 py-1 rounded text-[11px] transition-colors"
                            >
                              แสดงใบเสร็จ (Print)
                            </button>
                            <button 
                              onClick={() => {
                                setIsEditMode(true);
                                setReceiptNo(r.receiptNo);
                                setDate(r.date);
                                setInvoiceNo(r.invoiceNo);
                                setPaymentMethod(r.paymentMethod);
                                setSelectedCustomerName(r.customerName);
                                setSelectedInvoiceNos(r.invoiceNo.split(',').map(n => n.trim()).filter(Boolean));
                                setIsFormOpen(true);
                              }}
                              className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 p-1 rounded-lg transition-colors"
                              title="แก้ไขใบเสร็จ"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => {
                                if (confirm(`คุณต้องการลบรายงานใบเสร็จเลขที่ ${r.receiptNo} หรือไม่?`)) {
                                  onDeleteReceipt(r.receiptNo);
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

      {/* Direct Add Form Page */}
      {isFormOpen && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-800 font-sans block">
                {isEditMode ? `แก้ไขรายละเอียดใบเสร็จรับเงินเลขที่: ${receiptNo}` : 'สร้างคำขออนุมัติพิมพ์ใบเสร็จรับเงิน'}
              </h3>
              <p className="text-slate-400 text-xs">ระบุลูกค้าค้างจ่ายและเลือกใบแจ้งหนี้เพื่อออกสลักประทับใจความ (สามารถเลือกได้ทีละหลายรายการ)</p>
            </div>
            <button 
              onClick={() => setIsFormOpen(false)}
              className="text-slate-400 hover:text-slate-800 bg-slate-100 p-1.5 rounded-lg transition-colors border border-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">เลขที่ใบเสร็จ No</label>
                <input 
                  type="text" 
                  value={receiptNo}
                  className="w-full text-xs bg-slate-100 font-mono text-slate-500 font-semibold border border-slate-200 rounded-lg p-2.5 outline-none font-bold"
                  readOnly
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">วันที่รับเงินชำระ</label>
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">ลูกค้าผู้ชำระเงิน (Customer)</label>
              <select
                value={selectedCustomerName}
                onChange={(e) => {
                  setSelectedCustomerName(e.target.value);
                  setSelectedInvoiceNos([]);
                }}
                className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-450"
                required
                disabled={isEditMode}
              >
                <option value="">-- กรุณาเลือกลูกค้าคู่ชำระ --</option>
                {customers.map(c => {
                  const name = c.name || c.company;
                  return (
                    <option key={c.id} value={name}>
                      {name}
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedCustomerName && (
              <div className="space-y-3 border border-slate-200 rounded-lg p-3.5 bg-slate-50/50">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-700">เลือกใบแจ้งหนี้เพื่อรับชำระ ({invoices.filter(inv => inv.customerName === selectedCustomerName && (inv.status === 'ยังไม่จ่าย' || selectedInvoiceNos.includes(inv.invoiceNo))).length} รายการพบ)</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const unpaidInvs = invoices.filter(inv => 
                          inv.customerName === selectedCustomerName && 
                          (inv.status === 'ยังไม่จ่าย' || selectedInvoiceNos.includes(inv.invoiceNo))
                        );
                        setSelectedInvoiceNos(unpaidInvs.map(inv => inv.invoiceNo));
                      }}
                      className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded transition-colors"
                    >
                      เลือกทั้งหมด (Select All)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedInvoiceNos([])}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold px-2 py-1 rounded transition-colors"
                    >
                      ล้างทั้งหมด (Clear)
                    </button>
                  </div>
                </div>

                {(() => {
                  const availableInvs = invoices.filter(inv => 
                    inv.customerName === selectedCustomerName && 
                    (inv.status === 'ยังไม่จ่าย' || selectedInvoiceNos.includes(inv.invoiceNo))
                  );

                  if (availableInvs.length === 0) {
                    return (
                      <p className="text-xs text-slate-400 py-4 text-center font-mono">
                        ไม่มีใบแจ้งหนี้ค้างชำระสำหรับลูกค้ารายนี้
                      </p>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {availableInvs.map(inv => {
                        const isChecked = selectedInvoiceNos.includes(inv.invoiceNo);
                        return (
                          <label 
                            key={inv.invoiceNo} 
                            className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                              isChecked 
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold shadow-sm' 
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedInvoiceNos(prev => prev.filter(no => no !== inv.invoiceNo));
                                } else {
                                  setSelectedInvoiceNos(prev => [...prev, inv.invoiceNo]);
                                }
                              }}
                              className="mt-0.5 rounded border-slate-350 text-emerald-600 focus:ring-emerald-500"
                            />
                            <div className="flex-1 min-w-0 font-mono">
                              <div className="flex justify-between font-bold text-slate-900 gap-2">
                                <span className="truncate">{inv.invoiceNo}</span>
                                <span className="text-indigo-650 shrink-0">{formatCurrency(inv.grandTotal)}</span>
                              </div>
                              <div className="flex justify-between text-[10px] text-slate-400 font-normal mt-0.5">
                                <span>{inv.invoiceType === 'Transport' ? 'ค่าขนส่ง' : 'เงินทดรอง'}</span>
                                <span>{inv.date}</span>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  );
                })()}

                {selectedInvoiceNos.length > 0 && (
                  <div className="bg-emerald-50/50 rounded-lg p-2.5 border border-emerald-200 flex justify-between items-center text-xs">
                    <span className="font-bold text-emerald-800">เลือกแล้ว {selectedInvoiceNos.length} ใบแจ้งหนี้</span>
                    <span className="font-mono font-bold text-emerald-900">
                      รวมสุทธิ: {formatCurrency(
                        invoices
                          .filter(inv => selectedInvoiceNos.includes(inv.invoiceNo))
                          .reduce((sum, inv) => sum + (inv.grandTotal || 0), 0)
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">ช่องทางการรับชำระเงิน</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full text-xs bg-white text-slate-800 border border-slate-250 p-2.5 rounded-lg outline-none"
              >
                <option value="โอนเงิน">โอนเงินเข้าบัญชีธนาคาร (หลัก)</option>
                <option value="เงินสด">ชำระด้วยเงินสดหน้างาน</option>
                <option value="เช็ค">ชำระด้วยแคชเชียร์เช็คกระดาษ</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-150 pt-4">
              <button 
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-750 font-bold text-xs py-2 px-4 rounded-lg border border-slate-200"
              >
                ยกเลิกทำจ่าย
              </button>
              <button 
                type="submit"
                className="flex items-center gap-1.5 bg-slate-950 text-white font-bold text-xs py-2 px-5 rounded-lg hover:bg-slate-900 transition-colors"
              >
                <Save className="w-4 h-4" /> บันทึกและพิมพ์ออกใบรับ
              </button>
            </div>
          </form>
        </div>
      )}

{/* Cash receipt elegant visual model preview */}
      {previewReceipt && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-xl shadow-md no-print">
            <div className="flex items-center gap-2">
              <Printer className="text-emerald-400 w-5 h-5" />
              <div>
                <h3 className="font-extrabold text-sm uppercase">จัดทำและพิมพ์ตั๋วใบเสร็จรับเงิน</h3>
                <p className="text-xs text-slate-400">ใบเสร็จรับเงินสไตล์ดั้งเดิมสำหรับนำไปประกอบแฟ้มงานส่งมอบบัตรร้านค้า</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" /> สั่งพิมพ์ (Print)
              </button>
              <button
                onClick={() => window.print()}
                className="bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer shadow-sm"
              >
                <FileText className="w-3.5 h-3.5 text-red-500" /> บันทึก/ส่งออก PDF (Export PDF)
              </button>
              <button
                onClick={() => setPreviewReceipt(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-2 px-4 rounded-lg border border-slate-700 transition-colors cursor-pointer"
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

          <div className="bg-white text-slate-950 p-8 md:p-12 border border-slate-350 shadow-lg rounded-xl max-w-4xl mx-auto font-sans text-xs relative leading-relaxed overflow-x-auto print-view">
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

            {
              (() => {
                const linkedInvoiceNos = previewReceipt.invoiceNo.split(',').map(n => n.trim()).filter(Boolean);
                const matchedInvoices = invoices.filter(inv => linkedInvoiceNos.includes(inv.invoiceNo));
                
                const subtotal = matchedInvoices.length > 0
                  ? matchedInvoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0)
                  : previewReceipt.amount;
                
                const vatAmount = matchedInvoices.length > 0
                  ? matchedInvoices.reduce((sum, inv) => sum + (inv.vatAmount || 0), 0)
                  : 0;
                
                const withholdingTax = matchedInvoices.length > 0
                  ? matchedInvoices.reduce((sum, inv) => sum + (inv.withholdingTax || 0), 0)
                  : 0;
                
                const grandTotal = matchedInvoices.length > 0
                  ? matchedInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0)
                  : previewReceipt.amount;
                
                const totalText = arabicToThaiBaht(grandTotal);
                
                const noOfTrans = matchedInvoices.reduce((sum, inv) => 
                  sum + (inv.invoiceType === 'Transport' ? (inv.containers?.length || 1) : (inv.advanceItems?.length || 1)), 0);

                const customerObj = customers?.find(c => c.name === previewReceipt.customerName || c.company === previewReceipt.customerName);
                const clientAddress = customerObj?.address || 'ต.ศรีราชา อ.ศรีราชา จ.ชลบุรี';
                const clientPhone = customerObj?.phone || '';
                const clientTaxId = (customerObj as any)?.taxId || '';

                return (
                  <>
                    {/* Receipt Header block */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-300 pb-6">
                      <div className="flex gap-4 items-start">
                        {/* SVG Stamp logo */}
                        <div className="w-20 h-20 flex items-center justify-center shrink-0">
                          <svg viewBox="0 0 100 100" className="w-full h-full text-slate-800">
                            <defs>
                              <path id="khemthit-logo-top-path" d="M 14 50 A 36 36 0 0 1 86 50" fill="none" />
                              <path id="khemthit-logo-bottom-path" d="M 14 50 A 36 36 0 0 0 86 50" fill="none" />
                            </defs>
                            {/* Ring Borders */}
                            <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1.2" />
                            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.6" />
                            <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="0.6" />
                            <circle cx="50" cy="50" r="25.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
                            
                            {/* Curved English Text on Top */}
                            <text className="text-[4.6px] font-black tracking-[0.03em] fill-slate-900" dy="1.4">
                              <textPath href="#khemthit-logo-top-path" startOffset="50%" textAnchor="middle">
                                KHEMTHIT TRANSPORT CO., LTD.
                              </textPath>
                            </text>
                            
                            {/* Curved Thai Text on Bottom */}
                            <text className="text-[4.5px] font-bold tracking-[0.01em] fill-slate-900" dy="3.4">
                              <textPath href="#khemthit-logo-bottom-path" startOffset="50%" textAnchor="middle">
                                บริษัท เข็มทิศ ทรานสปอร์ต จำกัด
                              </textPath>
                            </text>
                            
                            {/* Inner Compass Rose Group */}
                            <g className="text-slate-800">
                              {/* Inner fine circles */}
                              <circle cx="50" cy="50" r="18" fill="none" stroke="currentColor" strokeWidth="0.4" strokeDasharray="1.5 1" />
                              <circle cx="50" cy="50" r="11" fill="none" stroke="currentColor" strokeWidth="0.4" />
                              <circle cx="50" cy="50" r="2.5" fill="currentColor" />
                              
                              {/* Secondary points (diagonals) */}
                              <polygon points="50,50 61.3,38.7 53,42" fill="currentColor" opacity="0.4" />
                              <polygon points="50,50 61.3,38.7 58,47" fill="currentColor" opacity="0.25" />
                              
                              <polygon points="50,50 61.3,61.3 58,53" fill="currentColor" opacity="0.4" />
                              <polygon points="50,50 61.3,61.3 49,58" fill="currentColor" opacity="0.25" />
                              
                              <polygon points="50,50 38.7,61.3 47,58" fill="currentColor" opacity="0.4" />
                              <polygon points="50,50 38.7,61.3 42,49" fill="currentColor" opacity="0.25" />
                              
                              <polygon points="50,50 38.7,38.7 42,47" fill="currentColor" opacity="0.4" />
                              <polygon points="50,50 38.7,38.7 51,42" fill="currentColor" opacity="0.25" />
                              
                              {/* Major points (cardinals) */}
                              {/* North */}
                              <polygon points="50,50 50,13.5 47,43.5" fill="currentColor" />
                              <polygon points="50,50 50,13.5 53,43.5" fill="currentColor" opacity="0.35" />
                              
                              {/* East */}
                              <polygon points="50,50 86.5,50 56.5,47" fill="currentColor" />
                              <polygon points="50,50 86.5,50 56.5,53" fill="currentColor" opacity="0.35" />
                              
                              {/* South */}
                              <polygon points="50,50 50,86.5 53,56.5" fill="currentColor" />
                              <polygon points="50,50 50,86.5 47,56.5" fill="currentColor" opacity="0.35" />
                              
                              {/* West */}
                              <polygon points="50,50 13.5,50 43.5,53" fill="currentColor" />
                              <polygon points="50,50 13.5,50 43.5,47" fill="currentColor" opacity="0.35" />
                              
                              {/* Labels N S E W */}
                              <text x="50" y="21.5" fontSize="4.2" fontWeight="bold" textAnchor="middle" fill="currentColor">N</text>
                              <text x="50" y="80.5" fontSize="4.2" fontWeight="bold" textAnchor="middle" fill="currentColor">S</text>
                              <text x="78.5" y="51.5" fontSize="4.2" fontWeight="bold" textAnchor="middle" fill="currentColor">E</text>
                              <text x="21.5" y="51.5" fontSize="4.2" fontWeight="bold" textAnchor="middle" fill="currentColor">W</text>
                            </g>
                          </svg>
                        </div>
                        <div className="space-y-1">
                          <h1 className="text-[14px] font-bold tracking-tight text-slate-900 block">บริษัท เข็มทิศ ทรานสปอร์ต จำกัด</h1>
                          <p className="text-slate-600 block text-[11px]">102/51 ม.10 ต.ทุ่งสุขลา อ.ศรีราชา จ.ชลบุรี 20230</p>
                          <div className="text-[11px] text-slate-600 space-y-0.5 block font-mono">
                            <div>เลขประจำตัวผู้เสียภาษี : <span className="font-bold text-slate-800">0205568017041</span></div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-3 shrink-0">
                        <div className="text-right">
                          <h2 className="text-lg font-bold tracking-[0.05em] text-slate-900 font-serif leading-none">ใบเสร็จรับเงิน / RECEIPT</h2>
                          <p className="text-[10px] text-slate-500 font-sans tracking-widest mt-1">ORIGINAL /ต้นฉบับ</p>
                        </div>
                        <div className="text-[11px] text-slate-600 space-y-1 pt-1 font-mono">
                          <div className="flex justify-end gap-6">
                            <span className="text-slate-500">เลขที่</span>
                            <span className="font-bold text-slate-900 w-24 text-left">{previewReceipt.receiptNo}</span>
                          </div>
                          <div className="flex justify-end gap-6">
                            <span className="text-slate-500">วันที่</span>
                            <span className="font-bold text-slate-900 w-24 text-left">{formatReceiptDate(previewReceipt.date)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Client Info block */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-slate-200">
                      <div className="space-y-1">
                        <span className="text-slate-400 text-[10px] font-bold block uppercase tracking-wider">Customers</span>
                        <span className="text-sm font-bold text-slate-900 block">{previewReceipt.customerName}</span>
                        <p className="text-slate-755 leading-relaxed text-[11px]">
                          ที่อยู่ : {clientAddress}
                        </p>
                        <div className="text-slate-600 text-[11px] font-mono space-y-0.5">
                          {clientPhone && <div>โทร : <span className="font-bold text-slate-850">{clientPhone}</span></div>}
                          <div>เลขประจำตัวผู้เสียภาษี : <span className="font-bold text-slate-850">{clientTaxId || '0205560001196'}</span></div>
                        </div>
                      </div>
                      <div className="space-y-1 text-right font-mono text-[11px] text-slate-600">
                        <div>เลขอ้างอิงใบวางบิล Invoice Ref: <span className="font-bold text-slate-900">{previewReceipt.invoiceNo}</span></div>
                        <div>ช่องทางการชำระ Payment: <span className="font-bold text-slate-900">{previewReceipt.paymentMethod}</span></div>
                      </div>
                    </div>

                    {/* Items Table */}
                    <div className="py-6">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead>
                          <tr className="border-b border-t border-slate-400 text-slate-500 font-bold text-[10px] bg-slate-50/50">
                            <th className="p-2 w-16 text-center">ลำดับ<br/>Item</th>
                            <th className="p-2">รายการ<br/>Description</th>
                            <th className="p-2 w-36 text-center">จำนวนรายการ<br/>No. of Trans.</th>
                            <th className="p-2 w-44 text-right text-slate-950">จำนวนเงิน<br/>Amount (Baht)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans">
                          <tr className="text-slate-800">
                            <td className="p-3 text-center font-mono text-slate-600">1</td>
                            <td className="p-3 font-semibold text-slate-900">
                              ค่าขนส่ง
                              <div className="text-[10px] text-slate-500 font-normal font-mono mt-1">
                                อ้างอิงใบแจ้งหนี้เลขที่ document ref: {previewReceipt.invoiceNo}
                              </div>
                            </td>
                            <td className="p-3 text-center font-mono">{noOfTrans}</td>
                            <td className="p-3 text-right font-mono font-bold text-[12px]">{formatCurrency(subtotal)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Total display with dotted pattern and Computations */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-350 mt-4">
                      <div className="md:col-span-2 flex items-center">
                        <div className="w-full border-2 border-dotted border-slate-400 p-4 rounded bg-slate-50 flex items-center justify-center min-h-[50px] relative">
                          <span className="text-[10px] text-slate-400 font-bold absolute top-1 left-2 uppercase tracking-wide">ยอดรวมรับเงินตัวอักษรไทย (Thai Baht Word)</span>
                          <span className="text-xs font-semibold text-slate-800 text-center font-serif">
                            -- {totalText} --
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-[11px] border bg-slate-50/30 p-4 rounded-lg border-slate-200 font-mono">
                        <div className="flex justify-between text-slate-500">
                          <span>รวมเงิน / Total</span>
                          <span className="font-bold">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 border-b border-slate-150 pb-1">
                          <span>ภาษีมูลค่าเพิ่ม / Vat 7%</span>
                          <span className="font-bold">{formatCurrency(vatAmount)}</span>
                        </div>
                        <div className="flex justify-between text-slate-800 font-bold pt-1">
                          <span>รวมทั้งสิ้น / Total Amount</span>
                          <span>{formatCurrency(subtotal + vatAmount)}</span>
                        </div>
                        <div className="flex justify-between text-red-600 font-semibold">
                          <span>ภาษีหัก ณ ที่จ่าย 1%</span>
                          <span>{formatCurrency(withholdingTax)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-serif font-black text-slate-950 pt-2 border-t border-slate-200 font-mono">
                          <span>ยอดชำระ / Total Net</span>
                          <span className="text-slate-910 text-sm font-bold">{formatCurrency(grandTotal)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Signatures and stamp indicator */}
                    <div className="grid grid-cols-2 gap-12 pt-16 text-center text-[11px] relative">
                      <div className="space-y-12">
                        <div className="h-10"></div>
                        <div className="space-y-2">
                          <p className="font-bold flex justify-center gap-2">
                            <span>....................................................................</span>
                          </p>
                          <p className="font-bold text-slate-800">ผู้รับเงิน</p>
                          <p className="text-slate-500 flex justify-center gap-1">
                            <span>วันที่</span>
                            <span>.............................../................../..................</span>
                          </p>
                        </div>
                      </div>
                      <div className="space-y-12 relative flex flex-col items-center">
                        {/* Stamp visual decoration PAID KHEMTHIT in deep emerald style */}
                        <div className="absolute right-1/4 -top-8 w-24 h-24 rounded-full border-4 border-emerald-500/30 border-double p-0.5 flex flex-col items-center justify-center opacity-45 select-none pointer-events-none rotate-12 text-emerald-600">
                          <div className="text-[7px] font-black tracking-widest leading-none text-center">PAID</div>
                          <svg viewBox="0 0 100 100" className="w-8 h-8 text-emerald-500 my-0.5">
                            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="2" />
                            <path d="M35,50 L45,60 L65,40" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <div className="text-[7px] font-black leading-none text-center">KHEMTHIT<br/>TRANSPORT</div>
                        </div>

                        <div className="h-10"></div>
                        
                        <div className="space-y-2 w-full">
                          <p className="font-bold text-slate-800 leading-relaxed block">บริษัท เข็มทิศ ทรานสปอร์ต จำกัด</p>
                          <p className="font-bold flex justify-center gap-2">
                            <span>....................................................................</span>
                          </p>
                          <p className="font-bold text-slate-800 font-sans">ผู้รับมอบอำนาจ</p>
                          <p className="text-slate-500 flex justify-center gap-1">
                            <span>วันที่</span>
                            <span>.............................../................../..................</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()
            }
          </div>
        </div>
      )}
    </div>
  );
}
