import React, { useState, useRef } from 'react';
import { 
  Plus, Edit2, Trash2, Search, X, DollarSign, Calendar, 
  Truck, Upload, FileText, Check, Filter, CreditCard, Award, HelpCircle
} from 'lucide-react';
import { DailyExpense, Driver, Vehicle, TransportJob } from '../types';
import { formatCurrency, getStatusStyle } from '../utils';

interface ExpensesViewProps {
  expenses: DailyExpense[];
  drivers: Driver[];
  vehicles: Vehicle[];
  jobs: TransportJob[];
  onSaveExpense: (expense: DailyExpense) => void;
  onDeleteExpense: (expenseId: string) => void;
}

export function ExpensesView({ expenses, drivers, vehicles, jobs, onSaveExpense, onDeleteExpense }: ExpensesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  // Filter for Advance vs Normal tab
  const [activeBillTab, setActiveBillTab] = useState<'All' | 'Normal' | 'Adv'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [id, setId] = useState('');
  const [selectedJobNo, setSelectedJobNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<DailyExpense['type']>('น้ำมัน');
  const [description, setDescription] = useState('');
  const [vehicleLicense, setVehicleLicense] = useState('');
  const [driverName, setDriverName] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState('');
  const [billType, setBillType] = useState<DailyExpense['billType']>('Normal');
  
  // Drag and Drop Slip file attachment state
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditMode, setIsEditMode] = useState(false);

  // Today calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTotal = expenses
    .filter(e => e.date === todayStr)
    .reduce((sum, e) => sum + e.amount, 0);

  const totalNormalAmount = expenses
    .filter(e => e.billType === 'Normal')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalAdvAmount = expenses
    .filter(e => e.billType === 'Adv')
    .reduce((sum, e) => sum + e.amount, 0);

  // Filter and Search
  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = 
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.note.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.vehicleLicense.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBillType = activeBillTab === 'All' || e.billType === activeBillTab;

    return matchesSearch && matchesBillType;
  });

  const resetForm = () => {
    const firstJob = jobs && jobs.length > 0 ? jobs[0] : null;
    setSelectedJobNo(firstJob ? firstJob.jobNo : '');
    setId('');
    setDate(new Date().toISOString().split('T')[0]);
    setType('น้ำมัน');
    setDescription(firstJob ? `วิ่งงานจ๊อบ ${firstJob.jobNo} [${firstJob.origin} ➔ ${firstJob.destination}]` : '');
    setVehicleLicense(firstJob?.vehicleLicense || vehicles[0]?.licensePlate || '');
    setDriverName(firstJob?.driverName || drivers[0]?.name || '');
    setAmount(0);
    setNote('');
    setBillType('Normal');
    setFileName('');
    setFileUrl('');
    setIsEditMode(false);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (e: DailyExpense) => {
    setId(e.id);
    setSelectedJobNo(e.jobNo || '');
    setDate(e.date);
    setType(e.type);
    setDescription(e.description);
    setVehicleLicense(e.vehicleLicense);
    setDriverName(e.driverName);
    setAmount(e.amount);
    setNote(e.note);
    setBillType(e.billType);
    setFileName('attach_slip_image_uploaded.png');
    setFileUrl('https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300&q=80');
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleJobChange = (jobNo: string) => {
    setSelectedJobNo(jobNo);
    const foundJob = jobs.find(j => j.jobNo === jobNo);
    if (foundJob) {
      if (foundJob.driverName) setDriverName(foundJob.driverName);
      if (foundJob.vehicleLicense) setVehicleLicense(foundJob.vehicleLicense);
      setDescription(`วิ่งงานจ๊อบ ${jobNo} [${foundJob.origin} ➔ ${foundJob.destination}]`);
    }
  };

  // Drag-and-drop file upload handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFileName(file.name);
      setFileUrl(URL.createObjectURL(file));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      setFileUrl(URL.createObjectURL(file));
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert("กรุณาระบุจำนวนเงินค่าใช้จ่ายมากกว่า 0 บาท");
      return;
    }

    let finalId = id;
    if (!finalId) {
      if (selectedJobNo) {
        // Generate sequence key for this job
        const jobExpensesCount = expenses.filter(exp => exp.jobNo === selectedJobNo).length;
        const seq = String(jobExpensesCount + 1).padStart(3, '0');
        finalId = `${selectedJobNo}/EXP-${seq}`;
      } else {
        finalId = `EXP-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(expenses.length + 1).padStart(3, '0')}`;
      }
    }

    const savedExpense: DailyExpense = {
      id: finalId,
      jobNo: selectedJobNo,
      date,
      type,
      description,
      vehicleLicense,
      driverName,
      amount,
      note,
      billType
    };

    onSaveExpense(savedExpense);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Upper Stats Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stat 1: Today sum */}
        <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 font-mono text-[10px] tracking-wider uppercase block">สูตรสรุปยอดวันนี้ SUMIFS()</span>
            <span className="text-xl font-bold font-mono tracking-tight text-amber-400">
              {formatCurrency(todayTotal)}
            </span>
            <span className="text-[11px] text-slate-300 block">ยอดรวมเบิกจ่ายประจำวันนี้</span>
          </div>
          <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
            <Calendar className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        {/* Stat 2: Normal expenses */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">ค่าใช้จ่ายขนส่งหลัก (Normal)</span>
            <span className="text-xl font-bold font-mono text-slate-900 block font-bold">
              {formatCurrency(totalNormalAmount)}
            </span>
            <span className="text-[11px] text-slate-400 block">ค่าเที่ยววิ่ง, น้ำมัน และค่าซ่อมหลัก</span>
          </div>
          <div className="bg-blue-50 text-blue-600 p-2.5 rounded-lg border border-blue-100">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 3: Advance payments */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">เงินสำรองจ่ายล่วงหน้า (Advance - Adv)</span>
            <span className="text-xl font-bold font-mono text-orange-600 block">
              {formatCurrency(totalAdvAmount)}
            </span>
            <span className="text-[11px] text-slate-400 block">ค่าผ่านด่าน, ค่าคืนตู้สำรองล่วงหน้า</span>
          </div>
          <div className="bg-orange-50 text-orange-600 p-2.5 rounded-lg border border-orange-100">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Table filters and Control Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Toggle Bill Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 w-max text-xs">
          <button 
            onClick={() => setActiveBillTab('All')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${activeBillTab === 'All' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            ค่าใช้จ่ายรวมหมด ({expenses.length})
          </button>
          <button 
            onClick={() => setActiveBillTab('Normal')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${activeBillTab === 'Normal' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <span className="w-2 h-2 rounded-full bg-white"></span>
            งานปกติ ({expenses.filter(e => e.billType === 'Normal').length})
          </button>
          <button 
            onClick={() => setActiveBillTab('Adv')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${activeBillTab === 'Adv' ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <span className="w-2 h-2 rounded-full bg-white"></span>
            เงินสำรองจ่าย Adv ({expenses.filter(e => e.billType === 'Adv').length})
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="ค้นหาใบเบิกค่าใช้จ่าย..."
              className="bg-slate-50 hover:bg-slate-100 focus:bg-white text-xs text-slate-700 pl-9 pr-4 py-2 rounded-lg border border-slate-200 outline-none w-full sm:w-56 transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleOpenAddModal}
            className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 px-3.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> บันทึกเบิกงวดเงิน
          </button>
        </div>
      </div>

      {/* Expense Excel Worksheet stye Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-mono text-slate-600">
                <th className="p-3 border-r border-slate-150 font-semibold">เลขจ๊อบอ้างอิง (Job Ref)</th>
                <th className="p-3 border-r border-slate-150 font-semibold text-center">วันที่เบิกเงิน</th>
                <th className="p-3 border-r border-slate-150 font-semibold text-center">ประเภทบัญชีกลุ่ม</th>
                <th className="p-3 border-r border-slate-150 font-semibold">ประเภทค่าใช้จ่าย</th>
                <th className="p-3 border-r border-slate-150 font-semibold">รายละเอียดรายการเบิกค่าใช้จ่าย</th>
                <th className="p-3 border-r border-slate-150 font-semibold">ทะเบียนรถ</th>
                <th className="p-3 border-r border-slate-150 font-semibold">ผู้ขอเบิกจ่าย (คนขับ)</th>
                <th className="p-3 border-r border-slate-150 font-semibold">บันทึกช่วยจำ/เอกสารแนบ</th>
                <th className="p-3 border-r border-slate-150 font-semibold text-right text-slate-950">จำนวนยอดเงิน</th>
                <th className="p-3 text-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 text-slate-700">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-slate-400 font-mono">
                    ไม่มีรายการบันทึกเบิกเงินตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors odd:bg-white even:bg-slate-50/45">
                    <td className="p-3 border-r border-slate-150 font-mono font-bold align-middle">
                      <div className="flex flex-col">
                        <span className="text-slate-900 font-bold font-mono text-xs">{exp.jobNo || 'ทั่วไป / ไม่มีจ๊อบ'}</span>
                        {exp.id.includes('/') ? (
                          <span className="text-[10px] text-slate-400 font-normal">({exp.id.split('/')[1]})</span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-normal">({exp.id})</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 border-r border-slate-150 font-mono text-center text-slate-500 whitespace-nowrap align-middle">
                      {exp.date}
                    </td>
                    <td className="p-3 border-r border-slate-150 text-center align-middle whitespace-nowrap">
                      {exp.billType === 'Adv' ? (
                        <span className="bg-orange-50 text-orange-700 border border-orange-200 font-bold px-2 py-0.5 rounded-md text-[10px] tracking-wide font-mono">
                          ADVANCE (เงินสำรอง)
                        </span>
                      ) : (
                        <span className="bg-sky-50 text-sky-700 border border-sky-200 font-bold px-2 py-0.5 rounded-md text-[10px] tracking-wide font-mono">
                          NORMAL (ค่าใช้จ่ายหลัก)
                        </span>
                      )}
                    </td>
                    <td className="p-3 border-r border-slate-150 font-bold text-slate-900 align-middle whitespace-nowrap">
                      {exp.type}
                    </td>
                    <td className="p-3 border-r border-slate-150 align-middle max-w-[200px] truncate" title={exp.description}>
                      {exp.description}
                    </td>
                    <td className="p-3 border-r border-slate-150 font-mono text-slate-600 align-middle">
                      {exp.vehicleLicense}
                    </td>
                    <td className="p-3 border-r border-slate-150 align-middle font-medium">
                      {exp.driverName}
                    </td>
                    <td className="p-3 border-r border-slate-150 align-middle">
                      <div className="flex flex-col gap-0.5 max-w-[160px]">
                        <span className="text-slate-400 truncate text-[10px] block" title={exp.note}>{exp.note || '-'}</span>
                        {/* Mock Slip indicator */}
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-150 px-1.5 py-0.5 rounded flex items-center gap-0.5 w-max">
                          <Check className="w-3 h-3" /> แนบภาพสลิปใบเสร็จแล้ว
                        </span>
                      </div>
                    </td>
                    <td className="p-3 border-r border-slate-150 text-right font-mono font-bold text-red-600 align-middle whitespace-nowrap">
                      -{formatCurrency(exp.amount)}
                    </td>
                    <td className="p-3 text-center align-middle whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => handleOpenEditModal(exp)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-1.5 rounded-lg border border-slate-200 transition-colors"
                          title="แก้ไขเงินเบิก"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm(`คุณต้องการลบข้อมูลเบิกจ่าย ${exp.id} หรือไม่?`)) {
                              onDeleteExpense(exp.id);
                            }
                          }}
                          className="bg-red-50 hover:bg-red-100 text-red-600 p-1.5 rounded-lg border border-red-200 transition-colors"
                          title="ลบเงินเบิกนี้"
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

      {/* Add / Edit Expense Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">
            <div className="bg-slate-950 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs uppercase font-sans tracking-wider">
                  {isEditMode ? 'แก้ไขแบบเบิกบันทึกเงินค่าใช้จ่าย' : 'บันทึกคำขอเบิกจ่ายเงินค่าใช้จ่ายรายวัน'}
                </h3>
                <p className="text-slate-400 text-xs">แยกหมวดการเบิกจ่าย (Normal และ Advance) พร้อมแนบใบเสร็จสลิป</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white bg-slate-850 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block">เลขงานวิ่งอ้างอิง (Job No. Reference)</label>
                  {isEditMode ? (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={selectedJobNo || 'ทั่วไป / ไม่มีงานวิ่ง'}
                        className="flex-1 text-xs bg-slate-100 font-mono text-slate-650 border border-slate-200 rounded-lg p-2.5 outline-none font-bold"
                        readOnly
                      />
                      <input 
                        type="text" 
                        value={id.includes('/') ? id.split('/')[1] : id}
                        className="w-1/3 text-xs bg-slate-100 font-mono text-slate-400 border border-slate-200 rounded-lg p-2.5 outline-none text-center font-semibold"
                        readOnly
                        title="เลขใบสำคัญการทำเบิก"
                      />
                    </div>
                  ) : (
                    <select
                      value={selectedJobNo}
                      onChange={(e) => handleJobChange(e.target.value)}
                      className="w-full text-xs text-slate-900 border border-indigo-200 bg-indigo-50/25 font-bold font-mono focus:bg-white focus:border-indigo-500 rounded-lg p-2.5 outline-none"
                      required
                    >
                      <option value="">-- กรุณาเลือกเลขจ๊อบขนส่งอ้างอิง (คู่ค้า / เส้นทาง) --</option>
                      {jobs.map(j => (
                        <option key={j.jobNo} value={j.jobNo} className="font-mono text-slate-800">
                          {j.jobNo} - {j.customerName} ({j.origin} ➔ {j.destination})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block">วันที่จ่ายเงิน</label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">ประเภทกลุ่มการทำจ่าย (Bill Type)</label>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <label className={`border rounded-lg p-2.5 flex items-center justify-center gap-2 text-xs font-bold cursor-pointer transition-all ${billType === 'Normal' ? 'bg-sky-50 border-sky-300 text-sky-850 shadow-xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      <input 
                        type="radio" 
                        name="billType" 
                        value="Normal" 
                        checked={billType === 'Normal'} 
                        onChange={() => setBillType('Normal')}
                        className="hidden"
                      />
                      <span>Normal (หลัก)</span>
                    </label>
                    <label className={`border rounded-lg p-2.5 flex items-center justify-center gap-2 text-xs font-bold cursor-pointer transition-all ${billType === 'Adv' ? 'bg-orange-50 border-orange-300 text-orange-850 shadow-xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      <input 
                        type="radio" 
                        name="billType" 
                        value="Adv" 
                        checked={billType === 'Adv'} 
                        onChange={() => setBillType('Adv')}
                        className="hidden"
                      />
                      <span>Advance (สำรอง)</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">หมวดหมู่ค่าใช้จ่าย</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none"
                    required
                  >
                    <option value="น้ำมัน">น้ำมัน</option>
                    <option value="ค่าทางด่วน">ค่าทางด่วน</option>
                    <option value="ค่าซ่อม">ค่าซ่อม</option>
                    <option value="ค่าแรง">ค่าแรง</option>
                    <option value="ค่าอาหาร">ค่าอาหาร</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">รถขนส่งอ้างอิง</label>
                  <select
                    value={vehicleLicense}
                    onChange={(e) => setVehicleLicense(e.target.value)}
                    className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none"
                    required
                  >
                    {vehicles.map(v => (
                      <option key={v.licensePlate} value={v.licensePlate}>{v.licensePlate} ({v.type})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">คนขับ/พนักงานผู้ขอเบิกเงิน</label>
                  <select
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none"
                    required
                  >
                    {drivers.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">รายละเอียดจุดพักวิ่งหรือการจ้างงาน</label>
                <input 
                  type="text" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="เช่น เติมน้ำมันเที่ยววิ่ง สระบุรี-ชลบุรี, เปลี่ยนยางรถ"
                  className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-xs font-bold text-slate-700 block">จำนวนเงินเบิก (บาท)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full text-xs font-mono font-extrabold text-red-600 border border-slate-200 rounded-lg p-2.5 outline-none text-right placeholder-slate-300"
                    required
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block">หมายเหตุชี้แจง</label>
                  <input 
                    type="text" 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="ระบุเพิ่มเติม เช่น ด่านมอเตอร์เวย์ ด่านพานทอง 2"
                    className="w-full text-xs text-slate-800 border border-slate-200 rounded-lg p-2.5 outline-none"
                  />
                </div>
              </div>

              {/* Drag and Drop Box following UX Requirements */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">แนบหลักฐานใบเสร็จ / รูปภาพสลิปชำระเงิน</label>
                <div 
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${dragActive ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'}`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={triggerFileInput}
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Upload className="w-10 h-10 text-slate-400" />
                    <div>
                      <p className="text-xs font-bold text-slate-700">ลากภาพสลิปใบเสร็จมาวางที่นี่ หรือคลิกเพื่อค้นหาไฟล์</p>
                      <p className="text-[10px] text-slate-400">รองรับระบบประมวลผลไฟล์ภาพนามสกุล JPEG, PNG หรือ PDF ขนาดไม่เกิน 5MB</p>
                    </div>
                  </div>
                </div>

                {fileName && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800 font-mono">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-500" />
                      <span className="font-semibold">{fileName}</span>
                    </div>
                    {fileUrl && (
                      <span className="text-[10px] bg-emerald-100 px-2 py-0.5 rounded text-emerald-700">สำเร็จ</span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2 px-4 rounded-lg border border-slate-200 transition-colors"
                >
                  ปิดหน้างต่าง
                </button>
                <button
                  type="submit"
                  className="bg-slate-950 text-white font-semibold text-xs py-2 px-5 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  บันทึกแบบสรุปเบิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
