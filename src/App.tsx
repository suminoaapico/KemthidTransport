import React, { useState, useEffect } from 'react';
import { 
  BarChart2, Truck, DollarSign, FileText, CheckSquare, Users, Settings, 
  RotateCw, CloudLightning, Database, Sparkles, HelpCircle, AlertCircle, CheckCircle, Info, ChevronRight
} from 'lucide-react';

import { 
  loadLocalData, saveLocalData, syncToGoogleSheets, 
  loadFromGoogleSheets, testSpreadsheetAccess, DEFAULT_SPREADSHEET_ID 
} from './sheetsService';

import { 
  supabase, testSupabaseConnection, fetchAllSupabaseData, seedSupabaseTablesJS,
  dbSaveCustomer, dbDeleteCustomer, dbSaveDriver, dbDeleteDriver, dbSaveVehicle, dbDeleteVehicle,
  dbSaveEmployee, dbDeleteEmployee, dbSaveJob, dbDeleteJob, dbSaveExpense, dbDeleteExpense,
  dbSaveInvoice, dbDeleteInvoice, dbSaveReceipt, dbDeleteReceipt, dbSavePartnerPayment, dbDeletePartnerPayment,
  dbSaveWithholdingTax, dbDeleteWithholdingTax, dbSavePayroll, dbDeletePayroll,
  SQL_SCHEMA, SEED_SQL_DATA
} from './supabaseService';

import { 
  Customer, Driver, Vehicle, Employee, TransportJob, 
  DailyExpense, Invoice, Receipt, PartnerPayment, 
  WithholdingTaxRecord, PayrollRecord 
} from './types';

// Importing Tab Components
import { DashboardView } from './components/DashboardView';
import { JobsView } from './components/JobsView';
import { ExpensesView } from './components/ExpensesView';
import { InvoicesView } from './components/InvoicesView';
import { ReceiptsView } from './components/ReceiptsView';
import { RegistryView } from './components/RegistryView';
import { FinanceView } from './components/FinanceView';
import { ManualView } from './components/ManualView';

type AppTab = 'dashboard' | 'jobs' | 'expenses' | 'invoices' | 'receipts' | 'registry' | 'finance' | 'manual';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  
  // Entire local state database representation
  const [state, setState] = useState(() => loadLocalData());

  // Supabase states
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'no_tables' | 'error'>('checking');
  const [supabaseMessage, setSupabaseMessage] = useState('กำลังพิสูจน์สิทธิ์และทดสอบพอร์ตการเชื่อมต่อ Supabase...');
  const [showSupabasePanel, setShowSupabasePanel] = useState(false);
  const [isSeedingSupabase, setIsSeedingSupabase] = useState(false);
  const [copyCodeSuccess, setCopyCodeSuccess] = useState(false);
  const [copySeedSuccess, setCopySeedSuccess] = useState(false);
  
  // Google Sheets Sync configurations
  const [spreadsheetId, setSpreadsheetId] = useState(DEFAULT_SPREADSHEET_ID);
  const [accessToken, setAccessToken] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  // Load from Supabase on Mount
  const fetchSupabaseData = async () => {
    setSupabaseStatus('checking');
    try {
      const conn = await testSupabaseConnection();
      if (!conn.success) {
        setSupabaseStatus('error');
        setSupabaseMessage('ล้มเหลวในการเชื่อมต่อ Supabase API: ' + conn.message);
        return;
      }
      if (!conn.tablesReady) {
        setSupabaseStatus('no_tables');
        setSupabaseMessage('เชื่อมระบบเสร็จเรียบร้อย แต่ฐานข้อมูลว่าง (ยังไม่ได้ตรวจรับหรือสร้าง SQL Tables)');
        return;
      }

      const data = await fetchAllSupabaseData();
      setState(data);
      setSupabaseStatus('connected');
      setSupabaseMessage('ดึงข้อมูลจาก Supabase ล่าสุดสำเร็จ เชื่อมต่อ API แบบเรียลไทม์ 100%!');
    } catch (err: any) {
      console.error("Supabase load fallback:", err);
      setSupabaseStatus('no_tables');
      setSupabaseMessage('ชุดโครงสร้างตารางบางส่วนไม่พร้อมใช้งาน กรุณากด "ซิงค์สแกนจัดโครงสร้าง" หรือสร้าง SQL Tables ด้านล่าง');
    }
  };

  useEffect(() => {
    fetchSupabaseData();
  }, []);

  // Auto-persist to localStorage as an offline caching mechanism
  useEffect(() => {
    saveLocalData(state);
  }, [state]);

  const updateStateAndPersist = (updater: (prev: typeof state) => typeof state) => {
    setState(prev => {
      const next = updater(prev);
      return next;
    });
  };

  // Helper background save to Supabase
  const handleSupabaseSave = async <T,>(saveFn: (item: T) => Promise<void>, item: T, tableName: string) => {
    try {
      await saveFn(item);
    } catch (err: any) {
      console.error(`Supabase Sync Error [${tableName}]:`, err);
      if (err.message && (err.message.includes('not found') || err.message.includes('does not exist'))) {
        setSupabaseStatus('no_tables');
        setSupabaseMessage(`ตรวจพบตาราง ${tableName} ไม่มีอยู่ในฐานข้อมูลกรุณาสร้าง SQL Tables`);
      }
    }
  };

  const handleSupabaseDelete = async (deleteFn: (id: string) => Promise<void>, id: string, tableName: string) => {
    try {
      await deleteFn(id);
    } catch (err: any) {
      console.error(`Supabase Sync Delete Error [${tableName}]:`, err);
      if (err.message && (err.message.includes('not found') || err.message.includes('does not exist'))) {
        setSupabaseStatus('no_tables');
        setSupabaseMessage(`ตรวจพบตาราง ${tableName} ไม่มีอยู่ในฐานข้อมูลกรุณาสร้าง SQL Tables`);
      }
    }
  };

  const handleSeedSupabase = async () => {
    setIsSeedingSupabase(true);
    setSupabaseStatus('checking');
    setSupabaseMessage('กำลังตรวจสอบสิทธิ์โครงสร้างตารางและเขียนชุดข้อมูลตัวอย่าง 10 แฟ้มงาน...');
    
    // Attempt schema seed from code upserts
    const result = await seedSupabaseTablesJS();
    setIsSeedingSupabase(false);
    
    if (result.success) {
      setSupabaseStatus('connected');
      setSupabaseMessage(result.message);
      await fetchSupabaseData();
    } else {
      setSupabaseStatus('error');
      setSupabaseMessage('ล้มเหลวในการส่งข้อมูล: ' + result.message);
    }
  };

  // Google Sheets Action Handlers
  const handlePushToSheets = async () => {
    if (!accessToken) {
      setSyncStatus('error');
      setSyncMessage('กรุณากรอก Access Token สิทธิ์ยืนยันตัวก่อนทำการซิงค์');
      setShowConfigPanel(true);
      return;
    }
    setIsSyncing(true);
    setSyncStatus('loading');
    setSyncMessage('กำลังส่งโครงร่างและฐานข้อมูลระดับหมุดขึ้นสู่คลาวด์...');

    const success = await syncToGoogleSheets(spreadsheetId, accessToken, state);
    
    setIsSyncing(false);
    if (success) {
      setSyncStatus('success');
      setSyncMessage('อัปเดตชุดข้อมูลโครงร่าง 12 Worksheets ลงบนชีทสำเร็จ!');
    } else {
      setSyncStatus('error');
      setSyncMessage('สิทธิ์ล้มเหลว หรือ SpreadsheetID ไม่ถูกต้อง กรุณาอัปเดต Token');
    }
  };

  const handlePullFromSheets = async () => {
    if (!accessToken) {
      setSyncStatus('error');
      setSyncMessage('กรุณากรอก Access Token สิทธิ์ยืนยันตัวก่อนทำการซิงค์');
      setShowConfigPanel(true);
      return;
    }
    setIsSyncing(true);
    setSyncStatus('loading');
    setSyncMessage('กำลังนำเข้าพารามิเตอร์ข้ามเครือข่าย...');

    const pulledData = await loadFromGoogleSheets(spreadsheetId, accessToken);
    setIsSyncing(false);
    if (pulledData) {
      setState(pulledData);
      setSyncStatus('success');
      setSyncMessage('ดาวน์โหลดและบูรณาการฐานข้อมูลจากชีทสำเร็จ!');
    } else {
      setSyncStatus('error');
      setSyncMessage('ล้มเหลวในการอ่านข้อมูล กรุณาตรวจชื่อแท็บใน Spreadsheet การตั้งค่า');
    }
  };

  const handleTestConnection = async () => {
    if (!accessToken) {
      alert('กรุณากรอก Google Access Token ก่อนการทดสอบ');
      return;
    }
    const ping = await testSpreadsheetAccess(spreadsheetId, accessToken);
    if (ping) {
      alert('เชื่อมต่อกับ Google Spreadsheet สำเร็จ!');
    } else {
      alert('การเชื่อมต่อล้มเหลว ตรวจสอบโครงสร้างสิทธิ์การเข้าถึงอีกครั้ง');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased">
      {/* Top Banner Branding / Header Section */}
      <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 no-print">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-md font-sans font-black tracking-tight block">KHEMTHIT TRANSPORT CO.,LTD.</h1>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] uppercase font-mono px-2 py-0.5 rounded font-extrabold">Active Hub</span>
              </div>
              <p className="text-slate-400 text-xs">ระบบบริหารงานและจัดการโลจิสติกส์ขนส่ง (14 โมดูลหลักเชื่อมชีทกาลสะสม)</p>
            </div>
          </div>

          {/* Sync status widget controllers */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Supabase Core Integration Widget */}
            <button
              onClick={() => {
                setShowSupabasePanel(!showSupabasePanel);
                setShowConfigPanel(false);
              }}
              className={`flex items-center gap-1.5 p-1.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                supabaseStatus === 'connected' 
                  ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/80' 
                  : supabaseStatus === 'checking'
                  ? 'bg-amber-950/80 border-amber-500/30 text-amber-400 hover:bg-amber-900/80'
                  : supabaseStatus === 'no_tables'
                  ? 'bg-amber-950/80 border-amber-600/50 text-amber-500 hover:bg-amber-905'
                  : 'bg-red-950/80 border-red-500/30 text-red-400 hover:bg-red-900/80'
              }`}
            >
              <Database className={`w-3.5 h-3.5 ${supabaseStatus === 'checking' ? 'animate-spin' : ''}`} />
              <span>
                Supabase: {
                  supabaseStatus === 'connected' ? 'Live (100%)' :
                  supabaseStatus === 'checking' ? 'Checking...' :
                  supabaseStatus === 'no_tables' ? 'No Tables' : 'Disconnected'
                }
              </span>
              <span className="text-[9px] bg-slate-800 text-slate-300 font-normal px-1 shadow-sm rounded">ตั้งค่า SQL</span>
            </button>

            {/* Google Sheets Backup Widget */}
            <div className="bg-slate-800/80 border border-slate-700/80 p-1.5 px-3 rounded-xl flex items-center gap-3">
              <button
                onClick={() => {
                  setShowConfigPanel(!showConfigPanel);
                  setShowSupabasePanel(false);
                }}
                className="text-[10px] font-bold text-slate-200 hover:text-white flex items-center gap-1 transition-all"
              >
                <CloudLightning className="w-3.5 h-3.5 text-indigo-400" /> เชื่อม Google Sheets
              </button>
              <div className="h-4 w-px bg-slate-700" />
              <button 
                onClick={handlePushToSheets}
                className="text-slate-200 hover:text-white"
                title="ส่งออกสำเนาบันทึกไปยังชีท (Backup)"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sync Status Notifications Drawer Bar */}
      {syncStatus !== 'idle' && (
        <div className="bg-indigo-50 border-b border-indigo-150 p-2.5 text-xs font-bold text-indigo-900 flex items-center justify-between no-print">
          <div className="max-w-7xl mx-auto px-4 w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              {syncStatus === 'loading' && <RotateCw className="w-4 h-4 animate-spin text-indigo-600" />}
              {syncStatus === 'success' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
              {syncStatus === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
              <span>{syncMessage}</span>
            </div>
            <button 
              onClick={() => setSyncStatus('idle')}
              className="text-indigo-400 hover:text-indigo-900 border border-indigo-200 rounded px-1.5 py-0.5 bg-white text-[10px]"
            >
              ปิดคำเตือน
            </button>
          </div>
        </div>
      )}

      {/* Supabase Core Management & Seeder Panel */}
      {showSupabasePanel && (
        <div className="bg-white border-b border-slate-200 shadow-sm no-print">
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <h2 className="font-sans font-black text-sm text-slate-900 uppercase tracking-wide">
                  ระบบบริหารงานฐานข้อมูล Supabase Live API (100%)
                </h2>
              </div>
              <button 
                onClick={() => setShowSupabasePanel(false)}
                className="text-slate-400 hover:text-slate-900 text-xs font-bold font-mono"
              >
                ปิดบานควบคุม [X]
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              {/* Box 1: Status & Connectivity */}
              <div className="p-4 bg-emerald-50/30 border border-emerald-100 rounded-xl space-y-3">
                <h3 className="font-black text-slate-800 text-xs flex items-center gap-1.5 uppercase font-mono">
                  🟢 Connectivity Status
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">สถานะเซิร์ฟเวอร์:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      supabaseStatus === 'connected' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {supabaseStatus}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white p-2 border border-slate-100 rounded text-[11px] leading-relaxed text-slate-700 font-medium">
                    {supabaseMessage}
                  </div>
                </div>
                
                {/* Seed button */}
                <div className="pt-2">
                  <button
                    disabled={isSeedingSupabase}
                    onClick={handleSeedSupabase}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold p-2.5 rounded-lg transition-all flex items-center justify-center gap-2 border-b-2 border-emerald-800"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isSeedingSupabase ? 'กำลังส่งชุดข้อมูล...' : 'เติมตัวอย่างดัมมี่จริง 10 ตาราง'}
                  </button>
                  <p className="text-[9px] text-slate-400 mt-1 leading-normal">
                    *ทำการ .upsert() บันทึกตรงผ่าน JavaScript SDK พร้อมจัดเรียงคีย์นอก (Foreign Keys)
                  </p>
                </div>
              </div>

              {/* Box 2: SQL Scripts Tool */}
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-slate-800 text-xs flex items-center gap-1.5 uppercase font-mono">
                    📋 SQL Schema (สร้าง 11 ตารางโครงร่างหลัก)
                  </h3>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(SQL_SCHEMA);
                      setCopyCodeSuccess(true);
                      setTimeout(() => setCopyCodeSuccess(false), 2000);
                    }}
                    className="text-indigo-600 hover:text-indigo-900 border border-indigo-200 bg-indigo-50/50 font-bold px-2 py-1 rounded text-[10px] transition-all"
                  >
                    {copyCodeSuccess ? 'คัดลอกสำเร็จ! ✔' : 'คัดลอก SQL Code'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  คัดลอกสคริปต์ความปลอดภัย RLS ป้อนใน **Supabase SQL Editor** กด **Run** หน้าแดชบอร์ดเพื่อให้พร้อมใช้งานระบบ Production 100% ทันที
                </p>
                <div className="relative">
                  <textarea
                    readOnly
                    value={SQL_SCHEMA}
                    className="w-full h-32 p-3 font-mono text-[9px] text-emerald-400 bg-slate-900 border border-slate-800 rounded-xl leading-relaxed outline-none resize-none"
                  />
                  <div className="absolute bottom-2.5 right-2.5 bg-slate-800 px-2 py-1 border border-slate-700 rounded text-[9px] font-mono text-slate-400">
                    PostgreSQL Syntax
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings / Configuration Drawer block */}
      {showConfigPanel && (
        <div className="bg-white border-b border-slate-200 shadow-sm no-print">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="font-sans font-black text-xs text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                <CloudLightning className="w-4 h-4 text-indigo-600" /> ตั้งค่า Google Sheets OAuth Integration
              </h2>
              <button 
                onClick={() => setShowConfigPanel(false)}
                className="text-slate-400 hover:text-slate-900 text-xs font-bold"
              >
                ปิดบานควบคุม [X]
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">1. Spreadsheet ID</label>
                <input 
                  type="text" 
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-lg outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-400 block pt-0.5">ID แรดจาก URL ของชีทที่คุณอนุญาตสิทธิ์</span>
              </div>
              <div className="space-y-1">
                <label className="text-slate-705 font-bold text-slate-700 block">
                  2. Google Access Token (สิทธิ์พาสบอร์ด)
                </label>
                <input 
                  type="password" 
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="กรอก Bearer Token สิทธิ์..."
                  className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-lg outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-400 block pt-0.5">ได้จากการคลิกอนุญาตพอร์ต หรือ ป้อนจาก OAuth Console</span>
              </div>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-4 border border-slate-200 rounded-xl">
              <div className="space-y-0.5 max-w-[400px]">
                <span className="font-extrabold text-[11px] text-slate-800 font-sans block">ความมั่นคงในแบบประสานกาลชีท:</span>
                <span className="text-[10px] text-slate-500 block leading-normal">
                  เมื่อคุณเชื่อม token สำเร็จ ระบบจะทำลายชีทเดิมที่ซ้ำกัน และสร้างสารบบ Worksheets ออกวางบิล, เงินเดือน, และรถร่วมที่เชื่อมต่อกันอย่างสมบูรณ์แบบไม่หายสูญ
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTestConnection}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[11px] px-3.5 py-2.0 py-2 rounded-lg border border-slate-305 transition-all"
                >
                  ทดสอบสิทธิ์
                </button>
                <button
                  onClick={handlePullFromSheets}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-3.5 py-2 rounded-lg transition-all"
                >
                  ดึงตารางข้อมูลลงเครื่อง (Pull)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Tab bar Navigator (Tabs mapping out the 14 requirements clearly) */}
      <nav className="bg-white border-b border-slate-200 z-10 sticky top-0 shadow-xs no-print">
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto flex items-center font-sans">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`py-3.5 px-4 font-bold text-xs border-b-2 tracking-wide flex items-center gap-1.5 whitespace-nowrap transition-all ${activeTab === 'dashboard' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
          >
            <BarChart2 className="w-4 h-4" /> แดชบอร์ดสรุปภาพรวม
          </button>
          
          <button 
            onClick={() => setActiveTab('jobs')}
            className={`py-3.5 px-4 font-bold text-xs border-b-2 tracking-wide flex items-center gap-1.5 whitespace-nowrap transition-all ${activeTab === 'jobs' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
          >
            <Truck className="w-4 h-4" /> แผนจราจรวิ่งงานขนส่ง
          </button>

          <button 
            onClick={() => setActiveTab('expenses')}
            className={`py-3.5 px-4 font-bold text-xs border-b-2 tracking-wide flex items-center gap-1.5 whitespace-nowrap transition-all ${activeTab === 'expenses' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
          >
            <DollarSign className="w-4 h-4" /> บันทึกจ่ายน้ำมัน&ทางด่วน
          </button>

          <button 
            onClick={() => setActiveTab('invoices')}
            className={`py-3.5 px-4 font-bold text-xs border-b-2 tracking-wide flex items-center gap-1.5 whitespace-nowrap transition-all ${activeTab === 'invoices' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
          >
            <FileText className="w-4 h-4" /> ออกใบแจ้งหนี้ (หัก 1%)
          </button>

          <button 
            onClick={() => setActiveTab('receipts')}
            className={`py-3.5 px-4 font-bold text-xs border-b-2 tracking-wide flex items-center gap-1.5 whitespace-nowrap transition-all ${activeTab === 'receipts' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
          >
            <CheckSquare className="w-4 h-4" /> ออกใบเสร็จรับเงิน
          </button>

          <button 
            onClick={() => setActiveTab('registry')}
            className={`py-3.5 px-4 font-bold text-xs border-b-2 tracking-wide flex items-center gap-1.5 whitespace-nowrap transition-all ${activeTab === 'registry' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
          >
            <Users className="w-4 h-4" /> ทะเบียนตารางหลัก (4 ฐาน)
          </button>

          <button 
            onClick={() => setActiveTab('finance')}
            className={`py-3.5 px-4 font-bold text-xs border-b-2 tracking-wide flex items-center gap-1.5 whitespace-nowrap transition-all ${activeTab === 'finance' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
          >
            <Settings className="w-4 h-4" /> บัญชีเงินกู้, เงินเดือน & งบ P&L
          </button>

          <button 
            onClick={() => setActiveTab('manual')}
            className={`py-3.5 px-4 font-bold text-xs border-b-2 tracking-wide flex items-center gap-1.5 whitespace-nowrap transition-all ${activeTab === 'manual' ? 'border-indigo-600 text-indigo-700 font-extrabold' : 'border-transparent text-emerald-600 hover:text-emerald-900 bg-emerald-500/5'}`}
          >
            <HelpCircle className="w-4 h-4 text-emerald-500" /> คู่มือการใช้งานระบบ
          </button>
        </div>
      </nav>

      {/* Main Core View Area render dependence on current Nav Bar click */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full space-y-6">
        
        {activeTab === 'dashboard' && (
          <DashboardView 
            jobs={state.jobs}
            expenses={state.expenses}
            invoices={state.invoices}
            receipts={state.receipts}
            drivers={state.drivers}
            vehicles={state.vehicles}
            customers={state.customers}
            onNavigate={(dest) => {
              if (dest === 'PLAN_JOB') {
                setActiveTab('jobs');
              } else if (dest === 'DAILY_EXPENSE') {
                setActiveTab('expenses');
              }
            }}
          />
        )}

        {activeTab === 'jobs' && (
          <JobsView 
            jobs={state.jobs}
            customers={state.customers}
            drivers={state.drivers}
            vehicles={state.vehicles}
            onSaveJob={(job) => {
              updateStateAndPersist(prev => {
                const list = [...prev.jobs];
                const index = list.findIndex(j => j.jobNo === job.jobNo);
                if (index > -1) {
                  list[index] = job;
                } else {
                  list.push(job);
                }
                return { ...prev, jobs: list };
              });
              handleSupabaseSave(dbSaveJob, job, 'ขนส่ง (transport_jobs)');
            }}
            onDeleteJob={(jobNo) => {
              updateStateAndPersist(prev => ({
                ...prev,
                jobs: prev.jobs.filter(j => j.jobNo !== jobNo)
              }));
              handleSupabaseDelete(dbDeleteJob, jobNo, 'ขนส่ง (transport_jobs)');
            }}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesView 
            expenses={state.expenses}
            vehicles={state.vehicles}
            drivers={state.drivers}
            onSaveExpense={(exp) => {
              updateStateAndPersist(prev => {
                const list = [...prev.expenses];
                const idx = list.findIndex(e => e.id === exp.id);
                if (idx > -1) {
                  list[idx] = exp;
                } else {
                  list.push(exp);
                }
                return { ...prev, expenses: list };
              });
              handleSupabaseSave(dbSaveExpense, exp, 'ค่าใช้จ่ายประจำวัน (daily_expenses)');
            }}
            onDeleteExpense={(id) => {
              updateStateAndPersist(prev => ({
                ...prev,
                expenses: prev.expenses.filter(e => e.id !== id)
              }));
              handleSupabaseDelete(dbDeleteExpense, id, 'ค่าใช้จ่ายประจำวัน (daily_expenses)');
            }}
          />
        )}

        {activeTab === 'invoices' && (
          <InvoicesView 
            invoices={state.invoices}
            customers={state.customers}
            jobs={state.jobs}
            onSaveInvoice={(invoice) => {
              updateStateAndPersist(prev => {
                const list = [...prev.invoices];
                const idx = list.findIndex(inv => inv.invoiceNo === invoice.invoiceNo);
                if (idx > -1) {
                  list[idx] = invoice;
                } else {
                  list.push(invoice);
                }

                // If invoice maps to a job, we can set that Job status instantly!
                const updatedJobs = prev.jobs.map(job => {
                  if (job.jobNo === invoice.jobNo) {
                    return { ...job, status: 'วางบิลแล้ว' as const };
                  }
                  return job;
                });

                return { ...prev, invoices: list, jobs: updatedJobs };
              });
              handleSupabaseSave(dbSaveInvoice, invoice, 'ใบแจ้งหนี้ (invoices)');
            }}
            onDeleteInvoice={(invNo) => {
              updateStateAndPersist(prev => ({
                ...prev,
                invoices: prev.invoices.filter(i => i.invoiceNo !== invNo)
              }));
              handleSupabaseDelete(dbDeleteInvoice, invNo, 'ใบแจ้งหนี้ (invoices)');
            }}
          />
        )}

        {activeTab === 'receipts' && (
          <ReceiptsView 
            receipts={state.receipts}
            invoices={state.invoices}
            customers={state.customers}
            onSaveReceipt={(receipt) => {
              updateStateAndPersist(prev => {
                const list = [...prev.receipts];
                const idx = list.findIndex(r => r.receiptNo === receipt.receiptNo);
                if (idx > -1) {
                  list[idx] = receipt;
                } else {
                  list.push(receipt);
                }

                // Update original invoice status to 'Paid' / 'จ่ายแล้ว'
                const updatedInv = prev.invoices.map(inv => {
                  if (inv.invoiceNo === receipt.invoiceNo) {
                    return { ...inv, status: 'จ่ายแล้ว' as const };
                  }
                  return inv;
                });

                return { ...prev, receipts: list, invoices: updatedInv };
              });
              handleSupabaseSave(dbSaveReceipt, receipt, 'ใบเสร็จรับเงิน (receipts)');
            }}
            onDeleteReceipt={(recNo) => {
              updateStateAndPersist(prev => ({
                ...prev,
                receipts: prev.receipts.filter(r => r.receiptNo !== recNo)
              }));
              handleSupabaseDelete(dbDeleteReceipt, recNo, 'ใบเสร็จรับเงิน (receipts)');
            }}
          />
        )}

        {activeTab === 'registry' && (
          <RegistryView 
            customers={state.customers}
            drivers={state.drivers}
            vehicles={state.vehicles}
            employees={state.employees}
            onSaveCustomer={(cust) => {
              updateStateAndPersist(prev => {
                const list = [...prev.customers];
                const index = list.findIndex(c => c.id === cust.id);
                if (index > -1) list[index] = cust;
                else list.push(cust);
                return { ...prev, customers: list };
              });
              handleSupabaseSave(dbSaveCustomer, cust, 'ลูกค้า (customers)');
            }}
            onDeleteCustomer={(id) => {
              updateStateAndPersist(prev => ({
                ...prev,
                customers: prev.customers.filter(c => c.id !== id)
              }));
              handleSupabaseDelete(dbDeleteCustomer, id, 'ลูกค้า (customers)');
            }}
            onSaveDriver={(drv) => {
              updateStateAndPersist(prev => {
                const list = [...prev.drivers];
                const index = list.findIndex(d => d.id === drv.id);
                if (index > -1) list[index] = drv;
                else list.push(drv);
                return { ...prev, drivers: list };
              });
              handleSupabaseSave(dbSaveDriver, drv, 'คนขับ (drivers)');
            }}
            onDeleteDriver={(id) => {
              updateStateAndPersist(prev => ({
                ...prev,
                drivers: prev.drivers.filter(d => d.id !== id)
              }));
              handleSupabaseDelete(dbDeleteDriver, id, 'คนขับ (drivers)');
            }}
            onSaveVehicle={(veh) => {
              updateStateAndPersist(prev => {
                const list = [...prev.vehicles];
                const index = list.findIndex(v => v.licensePlate === veh.licensePlate);
                if (index > -1) list[index] = veh;
                else list.push(veh);
                return { ...prev, vehicles: list };
              });
              handleSupabaseSave(dbSaveVehicle, veh, 'ยานพาหนะ (vehicles)');
            }}
            onDeleteVehicle={(plate) => {
              updateStateAndPersist(prev => ({
                ...prev,
                vehicles: prev.vehicles.filter(v => v.licensePlate !== plate)
              }));
              handleSupabaseDelete(dbDeleteVehicle, plate, 'ยานพาหนะ (vehicles)');
            }}
            onSaveEmployee={(emp) => {
              updateStateAndPersist(prev => {
                const list = [...prev.employees];
                const index = list.findIndex(e => e.id === emp.id);
                if (index > -1) list[index] = emp;
                else list.push(emp);
                return { ...prev, employees: list };
              });
              handleSupabaseSave(dbSaveEmployee, emp, 'พนักงาน (employees)');
            }}
            onDeleteEmployee={(id) => {
              updateStateAndPersist(prev => ({
                ...prev,
                employees: prev.employees.filter(e => e.id !== id)
              }));
              handleSupabaseDelete(dbDeleteEmployee, id, 'พนักงาน (employees)');
            }}
          />
        )}

        {activeTab === 'finance' && (
          <FinanceView 
            partnerPayments={state.partnerPayments}
            withholdingTaxes={state.withholdingTaxes}
            payroll={state.payroll}
            invoices={state.invoices}
            expenses={state.expenses}
            drivers={state.drivers}
            employees={state.employees}
            onSavePartnerPayment={(ppm) => {
              updateStateAndPersist(prev => {
                const list = [...prev.partnerPayments];
                const index = list.findIndex(p => p.id === ppm.id);
                if (index > -1) list[index] = ppm;
                else list.push(ppm);
                return { ...prev, partnerPayments: list };
              });
              handleSupabaseSave(dbSavePartnerPayment, ppm, 'จ่ายรถร่วม (partner_payments)');
            }}
            onDeletePartnerPayment={(id) => {
              updateStateAndPersist(prev => ({
                ...prev,
                partnerPayments: prev.partnerPayments.filter(p => p.id !== id)
              }));
              handleSupabaseDelete(dbDeletePartnerPayment, id, 'จ่ายรถร่วม (partner_payments)');
            }}
            onSaveWithholdingTax={(wht) => {
              updateStateAndPersist(prev => {
                const list = [...prev.withholdingTaxes];
                const index = list.findIndex(w => w.id === wht.id);
                if (index > -1) list[index] = wht;
                else list.push(wht);
                return { ...prev, withholdingTaxes: list };
              });
              handleSupabaseSave(dbSaveWithholdingTax, wht, 'ภาษีหัก ณ ที่จ่าย (withholding_taxes)');
            }}
            onDeleteWithholdingTax={(id) => {
              updateStateAndPersist(prev => ({
                ...prev,
                withholdingTaxes: prev.withholdingTaxes.filter(w => w.id !== id)
              }));
              handleSupabaseDelete(dbDeleteWithholdingTax, id, 'ภาษีหัก ณ ที่จ่าย (withholding_taxes)');
            }}
            onSavePayroll={(pr) => {
              updateStateAndPersist(prev => {
                const list = [...prev.payroll];
                const index = list.findIndex(p => p.id === pr.id);
                if (index > -1) list[index] = pr;
                else list.push(pr);
                return { ...prev, payroll: list };
              });
              handleSupabaseSave(dbSavePayroll, pr, 'เงินเดือน (payroll)');
            }}
            onDeletePayroll={(id) => {
              updateStateAndPersist(prev => ({
                ...prev,
                payroll: prev.payroll.filter(p => p.id !== id)
              }));
              handleSupabaseDelete(dbDeletePayroll, id, 'เงินเดือน (payroll)');
            }}
          />
        )}

        {activeTab === 'manual' && (
          <ManualView />
        )}

      </main>

      {/* Corporate Dashboard Footer notes */}
      <footer className="bg-slate-900 text-slate-400 py-6 mt-12 border-t border-slate-800 text-xs no-print text-center">
        <div className="max-w-7xl mx-auto px-4 space-y-1 block">
          <p>© 2026 Khemthit Transport Management Co.,Ltd. All rights reserved.</p>
          <p className="text-slate-500 font-mono text-[10px]">บึงเกลือ พานทอง อู่ศรีราชา จ.ชลบุรี • ปฏิบัติงานบนสภาพทางด่วนที่ปลอดภัย</p>
        </div>
      </footer>
    </div>
  );
}
