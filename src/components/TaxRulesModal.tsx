import React, { useEffect, useMemo, useState } from 'react';
import {
  Percent,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  RotateCcw,
  Check,
  Search,
  Sparkles,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { TaxRuleItem } from '../types';
import { DEFAULT_TAX_RULES, formatCurrency } from '../utils';
import { useToast } from './ui/DesignSystem';

interface TaxRulesModalProps {
  open: boolean;
  rules: TaxRuleItem[];
  onClose: () => void;
  onSaveRule: (rule: TaxRuleItem) => Promise<boolean>;
  onDeleteRule: (id: string) => Promise<boolean>;
  onResetDefaults: () => Promise<boolean>;
}

const QUICK_RATES = [0, 1, 2, 3, 5];

export function TaxRulesModal({
  open,
  rules,
  onClose,
  onSaveRule,
  onDeleteRule,
  onResetDefaults,
}: TaxRulesModalProps) {
  const { showToast } = useToast();

  // Local editable draft list synced when modal opens or Firestore rules update
  const effectiveRules = useMemo(
    () => (rules.length > 0 ? rules : DEFAULT_TAX_RULES),
    [rules]
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'taxable' | 'zero'>('all');

  // New Rule Form State
  const [newName, setNewName] = useState('');
  const [newAliases, setNewAliases] = useState('');
  const [newRate, setNewRate] = useState<string>('1');
  const [newNote, setNewNote] = useState('');

  // Inline Edit State for an existing row
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAliases, setEditAliases] = useState('');
  const [editRate, setEditRate] = useState<string>('0');
  const [editNote, setEditNote] = useState('');

  // Quick inline % edits (keyed by rule.id) before clicking Save All
  const [pendingRates, setPendingRates] = useState<Record<string, string>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setPendingRates({});
      setEditingId(null);
      setConfirmDeleteId(null);
      setConfirmReset(false);
    }
  }, [open]);

  const parseRate = (val: string): number => {
    const n = parseFloat(val);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(100, Math.round(n * 100) / 100);
  };

  const pendingChangedRules = useMemo(() => {
    return effectiveRules.filter((rule) => {
      if (pendingRates[rule.id] === undefined) return false;
      return parseRate(pendingRates[rule.id]) !== rule.taxRate;
    });
  }, [effectiveRules, pendingRates]);

  if (!open) return null;

  // Ensure Firestore is initialized with defaults if user edits while Firestore collection was empty
  const ensureDefaultsSeededBeforeMutation = async (skipId?: string) => {
    if (rules.length > 0) return;
    for (const defRule of DEFAULT_TAX_RULES) {
      if (defRule.id === skipId) continue;
      await onSaveRule(defRule);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newName.trim();
    if (!trimmedName) {
      showToast('กรุณาระบุชื่อรายการที่ต้องการกำหนดภาษี', 'error');
      return;
    }
    const rate = parseRate(newRate);
    const aliases = newAliases
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const newItem: TaxRuleItem = {
      id: `RULE-${Date.now()}`,
      name: trimmedName,
      aliases,
      taxRate: rate,
      isActive: true,
      note: newNote.trim(),
    };

    setIsSaving(true);
    try {
      await ensureDefaultsSeededBeforeMutation();
      const ok = await onSaveRule(newItem);
      if (ok) {
        setNewName('');
        setNewAliases('');
        setNewRate('1');
        setNewNote('');
        showToast(`เพิ่มรายการ "${trimmedName}" (${rate}%) เรียบร้อยแล้ว`, 'success');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const startEditRow = (rule: TaxRuleItem) => {
    setEditingId(rule.id);
    setEditName(rule.name);
    setEditAliases((rule.aliases || []).join(', '));
    setEditRate(
      pendingRates[rule.id] !== undefined ? pendingRates[rule.id] : String(rule.taxRate)
    );
    setEditNote(rule.note || '');
    setConfirmDeleteId(null);
  };

  const handleSaveEditRow = async (rule: TaxRuleItem) => {
    const trimmedName = editName.trim();
    if (!trimmedName) {
      showToast('ชื่อรายการต้องไม่ว่างเปล่า', 'error');
      return;
    }
    const updated: TaxRuleItem = {
      ...rule,
      name: trimmedName,
      aliases: editAliases
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      taxRate: parseRate(editRate),
      note: editNote.trim(),
    };

    setIsSaving(true);
    try {
      await ensureDefaultsSeededBeforeMutation(rule.id);
      const ok = await onSaveRule(updated);
      if (ok) {
        setEditingId(null);
        setPendingRates((prev) => {
          const next = { ...prev };
          delete next[rule.id];
          return next;
        });
        showToast(`บันทึก "${updated.name}" (${updated.taxRate}%) เรียบร้อยแล้ว`, 'success');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (rule: TaxRuleItem) => {
    setIsSaving(true);
    try {
      await ensureDefaultsSeededBeforeMutation(rule.id);
      await onSaveRule({ ...rule, isActive: !rule.isActive });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async (rule: TaxRuleItem) => {
    setIsSaving(true);
    try {
      await ensureDefaultsSeededBeforeMutation(rule.id);
      const ok = await onDeleteRule(rule.id);
      if (ok) {
        setConfirmDeleteId(null);
        setPendingRates((prev) => {
          const next = { ...prev };
          delete next[rule.id];
          return next;
        });
        showToast(`ลบรายการ "${rule.name}" เรียบร้อยแล้ว`, 'info');
      }
    } finally {
      setIsSaving(false);
    }
  };


  const handleSaveAllAndApply = async () => {
    setIsSaving(true);
    try {
      if (editingId) {
        const target = effectiveRules.find((r) => r.id === editingId);
        if (target) {
          await handleSaveEditRow(target);
        }
      }
      if (pendingChangedRules.length > 0) {
        await ensureDefaultsSeededBeforeMutation();
        for (const rule of pendingChangedRules) {
          const newNumericRate = parseRate(pendingRates[rule.id]);
          await onSaveRule({ ...rule, taxRate: newNumericRate });
        }
        setPendingRates({});
        showToast(
          `บันทึกอัตราภาษี ${pendingChangedRules.length} รายการ และปรับใช้กับหน้าเอกสารทันที`,
          'success'
        );
      } else if (rules.length === 0) {
        // Persist defaults so Firestore explicitly stores the rules
        await ensureDefaultsSeededBeforeMutation();
        showToast('บันทึกเกณฑ์ภาษีเริ่มต้นและปรับใช้กับหน้าเอกสารแล้ว', 'success');
      }
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetAll = async () => {
    setIsSaving(true);
    try {
      const ok = await onResetDefaults();
      if (ok) {
        setPendingRates({});
        setEditingId(null);
        setConfirmReset(false);
        showToast('คืนค่ารายการภาษีเริ่มต้นทั้งหมดเรียบร้อยแล้ว', 'success');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const taxableCount = effectiveRules.filter((r) => r.isActive && r.taxRate > 0).length;
  const zeroCount = effectiveRules.filter((r) => !r.isActive || r.taxRate === 0).length;

  const filteredRules = effectiveRules.filter((r) => {
    const q = searchTerm.trim().toLowerCase();
    const matchSearch =
      !q ||
      r.name.toLowerCase().includes(q) ||
      (r.aliases || []).some((a) => a.toLowerCase().includes(q)) ||
      (r.note || '').toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (filterMode === 'taxable') return r.isActive && r.taxRate > 0;
    if (filterMode === 'zero') return !r.isActive || r.taxRate === 0;
    return true;
  });

  const sampleNewTax = Math.round(10000 * (parseRate(newRate) / 100) * 100) / 100;

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-900/45 backdrop-blur-[2px] p-3 sm:p-4 no-print"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#FDF2F8] border-b border-[#FBCFE8] px-5 py-4 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#FBCFE8] text-[#BE185D] flex items-center justify-center shrink-0 shadow-2xs">
              <Percent className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                ตั้งค่ารายการและอัตราภาษีหัก ณ ที่จ่าย (% ต่อรายการ)
              </h2>
              <p className="text-[11px] text-slate-600 truncate">
                เพิ่ม ลบ แก้ไข และกำหนด % ของแต่ละรายการ — เมื่อบันทึกจะคำนวณในใบแจ้งหนี้และใบเสร็จทันที
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl bg-white/80 hover:bg-white border border-[#FBCFE8] text-slate-600 shrink-0"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Add New Rule Card */}
          <form
            onSubmit={handleAddRule}
            className="rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF]/60 p-4 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-[#1D4ED8] flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                เพิ่มรายการกำหนดอัตราหัก ณ ที่จ่ายใหม่
              </h3>
              <span className="text-[11px] font-mono text-slate-600 bg-white px-2.5 py-0.5 rounded-lg border border-[#BFDBFE]">
                ตัวอย่างยอด ฿10,000 → หัก{' '}
                <strong className="text-[#BE185D]">{formatCurrency(sampleNewTax)}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-4 space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">
                  ชื่อรายการ *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="เช่น ค่าฝากตู้, X-ray, ค่าบริการ"
                  className="w-full min-h-[40px] text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-blue-400"
                  required
                />
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">
                  ชื่อรอง / คำพ้อง (คั่นด้วย ,)
                </label>
                <input
                  type="text"
                  value={newAliases}
                  onChange={(e) => setNewAliases(e.target.value)}
                  placeholder="เช่น ค่า x-ray, x-rey"
                  className="w-full min-h-[40px] text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-blue-400"
                />
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">
                  อัตราหัก ณ ที่จ่าย (%) *
                </label>
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={newRate}
                      onChange={(e) => setNewRate(e.target.value)}
                      className="w-full min-h-[40px] text-xs font-mono font-bold bg-white border border-slate-200 rounded-xl pl-3 pr-7 py-2 text-right text-slate-900 outline-none focus:border-blue-400"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      %
                    </span>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full min-h-[40px] rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>เพิ่มรายการ</span>
                </button>
              </div>
            </div>

            {/* Quick % Chips + Optional Note */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-500 font-semibold">เลือกด่วน:</span>
                {QUICK_RATES.map((rateVal) => (
                  <button
                    key={rateVal}
                    type="button"
                    onClick={() => setNewRate(String(rateVal))}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition-colors ${
                      parseRate(newRate) === rateVal
                        ? 'bg-[#BE185D] text-white border-[#BE185D]'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {rateVal}%
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="หมายเหตุเพิ่มเติม (ไม่บังคับ)"
                className="flex-1 min-w-[180px] max-w-xs text-[11px] bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none focus:border-blue-400"
              />
            </div>
          </form>

          {/* Filter & Stats Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  filterMode === 'all'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                ทั้งหมด ({effectiveRules.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('taxable')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  filterMode === 'taxable'
                    ? 'bg-[#FDF2F8] text-[#BE185D] border-[#FBCFE8]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                รายการที่หักภาษี ({taxableCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('zero')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  filterMode === 'zero'
                    ? 'bg-slate-100 text-slate-800 border-slate-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                ไม่หัก / 0% ({zeroCount})
              </button>
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาชื่อรายการ..."
                className="w-full min-h-[38px] text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 outline-none focus:border-pink-400"
              />
            </div>
          </div>

          {/* Rules List Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500">
                  <tr>
                    <th className="px-3.5 py-3 w-16 text-center">ใช้งาน</th>
                    <th className="px-3.5 py-3">ชื่อรายการ & คำพ้อง</th>
                    <th className="px-3.5 py-3 w-36 text-center">อัตราหัก (%)</th>
                    <th className="px-3.5 py-3 hidden md:table-cell text-right">
                      ตัวอย่างยอด 10,000 บ.
                    </th>
                    <th className="px-3.5 py-3 w-32 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRules.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                        ไม่พบรายการที่ค้นหา — สามารถเพิ่มรายการใหม่ได้จากกล่องด้านบน
                      </td>
                    </tr>
                  ) : (
                    filteredRules.map((rule) => {
                      const isEditing = editingId === rule.id;
                      const currentRateStr =
                        pendingRates[rule.id] !== undefined
                          ? pendingRates[rule.id]
                          : String(rule.taxRate);
                      const displayRate = isEditing
                        ? parseRate(editRate)
                        : parseRate(currentRateStr);
                      const isModified =
                        pendingRates[rule.id] !== undefined &&
                        parseRate(pendingRates[rule.id]) !== rule.taxRate;
                      const sampleDeduction =
                        rule.isActive && displayRate > 0
                          ? Math.round(10000 * (displayRate / 100) * 100) / 100
                          : 0;

                      return (
                        <tr
                          key={rule.id}
                          className={`transition-colors ${
                            !rule.isActive
                              ? 'bg-slate-50/70 opacity-65'
                              : displayRate > 0
                                ? 'bg-[#FDF2F8]/35 hover:bg-[#FDF2F8]/60'
                                : 'hover:bg-slate-50/70'
                          }`}
                        >
                          {/* Active Toggle */}
                          <td className="px-3.5 py-3 text-center align-middle">
                            <button
                              type="button"
                              onClick={() => handleToggleActive(rule)}
                              disabled={isSaving}
                              className={`w-10 h-5 rounded-full p-0.5 transition-colors inline-flex items-center ${
                                rule.isActive ? 'bg-[#10B981]' : 'bg-slate-300'
                              }`}
                              title={rule.isActive ? 'ปิดการใช้งานชั่วคราว' : 'เปิดใช้งาน'}
                            >
                              <span
                                className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                                  rule.isActive ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </td>

                          {/* Name & Aliases */}
                          <td className="px-3.5 py-3 align-middle">
                            {isEditing ? (
                              <div className="space-y-1.5">
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="w-full text-xs font-bold bg-white border border-blue-300 rounded-lg px-2.5 py-1.5 outline-none"
                                  placeholder="ชื่อรายการ"
                                />
                                <input
                                  type="text"
                                  value={editAliases}
                                  onChange={(e) => setEditAliases(e.target.value)}
                                  className="w-full text-[11px] bg-white border border-slate-200 rounded-lg px-2.5 py-1 outline-none"
                                  placeholder="คำพ้องคั่นด้วย , เช่น ค่า x-ray, x-rey"
                                />
                                <input
                                  type="text"
                                  value={editNote}
                                  onChange={(e) => setEditNote(e.target.value)}
                                  className="w-full text-[11px] bg-white border border-slate-200 rounded-lg px-2.5 py-1 outline-none"
                                  placeholder="หมายเหตุ"
                                />
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-slate-900">{rule.name}</span>
                                  {isModified && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                      รอบันทึก
                                    </span>
                                  )}
                                </div>
                                {rule.aliases && rule.aliases.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {rule.aliases.map((alias, idx) => (
                                      <span
                                        key={idx}
                                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600"
                                      >
                                        {alias}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {rule.note && (
                                  <p className="text-[10px] text-slate-400 mt-0.5">{rule.note}</p>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Direct % Input */}
                          <td className="px-3.5 py-3 align-middle">
                            <div className="relative max-w-[110px] mx-auto">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={isEditing ? editRate : currentRateStr}
                                onChange={(e) => {
                                  if (isEditing) {
                                    setEditRate(e.target.value);
                                  } else {
                                    setPendingRates((prev) => ({
                                      ...prev,
                                      [rule.id]: e.target.value,
                                    }));
                                  }
                                }}
                                className={`w-full min-h-[36px] text-xs font-mono font-extrabold text-right rounded-xl pl-2.5 pr-6 py-1.5 border outline-none transition-colors ${
                                  displayRate > 0 && rule.isActive
                                    ? 'bg-white border-[#F9A8D4] text-[#BE185D] focus:border-[#BE185D]'
                                    : 'bg-slate-50 border-slate-200 text-slate-600 focus:border-blue-400'
                                }`}
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                                %
                              </span>
                            </div>
                          </td>

                          {/* Sample Calculation */}
                          <td className="px-3.5 py-3 hidden md:table-cell text-right align-middle font-mono">
                            {sampleDeduction > 0 ? (
                              <span className="font-bold text-[#BE185D]">
                                -{formatCurrency(sampleDeduction)}
                              </span>
                            ) : (
                              <span className="text-slate-400">ไม่หัก (฿0.00)</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-3.5 py-3 text-center align-middle">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  disabled={isSaving}
                                  onClick={() => handleSaveEditRow(rule)}
                                  className="px-2.5 py-1.5 rounded-lg bg-[#047857] hover:bg-[#065F46] text-white text-[11px] font-bold inline-flex items-center gap-1"
                                  title="บันทึกแถวนี้"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>บันทึก</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                                  title="ยกเลิก"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : confirmDeleteId === rule.id ? (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  disabled={isSaving}
                                  onClick={() => handleConfirmDelete(rule)}
                                  className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold"
                                >
                                  ยืนยันลบ
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold"
                                >
                                  ยกเลิก
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                {isModified && (
                                  <button
                                    type="button"
                                    disabled={isSaving}
                                    onClick={async () => {
                                      setIsSaving(true);
                                      try {
                                        await ensureDefaultsSeededBeforeMutation(rule.id);
                                        const rateNum = parseRate(pendingRates[rule.id]);
                                        const ok = await onSaveRule({ ...rule, taxRate: rateNum });
                                        if (ok) {
                                          setPendingRates((prev) => {
                                            const next = { ...prev };
                                            delete next[rule.id];
                                            return next;
                                          });
                                          showToast(
                                            `อัปเดต "${rule.name}" เป็น ${rateNum}% แล้ว`,
                                            'success'
                                          );
                                        }
                                      } finally {
                                        setIsSaving(false);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700"
                                    title="บันทึก % รายการนี้"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => startEditRow(rule)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700"
                                  title="แก้ไขรายการ"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(rule.id)}
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600"
                                  title="ลบรายการ"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[#BE185D] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-slate-800">
                หลักการทำงานอัตโนมัติบนหน้าเอกสาร (ใบแจ้งหนี้ & ใบเสร็จรับเงิน):
              </p>
              <p>
                ระบบจะตรวจสอบชื่อทุกรายการในเอกสาร (เช่น ค่าขนส่ง Transportation, X-ray, เปิดตรวจ, ลากตู้เปล่า, ลากตู้หนัก, ค้างหาง, Overtime และรายการเพิ่มเติม) แล้วหักภาษี ณ ที่จ่ายตาม % ที่กำหนดไว้ด้านบนทันที พร้อมอัปเดตยอดสุทธิและตัวอักษรภาษาไทยโดยอัตโนมัติ
              </p>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            {confirmReset ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-700">ยืนยันคืนค่าเริ่มต้น?</span>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleResetAll}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                >
                  ยืนยันรีเซ็ต
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold"
                >
                  ยกเลิก
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                disabled={isSaving}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>คืนค่าเริ่มต้น</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold"
            >
              ปิด
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveAllAndApply}
              className="min-h-[40px] px-5 py-2 rounded-xl bg-[#BE185D] hover:bg-[#9D174D] disabled:opacity-60 text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-colors"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>
                {pendingChangedRules.length > 0
                  ? `บันทึก (${pendingChangedRules.length} รายการ) & ใช้กับเอกสารทันที`
                  : 'บันทึกและใช้กับหน้าเอกสารทันที'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
