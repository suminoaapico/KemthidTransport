import React, { useMemo, useRef, useState } from 'react';
import {
  Database,
  Download,
  Upload,
  FileSpreadsheet,
  CloudUpload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileJson,
  ArrowRightLeft,
  Loader2,
  ShieldCheck,
  Table as TableIcon,
} from 'lucide-react';
import { AppDataState } from '../firebaseService';
import {
  DATASET_CATALOG,
  DatasetKey,
  MigrationProgress,
  MigrationReport,
  SupabaseFetchResult,
  buildCsvForCollection,
  buildFullBackupJson,
  buildTemplateCsv,
  fetchAllFromSupabase,
  fetchGoogleSheetAsDataset,
  mapRowsForDataset,
  migrateDatasetToFirebase,
  parseBackupOrAppsScriptJson,
  parseCsvText,
  triggerFileDownload,
} from '../migrationService';
import {
  PASTEL_TONES,
  PastelTone,
  StatCard,
  useToast,
} from './ui/DesignSystem';

interface BackupMigrationViewProps {
  state: AppDataState;
  actorUid: string;
}

type ActiveSection = 'backup' | 'google_sheets' | 'supabase';

function ToneBadge({ label, tone }: { label: string; tone: PastelTone }) {
  const palette = PASTEL_TONES[tone];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-lg border text-[11px] font-bold font-mono tabular-nums whitespace-nowrap ${palette.bg} ${palette.border} ${palette.text}`}
    >
      {label}
    </span>
  );
}

function PastelPanel({
  title,
  subtitle,
  tone,
  icon,
  headerRight,
  noPadding = false,
  children,
}: {
  title: string;
  subtitle?: string;
  tone: PastelTone;
  icon?: React.ReactNode;
  headerRight?: React.ReactNode;
  noPadding?: boolean;
  children: React.ReactNode;
}) {
  const palette = PASTEL_TONES[tone];
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <span
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${palette.iconBg} ${palette.iconText}`}
            >
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 truncate">{title}</h3>
            {subtitle && (
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{subtitle}</p>
            )}
          </div>
        </div>
        {headerRight && <div className="shrink-0">{headerRight}</div>}
      </div>
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </div>
  );
}

export function BackupMigrationView({ state, actorUid }: BackupMigrationViewProps) {
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = useState<ActiveSection>('backup');

  // Shared Migration Progress & Report
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [lastReport, setLastReport] = useState<MigrationReport | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tab 1: JSON Restore State
  const jsonFileRef = useRef<HTMLInputElement>(null);
  const [jsonPreview, setJsonPreview] = useState<Partial<AppDataState> | null>(null);
  const [jsonFileName, setJsonFileName] = useState('');

  // Tab 2: Google Sheets / CSV State
  const [sheetTargetKey, setSheetTargetKey] = useState<DatasetKey>('expenses');
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetTabName, setSheetTabName] = useState('');
  const [isFetchingSheet, setIsFetchingSheet] = useState(false);
  const [sheetPreview, setSheetPreview] = useState<Partial<AppDataState> | null>(null);
  const [sheetSourceLabel, setSheetSourceLabel] = useState('');
  const csvFileRef = useRef<HTMLInputElement>(null);

  // Tab 3: Supabase State (reads optional Vite env defaults; never hardcodes secrets)
  const viteEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  const [supabaseUrl, setSupabaseUrl] = useState<string>(
    () => viteEnv?.VITE_SUPABASE_URL || ''
  );
  const [supabaseKey, setSupabaseKey] = useState<string>(
    () => viteEnv?.VITE_SUPABASE_ANON_KEY || ''
  );
  const [isFetchingSupabase, setIsFetchingSupabase] = useState(false);
  const [supabasePreview, setSupabasePreview] = useState<SupabaseFetchResult | null>(null);

  const liveCounts = useMemo<Record<DatasetKey, number>>(() => {
    const map = {} as Record<DatasetKey, number>;
    for (const meta of DATASET_CATALOG) {
      const list = state[meta.key];
      map[meta.key] = Array.isArray(list) ? list.length : 0;
    }
    return map;
  }, [state]);

  const totalLiveDocs = useMemo<number>(
    () =>
      (Object.values(liveCounts) as number[]).reduce((sum, n) => sum + n, 0),
    [liveCounts]
  );

  const populatedCollectionsCount = useMemo<number>(
    () => (Object.values(liveCounts) as number[]).filter((n) => n > 0).length,
    [liveCounts]
  );

  const runMigration = async (partial: Partial<AppDataState>, sourceTitle: string) => {
    setErrorMsg(null);
    setLastReport(null);
    setIsMigrating(true);
    setProgress({ currentCollection: 'กำลังเตรียมข้อมูล...', completed: 0, total: 1 });
    try {
      const report = await migrateDatasetToFirebase(partial, actorUid, (p) => {
        setProgress(p);
      });
      setLastReport(report);
      if (report.totalFailed === 0) {
        showToast(
          `นำเข้าข้อมูลจาก ${sourceTitle} สำเร็จ ${report.totalSucceeded.toLocaleString()} รายการ`,
          'success'
        );
      } else {
        showToast(
          `นำเข้าสำเร็จ ${report.totalSucceeded} รายการ (ไม่สำเร็จ ${report.totalFailed} รายการ)`,
          'info'
        );
      }
    } catch (err: any) {
      const msg = err?.message || 'เกิดข้อผิดพลาดระหว่างการนำเข้าข้อมูล';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setIsMigrating(false);
      setProgress(null);
    }
  };

  // ---- Backup & Restore Handlers ----
  const handleDownloadFullBackup = () => {
    const today = new Date().toISOString().split('T')[0];
    const json = buildFullBackupJson(state);
    triggerFileDownload(
      `khemthit-firebase-backup-${today}.json`,
      json,
      'application/json;charset=utf-8'
    );
    showToast(
      `ดาวน์โหลดไฟล์สำรองข้อมูลทั้งหมด (${totalLiveDocs.toLocaleString()} รายการ) เรียบร้อย`,
      'success'
    );
  };

  const handleDownloadCollectionCsv = (key: DatasetKey) => {
    const meta = DATASET_CATALOG.find((m) => m.key === key);
    if (!meta) return;
    const rows = (state[key] || []) as any[];
    const today = new Date().toISOString().split('T')[0];
    const csv = buildCsvForCollection(meta, rows);
    triggerFileDownload(
      `khemthit-${meta.firestoreCollection}-${today}.csv`,
      csv,
      'text/csv;charset=utf-8'
    );
    showToast(`ส่งออก CSV ตาราง ${meta.thaiName} เรียบร้อย`, 'success');
  };

  const handleJsonFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const dataset = parseBackupOrAppsScriptJson(parsed);
      const total = Object.values(dataset).reduce(
        (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
        0
      );
      if (total === 0) {
        setErrorMsg('ไม่พบข้อมูลตารางที่รองรับในไฟล์ JSON นี้');
        setJsonPreview(null);
        return;
      }
      setJsonPreview(dataset);
      setJsonFileName(file.name);
      showToast(`อ่านไฟล์สำรองสำเร็จ พบทั้งหมด ${total.toLocaleString()} รายการ`, 'info');
    } catch {
      setErrorMsg('ไฟล์ JSON ไม่ถูกต้อง ไม่สามารถอ่านข้อมูลได้');
      setJsonPreview(null);
    } finally {
      if (jsonFileRef.current) jsonFileRef.current.value = '';
    }
  };

  // ---- Google Sheets & CSV Handlers ----
  const handleFetchGoogleSheet = async () => {
    if (!sheetUrl.trim()) {
      setErrorMsg('กรุณาวางลิงก์ Google Sheet หรือลิงก์ Google Apps Script Web App');
      return;
    }
    setErrorMsg(null);
    setSheetPreview(null);
    setIsFetchingSheet(true);
    try {
      const parsed = await fetchGoogleSheetAsDataset(sheetUrl, sheetTargetKey, sheetTabName);
      const total = Object.values(parsed).reduce(
        (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
        0
      );
      if (total === 0) {
        setErrorMsg(
          'ดึงข้อมูลได้แต่ไม่พบแถวข้อมูล (กรุณาตรวจสอบว่ามีหัวตารางในแถวที่ 1 และมีข้อมูลตั้งแต่แถวที่ 2)'
        );
        return;
      }
      setSheetPreview(parsed);
      setSheetSourceLabel(
        sheetUrl.includes('script.google.com')
          ? 'Google Apps Script'
          : `Google Sheet${sheetTabName ? ` (${sheetTabName})` : ''}`
      );
      showToast(`ดึงตัวอย่างจาก Google Sheet สำเร็จ ${total.toLocaleString()} รายการ`, 'success');
    } catch (err: any) {
      setErrorMsg(err?.message || 'ไม่สามารถดึงข้อมูลจาก Google Sheet ได้');
    } finally {
      setIsFetchingSheet(false);
    }
  };

  const handleCsvFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    try {
      const text = await file.text();
      const rawRows = parseCsvText(text);
      if (rawRows.length === 0) {
        setErrorMsg('ไม่พบข้อมูลในไฟล์ CSV (ต้องมีแถวหัวคอลัมน์ในแถวที่ 1 และข้อมูลตั้งแต่แถวที่ 2)');
        setSheetPreview(null);
        return;
      }
      const mapped = mapRowsForDataset(sheetTargetKey, rawRows);
      setSheetPreview({ [sheetTargetKey]: mapped } as Partial<AppDataState>);
      setSheetSourceLabel(`ไฟล์ CSV: ${file.name}`);
      showToast(`อ่านไฟล์ CSV สำเร็จ ${mapped.length.toLocaleString()} รายการ`, 'info');
    } catch (err: any) {
      setErrorMsg(err?.message || 'ไม่สามารถอ่านไฟล์ CSV ได้');
      setSheetPreview(null);
    } finally {
      if (csvFileRef.current) csvFileRef.current.value = '';
    }
  };

  const handleDownloadCsvTemplate = () => {
    const meta = DATASET_CATALOG.find((m) => m.key === sheetTargetKey);
    if (!meta) return;
    const csv = buildTemplateCsv(meta);
    triggerFileDownload(
      `template-${meta.firestoreCollection}.csv`,
      csv,
      'text/csv;charset=utf-8'
    );
    showToast(`ดาวน์โหลดต้นแบบ CSV (${meta.thaiName}) เรียบร้อย`, 'success');
  };

  // ---- Supabase Handlers ----
  const handleInspectSupabase = async () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setErrorMsg('กรุณากรอก Supabase Project URL และ Anon Key');
      return;
    }
    setErrorMsg(null);
    setSupabasePreview(null);
    setIsFetchingSupabase(true);
    try {
      const result = await fetchAllFromSupabase(supabaseUrl.trim(), supabaseKey.trim());
      setSupabasePreview(result);
      showToast(`พบข้อมูลใน Supabase ทั้งหมด ${result.totalRows.toLocaleString()} รายการ`, 'success');
    } catch (err: any) {
      setErrorMsg(err?.message || 'ไม่สามารถเชื่อมต่อ Supabase ได้ กรุณาตรวจสอบ URL และ Anon Key');
    } finally {
      setIsFetchingSupabase(false);
    }
  };

  const sheetPreviewRows = useMemo(() => {
    if (!sheetPreview) {
      return {
        total: 0,
        entries: [] as { meta: (typeof DATASET_CATALOG)[number]; rows: any[] }[],
      };
    }
    const entries = DATASET_CATALOG.map((meta) => ({
      meta,
      rows: Array.isArray((sheetPreview as any)[meta.key]) ? (sheetPreview as any)[meta.key] : [],
    })).filter((e) => e.rows.length > 0);
    const total = entries.reduce((sum, e) => sum + e.rows.length, 0);
    return { total, entries };
  }, [sheetPreview]);

  const jsonPreviewEntries = useMemo(() => {
    if (!jsonPreview) return [];
    return DATASET_CATALOG.map((meta) => ({
      meta,
      count: Array.isArray((jsonPreview as any)[meta.key])
        ? (jsonPreview as any)[meta.key].length
        : 0,
    })).filter((e) => e.count > 0);
  }, [jsonPreview]);

  const progressPct =
    progress && progress.total > 0
      ? Math.min(100, Math.round((progress.completed / progress.total) * 100))
      : 0;

  return (
    <div className="space-y-6">
      {/* Page Intro Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900">
              ศูนย์สำรองข้อมูล & ย้ายข้อมูลขึ้น Firebase
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              สำรองข้อมูลทั้งหมดเป็น JSON/CSV หรือนำเข้าข้อมูลเดิมจาก Google Sheets และ Supabase ขึ้นฐานข้อมูล Firebase Cloud Firestore ครบทั้ง 14 ตาราง
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDownloadFullBackup}
          className="min-h-[42px] px-4 py-2 rounded-xl bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1D4ED8] border border-[#BFDBFE] text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>สำรองข้อมูลทั้งหมด (.JSON)</span>
        </button>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="รายการข้อมูลใน Firebase"
          value={totalLiveDocs.toLocaleString()}
          subtitle="ซิงค์เรียลไทม์บน Cloud Firestore"
          tone="blue"
          icon={<Database className="w-5 h-5" />}
        />
        <StatCard
          title="คอลเลกชันที่มีข้อมูล"
          value={`${populatedCollectionsCount} / 14`}
          subtitle="รองรับโครงสร้างครบทุกโมดูล"
          tone="green"
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
        <StatCard
          title="แหล่งย้ายข้อมูลที่รองรับ"
          value="3 แหล่ง"
          subtitle="Supabase • Google Sheets • CSV/JSON"
          tone="purple"
          icon={<ArrowRightLeft className="w-5 h-5" />}
        />
        <StatCard
          title="ตรวจสอบภาษีอัตโนมัติ"
          value="1% คนขับรถ"
          subtitle="คำนวณหัก ณ ที่จ่ายตอนนำเข้าทันที"
          tone="orange"
          icon={<ShieldCheck className="w-5 h-5" />}
        />
      </div>

      {/* Section Switcher Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => {
            setActiveSection('backup');
            setErrorMsg(null);
          }}
          className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
            activeSection === 'backup'
              ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1D4ED8] shadow-xs'
              : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shrink-0 text-[#1D4ED8]">
            <FileJson className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate">1. สำรอง & กู้คืน Firebase</p>
            <p className="text-[11px] opacity-75 truncate">ดาวน์โหลด JSON / CSV ครบ 14 ตาราง</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSection('google_sheets');
            setErrorMsg(null);
          }}
          className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
            activeSection === 'google_sheets'
              ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#047857] shadow-xs'
              : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shrink-0 text-[#047857]">
            <FileSpreadsheet className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate">2. ย้ายจาก Google Sheets / CSV</p>
            <p className="text-[11px] opacity-75 truncate">วางลิงก์ Sheet หรืออัปโหลดไฟล์ CSV</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSection('supabase');
            setErrorMsg(null);
          }}
          className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
            activeSection === 'supabase'
              ? 'bg-[#F5F3FF] border-[#DDD6FE] text-[#6D28D9] shadow-xs'
              : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shrink-0 text-[#6D28D9]">
            <CloudUpload className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate">3. ย้ายจาก Supabase → Firebase</p>
            <p className="text-[11px] opacity-75 truncate">ซิงค์ตารางเดิมจาก Supabase ทั้งหมด</p>
          </div>
        </button>
      </div>

      {/* Global Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="break-words">{errorMsg}</span>
        </div>
      )}

      {/* Active Migration Progress Bar */}
      {isMigrating && progress && (
        <PastelPanel
          tone="blue"
          title="กำลังนำเข้าข้อมูลขึ้นฐานข้อมูล Firebase..."
          icon={<Loader2 className="w-4 h-4 animate-spin" />}
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>{progress.currentCollection}</span>
              <span className="font-mono tabular-nums text-[#1D4ED8]">
                {progress.completed.toLocaleString()} / {progress.total.toLocaleString()} ({progressPct}%)
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-[#2563EB] transition-all duration-200 rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </PastelPanel>
      )}

      {/* Migration Result Report */}
      {lastReport && !isMigrating && (
        <PastelPanel
          tone={lastReport.totalFailed === 0 ? 'green' : 'orange'}
          title="สรุปผลการย้าย / นำเข้าข้อมูลขึ้น Firebase"
          subtitle={`นำเข้าสำเร็จ ${lastReport.totalSucceeded.toLocaleString()} จากทั้งหมด ${lastReport.totalAttempted.toLocaleString()} รายการ`}
          icon={<CheckCircle2 className="w-4 h-4" />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {lastReport.items.map((item) => (
              <div
                key={item.key}
                className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/70 flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 truncate">{item.thaiName}</p>
                  {item.errors.length > 0 && (
                    <p className="text-[10px] text-rose-600 truncate mt-0.5">{item.errors[0]}</p>
                  )}
                </div>
                <ToneBadge
                  label={`${item.succeeded}/${item.attempted}`}
                  tone={item.failed === 0 ? 'green' : 'orange'}
                />
              </div>
            ))}
          </div>
        </PastelPanel>
      )}

      {/* ================================================== */}
      {/* SECTION 1: FIREBASE BACKUP & RESTORE               */}
      {/* ================================================== */}
      {activeSection === 'backup' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PastelPanel
              tone="blue"
              title="สำรองข้อมูลทั้งหมด (Full JSON Backup)"
              subtitle="บันทึกข้อมูลทั้ง 14 คอลเลกชันเก็บไว้บนเครื่องเพื่อความปลอดภัย"
              icon={<Download className="w-4 h-4" />}
            >
              <div className="space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  ไฟล์สำรองจะรวมข้อมูลครบทุกตาราง (ลูกค้า, คนขับ, รถ, พนักงาน, แผนวิ่งงาน, ค่าใช้จ่าย, ใบแจ้งหนี้, ใบเสร็จ, เอกสารรถร่วม, ภาษี และเงินเดือน) สามารถนำกลับมา Restore ขึ้น Firebase ได้ทุกเมื่อ
                </p>
                <button
                  type="button"
                  onClick={handleDownloadFullBackup}
                  className="w-full min-h-[44px] rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลดไฟล์สำรอง JSON ({totalLiveDocs.toLocaleString()} รายการ)</span>
                </button>
              </div>
            </PastelPanel>

            <PastelPanel
              tone="green"
              title="กู้คืน / นำเข้าจากไฟล์สำรอง (.JSON)"
              subtitle="เลือกไฟล์ JSON ที่สำรองไว้เพื่อนำเข้ากลับขึ้นฐานข้อมูล Firebase"
              icon={<Upload className="w-4 h-4" />}
            >
              <div className="space-y-3">
                <input
                  ref={jsonFileRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleJsonFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => jsonFileRef.current?.click()}
                  disabled={isMigrating}
                  className="w-full min-h-[44px] rounded-xl bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#047857] border border-[#A7F3D0] text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>เลือกไฟล์สำรอง JSON จากเครื่อง</span>
                </button>

                {jsonPreview && jsonPreviewEntries.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 truncate">{jsonFileName}</span>
                      <ToneBadge
                        label={`${jsonPreviewEntries
                          .reduce((s, e) => s + e.count, 0)
                          .toLocaleString()} รายการ`}
                        tone="green"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {jsonPreviewEntries.map((e) => (
                        <span
                          key={e.meta.key}
                          className="text-[11px] bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-slate-700"
                        >
                          {e.meta.firestoreCollection}: <strong>{e.count}</strong>
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled={isMigrating}
                      onClick={() => runMigration(jsonPreview, `ไฟล์สำรอง ${jsonFileName}`)}
                      className="w-full min-h-[42px] rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold inline-flex items-center justify-center gap-2"
                    >
                      <CloudUpload className="w-4 h-4" />
                      <span>ยืนยันนำเข้าขึ้น Firebase</span>
                    </button>
                  </div>
                )}
              </div>
            </PastelPanel>
          </div>

          <PastelPanel
            tone="slate"
            title="ตารางข้อมูลบน Firebase Cloud Firestore (14 Collections)"
            subtitle="ตรวจสอบจำนวนรายการปัจจุบันและส่งออกเป็นไฟล์ CSV สำหรับเปิดใน Excel / Google Sheets"
            icon={<TableIcon className="w-4 h-4" />}
            noPadding
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500">
                  <tr>
                    <th className="px-4 py-3">ตารางข้อมูล</th>
                    <th className="px-4 py-3">Collection Path</th>
                    <th className="px-4 py-3 text-right">จำนวนใน Firebase</th>
                    <th className="px-4 py-3 text-right">ส่งออก CSV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {DATASET_CATALOG.map((meta) => {
                    const count = liveCounts[meta.key] ?? 0;
                    return (
                      <tr key={meta.key} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-800">{meta.thaiName}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                          /{meta.firestoreCollection}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <ToneBadge
                            label={`${count.toLocaleString()} รายการ`}
                            tone={count > 0 ? 'green' : 'slate'}
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDownloadCollectionCsv(meta.key)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>CSV</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </PastelPanel>
        </div>
      )}

      {/* ================================================== */}
      {/* SECTION 2: GOOGLE SHEETS & CSV IMPORT              */}
      {/* ================================================== */}
      {activeSection === 'google_sheets' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Option A: Direct Google Sheet Link or Apps Script URL */}
            <PastelPanel
              tone="green"
              title="วิธีที่ 1: ดึงจากลิงก์ Google Sheet หรือ Apps Script URL"
              subtitle="วางลิงก์ Google Sheet (แชร์แบบทุกคนที่มีลิงก์ดูได้) หรือลิงก์ Web App เดิม"
              icon={<FileSpreadsheet className="w-4 h-4" />}
            >
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    เลือกตารางปลายทางใน Firebase
                  </label>
                  <select
                    value={sheetTargetKey}
                    onChange={(e) => setSheetTargetKey(e.target.value as DatasetKey)}
                    className="w-full min-h-[42px] text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-emerald-400"
                  >
                    {DATASET_CATALOG.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.thaiName} (/{m.firestoreCollection})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    ลิงก์ Google Sheet หรือ Google Apps Script Web App URL
                  </label>
                  <input
                    type="url"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/... หรือ https://script.google.com/macros/s/.../exec"
                    className="w-full min-h-[42px] text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    ชื่อแท็บ/ชีต (ไม่บังคับ — เว้นว่างเพื่อใช้แท็บแรกหรือ gid จากลิงก์)
                  </label>
                  <input
                    type="text"
                    value={sheetTabName}
                    onChange={(e) => setSheetTabName(e.target.value)}
                    placeholder="เช่น Customers, Jobs, Expenses, ค่าใช้จ่าย"
                    className="w-full min-h-[42px] text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-emerald-400"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleFetchGoogleSheet}
                  disabled={isFetchingSheet || isMigrating}
                  className="w-full min-h-[44px] rounded-xl bg-[#047857] hover:bg-[#065F46] disabled:opacity-60 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors"
                >
                  {isFetchingSheet ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span>ดึงข้อมูลตัวอย่างจาก Google Sheet</span>
                </button>
              </div>
            </PastelPanel>

            {/* Option B: Upload CSV Exported from Google Sheets / Excel */}
            <PastelPanel
              tone="blue"
              title="วิธีที่ 2: อัปโหลดไฟล์ CSV จาก Google Sheets / Excel"
              subtitle="เหมาะสำหรับชีตส่วนตัว: ใน Google Sheets กด ไฟล์ → ดาวน์โหลด → CSV แล้วอัปโหลดที่นี่"
              icon={<Upload className="w-4 h-4" />}
            >
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    ตารางปลายทางที่เลือกนำเข้า
                  </label>
                  <select
                    value={sheetTargetKey}
                    onChange={(e) => setSheetTargetKey(e.target.value as DatasetKey)}
                    className="w-full min-h-[42px] text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-sky-400"
                  >
                    {DATASET_CATALOG.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.thaiName} (/{m.firestoreCollection})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                  <p className="font-bold text-slate-800">รองรับหัวคอลัมน์ภาษาไทยและอังกฤษอัตโนมัติ:</p>
                  <p className="font-mono text-[10px] text-slate-500 break-words">
                    {DATASET_CATALOG.find((m) => m.key === sheetTargetKey)?.csvHeaders.join(', ')}
                  </p>
                  <p className="text-[11px] text-[#C2410C] font-medium pt-1">
                    • หากนำเข้าตารางค่าใช้จ่าย ระบบจะคำนวณหัก ณ ที่จ่าย 1% เฉพาะรายการคนขับรถให้อัตโนมัติทันที
                  </p>
                </div>

                <input
                  ref={csvFileRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleCsvFileUpload}
                  className="hidden"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleDownloadCsvTemplate}
                    className="min-h-[42px] rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold inline-flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>โหลดไฟล์ต้นแบบ CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => csvFileRef.current?.click()}
                    disabled={isMigrating}
                    className="min-h-[42px] rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-4 h-4" />
                    <span>เลือกไฟล์ CSV นำเข้า</span>
                  </button>
                </div>
              </div>
            </PastelPanel>
          </div>

          {/* Preview & Confirm Import Panel */}
          {sheetPreview && sheetPreviewRows.total > 0 && (
            <PastelPanel
              tone="green"
              title={`ตรวจสอบข้อมูลก่อนนำเข้าขึ้น Firebase (${sheetSourceLabel})`}
              subtitle={`พบทั้งหมด ${sheetPreviewRows.total.toLocaleString()} รายการ พร้อมตรวจสอบความถูกต้องตามโครงสร้าง Firebase`}
              icon={<CheckCircle2 className="w-4 h-4" />}
              headerRight={
                <button
                  type="button"
                  disabled={isMigrating}
                  onClick={() => runMigration(sheetPreview, sheetSourceLabel)}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold inline-flex items-center gap-2"
                >
                  <CloudUpload className="w-4 h-4" />
                  <span>ยืนยันนำเข้าขึ้น Firebase ({sheetPreviewRows.total.toLocaleString()})</span>
                </button>
              }
            >
              <div className="space-y-4">
                {sheetPreviewRows.entries.map(({ meta, rows }) => (
                  <div key={meta.key} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{meta.thaiName}</span>
                      <ToneBadge label={`${rows.length.toLocaleString()} รายการ`} tone="green" />
                    </div>
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                          <tr>
                            {meta.csvHeaders.slice(0, 7).map((h) => (
                              <th key={h} className="px-3 py-2 font-bold whitespace-nowrap">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {rows.slice(0, 5).map((r, i) => (
                            <tr key={i}>
                              {meta.csvHeaders.slice(0, 7).map((h) => (
                                <td
                                  key={h}
                                  className="px-3 py-2 text-slate-700 whitespace-nowrap max-w-[200px] truncate"
                                >
                                  {typeof r[h] === 'object' ? JSON.stringify(r[h]) : String(r[h] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {rows.length > 5 && (
                      <p className="text-[11px] text-slate-400">
                        แสดงตัวอย่าง 5 แถวแรก จากทั้งหมด {rows.length.toLocaleString()} รายการ
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </PastelPanel>
          )}
        </div>
      )}

      {/* ================================================== */}
      {/* SECTION 3: SUPABASE TO FIREBASE MIGRATION          */}
      {/* ================================================== */}
      {activeSection === 'supabase' && (
        <div className="space-y-5">
          <PastelPanel
            tone="purple"
            title="เชื่อมต่อและย้ายข้อมูลจาก Supabase เดิม → Firebase"
            subtitle="ดึงข้อมูลทั้งหมดจาก Supabase ทุกตารางแล้วซิงค์ขึ้น Firebase Cloud Firestore โดยไม่ทับสถานะเอกสารเดิม"
            icon={<CloudUpload className="w-4 h-4" />}
          >
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xxxxxxxx.supabase.co"
                    className="w-full min-h-[42px] text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-purple-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Supabase Anon Key
                  </label>
                  <input
                    type="password"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full min-h-[42px] text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleInspectSupabase}
                  disabled={isFetchingSupabase || isMigrating}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-[#F5F3FF] hover:bg-[#EDE9FE] text-[#6D28D9] border border-[#DDD6FE] text-xs font-bold inline-flex items-center gap-2"
                >
                  {isFetchingSupabase ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span>ตรวจสอบข้อมูลใน Supabase</span>
                </button>

                {supabasePreview && supabasePreview.totalRows > 0 && (
                  <button
                    type="button"
                    disabled={isMigrating}
                    onClick={() => runMigration(supabasePreview.dataset, 'Supabase')}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-bold inline-flex items-center gap-2"
                  >
                    <CloudUpload className="w-4 h-4" />
                    <span>
                      ย้ายข้อมูลทั้งหมดจาก Supabase ขึ้น Firebase ({supabasePreview.totalRows.toLocaleString()} รายการ)
                    </span>
                  </button>
                )}
              </div>
            </div>
          </PastelPanel>

          {supabasePreview && (
            <PastelPanel
              tone="slate"
              title="เปรียบเทียบจำนวนข้อมูล: Supabase vs Firebase ปัจจุบัน"
              subtitle={`พบข้อมูลใน Supabase รวม ${supabasePreview.totalRows.toLocaleString()} รายการ`}
              icon={<ArrowRightLeft className="w-4 h-4" />}
              noPadding
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500">
                    <tr>
                      <th className="px-4 py-3">ตารางข้อมูล</th>
                      <th className="px-4 py-3 text-right">ใน Supabase</th>
                      <th className="px-4 py-3 text-right">ใน Firebase ปัจจุบัน</th>
                      <th className="px-4 py-3 text-right">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {DATASET_CATALOG.map((meta) => {
                      const sbCount = supabasePreview.counts[meta.key] ?? 0;
                      const fbCount = liveCounts[meta.key] ?? 0;
                      const synced = sbCount === 0 || fbCount >= sbCount;
                      return (
                        <tr key={meta.key} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 font-semibold text-slate-800">{meta.thaiName}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-purple-700">
                            {sbCount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-blue-700">
                            {fbCount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <ToneBadge
                              label={sbCount === 0 ? 'ว่าง' : synced ? 'ครบถ้วนแล้ว' : 'รอย้ายขึ้น Firebase'}
                              tone={sbCount === 0 ? 'slate' : synced ? 'green' : 'orange'}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </PastelPanel>
          )}
        </div>
      )}
    </div>
  );
}
