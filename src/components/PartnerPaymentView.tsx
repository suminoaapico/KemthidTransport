import React, { useState } from 'react';
import { 
  Plus, Edit2, Trash2, Search, X, FileText, Printer, Save, 
  CheckCircle, Truck, DollarSign, Calendar, User, Check, RefreshCw, 
  Download, ArrowLeft, Layers, ShieldCheck, AlertCircle
} from 'lucide-react';
import { SubcontractorPaymentDoc, SubcontractorTripItem, TransportJob, Vehicle, Driver } from '../types';
import { formatCurrency, arabicToThaiBaht } from '../utils';

interface PartnerPaymentViewProps {
  paymentDocs: SubcontractorPaymentDoc[];
  jobs: TransportJob[];
  vehicles: Vehicle[];
  drivers: Driver[];
  onSavePaymentDoc: (doc: SubcontractorPaymentDoc) => void;
  onDeletePaymentDoc: (id: string) => void;
}

export function PartnerPaymentView({
  paymentDocs,
  jobs,
  vehicles,
  drivers,
  onSavePaymentDoc,
  onDeletePaymentDoc
}: PartnerPaymentViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ยังไม่ได้จ่าย' | 'จ่ายแล้ว'>('ALL');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<SubcontractorPaymentDoc | null>(null);

  // Form State
  const [docId, setDocId] = useState('');
  const [paymentNo, setPaymentNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [partnerName, setPartnerName] = useState('');
  const [vehicleLicense, setVehicleLicense] = useState('');
  const [paymentCycle, setPaymentCycle] = useState('');
  const [advanceDeduction, setAdvanceDeduction] = useState<number>(0);
  const [status, setStatus] = useState<'ยังไม่ได้จ่าย' | 'จ่ายแล้ว'>('ยังไม่ได้จ่าย');
  const [note, setNote] = useState('');

  // Trip Items State (Table rows)
  const [trips, setTrips] = useState<SubcontractorTripItem[]>([]);

  // Selected vehicle filter for pulling jobs
  const [selectedVehicleForImport, setSelectedVehicleForImport] = useState('');

  const generatePaymentNo = (currentCount: number) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    return `KTT-AP-${year}-${month}${String(currentCount + 1).padStart(3, '0')}`;
  };

  const getThaiMonthCycle = () => {
    const today = new Date();
    const monthNamesThai = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const thaiYear = today.getFullYear() + 543;
    return `${monthNamesThai[today.getMonth()]} ${thaiYear}`;
  };

  const resetForm = () => {
    setIsEditMode(false);
    const newId = `SP-${Date.now()}`;
    const newNo = generatePaymentNo(paymentDocs.length);
    setDocId(newId);
    setPaymentNo(newNo);
    setDate(new Date().toISOString().split('T')[0]);
    setPartnerName('');
    setVehicleLicense('');
    setPaymentCycle(getThaiMonthCycle());
    setAdvanceDeduction(0);
    setStatus('ยังไม่ได้จ่าย');
    setNote('');
    setTrips([]);
    setSelectedVehicleForImport('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  // Pull trips from Job Plan based on chosen vehicle / driver
  const handleImportJobsFromPlan = (plate: string) => {
    if (!plate) return;
    setSelectedVehicleForImport(plate);
    setVehicleLicense(plate);

    // Auto-detect driver name from driver or vehicle
    const matchedVehicle = vehicles.find(v => v.licensePlate === plate);
    const matchedDriver = drivers.find(d => d.vehicleLicense === plate || d.id === matchedVehicle?.driverId);
    if (matchedDriver && !partnerName) {
      setPartnerName(matchedDriver.name);
    }

    // Find jobs for this vehicle
    const matchedJobs = jobs.filter(j => j.vehicleLicense === plate);
    const importedTrips: SubcontractorTripItem[] = [];

    matchedJobs.forEach(job => {
      if (job.containers && job.containers.length > 0) {
        job.containers.forEach((c, idx) => {
          importedTrips.push({
            id: `TRIP-${job.jobNo}-${idx}-${Date.now()}`,
            jobNo: job.jobNo,
            date: job.date || date,
            shipper: job.shipper || '-',
            bookingNo: job.bookingNo || '-',
            type: `${c.size || "40'"} ${job.jobType || ''}`.trim(),
            containerNo: c.containerNo || '-',
            price: c.transportation || 0,
            ot: (c.expenses?.find(e => e.name === 'Overtime')?.amount) || 0,
            remark: job.destination || ''
          });
        });
      } else {
        importedTrips.push({
          id: `TRIP-${job.jobNo}-${Date.now()}`,
          jobNo: job.jobNo,
          date: job.date || date,
          shipper: job.shipper || '-',
          bookingNo: job.bookingNo || '-',
          type: job.jobType || "40'",
          containerNo: '-',
          price: 0,
          ot: 0,
          remark: `${job.origin || ''} -> ${job.destination || ''}`.trim()
        });
      }
    });

    if (importedTrips.length > 0) {
      setTrips(importedTrips);
    } else {
      alert(`ไม่พบแผนการวิ่งงานของทะเบียน ${plate} ในระบบ คุณสามารถเพิ่มรายการเองได้`);
      // Start with 1 blank row
      if (trips.length === 0) {
        handleAddTripRow();
      }
    }
  };

  const handleAddTripRow = () => {
    const newTrip: SubcontractorTripItem = {
      id: `TRIP-MANUAL-${Date.now()}-${trips.length + 1}`,
      date: date,
      shipper: '',
      bookingNo: '',
      type: "40'",
      containerNo: '',
      price: 0,
      ot: 0,
      remark: ''
    };
    setTrips([...trips, newTrip]);
  };

  const handleRemoveTripRow = (index: number) => {
    setTrips(trips.filter((_, i) => i !== index));
  };

  const updateTripField = (index: number, field: keyof SubcontractorTripItem, value: any) => {
    const updated = [...trips];
    if (field === 'price' || field === 'ot') {
      updated[index][field] = parseFloat(value) || 0;
    } else {
      (updated[index] as any)[field] = value;
    }
    setTrips(updated);
  };

  // Math Calculations for Subcontractor payment
  const calculateTotals = () => {
    const subtotalPrice = trips.reduce((sum, t) => sum + (t.price || 0), 0);
    const subtotalOt = trips.reduce((sum, t) => sum + (t.ot || 0), 0);
    const totalBeforeDeductions = Math.round((subtotalPrice + subtotalOt) * 100) / 100;
    const withholdingTax = Math.round(totalBeforeDeductions * 0.01 * 100) / 100; // 1% หัก ณ ที่จ่าย อัตโนมัติ
    const grandTotal = Math.round((totalBeforeDeductions - advanceDeduction - withholdingTax) * 100) / 100;

    return {
      subtotalPrice,
      subtotalOt,
      totalBeforeDeductions,
      withholdingTax,
      grandTotal
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trips.length === 0) {
      alert('กรุณาเพิ่มรายการเที่ยววิ่งอย่างน้อย 1 รายการ');
      return;
    }

    const { subtotalPrice, subtotalOt, totalBeforeDeductions, withholdingTax, grandTotal } = calculateTotals();

    const doc: SubcontractorPaymentDoc = {
      id: docId || `SP-${Date.now()}`,
      paymentNo,
      date,
      partnerName: partnerName.trim() || 'รถร่วมบริการ',
      vehicleLicense: vehicleLicense.trim() || '-',
      paymentCycle: paymentCycle.trim() || getThaiMonthCycle(),
      trips,
      subtotalPrice,
      subtotalOt,
      totalBeforeDeductions,
      advanceDeduction: Number(advanceDeduction) || 0,
      withholdingTax,
      grandTotal,
      status,
      note
    };

    onSavePaymentDoc(doc);
    setIsFormOpen(false);
  };

  const handleEdit = (doc: SubcontractorPaymentDoc) => {
    setIsEditMode(true);
    setDocId(doc.id);
    setPaymentNo(doc.paymentNo);
    setDate(doc.date);
    setPartnerName(doc.partnerName);
    setVehicleLicense(doc.vehicleLicense);
    setPaymentCycle(doc.paymentCycle);
    setAdvanceDeduction(doc.advanceDeduction);
    setStatus(doc.status);
    setNote(doc.note || '');
    setTrips(doc.trips ? [...doc.trips] : []);
    setIsFormOpen(true);
  };

  const filteredDocs = paymentDocs.filter(d => {
    const matchSearch = 
      d.paymentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.vehicleLicense.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.paymentCycle.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'ALL') return matchSearch;
    return matchSearch && d.status === filterStatus;
  });

  const totals = calculateTotals();

  return (
    <div className="space-y-5 font-sans">
      {/* Control Header */}
      {!isFormOpen && !previewDoc && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
                  <Truck className="w-5 h-5" />
                </span>
                <h2 className="text-xl font-bold text-slate-900">
                  ทำจ่ายรถร่วม (Subcontractor & Partner Fleet Payout)
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                ดึงข้อมูลเที่ยววิ่งจากแผนการวิ่งงาน กรอกราคา หักแอดวานซ์ หักภาษี 1% อัตโนมัติ และพิมพ์ใบทำจ่ายมาตรฐาน
              </p>
            </div>

            <button
              onClick={handleOpenAdd}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + สร้างใบทำจ่ายรถร่วมใหม่
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">เอกสารทำจ่ายทั้งหมด</p>
                <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">{paymentDocs.length} <span className="text-xs font-normal text-slate-500">ฉบับ</span></p>
              </div>
              <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">ยอดรอจ่าย (Pending)</p>
                <p className="text-2xl font-black text-amber-600 font-mono mt-0.5">
                  {formatCurrency(paymentDocs.filter(d => d.status === 'ยังไม่ได้จ่าย').reduce((s, d) => s + d.grandTotal, 0))}
                </p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">จ่ายแล้วสะสม (Paid Total)</p>
                <p className="text-2xl font-black text-emerald-600 font-mono mt-0.5">
                  {formatCurrency(paymentDocs.filter(d => d.status === 'จ่ายแล้ว').reduce((s, d) => s + d.grandTotal, 0))}
                </p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาเลขที่ทำจ่าย, ชื่อคู่ค้า, ทะเบียนรถ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:bg-white transition-all font-sans"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-500 font-bold whitespace-nowrap">สถานะ:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-bold text-slate-700"
              >
                <option value="ALL">ทั้งหมด (All Status)</option>
                <option value="ยังไม่ได้จ่าย">ยังไม่ได้จ่าย (Unpaid)</option>
                <option value="จ่ายแล้ว">จ่ายแล้ว (Paid)</option>
              </select>
            </div>
          </div>

          {/* Documents Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse font-sans">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold text-[11px]">
                    <th className="p-3 text-center w-12">ลำดับ</th>
                    <th className="p-3">เลขที่ทำจ่าย</th>
                    <th className="p-3 text-center">วันที่ออกเอกสาร</th>
                    <th className="p-3">ชื่อคู่ค้า / คนขับ</th>
                    <th className="p-3 text-center">ทะเบียนรถ</th>
                    <th className="p-3 text-center">รอบทำจ่าย</th>
                    <th className="p-3 text-center">จำนวนเที่ยว</th>
                    <th className="p-3 text-right">ยอดรวมค่าเที่ยว</th>
                    <th className="p-3 text-right text-red-600">หัก Advance</th>
                    <th className="p-3 text-right text-red-600">หัก 1%</th>
                    <th className="p-3 text-right font-black text-slate-900">ยอดสุทธิที่ต้องจ่าย</th>
                    <th className="p-3 text-center">สถานะ</th>
                    <th className="p-3 text-center w-28">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocs.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="p-8 text-center text-slate-400">
                        ไม่พบข้อมูลเอกสารทำจ่ายรถร่วม
                      </td>
                    </tr>
                  ) : (
                    filteredDocs.map((doc, idx) => (
                      <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-indigo-700">{doc.paymentNo}</td>
                        <td className="p-3 text-center font-mono text-slate-500">{doc.date}</td>
                        <td className="p-3 font-semibold text-slate-900">{doc.partnerName}</td>
                        <td className="p-3 text-center">
                          <span className="bg-slate-100 text-slate-800 font-mono font-bold px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                            {doc.vehicleLicense}
                          </span>
                        </td>
                        <td className="p-3 text-center text-slate-600">{doc.paymentCycle}</td>
                        <td className="p-3 text-center font-mono font-bold text-slate-700">{doc.trips?.length || 0}</td>
                        <td className="p-3 text-right font-mono text-slate-700">{formatCurrency(doc.totalBeforeDeductions)}</td>
                        <td className="p-3 text-right font-mono text-red-600">
                          {doc.advanceDeduction > 0 ? `-${formatCurrency(doc.advanceDeduction)}` : '0.00'}
                        </td>
                        <td className="p-3 text-right font-mono text-red-600">
                          {doc.withholdingTax > 0 ? `-${formatCurrency(doc.withholdingTax)}` : '0.00'}
                        </td>
                        <td className="p-3 text-right font-mono font-extrabold text-slate-950 text-sm">
                          {formatCurrency(doc.grandTotal)}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            doc.status === 'จ่ายแล้ว' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setPreviewDoc(doc)}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold px-2 py-1 rounded text-[11px] transition-colors"
                              title="พิมพ์เอกสารทำจ่าย"
                            >
                              พิมพ์
                            </button>
                            <button
                              onClick={() => handleEdit(doc)}
                              className="p-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors"
                              title="แก้ไข"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`ต้องการลบใบทำจ่ายเลขที่ ${doc.paymentNo} หรือไม่?`)) {
                                  onDeletePaymentDoc(doc.id);
                                }
                              }}
                              className="p-1 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors"
                              title="ลบ"
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

      {/* Creation / Edit Modal Form */}
      {isFormOpen && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Truck className="text-indigo-600 w-5 h-5" />
                {isEditMode ? `แก้ไขใบทำจ่ายรถร่วม: ${paymentNo}` : 'สร้างเอกสารใบทำจ่ายรถร่วม (New Subcontractor Payout)'}
              </h3>
              <p className="text-xs text-slate-500">
                ดึงเที่ยววิ่งจากแผนการวิ่งงาน กรอกราคาค่าเที่ยว หักค่าแอดวานซ์ และคำนวณหัก 1% สุทธิ
              </p>
            </div>
            <button 
              onClick={() => setIsFormOpen(false)}
              className="text-slate-400 hover:text-slate-800 bg-slate-100 p-1.5 rounded-lg transition-colors border border-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header Form Controls */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">เลขที่ใบทำจ่าย (Payment No.)</label>
                <input
                  type="text"
                  value={paymentNo}
                  onChange={(e) => setPaymentNo(e.target.value)}
                  className="w-full text-xs font-mono font-bold bg-white text-indigo-700 border border-slate-300 rounded-lg p-2.5 outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">วันที่ทำจ่าย</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs text-slate-800 border border-slate-300 rounded-lg p-2.5 outline-none bg-white font-sans"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">ชื่อคู่ค้า / คนขับ / ผู้รับเงิน</label>
                <input
                  type="text"
                  placeholder="เช่น นายสมศักดิ์ ขับดี หรือ บจก. รวมมิตรโลจิสติกส์"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  className="w-full text-xs text-slate-800 border border-slate-300 rounded-lg p-2.5 outline-none bg-white font-sans"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">รอบทำจ่าย (เดือน / ปี)</label>
                <input
                  type="text"
                  placeholder="เช่น สิงหาคม 2569"
                  value={paymentCycle}
                  onChange={(e) => setPaymentCycle(e.target.value)}
                  className="w-full text-xs text-slate-800 border border-slate-300 rounded-lg p-2.5 outline-none bg-white font-sans"
                  required
                />
              </div>
            </div>

            {/* Quick Import Bar from Job Plan */}
            <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-200 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <RefreshCw className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-indigo-950">ดึงข้อมูลเที่ยววิ่งอัตโนมัติจากแผนการวิ่งงาน (Job Plan)</h4>
                  <p className="text-[11px] text-indigo-800">เลือกรถเพื่อดึงรายการเที่ยววิ่งทั้งหมดของรถคันนี้มาลงในตารางทำจ่าย</p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={vehicleLicense}
                  onChange={(e) => {
                    const plate = e.target.value;
                    setVehicleLicense(plate);
                    if (plate) {
                      handleImportJobsFromPlan(plate);
                    }
                  }}
                  className="text-xs font-bold text-slate-800 bg-white border border-indigo-300 rounded-lg p-2 outline-none w-full md:w-60"
                >
                  <option value="">-- เลือกรถ / ทะเบียนรถร่วม --</option>
                  {vehicles.map(v => (
                    <option key={v.licensePlate} value={v.licensePlate}>
                      {v.licensePlate} ({v.type || 'รถร่วม'} - {v.ownerType || 'Partner'})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleImportJobsFromPlan(vehicleLicense)}
                  disabled={!vehicleLicense}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs py-2 px-4 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  ดึงข้อมูล
                </button>
              </div>
            </div>

            {/* Trips Table Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    รายการเที่ยววิ่งของรถ (Trips Details)
                  </h4>
                  <p className="text-xs text-slate-500">
                    สามารถแก้ไข ราคาค่าเที่ยว (Price), ค่าล่วงเวลา (OT) และหมายเหตุได้โดยตรง
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddTripRow}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-1.5 px-3 rounded-lg border border-slate-300 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> + เพิ่มแถวเที่ยววิ่ง
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-xs text-left border-collapse font-sans">
                    <thead className="sticky top-0 bg-slate-100 text-slate-700 border-b border-slate-200 font-bold text-[11px] z-10">
                      <tr>
                        <th className="p-2 text-center w-10">No.</th>
                        <th className="p-2 w-28">Date</th>
                        <th className="p-2 min-w-[140px]">Shiper</th>
                        <th className="p-2 min-w-[130px]">Booking No.</th>
                        <th className="p-2 w-24">Type</th>
                        <th className="p-2 min-w-[140px]">Container no.</th>
                        <th className="p-2 w-28 text-right">Price (ราคา)</th>
                        <th className="p-2 w-24 text-right">OT</th>
                        <th className="p-2 min-w-[120px]">Remark</th>
                        <th className="p-2 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {trips.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="p-8 text-center text-slate-400">
                            ไม่มีรายการเที่ยววิ่ง กรุณาเลือกรถเพื่อดึงข้อมูล หรือกดปุ่ม <strong>"+ เพิ่มแถวเที่ยววิ่ง"</strong>
                          </td>
                        </tr>
                      ) : (
                        trips.map((trip, idx) => (
                          <tr key={trip.id || idx} className="hover:bg-slate-50">
                            <td className="p-2 text-center font-mono text-slate-500 font-bold">{idx + 1}</td>
                            <td className="p-1">
                              <input
                                type="date"
                                value={trip.date}
                                onChange={(e) => updateTripField(idx, 'date', e.target.value)}
                                className="w-full text-xs bg-white border border-slate-200 rounded p-1.5 outline-none font-sans"
                              />
                            </td>
                            <td className="p-1">
                              <input
                                type="text"
                                value={trip.shipper}
                                onChange={(e) => updateTripField(idx, 'shipper', e.target.value)}
                                placeholder="Shipper"
                                className="w-full text-xs bg-white border border-slate-200 rounded p-1.5 outline-none font-sans"
                              />
                            </td>
                            <td className="p-1">
                              <input
                                type="text"
                                value={trip.bookingNo}
                                onChange={(e) => updateTripField(idx, 'bookingNo', e.target.value)}
                                placeholder="Booking No."
                                className="w-full text-xs bg-white border border-slate-200 rounded p-1.5 outline-none font-mono"
                              />
                            </td>
                            <td className="p-1">
                              <input
                                type="text"
                                value={trip.type}
                                onChange={(e) => updateTripField(idx, 'type', e.target.value)}
                                placeholder="20', 40', Import"
                                className="w-full text-xs bg-white border border-slate-200 rounded p-1.5 outline-none font-sans"
                              />
                            </td>
                            <td className="p-1">
                              <input
                                type="text"
                                value={trip.containerNo}
                                onChange={(e) => updateTripField(idx, 'containerNo', e.target.value)}
                                placeholder="หมายเลขตู้"
                                className="w-full text-xs bg-white border border-slate-200 rounded p-1.5 outline-none font-mono"
                              />
                            </td>
                            <td className="p-1">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={trip.price || ''}
                                onChange={(e) => updateTripField(idx, 'price', e.target.value)}
                                placeholder="0.00"
                                className="w-full text-xs font-mono font-bold text-right bg-white border border-slate-200 rounded p-1.5 outline-none text-slate-900"
                              />
                            </td>
                            <td className="p-1">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={trip.ot || ''}
                                onChange={(e) => updateTripField(idx, 'ot', e.target.value)}
                                placeholder="0.00"
                                className="w-full text-xs font-mono font-bold text-right bg-white border border-slate-200 rounded p-1.5 outline-none text-slate-900"
                              />
                            </td>
                            <td className="p-1">
                              <input
                                type="text"
                                value={trip.remark}
                                onChange={(e) => updateTripField(idx, 'remark', e.target.value)}
                                placeholder="หมายเหตุ / ปลายทาง"
                                className="w-full text-xs bg-white border border-slate-200 rounded p-1.5 outline-none font-sans"
                              />
                            </td>
                            <td className="p-1 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveTripRow(idx)}
                                className="p-1 text-red-500 hover:text-red-700 bg-white border border-slate-200 rounded hover:bg-red-50 transition-colors"
                                title="ลบแถวนี้"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Calculations & Deduction Control Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900 text-white p-5 rounded-2xl border border-slate-800">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">การหักเงิน และสถานะ</h4>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-300 block">
                    หัก Advance (แอดวานซ์ / เงินเบิกล่วงหน้า)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={advanceDeduction || ''}
                      onChange={(e) => setAdvanceDeduction(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full text-sm font-mono font-black bg-slate-800 text-amber-300 border border-slate-700 rounded-lg p-2.5 outline-none focus:border-amber-400"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">บาท</span>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-xs font-bold text-slate-300 block">สถานะการจ่ายเงิน</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full text-xs font-bold bg-slate-800 text-white border border-slate-700 rounded-lg p-2.5 outline-none"
                  >
                    <option value="ยังไม่ได้จ่าย">ยังไม่ได้จ่าย (Pending Payment)</option>
                    <option value="จ่ายแล้ว">จ่ายแล้ว (Paid)</option>
                  </select>
                </div>
              </div>

              {/* Math Summary Box */}
              <div className="space-y-2 text-xs bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
                <div className="flex justify-between text-slate-400">
                  <span>รวมค่าเที่ยวทั้งหมด ({trips.length} เที่ยว):</span>
                  <span className="font-mono text-slate-200 font-bold">{formatCurrency(totals.subtotalPrice)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>รวมค่าล่วงเวลา (OT):</span>
                  <span className="font-mono text-slate-200 font-bold">{formatCurrency(totals.subtotalOt)}</span>
                </div>
                <div className="flex justify-between text-slate-200 font-bold border-t border-slate-800 pt-1.5">
                  <span>ยอดรวมก่อนหัก (รวม):</span>
                  <span className="font-mono text-indigo-300 font-extrabold">{formatCurrency(totals.totalBeforeDeductions)}</span>
                </div>
                <div className="flex justify-between text-amber-400">
                  <span>หัก Advance:</span>
                  <span className="font-mono font-bold">-{formatCurrency(advanceDeduction)}</span>
                </div>
                <div className="flex justify-between text-red-400">
                  <span>หัก ณ ที่จ่าย 1% (คำนวณอัตโนมัติ):</span>
                  <span className="font-mono font-bold">-{formatCurrency(totals.withholdingTax)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-white border-t border-slate-800 pt-2 bg-indigo-900/40 p-2 rounded-lg">
                  <span className="text-emerald-300">รวมทั้งสิ้น (สุทธิ):</span>
                  <span className="text-emerald-400 font-mono text-lg">{formatCurrency(totals.grandTotal)} <span className="text-xs font-normal text-slate-300">บาท</span></span>
                </div>
              </div>
            </div>

            {/* Form Footer Buttons */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-4 rounded-xl border border-slate-300 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-6 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" /> บันทึกเอกสารทำจ่ายรถร่วม
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Printable Voucher Matching the Sample Image */}
      {previewDoc && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-xl shadow-md no-print">
            <div className="flex items-center gap-2">
              <Printer className="text-indigo-400 w-5 h-5" />
              <div>
                <h3 className="font-bold text-sm">พิมพ์เอกสารทำจ่ายรถร่วม (Subcontractor Payment Voucher)</h3>
                <p className="text-xs text-slate-400">รูปแบบเอกสาร A4 ตามมาตรฐานแบบฟอร์มบริษัท</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm font-sans"
              >
                <Printer className="w-3.5 h-3.5" /> สั่งพิมพ์ (Print)
              </button>
              <button
                onClick={() => window.print()}
                className="bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer shadow-sm font-sans"
              >
                <FileText className="w-3.5 h-3.5 text-red-500" /> ส่งออก PDF
              </button>
              <button
                onClick={() => setPreviewDoc(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-2 px-4 rounded-lg transition-colors border border-slate-700 cursor-pointer font-sans"
              >
                ย้อนกลับ (Close)
              </button>
            </div>
          </div>

          {/* Exact Sample Image Layout for A4 Print */}
          <div className="bg-white text-slate-900 p-8 md:p-10 border border-slate-400 shadow-xl rounded-xl max-w-4xl mx-auto font-sans text-xs relative overflow-x-auto print-view-partner">
            <style>
              {`
                @media print {
                  @page {
                    size: A4 portrait;
                    margin: 0.8cm;
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
                  .print-view-partner, .print-view-partner * {
                    visibility: visible;
                  }
                  .print-view-partner {
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

            {/* Header with Circular Logo and Company Details */}
            <div className="flex flex-row items-center gap-4 border-b-2 border-slate-800 pb-3">
              <div className="w-20 h-20 flex items-center justify-center shrink-0">
                <img 
                  src="https://lh3.googleusercontent.com/d/14sHmuOzVEZbKgOZP5p7COS1rfXJvi5w_" 
                  alt="Khemthit Transport Logo" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex-1">
                <h1 className="text-base font-extrabold tracking-wide text-slate-950 uppercase leading-snug">
                  KHEMTHIT TRANSPORT CO.,LTD
                </h1>
                <h2 className="text-sm font-bold text-slate-900">
                  บริษัท เข็มทิศ ทรานสปอร์ต จำกัด
                </h2>
                <p className="text-[11px] text-slate-700 mt-0.5">
                  102/51 ม.10 ต.ทุ่งสุขลา อ.ศรีราชา จ.ชลบุรี 20230
                </p>
                <p className="text-[11px] text-slate-700">
                  เลขประจำตัวผู้เสียภาษี 0205568017041
                </p>
              </div>

              <div className="text-right">
                <div className="border border-slate-400 bg-slate-50 px-3 py-1.5 rounded">
                  <span className="text-[10px] text-slate-500 block font-bold">เลขที่ทำจ่าย:</span>
                  <span className="text-xs font-mono font-black text-slate-900">{previewDoc.paymentNo}</span>
                </div>
              </div>
            </div>

            {/* Info Grid (ชื่อ, ทะเบียน, รอบทำจ่าย, วันที่ทำจ่าย) */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 py-3 border-b border-slate-300 text-[11px]">
              <div className="flex items-center">
                <span className="w-24 font-bold text-slate-900">ชื่อ :</span>
                <span className="font-semibold text-slate-800">{previewDoc.partnerName}</span>
              </div>
              <div className="flex items-center">
                <span className="w-24 font-bold text-slate-900">รอบทำจ่าย :</span>
                <span className="font-semibold text-slate-800">{previewDoc.paymentCycle}</span>
              </div>
              <div className="flex items-center">
                <span className="w-24 font-bold text-slate-900">ทะเบียน :</span>
                <span className="font-bold text-slate-950 font-mono">{previewDoc.vehicleLicense}</span>
              </div>
              <div className="flex items-center">
                <span className="w-24 font-bold text-slate-900">วันที่ทำจ่าย :</span>
                <span className="font-mono text-slate-800">{previewDoc.date}</span>
              </div>
            </div>

            {/* Structured Table for Trips */}
            <div className="mt-3">
              <table className="w-full text-left border-collapse border border-slate-400 text-[10px] font-sans">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 border-b border-slate-400 font-bold text-center">
                    <th className="border border-slate-400 p-1 w-8">No.</th>
                    <th className="border border-slate-400 p-1 w-16">Date</th>
                    <th className="border border-slate-400 p-1 min-w-[100px] text-left">Shiper</th>
                    <th className="border border-slate-400 p-1 min-w-[90px] text-left">Booking No.</th>
                    <th className="border border-slate-400 p-1 w-12">Type</th>
                    <th className="border border-slate-400 p-1 min-w-[100px] text-left">Container no.</th>
                    <th className="border border-slate-400 p-1 w-16 text-right">Price</th>
                    <th className="border border-slate-400 p-1 w-14 text-right">OT</th>
                    <th className="border border-slate-400 p-1 min-w-[80px] text-left">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {previewDoc.trips.map((trip, idx) => (
                    <tr key={idx} className="border-b border-slate-300">
                      <td className="border border-slate-300 p-1 text-center font-mono">{idx + 1}</td>
                      <td className="border border-slate-300 p-1 text-center font-mono">{trip.date}</td>
                      <td className="border border-slate-300 p-1 font-medium">{trip.shipper || '-'}</td>
                      <td className="border border-slate-300 p-1 font-mono">{trip.bookingNo || '-'}</td>
                      <td className="border border-slate-300 p-1 text-center">{trip.type || "40'"}</td>
                      <td className="border border-slate-300 p-1 font-mono font-medium">{trip.containerNo || '-'}</td>
                      <td className="border border-slate-300 p-1 text-right font-mono font-semibold">{trip.price > 0 ? formatCurrency(trip.price) : '-'}</td>
                      <td className="border border-slate-300 p-1 text-right font-mono">{trip.ot > 0 ? formatCurrency(trip.ot) : '-'}</td>
                      <td className="border border-slate-300 p-1 text-slate-600">{trip.remark || '-'}</td>
                    </tr>
                  ))}

                  {/* If less than 15 rows, render elegant blank grid rows to fill the voucher sheet gracefully */}
                  {Array.from({ length: Math.max(0, 12 - previewDoc.trips.length) }).map((_, i) => (
                    <tr key={`blank-${i}`} className="border-b border-slate-250 h-5">
                      <td className="border border-slate-300 p-1 text-center font-mono text-slate-300">{previewDoc.trips.length + i + 1}</td>
                      <td className="border border-slate-300 p-1"></td>
                      <td className="border border-slate-300 p-1"></td>
                      <td className="border border-slate-300 p-1"></td>
                      <td className="border border-slate-300 p-1"></td>
                      <td className="border border-slate-300 p-1"></td>
                      <td className="border border-slate-300 p-1"></td>
                      <td className="border border-slate-300 p-1"></td>
                      <td className="border border-slate-300 p-1"></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Bottom Calculations Table matching the Sample Image */}
              <div className="flex justify-end mt-2">
                <table className="w-72 border-collapse border border-slate-400 text-[11px] font-sans">
                  <tbody>
                    <tr className="border-b border-slate-300">
                      <td className="border border-slate-400 p-1.5 font-bold text-slate-800 bg-slate-50">รวม</td>
                      <td className="border border-slate-400 p-1.5 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(previewDoc.totalBeforeDeductions)}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-300">
                      <td className="border border-slate-400 p-1.5 font-bold text-red-700 bg-slate-50">หัก Advance</td>
                      <td className="border border-slate-400 p-1.5 text-right font-mono font-bold text-red-700">
                        {previewDoc.advanceDeduction > 0 ? formatCurrency(previewDoc.advanceDeduction) : '0.00'}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-300">
                      <td className="border border-slate-400 p-1.5 font-bold text-red-700 bg-slate-50">หัก ณ ที่จ่าย 1%</td>
                      <td className="border border-slate-400 p-1.5 text-right font-mono font-bold text-red-700">
                        {formatCurrency(previewDoc.withholdingTax)}
                      </td>
                    </tr>
                    {/* Blue Highlight row matching physical template */}
                    <tr className="bg-sky-100 text-slate-950 font-black border-2 border-slate-800">
                      <td className="border border-slate-800 p-2 text-xs font-black">รวมทั้งสิ้น</td>
                      <td className="border border-slate-800 p-2 text-right font-mono text-sm font-black">
                        {formatCurrency(previewDoc.grandTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Thai Baht text description */}
            <div className="mt-3 p-2 bg-slate-50 border border-slate-300 text-center text-xs font-semibold text-slate-800">
              -- จำนวนเงินตัวอักษร: {arabicToThaiBaht(previewDoc.grandTotal)} --
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-12 pt-10 text-center text-[10px]">
              <div className="space-y-8">
                <div className="h-6"></div>
                <div className="space-y-1.5">
                  <p className="font-bold flex justify-center">
                    ....................................................................
                  </p>
                  <p className="font-bold text-slate-900">ผู้รับเงิน / พนักงานขับรถร่วม</p>
                  <p className="text-slate-500">
                    วันที่ .......... / .......... / ................
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="h-6"></div>
                <div className="space-y-1.5">
                  <p className="font-bold flex justify-center">
                    ....................................................................
                  </p>
                  <p className="font-bold text-slate-900">ผู้มีอำนาจจ่ายเงิน / ผู้ตรวจสอบ</p>
                  <p className="text-slate-500">
                    วันที่ .......... / .......... / ................
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
