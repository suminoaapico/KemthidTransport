import React, { useState } from 'react';
import { 
  Plus, Edit2, Trash2, Search, X, FileText, Printer, Save, 
  Layers, CheckCircle, HelpCircle
} from 'lucide-react';
import { Receipt, Invoice } from '../types';
import { arabicToThaiBaht, formatCurrency } from '../utils';

interface ReceiptsViewProps {
  receipts: Receipt[];
  invoices: Invoice[];
  onSaveReceipt: (receipt: Receipt) => void;
  onDeleteReceipt: (receiptNo: string) => void;
}

export function ReceiptsView({ receipts, invoices, onSaveReceipt, onDeleteReceipt }: ReceiptsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState<Receipt | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form State
  const [receiptNo, setReceiptNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<Receipt['paymentMethod']>('โอนเงิน');

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
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const linkedInvoice = invoices.find(inv => inv.invoiceNo === invoiceNo);
    if (!linkedInvoice) {
      alert("กรุณาจับคู่ใบแจ้งหนี้เพื่อรับชำระเงิน");
      return;
    }

    const newReceipt: Receipt = {
      receiptNo,
      date,
      invoiceNo,
      customerName: linkedInvoice.customerName,
      amount: linkedInvoice.grandTotal, // matching final calculated grand total
      paymentMethod,
      receiptType: linkedInvoice.invoiceType
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
                          {r.invoiceNo}
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
              <p className="text-slate-400 text-xs text-slate-500">ระบุใบอ้างอิงใบแจ้งหนี้เพื่อดึงฐานราคารวมภาษีรวมสุทธิมาออกสลักประทับจ่าย</p>
            </div>
            <button 
              onClick={() => setIsFormOpen(false)}
              className="text-slate-400 hover:text-slate-800 bg-slate-100 p-1.5 rounded-lg transition-colors border border-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 col-span-2">
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
              <label className="text-xs font-bold text-slate-700 block">จับคู่เลขอ้างอิงใบแจ้งหนี้ (Invoice Referrer)</label>
              <select
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-400"
                required
                disabled={isEditMode}
              >
                <option value="">-- กรุณาเลือกใบวางบิลเพื่อเคลียร์ชำระ --</option>
                {invoices.map(inv => (
                  <option key={inv.invoiceNo} value={inv.invoiceNo}>
                    {inv.invoiceNo} - {inv.customerName} ({inv.invoiceType === 'Transport' ? 'ค่าขนส่ง' : 'เงินทดรอง'}) | ยอดรับ: {formatCurrency(inv.grandTotal)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">ช่องทางการรับชำระเงิน</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full text-xs bg-white text-slate-800 border border-slate-350 p-2.5 rounded-lg outline-none"
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
                onClick={handlePrint}
                className="bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1 border border-slate-200"
              >
                สั่งพิมพ์ (Print)
              </button>
              <button
                onClick={() => setPreviewReceipt(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-2 px-4 rounded-lg border border-slate-700"
              >
                ย้อนกลับ (Close)
              </button>
            </div>
          </div>

          <div className="bg-white text-slate-950 p-8 md:p-12 border border-slate-350 shadow-lg rounded-xl max-w-4xl mx-auto font-sans text-xs relative leading-relaxed overflow-x-auto print-view">
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

            {/* Receipt Header block */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-slate-900 pb-6">
              <div className="space-y-1">
                <h1 className="text-lg font-black text-slate-900 block">บริษัท เข็มทิศ ทานสปอร์ต จำกัด</h1>
                <p className="text-slate-600 block">102/51 หมู่ 10 ต.ทุ่งสุขลา อ.ศรีราชา จ.ชลบุรี 20230</p>
                <div className="text-[10px] text-slate-500 font-mono block">
                  โทร: 095-7757467 | เลขประจำตัวผู้เสียภาษี: 0205568017041 (สำนักงานใหญ่)
                </div>
              </div>
              <div className="text-right space-y-1">
                <h2 className="text-lg font-black text-emerald-700 bg-emerald-50 border border-emerald-250 p-3.0 rounded-lg inline-block whitespace-nowrap uppercase">
                  ใบเสร็จรับเงิน / ใบรับเงิน (RECEIPT)
                </h2>
                <div className="font-mono text-[11px] text-slate-500 space-y-0.5 pt-2">
                  <div>รหัสกระดาษ No: <span className="font-bold text-slate-900">{previewReceipt.receiptNo}</span></div>
                  <div>วันที่ชำระเงิน Date: <span className="font-bold text-slate-900">{previewReceipt.date}</span></div>
                </div>
              </div>
            </div>

            {/* Client Info block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-slate-200">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block">ข้อมูลผู้จ่ายเงิน (Received From):</span>
                <span className="text-sm font-extrabold text-slate-900 block">{previewReceipt.customerName}</span>
                <p className="text-slate-500 text-[11px]">
                  อ้างอิงรหัสวางบิลดั้งเดิม: <span className="font-bold text-slate-800 font-mono">{previewReceipt.invoiceNo}</span>
                </p>
              </div>
              <div className="space-y-1 sm:text-right font-mono text-[11px] text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-150">
                <div>ช่องทางการชำระวิธี: <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">{previewReceipt.paymentMethod}</span></div>
                <div>ลักษณะแบบประกัน: {previewReceipt.receiptType === 'Transport' ? 'ค่าระเบียบขนส่งสินค้า' : 'เงินเบิกจ่ายทดรองล่วงหน้า'}</div>
              </div>
            </div>

            {/* Dynamic Rendering of Invoice Content */}
            <div className="py-6 space-y-4">
              <table className="w-full text-left text-[11px] border border-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-310">
                    <th className="p-2 border-r border-slate-300 w-12 text-center">ลำดับ</th>
                    <th className="p-2 border-r border-slate-300">รายละเอียดงานบริการ</th>
                    <th className="p-2 text-right">จำนวนยอดสุทธิรับเงินชำระแล้ว (บาท)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-250">
                  <tr>
                    <td className="p-3 border-r border-slate-300 text-center font-mono font-bold text-slate-500">1</td>
                    <td className="p-3 border-r border-slate-300">
                      <div className="font-bold text-slate-900">
                        {previewReceipt.receiptType === 'Transport' 
                          ? `รับชำระค่าดำเนินการขนส่งตู้สินค้าคอนเทนเนอร์ ตามใบแจ้งหนี้อ้างอิง ${previewReceipt.invoiceNo}`
                          : `รับชำระค่าใช้จ่ายสำรองจ่ายล่วงหน้า (Advance Settlement) ตามใบแจ้งหนี้อ้างอิง ${previewReceipt.invoiceNo}`}
                      </div>
                      <p className="text-slate-400 text-[10px] mt-1 italic">
                        บริษัท ยินยอมรับมอบเงินครบถ้วนและยกเลิกข้อผูกมัดงวดภาระงานเรียบร้อยสมบูรณ์
                      </p>
                    </td>
                    <td className="p-3 text-right font-mono font-extrabold text-slate-900 text-[13px] align-middle">
                      {formatCurrency(previewReceipt.amount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total display with dotted pattern */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-200">
              <div className="md:col-span-2 flex items-center">
                <div className="w-full border-2 border-dotted border-slate-400 p-4 rounded bg-slate-50 flex items-center justify-center min-h-[50px] relative">
                  <span className="text-[10px] text-slate-400 font-bold absolute top-1 left-2 uppercase tracking-wide">ยอดรวมรับเงินตัวอักษรไทย (Thai Baht Word)</span>
                  <span className="text-xs font-bold text-slate-800 text-center font-serif">
                    ({arabicToThaiBaht(previewReceipt.amount)})
                  </span>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-lg flex flex-col justify-center items-center shadow-md">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">ยอดรับเงินสุทธิ (NET INS)</span>
                <span className="text-lg font-black text-emerald-400 font-mono mt-1">
                  {formatCurrency(previewReceipt.amount)}
                </span>
              </div>
            </div>

            {/* Signatures and stamp indicator */}
            <div className="grid grid-cols-2 gap-12 pt-16 text-center text-[10px]">
              <div className="space-y-12">
                <div className="border-b border-slate-450 h-1 flex items-end justify-center"></div>
                <div>
                  <p className="font-bold">น.ส. สมศรี รักงาน</p>
                  <p className="text-slate-400">เจ้าหน้าที่รับชำระเงินคลังบัญชี (Cashier)</p>
                </div>
              </div>
              <div className="space-y-12 relative flex flex-col items-center">
                {/* Stamp visual decoration */}
                <div className="absolute right-12 -top-8 w-16 h-16 rounded-full border-4 border-emerald-500/30 flex items-center justify-center rotate-12 font-black text-emerald-500/40 text-[9px] uppercase tracking-tighter text-center">
                  PAID<br/>KHEMTHIT
                </div>
                <div className="border-b border-slate-450 w-full h-1 flex items-end justify-center"></div>
                <div>
                  <p className="font-bold text-slate-850">ประทับตราอนุมัติจ่ายอย่างเป็นทางการ</p>
                  <p className="text-slate-450">ผู้ว่าจ้างอนุมัติปิดสัญญาการวิ่งเที่ยว (Authorized Sign)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
