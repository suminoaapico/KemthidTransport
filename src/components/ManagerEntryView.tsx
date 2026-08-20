import React, { useState } from 'react';
import { 
  Plus, Edit2, Trash2, Search, X, DollarSign, ArrowUpRight, ArrowDownRight, 
  Calendar, User, Save, FileText, Tag, Filter, CheckCircle2, TrendingUp, TrendingDown,
  Briefcase
} from 'lucide-react';
import { ManagerEntry } from '../types';
import { formatCurrency } from '../utils';

interface ManagerEntryViewProps {
  entries: ManagerEntry[];
  onSaveEntry: (entry: ManagerEntry) => void;
  onDeleteEntry: (id: string) => void;
}

const INCOME_CATEGORIES = [
  'รายรับค่าบริการพิเศษ',
  'รายรับค่าลานตู้และยกตู้',
  'รายรับค่าปรับ/ส่วนลดรับ',
  'รายได้เบ็ดเตล็ด',
  'เงินชดเชย/เงินประกันคืน',
  'รายรับอื่นๆ'
];

const EXPENSE_CATEGORIES = [
  'ค่าใช้จ่ายบริหาร/สำนักงาน',
  'ค่าบำรุงรักษา/ซ่อมบำรุงรถ',
  'ค่าน้ำมันและแก๊สส่วนกลาง',
  'ค่าสาธารณูปโภค (น้ำ/ไฟ/เน็ต)',
  'ค่าธรรมเนียม/ใบอนุญาต/ประกันภัย',
  'ค่าจัดเลี้ยง/สวัสดิการ',
  'ค่าจ้างชั่วคราว/บริการภายนอก',
  'ค่าใช้จ่ายเบ็ดเตล็ด'
];

export function ManagerEntryView({ entries, onSaveEntry, onDeleteEntry }: ManagerEntryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form state
  const [id, setId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [recordedBy, setRecordedBy] = useState('Manager');
  const [referenceNo, setReferenceNo] = useState('');
  const [note, setNote] = useState('');

  const resetForm = () => {
    setIsEditMode(false);
    setId(`MGR-${Date.now()}`);
    setDate(new Date().toISOString().split('T')[0]);
    setType('EXPENSE');
    setCategory(EXPENSE_CATEGORIES[0]);
    setTitle('');
    setAmount('');
    setRecordedBy('Manager');
    setReferenceNo('');
    setNote('');
  };

  const handleOpenAdd = (defaultType: 'INCOME' | 'EXPENSE' = 'EXPENSE') => {
    resetForm();
    setType(defaultType);
    setCategory(defaultType === 'INCOME' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
    setIsFormOpen(true);
  };

  const handleEdit = (entry: ManagerEntry) => {
    setIsEditMode(true);
    setId(entry.id);
    setDate(entry.date);
    setType(entry.type);
    setCategory(entry.category);
    setTitle(entry.title);
    setAmount(entry.amount);
    setRecordedBy(entry.recordedBy || 'Manager');
    setReferenceNo(entry.referenceNo || '');
    setNote(entry.note || '');
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || Number(amount) <= 0) {
      alert('กรุณากรอกหัวข้อรายการและจำนวนเงินที่ถูกต้อง');
      return;
    }

    const newEntry: ManagerEntry = {
      id: id || `MGR-${Date.now()}`,
      date,
      type,
      category,
      title: title.trim(),
      amount: Number(amount),
      recordedBy: recordedBy.trim() || 'Manager',
      referenceNo: referenceNo.trim() || undefined,
      note: note.trim() || undefined
    };

    onSaveEntry(newEntry);
    setIsFormOpen(false);
  };

  // Calculations
  const totalIncome = entries
    .filter(e => e.type === 'INCOME')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const totalExpense = entries
    .filter(e => e.type === 'EXPENSE')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const netBalance = totalIncome - totalExpense;

  const filteredEntries = entries.filter(e => {
    const matchesSearch = 
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.referenceNo && e.referenceNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.note && e.note.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'ALL' || e.type === typeFilter;
    const matchesCategory = categoryFilter === 'ALL' || e.category === categoryFilter;

    return matchesSearch && matchesType && matchesCategory;
  });

  return (
    <div className="space-y-5 font-sans">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-purple-50 text-purple-700 rounded-xl border border-purple-100">
              <Briefcase className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              บันทึกรายรับ - รายจ่าย (Manager Financial Log)
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            ระบบบันทึกรายรับพิเศษและรายจ่ายบริหารสำหรับผู้จัดการ เพื่อนำข้อมูลไปประมวลผลในรายงานสรุปผลประกอบการ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenAdd('INCOME')}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> + บันทึกรายรับ
          </button>
          <button
            onClick={() => handleOpenAdd('EXPENSE')}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> + บันทึกรายจ่าย
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">รายรับพิเศษสะสม (Extra Income)</p>
            <p className="text-2xl font-black text-emerald-600 font-mono mt-0.5">
              +{formatCurrency(totalIncome)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {entries.filter(e => e.type === 'INCOME').length} รายการ
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">รายจ่ายบริหารสะสม (Expenses)</p>
            <p className="text-2xl font-black text-rose-600 font-mono mt-0.5">
              -{formatCurrency(totalExpense)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {entries.filter(e => e.type === 'EXPENSE').length} รายการ
            </p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">ยอดคงเหลือสุทธิ (Net Manager Balance)</p>
            <p className={`text-2xl font-black font-mono mt-0.5 ${netBalance >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
              {formatCurrency(netBalance)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {netBalance >= 0 ? 'รายรับมากกว่ารายจ่าย' : 'รายจ่ายเกินรายรับ'}
            </p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหารายการ, หมวดหมู่, เลขที่อ้างอิง..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:bg-white transition-all font-sans"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-bold">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1.5 rounded-md transition-colors ${typeFilter === 'ALL' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-500'}`}
            >
              ทั้งหมด ({entries.length})
            </button>
            <button
              onClick={() => setTypeFilter('INCOME')}
              className={`px-3 py-1.5 rounded-md transition-colors ${typeFilter === 'INCOME' ? 'bg-emerald-500 text-white shadow-xs font-bold' : 'text-emerald-700'}`}
            >
              รายรับ ({entries.filter(e => e.type === 'INCOME').length})
            </button>
            <button
              onClick={() => setTypeFilter('EXPENSE')}
              className={`px-3 py-1.5 rounded-md transition-colors ${typeFilter === 'EXPENSE' ? 'bg-rose-500 text-white shadow-xs font-bold' : 'text-rose-700'}`}
            >
              รายจ่าย ({entries.filter(e => e.type === 'EXPENSE').length})
            </button>
          </div>
        </div>
      </div>

      {/* Entries Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse font-sans">
            <thead>
              <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold text-[11px]">
                <th className="p-3 text-center w-12">ลำดับ</th>
                <th className="p-3 text-center">วันที่</th>
                <th className="p-3 text-center">ประเภท</th>
                <th className="p-3">หมวดหมู่</th>
                <th className="p-3">หัวข้อรายการ / รายละเอียด</th>
                <th className="p-3 text-center">เอกสารอ้างอิง</th>
                <th className="p-3 text-right">จำนวนเงิน (บาท)</th>
                <th className="p-3 text-center">ผู้บันทึก</th>
                <th className="p-3 text-center w-24">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    ไม่พบข้อมูลรายการรายรับ-รายจ่ายของ Manager
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry, idx) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-3 text-center font-mono text-slate-600">{entry.date}</td>
                    <td className="p-3 text-center">
                      {entry.type === 'INCOME' ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          <ArrowDownRight className="w-3 h-3" /> รายรับ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          <ArrowUpRight className="w-3 h-3" /> รายจ่าย
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-semibold text-slate-800">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 text-[10px]">
                        {entry.category}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-900">
                      {entry.title}
                      {entry.note && (
                        <span className="block text-[11px] font-normal text-slate-500 mt-0.5">
                          {entry.note}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center font-mono text-slate-500">
                      {entry.referenceNo || '-'}
                    </td>
                    <td className={`p-3 text-right font-mono font-black text-sm ${
                      entry.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {entry.type === 'INCOME' ? '+' : '-'}{formatCurrency(entry.amount)}
                    </td>
                    <td className="p-3 text-center text-slate-600 text-[11px]">
                      {entry.recordedBy || 'Manager'}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="p-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors"
                          title="แก้ไข"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`ต้องการลบรายการ "${entry.title}" หรือไม่?`)) {
                              onDeleteEntry(entry.id);
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

      {/* Creation / Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {isEditMode ? 'แก้ไขรายการบันทึก Manager' : `เพิ่มรายการ${type === 'INCOME' ? 'รายรับ' : 'รายจ่าย'}ใหม่`}
                </h3>
                <p className="text-xs text-slate-500">กรอกข้อมูลให้ครบถ้วนเพื่อนำไปใช้ในรายงานวิเคราะห์ผลประกอบการ</p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setType('INCOME');
                    setCategory(INCOME_CATEGORIES[0]);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    type === 'INCOME' 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  + รายรับ (Income)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('EXPENSE');
                    setCategory(EXPENSE_CATEGORIES[0]);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    type === 'EXPENSE' 
                      ? 'bg-rose-600 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  - รายจ่าย (Expense)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">วันที่</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none font-sans"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">หมวดหมู่</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none font-sans"
                  >
                    {(type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  หัวข้อรายการ / คำอธิบาย <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="เช่น ค่าเปลี่ยนถ่ายน้ำมันเครื่อง, ค่าบริการพิเศษลานตู้, ซื้ออุปกรณ์สำนักงาน"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 outline-none font-sans"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    จำนวนเงิน (บาท) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full text-sm font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg p-2.5 outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">เลขที่เอกสาร / บิลอ้างอิง</label>
                  <input
                    type="text"
                    placeholder="เช่น INV-001, RCP-2026/08"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">หมายเหตุเพิ่มเติม</label>
                <textarea
                  rows={2}
                  placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 outline-none font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-4 rounded-xl border border-slate-300 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-5 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" /> บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
