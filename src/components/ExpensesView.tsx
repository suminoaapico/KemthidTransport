import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  DollarSign,
  Calendar,
  Truck,
  Upload,
  FileText,
  UserCheck,
  Percent,
  Wallet,
  Eye,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  DailyExpense,
  DailyExpenseType,
  Driver,
  ExpenseCategory,
  TransportJob,
  Vehicle,
} from '../types';
import {
  DRIVER_EXPENSE_TYPES,
  GENERAL_ADV_EXPENSE_TYPES,
  GENERAL_NORMAL_EXPENSE_TYPES,
  calculateDriverExpenseTax,
  formatCurrency,
  formatDate,
  isDriverExpenseType,
  normalizeExpenseRecord,
} from '../utils';
import { ConfirmDialog, EmptyState, StatCard, useToast } from './ui/DesignSystem';

interface ExpensesViewProps {
  expenses: DailyExpense[];
  drivers: Driver[];
  vehicles: Vehicle[];
  jobs: TransportJob[];
  onSaveExpense: (expense: DailyExpense) => Promise<boolean> | void;
  onDeleteExpense: (expenseId: string) => Promise<boolean> | void;
  initialCategoryFilter?: 'all' | 'driver' | 'general';
  openAddSignal?: number;
}

export function ExpensesView({
  expenses,
  drivers,
  vehicles,
  jobs,
  onSaveExpense,
  onDeleteExpense,
  initialCategoryFilter = 'all',
  openAddSignal = 0,
}: ExpensesViewProps) {
  const { showToast } = useToast();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [activeBillTab, setActiveBillTab] = useState<'All' | 'Normal' | 'Adv'>('All');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'driver' | 'general'>(
    initialCategoryFilter
  );

  // Sync external initialCategoryFilter when switching sidebar menu
  useEffect(() => {
    setCategoryFilter(initialCategoryFilter);
  }, [initialCategoryFilter]);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailExpense, setDetailExpense] = useState<DailyExpense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DailyExpense | null>(null);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [id, setId] = useState('');
  const [selectedJobNo, setSelectedJobNo] = useState('');
  const [containerNo, setContainerNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('driver');
  const [type, setType] = useState<DailyExpenseType>('ค่าจ้างคนขับรถ');
  const [description, setDescription] = useState('');
  const [vehicleLicense, setVehicleLicense] = useState('');
  const [driverName, setDriverName] = useState('');
  const [amountInput, setAmountInput] = useState<string>('');
  const [note, setNote] = useState('');
  const [billType, setBillType] = useState<DailyExpense['billType']>('Normal');

  // Attachment preview state (local file only)
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Normalize all expenses so legacy records always have accurate tax figures
  const normalizedExpenses = useMemo(
    () => expenses.map((e) => normalizeExpenseRecord(e)),
    [expenses]
  );

  // Live tax preview calculation for current form inputs
  const numericAmount = useMemo(() => {
    const parsed = parseFloat(amountInput);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [amountInput]);

  const liveTax = useMemo(
    () => calculateDriverExpenseTax(numericAmount, expenseCategory),
    [numericAmount, expenseCategory]
  );

  // Summary metrics
  const summary = useMemo(() => {
    const totalAmount = normalizedExpenses.reduce((s, e) => s + e.amount, 0);
    const driverItems = normalizedExpenses.filter((e) => e.expenseCategory === 'driver');
    const driverTotal = driverItems.reduce((s, e) => s + e.amount, 0);
    const totalWht = normalizedExpenses.reduce((s, e) => s + e.withholdingTaxAmount, 0);
    const totalNet = normalizedExpenses.reduce((s, e) => s + e.netAmount, 0);
    return {
      totalAmount,
      driverCount: driverItems.length,
      driverTotal,
      totalWht,
      totalNet,
    };
  }, [normalizedExpenses]);

  // Filtered list
  const filteredExpenses = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return normalizedExpenses.filter((e) => {
      const matchesSearch =
        !q ||
        e.description.toLowerCase().includes(q) ||
        e.note.toLowerCase().includes(q) ||
        e.driverName.toLowerCase().includes(q) ||
        e.vehicleLicense.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q) ||
        e.jobNo.toLowerCase().includes(q) ||
        (e.containerNo && e.containerNo.toLowerCase().includes(q));

      const matchesBillType = activeBillTab === 'All' || e.billType === activeBillTab;
      const matchesCategory =
        categoryFilter === 'all' || e.expenseCategory === categoryFilter;

      return matchesSearch && matchesBillType && matchesCategory;
    });
  }, [normalizedExpenses, searchTerm, activeBillTab, categoryFilter]);

  const resetForm = (defaultCat?: ExpenseCategory) => {
    const firstJob = jobs && jobs.length > 0 ? jobs[0] : null;
    const cat: ExpenseCategory =
      defaultCat || (categoryFilter === 'general' ? 'general' : 'driver');
    setSelectedJobNo(firstJob ? firstJob.jobNo : '');
    setContainerNo(
      firstJob && firstJob.containers && firstJob.containers.length > 0
        ? firstJob.containers[0].containerNo
        : ''
    );
    setId('');
    setDate(new Date().toISOString().split('T')[0]);
    setExpenseCategory(cat);
    setBillType('Normal');
    setType(cat === 'driver' ? 'ค่าจ้างคนขับรถ' : 'ค่าน้ำมัน');
    setDescription(
      firstJob
        ? `วิ่งงานจ๊อบ ${firstJob.jobNo} [${firstJob.origin} ➔ ${firstJob.destination}]`
        : ''
    );
    setVehicleLicense(firstJob?.vehicleLicense || vehicles[0]?.licensePlate || '');
    setDriverName(firstJob?.driverName || drivers[0]?.name || '');
    setAmountInput('');
    setNote('');
    setFileName('');
    setFormError('');
    setIsEditMode(false);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Trigger Add modal from FAB or Sidebar quick action
  const lastSignalRef = useRef(openAddSignal);
  useEffect(() => {
    if (openAddSignal > 0 && openAddSignal !== lastSignalRef.current) {
      lastSignalRef.current = openAddSignal;
      resetForm(categoryFilter === 'general' ? 'general' : 'driver');
      setIsModalOpen(true);
    }
  }, [openAddSignal]);

  const handleOpenEditModal = (exp: DailyExpense) => {
    const norm = normalizeExpenseRecord(exp);
    setId(norm.id);
    setSelectedJobNo(norm.jobNo || '');
    setContainerNo(norm.containerNo || '');
    setDate(norm.date);
    setExpenseCategory(norm.expenseCategory);
    setType(norm.type);
    setDescription(norm.description);
    setVehicleLicense(norm.vehicleLicense);
    setDriverName(norm.driverName);
    setAmountInput(String(norm.amount));
    setNote(norm.note);
    setBillType(norm.billType);
    setFileName('');
    setFormError('');
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleCategorySwitch = (newCategory: ExpenseCategory) => {
    setExpenseCategory(newCategory);
    if (newCategory === 'driver') {
      if (!DRIVER_EXPENSE_TYPES.includes(type)) {
        setType('ค่าจ้างคนขับรถ');
      }
    } else {
      const targetList =
        billType === 'Adv' ? GENERAL_ADV_EXPENSE_TYPES : GENERAL_NORMAL_EXPENSE_TYPES;
      if (!targetList.includes(type)) {
        setType(targetList[0]);
      }
    }
  };

  const handleTypeChange = (nextType: DailyExpenseType) => {
    setType(nextType);
    if (isDriverExpenseType(nextType)) {
      setExpenseCategory('driver');
    } else if (
      GENERAL_NORMAL_EXPENSE_TYPES.includes(nextType) ||
      GENERAL_ADV_EXPENSE_TYPES.includes(nextType)
    ) {
      setExpenseCategory('general');
    }
  };

  const handleJobChange = (jobNo: string) => {
    setSelectedJobNo(jobNo);
    const foundJob = jobs.find((j) => j.jobNo === jobNo);
    if (foundJob) {
      if (foundJob.driverName) setDriverName(foundJob.driverName);
      if (foundJob.vehicleLicense) setVehicleLicense(foundJob.vehicleLicense);
      if (foundJob.containers && foundJob.containers.length > 0) {
        setContainerNo(foundJob.containers[0].containerNo);
      } else {
        setContainerNo('');
      }
      if (!description) {
        setDescription(
          `วิ่งงานจ๊อบ ${jobNo} [${foundJob.origin} ➔ ${foundJob.destination}]`
        );
      }
    } else {
      setContainerNo('');
    }
  };

  const handleBillTypeChange = (newBillType: 'Normal' | 'Adv') => {
    setBillType(newBillType);
    if (expenseCategory === 'general') {
      setType(newBillType === 'Adv' ? 'Life on / Life off' : 'ค่าน้ำมัน');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFileName(e.dataTransfer.files[0].name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!date) {
      setFormError('กรุณาระบุวันที่จ่ายเงิน');
      return;
    }
    if (numericAmount <= 0) {
      setFormError('กรุณาระบุจำนวนเงินก่อนหักมากกว่า 0 บาท');
      return;
    }
    if (!description.trim()) {
      setFormError('กรุณาระบุรายละเอียดรายการค่าใช้จ่าย');
      return;
    }

    let finalId = id;
    if (!finalId) {
      if (selectedJobNo) {
        const jobExpensesCount = expenses.filter((exp) => exp.jobNo === selectedJobNo).length;
        const seq = String(jobExpensesCount + 1).padStart(3, '0');
        finalId = `${selectedJobNo}/EXP-${seq}-${Date.now().toString().slice(-3)}`;
      } else {
        finalId = `EXP-${date.replace(/-/g, '')}-${String(expenses.length + 1).padStart(3, '0')}-${Date.now().toString().slice(-3)}`;
      }
    }

    const calc = calculateDriverExpenseTax(numericAmount, expenseCategory);

    const savedExpense: DailyExpense = {
      id: finalId,
      jobNo: selectedJobNo,
      containerNo,
      date,
      type,
      expenseCategory: calc.expenseCategory,
      description: description.trim(),
      vehicleLicense: vehicleLicense || '-',
      driverName: driverName || '-',
      amount: calc.amount,
      withholdingTaxRate: calc.withholdingTaxRate,
      withholdingTaxAmount: calc.withholdingTaxAmount,
      netAmount: calc.netAmount,
      note: note.trim(),
      billType,
    };

    setIsSubmitting(true);
    try {
      const ok = await onSaveExpense(savedExpense);
      if (ok !== false) {
        setIsModalOpen(false);
        showToast('บันทึกข้อมูลเรียบร้อยแล้ว', 'success');
      }
    } catch {
      showToast('ไม่สามารถบันทึกข้อมูลได้ กรุณาตรวจสอบข้อมูลอีกครั้ง', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    const ok = await onDeleteExpense(target.id);
    if (ok !== false) {
      showToast(`ลบรายการ ${target.type} เรียบร้อยแล้ว`, 'success');
    }
  };

  const availableGeneralTypes =
    billType === 'Adv' ? GENERAL_ADV_EXPENSE_TYPES : GENERAL_NORMAL_EXPENSE_TYPES;

  return (
    <div className="space-y-5">
      {/* KPI Summary Cards — Soft Pastel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="ค่าใช้จ่ายทั้งหมด (ก่อนหัก)"
          value={formatCurrency(summary.totalAmount)}
          subtitle={`ทั้งหมด ${normalizedExpenses.length} รายการ`}
          tone="blue"
          icon={<DollarSign className="w-5 h-5" />}
          onClick={() => setCategoryFilter('all')}
        />
        <StatCard
          title="ค่าใช้จ่ายคนขับรถ (หัก 1%)"
          value={formatCurrency(summary.driverTotal)}
          subtitle={`${summary.driverCount} รายการที่เข้าเกณฑ์หักภาษี`}
          tone="orange"
          icon={<UserCheck className="w-5 h-5" />}
          onClick={() => setCategoryFilter('driver')}
        />
        <StatCard
          title="ภาษีหัก ณ ที่จ่าย (1%)"
          value={formatCurrency(summary.totalWht)}
          subtitle="คำนวณอัตโนมัติเฉพาะรายการคนขับรถ"
          tone="pink"
          icon={<Percent className="w-5 h-5" />}
        />
        <StatCard
          title="ยอดจ่ายสุทธิทั้งหมด"
          value={formatCurrency(summary.totalNet)}
          subtitle="หลังหักภาษี ณ ที่จ่ายเรียบร้อย"
          tone="green"
          icon={<Wallet className="w-5 h-5" />}
        />
      </div>

      {/* Filter & Control Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Category Segmented Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 text-xs">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  categoryFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ทั้งหมด ({normalizedExpenses.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('driver')}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  categoryFilter === 'driver'
                    ? 'bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                คนขับรถ หัก 1% ({summary.driverCount})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('general')}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  categoryFilter === 'general'
                    ? 'bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ทั่วไป 0% ({normalizedExpenses.length - summary.driverCount})
              </button>
            </div>

            {/* Bill Group Filter */}
            <div className="inline-flex bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 text-xs">
              <button
                type="button"
                onClick={() => setActiveBillTab('All')}
                className={`min-h-[36px] px-2.5 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  activeBillTab === 'All'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ทุกกลุ่มรถ
              </button>
              <button
                type="button"
                onClick={() => setActiveBillTab('Normal')}
                className={`min-h-[36px] px-2.5 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  activeBillTab === 'Normal'
                    ? 'bg-[#EFF6FF] text-[#1D4ED8] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                รถบริษัท
              </button>
              <button
                type="button"
                onClick={() => setActiveBillTab('Adv')}
                className={`min-h-[36px] px-2.5 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  activeBillTab === 'Adv'
                    ? 'bg-[#F5F3FF] text-[#6D28D9] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                รถร่วม (Adv)
              </button>
            </div>
          </div>

          {/* Search & Add Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหารายการ, คนขับ, ทะเบียน, จ๊อบ..."
                className="w-full min-h-[42px] bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs text-slate-800 pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 outline-none focus:border-sky-400 transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="min-h-[42px] flex items-center justify-center gap-1.5 bg-[#047857] hover:bg-[#065F46] text-white font-semibold text-xs py-2 px-4 rounded-xl transition-colors whitespace-nowrap shrink-0 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มรายการค่าใช้จ่าย</span>
            </button>
          </div>
        </div>

        {/* Business Rule Notice Strip */}
        <div className="flex items-start sm:items-center gap-2 text-[11px] text-slate-600 bg-[#FFF7ED]/70 border border-[#FED7AA]/70 rounded-xl px-3.5 py-2">
          <Info className="w-4 h-4 text-[#C2410C] shrink-0 mt-0.5 sm:mt-0" />
          <span>
            <strong className="text-[#C2410C]">เกณฑ์ภาษีหัก ณ ที่จ่าย 1%:</strong>{' '}
            ระบบคำนวณและหักภาษี 1% อัตโนมัติเฉพาะรายการประเภท{' '}
            <strong>"คนขับรถ"</strong> เท่านั้น (ค่าจ้างคนขับรถ, ค่าเที่ยวรถ, ค่าแรงคนขับรถ ฯลฯ)
            ส่วนค่าอาหาร ค่าน้ำมัน ค่าทางด่วน และค่าใช้จ่ายทั่วไปจะไม่ถูกหักภาษี (0%)
          </span>
        </div>
      </div>

      {/* Desktop Data Table (hidden on mobile < md) */}
      <div className="hidden md:block bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        {filteredExpenses.length === 0 ? (
          <EmptyState
            title="ไม่พบรายการค่าใช้จ่าย"
            description="ยังไม่มีข้อมูลค่าใช้จ่ายที่ตรงกับเงื่อนไขการค้นหาหรือตัวกรองที่เลือก"
            actionLabel="เพิ่มรายการค่าใช้จ่ายใหม่"
            onAction={handleOpenAddModal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600">
                  <th className="py-3 px-3.5 font-semibold whitespace-nowrap">วันที่ / จ๊อบอ้างอิง</th>
                  <th className="py-3 px-3.5 font-semibold whitespace-nowrap">หมวดภาษี</th>
                  <th className="py-3 px-3.5 font-semibold whitespace-nowrap">รายการค่าใช้จ่าย</th>
                  <th className="py-3 px-3.5 font-semibold">คนขับ / ทะเบียนรถ</th>
                  <th className="py-3 px-3.5 font-semibold text-right whitespace-nowrap">จำนวนเงินก่อนหัก</th>
                  <th className="py-3 px-3.5 font-semibold text-right whitespace-nowrap">ภาษีหัก ณ ที่จ่าย</th>
                  <th className="py-3 px-3.5 font-semibold text-right whitespace-nowrap">ยอดจ่ายสุทธิ</th>
                  <th className="py-3 px-3.5 font-semibold text-center whitespace-nowrap">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredExpenses.map((exp) => {
                  const isDriver = exp.expenseCategory === 'driver';
                  return (
                    <tr
                      key={exp.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                        <div className="font-mono font-semibold text-slate-800 tabular-nums">
                          {formatDate(exp.date)}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {exp.jobNo || 'ทั่วไป'}
                          {exp.containerNo ? ` • ${exp.containerNo}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                            isDriver
                              ? 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]'
                              : 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                          }`}
                        >
                          {isDriver ? 'คนขับรถ (1%)' : 'ทั่วไป (0%)'}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {exp.billType === 'Adv' ? 'รถร่วม (Adv)' : 'รถบริษัท'}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 align-middle max-w-[240px]">
                        <div className="font-semibold text-slate-900">{exp.type}</div>
                        <div
                          className="text-[11px] text-slate-500 truncate mt-0.5"
                          title={exp.description}
                        >
                          {exp.description}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                        <div className="font-medium text-slate-800">{exp.driverName || '-'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {exp.vehicleLicense || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 align-middle text-right font-mono tabular-nums font-medium text-slate-800 whitespace-nowrap">
                        {formatCurrency(exp.amount)}
                      </td>
                      <td className="py-3 px-3.5 align-middle text-right font-mono tabular-nums whitespace-nowrap">
                        {isDriver ? (
                          <span className="font-semibold text-[#BE185D]">
                            -{formatCurrency(exp.withholdingTaxAmount)}
                          </span>
                        ) : (
                          <span className="text-slate-400">{formatCurrency(0)}</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 align-middle text-right font-mono tabular-nums font-bold text-[#047857] whitespace-nowrap">
                        {formatCurrency(exp.netAmount)}
                      </td>
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDetailExpense(exp)}
                            className="p-2 rounded-lg bg-slate-50 hover:bg-[#EFF6FF] text-slate-600 hover:text-[#1D4ED8] border border-slate-200/80 transition-colors"
                            title="ดูรายละเอียด"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(exp)}
                            className="p-2 rounded-lg bg-slate-50 hover:bg-[#FFF7ED] text-slate-600 hover:text-[#C2410C] border border-slate-200/80 transition-colors"
                            title="แก้ไขรายการ"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(exp)}
                            className="p-2 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200/80 transition-colors"
                            title="ลบรายการ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mobile Card List View (< md) */}
      <div className="md:hidden space-y-3">
        {filteredExpenses.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl">
            <EmptyState
              title="ไม่พบรายการค่าใช้จ่าย"
              description="แตะปุ่มด้านล่างเพื่อบันทึกรายการค่าใช้จ่ายใหม่"
              actionLabel="เพิ่มรายการค่าใช้จ่าย"
              onAction={handleOpenAddModal}
            />
          </div>
        ) : (
          filteredExpenses.map((exp) => {
            const isDriver = exp.expenseCategory === 'driver';
            return (
              <div
                key={exp.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {exp.type}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      {exp.description}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                      isDriver
                        ? 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]'
                        : 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                    }`}
                  >
                    {isDriver ? 'คนขับรถ 1%' : 'ทั่วไป 0%'}
                  </span>
                </div>

                {/* Meta line */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatDate(exp.date)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    {exp.driverName || '-'}
                  </span>
                  {exp.vehicleLicense && (
                    <span className="inline-flex items-center gap-1 font-mono">
                      <Truck className="w-3.5 h-3.5 text-slate-400" />
                      {exp.vehicleLicense}
                    </span>
                  )}
                </div>

                {/* 3-Metric Tax Breakdown */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50/90 rounded-xl p-2.5 border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-500 block">จำนวนเงิน</span>
                    <span className="text-xs font-mono font-semibold tabular-nums text-slate-800">
                      {formatCurrency(exp.amount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">หัก ณ ที่จ่าย</span>
                    <span
                      className={`text-xs font-mono font-semibold tabular-nums ${
                        isDriver ? 'text-[#BE185D]' : 'text-slate-400'
                      }`}
                    >
                      {formatCurrency(exp.withholdingTaxAmount)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">จ่ายสุทธิ</span>
                    <span className="text-xs font-mono font-bold tabular-nums text-[#047857]">
                      {formatCurrency(exp.netAmount)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setDetailExpense(exp)}
                    className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/80 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    รายละเอียด
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(exp)}
                    className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-[#FFF7ED] hover:bg-[#FFEDD5] text-[#C2410C] text-xs font-semibold border border-[#FED7AA] transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    แก้ไข
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(exp)}
                    className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold border border-rose-200 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    ลบ
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Expense Modal (Responsive Form + Live 1% WHT Calculator) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-slate-900/45 backdrop-blur-[2px] sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-slate-200/80 flex flex-col">
            {/* Modal Header (Soft Pastel Green) */}
            <div className="bg-[#ECFDF5] border-b border-[#A7F3D0] px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#A7F3D0] text-[#047857] flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {isEditMode ? 'แก้ไขรายการค่าใช้จ่าย' : 'เพิ่มรายการค่าใช้จ่ายใหม่'}
                  </h3>
                  <p className="text-[11px] text-[#047857]">
                    คำนวณภาษีหัก ณ ที่จ่าย 1% อัตโนมัติสำหรับรายการคนขับรถ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white/70 transition-colors"
                aria-label="ปิดหน้าต่าง"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5"
            >
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Step 1: Expense Category (Driver 1% vs General 0%) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  1. เลือกหมวดหมู่การคำนวณภาษีหัก ณ ที่จ่าย
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleCategorySwitch('driver')}
                    className={`min-h-[68px] p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                      expenseCategory === 'driver'
                        ? 'bg-[#FFF7ED] border-[#FB923C] ring-2 ring-[#FED7AA]'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        expenseCategory === 'driver'
                          ? 'bg-[#FFEDD5] text-[#C2410C]'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900">
                        คนขับรถ — หัก ณ ที่จ่าย 1%
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        ค่าจ้างคนขับรถ, ค่าเที่ยวรถ, ค่าขนส่งคนขับรถ, ค่าแรงคนขับรถ
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCategorySwitch('general')}
                    className={`min-h-[68px] p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                      expenseCategory === 'general'
                        ? 'bg-[#ECFDF5] border-[#34D399] ring-2 ring-[#A7F3D0]'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        expenseCategory === 'general'
                          ? 'bg-[#D1FAE5] text-[#047857]'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900">
                        ค่าใช้จ่ายทั่วไป — ไม่หักภาษี (0%)
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        ค่าน้ำมัน, ค่าอาหาร, ค่าโรงแรม, ค่าทางด่วน, อุปกรณ์สำนักงาน
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Step 2: Expense Type & Amount + Live Tax Calculation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    ประเภทค่าใช้จ่าย *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => handleTypeChange(e.target.value as DailyExpenseType)}
                    className="w-full min-h-[44px] text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-sky-400"
                    required
                  >
                    {expenseCategory === 'driver' ? (
                      <optgroup label="รายการคนขับรถ (หัก ณ ที่จ่าย 1%)">
                        {DRIVER_EXPENSE_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </optgroup>
                    ) : (
                      <optgroup label="รายการทั่วไป (ไม่หักภาษี 0%)">
                        {availableGeneralTypes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    จำนวนเงินก่อนหัก (บาท) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full min-h-[44px] text-sm font-mono font-bold tabular-nums text-slate-900 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none text-right focus:border-sky-400"
                    required
                  />
                </div>
              </div>

              {/* Live Real-Time WHT Calculation Breakdown Box */}
              <div
                className={`rounded-2xl p-4 border space-y-2.5 ${
                  expenseCategory === 'driver'
                    ? 'bg-[#FDF2F8]/80 border-[#FBCFE8]'
                    : 'bg-[#F8FAFC] border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">
                    สรุปการคำนวณภาษีหัก ณ ที่จ่ายแบบอัตโนมัติ
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                      expenseCategory === 'driver'
                        ? 'bg-[#FCE7F3] text-[#BE185D]'
                        : 'bg-slate-200/70 text-slate-600'
                    }`}
                  >
                    อัตราภาษี {liveTax.withholdingTaxRate}%
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="bg-white rounded-xl p-3 border border-slate-200/70">
                    <span className="text-[11px] text-slate-500 block">จำนวนเงินก่อนหัก</span>
                    <span className="text-sm font-mono font-bold tabular-nums text-slate-900">
                      {formatCurrency(liveTax.amount)}
                    </span>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-slate-200/70">
                    <span className="text-[11px] text-slate-500 block">
                      ภาษีหัก ณ ที่จ่าย ({liveTax.withholdingTaxRate}%)
                    </span>
                    <span
                      className={`text-sm font-mono font-bold tabular-nums ${
                        liveTax.withholdingTaxAmount > 0 ? 'text-[#BE185D]' : 'text-slate-400'
                      }`}
                    >
                      {formatCurrency(liveTax.withholdingTaxAmount)}
                    </span>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-[#A7F3D0]">
                    <span className="text-[11px] text-[#047857] font-semibold block">
                      ยอดจ่ายสุทธิ
                    </span>
                    <span className="text-sm font-mono font-extrabold tabular-nums text-[#047857]">
                      {formatCurrency(liveTax.netAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 3: Date, Group, Job Ref, Container */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    วันที่จ่ายเงิน / บันทึก *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full min-h-[44px] text-xs font-mono bg-white text-slate-800 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-sky-400"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    กลุ่มรถการทำจ่าย (Bill Type)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleBillTypeChange('Normal')}
                      className={`min-h-[44px] rounded-xl border text-xs font-semibold transition-all ${
                        billType === 'Normal'
                          ? 'bg-[#EFF6FF] border-[#93C5FD] text-[#1D4ED8]'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      รถบริษัท (Normal)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBillTypeChange('Adv')}
                      className={`min-h-[44px] rounded-xl border text-xs font-semibold transition-all ${
                        billType === 'Adv'
                          ? 'bg-[#F5F3FF] border-[#C4B5FD] text-[#6D28D9]'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      รถร่วม (Advance)
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    เลขงานวิ่งอ้างอิง (ไม่บังคับ)
                  </label>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={selectedJobNo || 'ทั่วไป / ไม่มีจ๊อบ'}
                      className="w-full min-h-[44px] text-xs bg-slate-100 font-mono text-slate-600 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none"
                      readOnly
                    />
                  ) : (
                    <select
                      value={selectedJobNo}
                      onChange={(e) => handleJobChange(e.target.value)}
                      className="w-full min-h-[44px] text-xs text-slate-800 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-sky-400"
                    >
                      <option value="">-- ทั่วไป / ไม่ผูกเลขจ๊อบ --</option>
                      {jobs.map((j) => (
                        <option key={j.jobNo} value={j.jobNo}>
                          {j.jobNo} - {j.customerName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    เบอร์ตู้คอนเทนเนอร์ (ถ้ามี)
                  </label>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={containerNo || '-'}
                      className="w-full min-h-[44px] text-xs bg-slate-100 font-mono text-slate-600 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none"
                      readOnly
                    />
                  ) : (
                    <select
                      value={containerNo}
                      onChange={(e) => setContainerNo(e.target.value)}
                      className="w-full min-h-[44px] text-xs text-slate-800 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-sky-400"
                    >
                      <option value="">-- ไม่ระบุตู้ --</option>
                      {(() => {
                        const foundJob = jobs.find((j) => j.jobNo === selectedJobNo);
                        return foundJob?.containers?.map((c) => (
                          <option key={c.containerNo} value={c.containerNo}>
                            {c.containerNo}
                          </option>
                        ));
                      })()}
                    </select>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    คนขับรถ / ผู้รับเงิน
                  </label>
                  <select
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full min-h-[44px] text-xs text-slate-800 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-sky-400"
                  >
                    <option value="">-- เลือกคนขับรถ / พนักงาน --</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    ทะเบียนรถอ้างอิง
                  </label>
                  <select
                    value={vehicleLicense}
                    onChange={(e) => setVehicleLicense(e.target.value)}
                    className="w-full min-h-[44px] text-xs text-slate-800 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-sky-400"
                  >
                    <option value="">-- ไม่ระบุทะเบียนรถ --</option>
                    {vehicles.map((v) => (
                      <option key={v.licensePlate} value={v.licensePlate}>
                        {v.licensePlate} ({v.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description & Note */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    รายละเอียดรายการค่าใช้จ่าย *
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="เช่น ค่าจ้างคนขับรถเที่ยวแหลมฉบัง-ชลบุรี, เติมน้ำมันดีเซล"
                    className="w-full min-h-[44px] text-xs text-slate-800 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-sky-400"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    หมายเหตุเพิ่มเติม
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="ระบุรายละเอียดเพิ่มเติม เช่น เลขที่บิลหรือด่านทางด่วน"
                    className="w-full min-h-[44px] text-xs text-slate-800 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              {/* Attachment Dropzone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  แนบสลิป / หลักฐานอ้างอิง (ไม่บังคับ)
                </label>
                <div
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors ${
                    dragActive
                      ? 'border-sky-400 bg-sky-50/50'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/60'
                  }`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="flex flex-col items-center gap-1.5">
                    <Upload className="w-6 h-6 text-slate-400" />
                    <p className="text-xs font-semibold text-slate-700">
                      ลากไฟล์สลิปมาวาง หรือแตะเพื่อเลือกไฟล์
                    </p>
                    <p className="text-[11px] text-slate-400">รองรับ JPG, PNG, PDF</p>
                  </div>
                </div>

                {fileName && (
                  <div className="p-2.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl flex items-center justify-between text-xs text-[#047857]">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 shrink-0" />
                      <span className="font-semibold truncate">{fileName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFileName('')}
                      className="text-slate-500 hover:text-slate-800 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Sticky Footer Actions */}
              <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#047857] hover:bg-[#065F46] disabled:opacity-60 text-white font-semibold text-xs transition-colors shadow-xs"
                >
                  {isSubmitting
                    ? 'กำลังบันทึกข้อมูล...'
                    : isEditMode
                      ? 'บันทึกการแก้ไข'
                      : 'บันทึกรายการค่าใช้จ่าย'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailExpense && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-slate-900/45 backdrop-blur-[2px] sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-[#EFF6FF] border-b border-[#BFDBFE] px-5 py-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{detailExpense.type}</h4>
                <p className="text-[11px] text-[#1D4ED8] font-mono">{detailExpense.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetailExpense(null)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-white/70"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-slate-400 block">วันที่</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {formatDate(detailExpense.date)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">หมวดหมู่ภาษี</span>
                  <span className="font-semibold text-slate-800">
                    {detailExpense.expenseCategory === 'driver'
                      ? 'คนขับรถ (หัก ณ ที่จ่าย 1%)'
                      : 'ค่าใช้จ่ายทั่วไป (ไม่หักภาษี 0%)'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">คนขับรถ / ผู้เบิก</span>
                  <span className="font-semibold text-slate-800">
                    {detailExpense.driverName || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">ทะเบียนรถ / จ๊อบ</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {detailExpense.vehicleLicense || '-'}
                    {detailExpense.jobNo ? ` • ${detailExpense.jobNo}` : ''}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <span className="text-[11px] text-slate-400 block">รายละเอียด</span>
                <p className="text-slate-800 font-medium mt-0.5">{detailExpense.description}</p>
                {detailExpense.note && (
                  <p className="text-slate-500 mt-1">หมายเหตุ: {detailExpense.note}</p>
                )}
              </div>

              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/70 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">จำนวนเงินก่อนหัก</span>
                  <span className="font-mono font-semibold tabular-nums text-slate-900">
                    {formatCurrency(detailExpense.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    ภาษีหัก ณ ที่จ่าย ({detailExpense.withholdingTaxRate}%)
                  </span>
                  <span className="font-mono font-semibold tabular-nums text-[#BE185D]">
                    -{formatCurrency(detailExpense.withholdingTaxAmount)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-800">ยอดจ่ายสุทธิ</span>
                  <span className="font-mono font-extrabold tabular-nums text-sm text-[#047857]">
                    {formatCurrency(detailExpense.netAmount)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const target = detailExpense;
                    setDetailExpense(null);
                    handleOpenEditModal(target);
                  }}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA] font-semibold"
                >
                  แก้ไขรายการ
                </button>
                <button
                  type="button"
                  onClick={() => setDetailExpense(null)}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="ยืนยันการลบรายการค่าใช้จ่าย"
        description={
          deleteTarget
            ? `คุณต้องการลบรายการ "${deleteTarget.type}" ยอด ${formatCurrency(deleteTarget.amount)} ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`
            : ''
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
