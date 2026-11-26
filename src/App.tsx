import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  AlertCircle,
  ShieldCheck,
  X,
  Briefcase,
  UserCheck,
  ArrowRight,
} from 'lucide-react';

import {
  AppDataState,
  EMPTY_APP_STATE,
  FIRESTORE_SCHEMA_SUMMARY,
  subscribeAllCollections,
  fbSaveCustomer,
  fbDeleteCustomer,
  fbSyncCustomerNameCascade,
  fbSaveDriver,
  fbDeleteDriver,
  fbSaveVehicle,
  fbDeleteVehicle,
  fbSaveEmployee,
  fbDeleteEmployee,
  fbSaveJob,
  fbDeleteJob,
  fbSaveExpense,
  fbDeleteExpense,
  fbSaveInvoice,
  fbDeleteInvoice,
  fbSaveReceipt,
  fbDeleteReceipt,
  fbSaveManagerEntry,
  fbDeleteManagerEntry,
  fbSaveSubcontractorPaymentDoc,
  fbDeleteSubcontractorPaymentDoc,
  fbSavePartnerPayment,
  fbDeletePartnerPayment,
  fbSaveWithholdingTax,
  fbDeleteWithholdingTax,
  fbSavePayroll,
  fbDeletePayroll,
  fbSaveTaxRule,
  fbDeleteTaxRule,
  fbResetDefaultTaxRules,
} from './firebaseService';
import { DEFAULT_TAX_RULES } from './utils';

import { DashboardView } from './components/DashboardView';
import { JobsView } from './components/JobsView';
import { ExpensesView } from './components/ExpensesView';
import { InvoicesView } from './components/InvoicesView';
import { ReceiptsView } from './components/ReceiptsView';
import { RegistryView } from './components/RegistryView';
import { FinanceView } from './components/FinanceView';
import { ManualView } from './components/ManualView';
import { ReportsView } from './components/ReportsView';
import { PartnerPaymentView } from './components/PartnerPaymentView';
import { ManagerEntryView } from './components/ManagerEntryView';
import { TaxReportView } from './components/TaxReportView';
import { BackupMigrationView } from './components/BackupMigrationView';
import { TaxRulesModal } from './components/TaxRulesModal';
import { LayoutShell, AppTab } from './components/LayoutShell';
import {
  SkeletonDashboard,
  ToastProvider,
  useToast,
} from './components/ui/DesignSystem';

type RoleSession = 'staff' | 'manager';

const ROLE_STORAGE_KEY = 'khemthit_active_role';
const NAME_STORAGE_KEY = 'khemthit_operator_name';

function AppWorkspace() {
  const { showToast } = useToast();

  // Simple Role Session (Staff or Manager) — no Google account login required
  const [roleSession, setRoleSession] = useState<RoleSession | null>(() => {
    try {
      const saved = localStorage.getItem(ROLE_STORAGE_KEY);
      if (saved === 'staff' || saved === 'manager') return saved;
    } catch {
      // ignore storage errors
    }
    return null;
  });

  const [operatorName, setOperatorName] = useState<string>(() => {
    try {
      return localStorage.getItem(NAME_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  const [activeTab, setActiveTab] = useState<AppTab>(() =>
    roleSession === 'manager' ? 'reports' : 'dashboard'
  );
  const [openAddExpenseSignal, setOpenAddExpenseSignal] = useState(0);

  // Real-time Firestore state for all 15 operational collections
  const [state, setState] = useState<AppDataState>(EMPTY_APP_STATE);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [showTaxRulesModal, setShowTaxRulesModal] = useState(false);

  // Subscribe to all 14 Firestore collections directly
  useEffect(() => {
    setIsLoadingData(true);
    setDbError(null);

    const unsubscribeAll = subscribeAllCollections(
      (patch) => {
        setState((prev) => ({ ...prev, ...patch }));
      },
      () => {
        setIsLoadingData(false);
      },
      (err) => {
        setIsLoadingData(false);
        setDbError(err.message || 'ไม่สามารถเชื่อมต่อฐานข้อมูล Firebase Firestore ได้');
      }
    );

    return () => {
      unsubscribeAll();
    };
  }, []);

  const handleSelectRole = (role: RoleSession) => {
    setRoleSession(role);
    setActiveTab(role === 'manager' ? 'reports' : 'dashboard');
    try {
      localStorage.setItem(ROLE_STORAGE_KEY, role);
      if (operatorName.trim()) {
        localStorage.setItem(NAME_STORAGE_KEY, operatorName.trim());
      }
    } catch {
      // ignore storage errors
    }
  };

  const handleLogout = () => {
    setRoleSession(null);
    setShowSchemaModal(false);
    setShowTaxRulesModal(false);
    setActiveTab('dashboard');
    try {
      localStorage.removeItem(ROLE_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
  };

  const runDbAction = async (
    action: () => Promise<void>,
    label: string,
    silentSuccess = false
  ): Promise<boolean> => {
    try {
      setDbError(null);
      await action();
      if (!silentSuccess) {
        showToast('บันทึกข้อมูลเรียบร้อยแล้ว', 'success');
      }
      return true;
    } catch (err: any) {
      console.error(`Firebase Error [${label}]:`, err);
      setDbError(
        `บันทึกข้อมูล "${label}" ไม่สำเร็จ: ${err?.message || 'โปรดตรวจสอบการเชื่อมต่อ Firebase'}`
      );
      showToast('ไม่สามารถบันทึกข้อมูลได้ กรุณาตรวจสอบข้อมูลอีกครั้ง', 'error');
      return false;
    }
  };

  const handleQuickAddExpense = () => {
    if (roleSession === 'manager') {
      handleSelectRole('staff');
    }
    if (activeTab !== 'expenses' && activeTab !== 'driver_expenses') {
      setActiveTab('expenses');
    }
    setOpenAddExpenseSignal((n) => n + 1);
  };

  const driverExpenseCount = useMemo(
    () => state.expenses.filter((e) => e.expenseCategory === 'driver').length,
    [state.expenses]
  );

  const effectiveTaxRules = useMemo(
    () => (state.taxRules.length > 0 ? state.taxRules : DEFAULT_TAX_RULES),
    [state.taxRules]
  );

  const collectionCounts: Record<string, number> = {
    customers: state.customers.length,
    drivers: state.drivers.length,
    vehicles: state.vehicles.length,
    employees: state.employees.length,
    transport_jobs: state.jobs.length,
    daily_expenses: state.expenses.length,
    credit_incomes: state.incomes.length,
    invoices: state.invoices.length,
    receipts: state.receipts.length,
    subcontractor_payment_docs: state.partnerPaymentDocs.length,
    partner_payments: state.partnerPayments.length,
    withholding_taxes: state.withholdingTaxes.length,
    payroll: state.payroll.length,
    manager_entries: state.managerEntries.length,
    tax_rules: state.taxRules.length,
  };

  // Role Selection / Login Screen (Staff & Manager ONLY — No Google Sign-In)
  if (!roleSession) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col justify-center items-center p-4 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#DBEAFE]/60 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#D1FAE5]/60 blur-3xl pointer-events-none" />

        <div className="max-w-lg w-full bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-900/5 relative space-y-6">
          {/* Logo & Branding */}
          <div className="text-center space-y-3">
            <div className="w-20 h-20 mx-auto flex items-center justify-center p-2.5 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE]">
              <img
                src="https://lh3.googleusercontent.com/d/14sHmuOzVEZbKgOZP5p7COS1rfXJvi5w_"
                alt="บริษัท เข็มทิศ ทรานสปอร์ต จำกัด"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-1">
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900 uppercase">
                KHEMTHIT TRANSPORT CO.,LTD.
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                เลือกฝ่ายผู้ใช้งานเพื่อเข้าสู่ระบบทันที (ไม่ต้องเข้าสู่ระบบด้วยบัญชี Google)
              </p>
            </div>
          </div>

          {/* Optional Operator Display Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 block">
              ชื่อผู้ปฏิบัติงาน (ไม่บังคับ)
            </label>
            <input
              type="text"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              placeholder="เช่น คุณสมชาย, ฝ่ายบัญชี, ผู้จัดการ"
              className="w-full min-h-[44px] text-xs text-slate-800 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-sky-400 transition-colors"
            />
          </div>

          {/* 2 Role Buttons: Staff vs Manager */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => handleSelectRole('staff')}
              className="group p-5 rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF]/70 hover:bg-[#DBEAFE]/70 text-left transition-all flex flex-col justify-between gap-4 min-h-[144px] active:scale-[0.98]"
            >
              <div className="w-11 h-11 rounded-xl bg-white border border-[#BFDBFE] text-[#1D4ED8] flex items-center justify-center shadow-2xs">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-slate-900">ฝ่ายพนักงาน</span>
                  <ArrowRight className="w-4 h-4 text-[#1D4ED8] group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  งานขนส่ง, ค่าใช้จ่าย, ภาษี 1% คนขับรถ, ใบแจ้งหนี้, ใบเสร็จ และทะเบียน
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectRole('manager')}
              className="group p-5 rounded-2xl border border-[#DDD6FE] bg-[#F5F3FF]/70 hover:bg-[#EDE9FE]/80 text-left transition-all flex flex-col justify-between gap-4 min-h-[144px] active:scale-[0.98]"
            >
              <div className="w-11 h-11 rounded-xl bg-white border border-[#DDD6FE] text-[#6D28D9] flex items-center justify-center shadow-2xs">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-slate-900">ฝ่ายผู้จัดการ</span>
                  <ArrowRight className="w-4 h-4 text-[#6D28D9] group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  รายงานวิ่งงานแยกคัน, งบการเงิน, รายงานภาษี 1% และบันทึกรายรับ-จ่ายผู้จัดการ
                </p>
              </div>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-[#047857] font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>เชื่อมต่อฐานข้อมูล Firebase Firestore เรียลไทม์ 100%</span>
            </div>
            <p className="text-[11px] text-slate-400">
              สามารถสลับระหว่างฝ่ายพนักงานและฝ่ายผู้จัดการได้ตลอดเวลาจากแถบเมนูด้านบน
            </p>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 mt-6 text-center select-none">
          © {new Date().getFullYear()} บริษัท เข็มทิศ ทรานสปอร์ต จำกัด
        </div>
      </div>
    );
  }

  const actorUid = roleSession === 'manager' ? 'khemthit_manager' : 'khemthit_staff';
  const displayName =
    operatorName.trim() ||
    (roleSession === 'manager' ? 'ฝ่ายผู้จัดการ (Manager)' : 'ฝ่ายพนักงาน (Staff)');

  const handleDashboardNavigate = (dest: string) => {
    if (dest === 'PLAN_JOB') {
      setActiveTab(roleSession === 'manager' ? 'reports' : 'jobs');
    } else if (dest === 'DAILY_EXPENSE') {
      setActiveTab(roleSession === 'manager' ? 'manager_entry' : 'expenses');
    } else if (dest === 'DRIVER_EXPENSE') {
      if (roleSession === 'manager') handleSelectRole('staff');
      setActiveTab('driver_expenses');
    } else if (dest === 'TAX_REPORT') {
      setActiveTab('tax_report');
    } else if (dest === 'EXPENSE_SUMMARY') {
      setActiveTab('expense_summary');
    }
  };

  return (
    <LayoutShell
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      onQuickAddExpense={handleQuickAddExpense}
      onOpenTaxRules={() => setShowTaxRulesModal(true)}
      onToggleSchema={() => setShowSchemaModal((s) => !s)}
      onLogout={handleLogout}
      userDisplayName={displayName}
      userEmail={roleSession === 'manager' ? 'โหมดผู้จัดการ' : 'โหมดพนักงานปฏิบัติการ'}
      userRole={roleSession}
      isAdminUser={true}
      workspaceMode={roleSession}
      onChangeWorkspaceMode={(mode) => {
        handleSelectRole(mode);
      }}
      driverExpenseCount={driverExpenseCount}
      totalExpenseCount={state.expenses.length}
    >
      {/* Firestore Error Notification Bar */}
      {dbError && (
        <div className="mb-4 bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs font-semibold text-rose-700 flex items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="break-words">{dbError}</span>
          </div>
          <button
            type="button"
            onClick={() => setDbError(null)}
            className="text-rose-600 hover:text-rose-900 border border-rose-200 rounded-lg px-2.5 py-1 bg-white text-[11px] shrink-0"
          >
            ปิด
          </button>
        </div>
      )}

      {/* Firebase 14 Collections Schema Inspector Modal */}
      {showSchemaModal && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4 no-print"
          onClick={() => setShowSchemaModal(false)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#F1F5F9] border-b border-slate-200 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Database className="w-5 h-5 text-[#1D4ED8]" />
                <div>
                  <h2 className="font-bold text-sm text-slate-900">
                    โครงสร้างฐานข้อมูล Firebase Cloud Firestore (15 Collections)
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    ซิงค์ข้อมูลเรียลไทม์ 100% พร้อมตรวจสอบเกณฑ์ภาษี 1% ระดับฐานข้อมูล
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSchemaModal(false)}
                className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl hover:bg-white text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {FIRESTORE_SCHEMA_SUMMARY.map((schema) => (
                <div
                  key={schema.collection}
                  className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 truncate">
                      {schema.thaiName}
                    </span>
                    <span className="font-mono text-[10px] font-bold bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] px-2 py-0.5 rounded-md shrink-0">
                      {collectionCounts[schema.collection] ?? 0}
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-[#C2410C] font-semibold">
                    /{schema.collection} (Key: {schema.keyField})
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono leading-relaxed break-words">
                    {schema.fields.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Body with Skeleton Loading */}
      {isLoadingData ? (
        <SkeletonDashboard />
      ) : (
        <>
          {activeTab === 'dashboard' && (
            <DashboardView
              jobs={state.jobs}
              expenses={state.expenses}
              invoices={state.invoices}
              receipts={state.receipts}
              drivers={state.drivers}
              vehicles={state.vehicles}
              customers={state.customers}
              onNavigate={handleDashboardNavigate}
              onQuickAddExpense={handleQuickAddExpense}
            />
          )}

          {(activeTab === 'expenses' || activeTab === 'driver_expenses') && (
            <ExpensesView
              expenses={state.expenses}
              vehicles={state.vehicles}
              drivers={state.drivers}
              jobs={state.jobs}
              initialCategoryFilter={
                activeTab === 'driver_expenses' ? 'driver' : 'all'
              }
              openAddSignal={openAddExpenseSignal}
              onSaveExpense={(exp) =>
                runDbAction(() => fbSaveExpense(exp, actorUid), 'ค่าใช้จ่ายรายวัน', true)
              }
              onDeleteExpense={(id) =>
                runDbAction(() => fbDeleteExpense(id), 'ลบค่าใช้จ่ายรายวัน', true)
              }
            />
          )}

          {(activeTab === 'tax_report' || activeTab === 'expense_summary') && (
            <TaxReportView
              expenses={state.expenses}
              drivers={state.drivers}
              initialMode={activeTab === 'expense_summary' ? 'summary' : 'tax'}
            />
          )}

          {activeTab === 'jobs' && (
            <JobsView
              jobs={state.jobs}
              customers={state.customers}
              drivers={state.drivers}
              vehicles={state.vehicles}
              expenses={state.expenses}
              onSaveJob={(job) => runDbAction(() => fbSaveJob(job, actorUid), 'งานขนส่ง')}
              onDeleteJob={(jobNo) =>
                runDbAction(() => fbDeleteJob(jobNo), 'ลบงานขนส่ง')
              }
            />
          )}

          {activeTab === 'partner_payout' && (
            <PartnerPaymentView
              paymentDocs={state.partnerPaymentDocs}
              jobs={state.jobs}
              vehicles={state.vehicles}
              drivers={state.drivers}
              onSavePaymentDoc={(docData) =>
                runDbAction(
                  () => fbSaveSubcontractorPaymentDoc(docData, actorUid),
                  'เอกสารทำจ่ายรถร่วม'
                )
              }
              onDeletePaymentDoc={(id) =>
                runDbAction(
                  () => fbDeleteSubcontractorPaymentDoc(id),
                  'ลบเอกสารทำจ่ายรถร่วม'
                )
              }
            />
          )}

          {activeTab === 'invoices' && (
            <InvoicesView
              invoices={state.invoices}
              customers={state.customers}
              jobs={state.jobs}
              taxRules={effectiveTaxRules}
              onOpenTaxRules={() => setShowTaxRulesModal(true)}
              onSaveInvoice={(invoice) =>
                runDbAction(() => fbSaveInvoice(invoice, actorUid), 'ใบแจ้งหนี้')
              }
              onDeleteInvoice={(invNo) =>
                runDbAction(() => fbDeleteInvoice(invNo), 'ลบใบแจ้งหนี้')
              }
            />
          )}

          {activeTab === 'receipts' && (
            <ReceiptsView
              receipts={state.receipts}
              invoices={state.invoices}
              customers={state.customers}
              taxRules={effectiveTaxRules}
              onOpenTaxRules={() => setShowTaxRulesModal(true)}
              onSaveReceipt={(receipt) =>
                runDbAction(() => fbSaveReceipt(receipt, actorUid), 'ใบเสร็จรับเงิน')
              }
              onDeleteReceipt={(recNo) => {
                const rec = state.receipts.find((r) => r.receiptNo === recNo);
                const linkedInvoiceNos = rec
                  ? rec.invoiceNo
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                  : [];
                runDbAction(
                  () => fbDeleteReceipt(recNo, linkedInvoiceNos),
                  'ลบใบเสร็จรับเงิน'
                );
              }}
            />
          )}

          {(activeTab === 'registry' || activeTab === 'employees') && (
            <RegistryView
              customers={state.customers}
              drivers={state.drivers}
              vehicles={state.vehicles}
              employees={state.employees}
              initialTab={activeTab === 'employees' ? 'employees' : 'customers'}
              onSaveCustomer={(cust) => {
                const oldCustomer =
                  state.customers.find((c) => c.id === cust.id) || null;
                runDbAction(async () => {
                  await fbSaveCustomer(cust, actorUid);
                  await fbSyncCustomerNameCascade(cust, oldCustomer, state, actorUid);
                }, 'ข้อมูลลูกค้า');
              }}
              onDeleteCustomer={(id) =>
                runDbAction(() => fbDeleteCustomer(id), 'ลบข้อมูลลูกค้า')
              }
              onSaveDriver={(drv) =>
                runDbAction(async () => {
                  if (drv.vehicleLicense) {
                    const matchedVeh = state.vehicles.find(
                      (v) => v.licensePlate === drv.vehicleLicense
                    );
                    if (matchedVeh) {
                      await fbSaveVehicle(matchedVeh, actorUid);
                    }
                  }
                  await fbSaveDriver(drv, actorUid);
                }, 'ข้อมูลคนขับรถ')
              }
              onDeleteDriver={(id) =>
                runDbAction(() => fbDeleteDriver(id), 'ลบข้อมูลคนขับรถ')
              }
              onSaveVehicle={(veh) =>
                runDbAction(() => fbSaveVehicle(veh, actorUid), 'ข้อมูลรถขนส่ง')
              }
              onDeleteVehicle={(plate) =>
                runDbAction(() => fbDeleteVehicle(plate), 'ลบข้อมูลรถขนส่ง')
              }
              onSaveEmployee={(emp) =>
                runDbAction(() => fbSaveEmployee(emp, actorUid), 'ข้อมูลพนักงาน')
              }
              onDeleteEmployee={(id) =>
                runDbAction(() => fbDeleteEmployee(id), 'ลบข้อมูลพนักงาน')
              }
            />
          )}

          {(activeTab === 'finance' || activeTab === 'payroll') && (
            <FinanceView
              partnerPayments={state.partnerPayments}
              withholdingTaxes={state.withholdingTaxes}
              payroll={state.payroll}
              invoices={state.invoices}
              expenses={state.expenses}
              drivers={state.drivers}
              employees={state.employees}
              initialTab={activeTab === 'payroll' ? 'payroll' : 'partners'}
              onSavePartnerPayment={(ppm) =>
                runDbAction(() => fbSavePartnerPayment(ppm, actorUid), 'จ่ายรถร่วม')
              }
              onDeletePartnerPayment={(id) =>
                runDbAction(
                  () => fbDeletePartnerPayment(id),
                  'ลบรายการจ่ายรถร่วม'
                )
              }
              onSaveWithholdingTax={(wht) =>
                runDbAction(
                  () => fbSaveWithholdingTax(wht, actorUid),
                  'ภาษีหัก ณ ที่จ่าย'
                )
              }
              onDeleteWithholdingTax={(id) =>
                runDbAction(
                  () => fbDeleteWithholdingTax(id),
                  'ลบภาษีหัก ณ ที่จ่าย'
                )
              }
              onSavePayroll={(pr) =>
                runDbAction(() => fbSavePayroll(pr, actorUid), 'สลิปเงินเดือน')
              }
              onDeletePayroll={(id) =>
                runDbAction(() => fbDeletePayroll(id), 'ลบสลิปเงินเดือน')
              }
            />
          )}

          {activeTab === 'manager_entry' && (
            <ManagerEntryView
              entries={state.managerEntries}
              onSaveEntry={(entry) =>
                runDbAction(
                  () => fbSaveManagerEntry(entry, actorUid),
                  'รายรับ-รายจ่ายผู้จัดการ'
                )
              }
              onDeleteEntry={(id) =>
                runDbAction(
                  () => fbDeleteManagerEntry(id),
                  'ลบรายรับ-รายจ่ายผู้จัดการ'
                )
              }
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              jobs={state.jobs}
              expenses={state.expenses}
              vehicles={state.vehicles}
              drivers={state.drivers}
              customers={state.customers}
              managerEntries={state.managerEntries}
              partnerPaymentDocs={state.partnerPaymentDocs}
            />
          )}

          {activeTab === 'backup_migration' && (
            <BackupMigrationView state={state} actorUid={actorUid} />
          )}

          {activeTab === 'manual' && <ManualView />}
        </>
      )}

      {/* Configurable Document Withholding Tax Rules Modal */}
      <TaxRulesModal
        open={showTaxRulesModal}
        rules={state.taxRules}
        onClose={() => setShowTaxRulesModal(false)}
        onSaveRule={(rule) =>
          runDbAction(() => fbSaveTaxRule(rule, actorUid), 'เกณฑ์ภาษีหัก ณ ที่จ่าย', true)
        }
        onDeleteRule={(id) =>
          runDbAction(() => fbDeleteTaxRule(id), 'ลบเกณฑ์ภาษีหัก ณ ที่จ่าย', true)
        }
        onResetDefaults={() =>
          runDbAction(
            () => fbResetDefaultTaxRules(state.taxRules, actorUid),
            'รีเซ็ตเกณฑ์ภาษีเริ่มต้น',
            true
          )
        }
      />
    </LayoutShell>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppWorkspace />
    </ToastProvider>
  );
}
