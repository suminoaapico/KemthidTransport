import React, { useState } from 'react';
import {
  LayoutDashboard,
  Receipt,
  PlusCircle,
  UserCheck,
  BarChart3,
  Percent,
  PieChart,
  Truck,
  FileText,
  CheckSquare,
  Users,
  Briefcase,
  CreditCard,
  Settings,
  Database,
  HelpCircle,
  LogOut,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  Plus,
  Wallet,
  Building2,
  HardDriveDownload,
} from 'lucide-react';
import { PASTEL_TONES, PastelTone } from './ui/DesignSystem';

export type AppTab =
  | 'dashboard'
  | 'expenses'
  | 'driver_expenses'
  | 'tax_report'
  | 'expense_summary'
  | 'jobs'
  | 'partner_payout'
  | 'invoices'
  | 'receipts'
  | 'registry'
  | 'employees'
  | 'finance'
  | 'payroll'
  | 'manager_entry'
  | 'reports'
  | 'backup_migration'
  | 'manual';

export interface NavItemConfig {
  id: AppTab | 'ACTION_ADD_EXPENSE' | 'ACTION_SCHEMA';
  label: string;
  shortLabel?: string;
  icon: React.ReactNode;
  tone: PastelTone;
  badge?: number;
}

export interface NavGroupConfig {
  id: string;
  label: string;
  tone: PastelTone;
  items: NavItemConfig[];
}

export const PAGE_TITLES: Record<AppTab, { title: string; group: string; tone: PastelTone }> = {
  dashboard: { title: 'แดชบอร์ดภาพรวม', group: 'ภาพรวม', tone: 'blue' },
  expenses: { title: 'รายการค่าใช้จ่าย', group: 'ค่าใช้จ่าย', tone: 'green' },
  driver_expenses: { title: 'รายการค่าใช้จ่ายคนขับรถ (หัก 1%)', group: 'คนขับรถ', tone: 'orange' },
  tax_report: { title: 'รายงานภาษีหัก ณ ที่จ่าย 1%', group: 'ภาษี', tone: 'pink' },
  expense_summary: { title: 'สรุปค่าใช้จ่ายแยกประเภท', group: 'รายงาน', tone: 'purple' },
  jobs: { title: 'แผนการวิ่งงานขนส่ง', group: 'ปฏิบัติการขนส่ง', tone: 'blue' },
  partner_payout: { title: 'เอกสารทำจ่ายรถร่วม', group: 'ปฏิบัติการขนส่ง', tone: 'orange' },
  invoices: { title: 'ใบแจ้งหนี้ / ใบวางบิล', group: 'เอกสารการเงิน', tone: 'blue' },
  receipts: { title: 'ใบเสร็จรับเงิน', group: 'เอกสารการเงิน', tone: 'green' },
  registry: { title: 'ทะเบียนฐานข้อมูล (4 ฐาน)', group: 'ทะเบียน & บุคลากร', tone: 'slate' },
  employees: { title: 'จัดการพนักงาน', group: 'ทะเบียน & บุคลากร', tone: 'slate' },
  finance: { title: 'การเงิน & ทะเบียนภาษี', group: 'การเงิน', tone: 'pink' },
  payroll: { title: 'สลิปเงินเดือนพนักงาน', group: 'ทะเบียน & บุคลากร', tone: 'green' },
  manager_entry: { title: 'บันทึกรายรับ-รายจ่าย (ผู้จัดการ)', group: 'รายงาน', tone: 'purple' },
  reports: { title: 'รายงานวิ่งงานแยกคัน & งบการเงิน', group: 'รายงาน', tone: 'purple' },
  backup_migration: { title: 'สำรอง & ย้ายข้อมูล (Supabase / Google Sheet)', group: 'ตั้งค่าระบบ', tone: 'blue' },
  manual: { title: 'คู่มือการใช้งานระบบ', group: 'ตั้งค่าระบบ', tone: 'slate' },
};

interface LayoutShellProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onQuickAddExpense: () => void;
  onToggleSchema: () => void;
  onLogout: () => void;
  userDisplayName: string;
  userEmail: string;
  userRole: 'admin' | 'staff' | 'manager';
  isAdminUser: boolean;
  workspaceMode: 'staff' | 'manager';
  onChangeWorkspaceMode: (mode: 'staff' | 'manager') => void;
  driverExpenseCount: number;
  totalExpenseCount: number;
  children: React.ReactNode;
}

export function LayoutShell({
  activeTab,
  onSelectTab,
  onQuickAddExpense,
  onToggleSchema,
  onLogout,
  userDisplayName,
  userEmail,
  userRole,
  isAdminUser,
  workspaceMode,
  onChangeWorkspaceMode,
  driverExpenseCount,
  totalExpenseCount,
  children,
}: LayoutShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const navGroups: NavGroupConfig[] =
    workspaceMode === 'manager'
      ? [
          {
            id: 'overview',
            label: 'ภาพรวมผู้บริหาร',
            tone: 'blue',
            items: [
              {
                id: 'dashboard',
                label: 'แดชบอร์ดภาพรวม',
                icon: <LayoutDashboard className="w-4 h-4" />,
                tone: 'blue',
              },
            ],
          },
          {
            id: 'manager_reports',
            label: 'รายงาน & ภาษี',
            tone: 'purple',
            items: [
              {
                id: 'reports',
                label: 'รายงานวิ่งงาน & งบการเงิน',
                icon: <BarChart3 className="w-4 h-4" />,
                tone: 'purple',
              },
              {
                id: 'tax_report',
                label: 'ภาษีหัก ณ ที่จ่าย 1%',
                icon: <Percent className="w-4 h-4" />,
                tone: 'pink',
                badge: driverExpenseCount,
              },
              {
                id: 'expense_summary',
                label: 'สรุปค่าใช้จ่าย',
                icon: <PieChart className="w-4 h-4" />,
                tone: 'purple',
              },
              {
                id: 'manager_entry',
                label: 'บันทึกรายรับ-รายจ่าย',
                icon: <Briefcase className="w-4 h-4" />,
                tone: 'purple',
              },
            ],
          },
          {
            id: 'manager_system',
            label: 'ตั้งค่า & สำรองข้อมูล',
            tone: 'slate',
            items: [
              {
                id: 'backup_migration',
                label: 'สำรอง & ย้ายข้อมูล',
                icon: <HardDriveDownload className="w-4 h-4" />,
                tone: 'blue',
              },
              {
                id: 'ACTION_SCHEMA',
                label: 'ฐานข้อมูล Firebase (14)',
                icon: <Database className="w-4 h-4" />,
                tone: 'slate',
              },
            ],
          },
        ]
      : [
          {
            id: 'overview',
            label: 'ภาพรวมระบบ',
            tone: 'blue',
            items: [
              {
                id: 'dashboard',
                label: 'Dashboard',
                icon: <LayoutDashboard className="w-4 h-4" />,
                tone: 'blue',
              },
            ],
          },
          {
            id: 'expenses_group',
            label: 'ค่าใช้จ่าย & คนขับรถ',
            tone: 'green',
            items: [
              {
                id: 'expenses',
                label: 'รายการค่าใช้จ่าย',
                icon: <Receipt className="w-4 h-4" />,
                tone: 'green',
                badge: totalExpenseCount,
              },
              {
                id: 'ACTION_ADD_EXPENSE',
                label: 'เพิ่มรายการ',
                icon: <PlusCircle className="w-4 h-4" />,
                tone: 'green',
              },
              {
                id: 'driver_expenses',
                label: 'รายการคนขับรถ (1%)',
                icon: <UserCheck className="w-4 h-4" />,
                tone: 'orange',
                badge: driverExpenseCount,
              },
            ],
          },
          {
            id: 'reports_tax',
            label: 'รายงาน & ภาษี',
            tone: 'purple',
            items: [
              {
                id: 'tax_report',
                label: 'ภาษีหัก ณ ที่จ่าย',
                icon: <Percent className="w-4 h-4" />,
                tone: 'pink',
              },
              {
                id: 'expense_summary',
                label: 'สรุปค่าใช้จ่าย',
                icon: <PieChart className="w-4 h-4" />,
                tone: 'purple',
              },
              {
                id: 'reports',
                label: 'รายงานวิ่งงานแยกคัน',
                icon: <BarChart3 className="w-4 h-4" />,
                tone: 'purple',
              },
              {
                id: 'manager_entry',
                label: 'รายรับ-จ่าย (ผู้จัดการ)',
                icon: <Briefcase className="w-4 h-4" />,
                tone: 'purple',
              },
            ],
          },
          {
            id: 'operations',
            label: 'ปฏิบัติการขนส่ง & บิล',
            tone: 'blue',
            items: [
              {
                id: 'jobs',
                label: 'แผนการวิ่งงาน',
                icon: <Truck className="w-4 h-4" />,
                tone: 'blue',
              },
              {
                id: 'partner_payout',
                label: 'ทำจ่ายรถร่วม',
                icon: <Wallet className="w-4 h-4" />,
                tone: 'orange',
              },
              {
                id: 'invoices',
                label: 'ออกใบแจ้งหนี้',
                icon: <FileText className="w-4 h-4" />,
                tone: 'blue',
              },
              {
                id: 'receipts',
                label: 'ใบเสร็จรับเงิน',
                icon: <CheckSquare className="w-4 h-4" />,
                tone: 'green',
              },
            ],
          },
          {
            id: 'registry_hr',
            label: 'ทะเบียน & การเงิน',
            tone: 'slate',
            items: [
              {
                id: 'registry',
                label: 'ทะเบียน (4 ฐาน)',
                icon: <Building2 className="w-4 h-4" />,
                tone: 'slate',
              },
              {
                id: 'employees',
                label: 'จัดการพนักงาน',
                icon: <Users className="w-4 h-4" />,
                tone: 'slate',
              },
              {
                id: 'finance',
                label: 'การเงิน & ทะเบียนภาษี',
                icon: <Settings className="w-4 h-4" />,
                tone: 'pink',
              },
              {
                id: 'payroll',
                label: 'สลิปเงินเดือน',
                icon: <CreditCard className="w-4 h-4" />,
                tone: 'green',
              },
            ],
          },
          {
            id: 'system',
            label: 'ตั้งค่าระบบ',
            tone: 'slate',
            items: [
              {
                id: 'backup_migration',
                label: 'สำรอง & ย้ายข้อมูล',
                icon: <HardDriveDownload className="w-4 h-4" />,
                tone: 'blue',
              },
              {
                id: 'ACTION_SCHEMA',
                label: 'ฐานข้อมูล Firebase (14)',
                icon: <Database className="w-4 h-4" />,
                tone: 'slate',
              },
              {
                id: 'manual',
                label: 'คู่มือใช้งาน',
                icon: <HelpCircle className="w-4 h-4" />,
                tone: 'slate',
              },
            ],
          },
        ];

  const handleNavClick = (item: NavItemConfig) => {
    setMobileMenuOpen(false);
    if (item.id === 'ACTION_ADD_EXPENSE') {
      onQuickAddExpense();
      return;
    }
    if (item.id === 'ACTION_SCHEMA') {
      onToggleSchema();
      return;
    }
    onSelectTab(item.id);
  };

  const currentMeta = PAGE_TITLES[activeTab] || PAGE_TITLES.dashboard;
  const currentTone = PASTEL_TONES[currentMeta.tone];

  const userInitial = (userDisplayName || userEmail || 'K').trim().charAt(0).toUpperCase();

  const roleLabel =
    userRole === 'manager'
      ? 'ฝ่ายผู้จัดการ (Manager)'
      : 'ฝ่ายพนักงาน (Staff)';

  // Mobile Bottom Nav items (5 primary destinations)
  const mobileBottomItems: {
    id: AppTab | 'MORE';
    label: string;
    icon: React.ReactNode;
    tone: PastelTone;
  }[] = [
    {
      id: 'dashboard',
      label: 'หน้าแรก',
      icon: <LayoutDashboard className="w-5 h-5" />,
      tone: 'blue',
    },
    {
      id: 'expenses',
      label: 'ค่าใช้จ่าย',
      icon: <Receipt className="w-5 h-5" />,
      tone: 'green',
    },
    {
      id: 'driver_expenses',
      label: 'คนขับรถ',
      icon: <UserCheck className="w-5 h-5" />,
      tone: 'orange',
    },
    {
      id: 'tax_report',
      label: 'รายงาน',
      icon: <Percent className="w-5 h-5" />,
      tone: 'pink',
    },
    {
      id: 'MORE',
      label: 'เพิ่มเติม',
      icon: <Menu className="w-5 h-5" />,
      tone: 'purple',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex">
      {/* ========================================== */}
      {/* DESKTOP LEFT SIDEBAR (AdminLTE 5 Pastel)   */}
      {/* ========================================== */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-slate-200/80 shrink-0 sticky top-0 h-screen transition-all duration-200 z-30 no-print ${
          sidebarCollapsed ? 'w-[78px]' : 'w-[268px]'
        }`}
      >
        {/* Brand Logo Header */}
        <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-3 min-w-0 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center shrink-0 overflow-hidden p-1">
              <img
                src="https://lh3.googleusercontent.com/d/14sHmuOzVEZbKgOZP5p7COS1rfXJvi5w_"
                alt="Khemthit Logo"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <span className="text-xs font-extrabold tracking-tight text-slate-900 block truncate">
                  KHEMTHIT TRANSPORT
                </span>
                <span className="text-[10px] font-medium text-slate-400 block truncate">
                  ระบบขนส่งและบัญชีภาษี 1%
                </span>
              </div>
            )}
          </button>
        </div>

        {/* User Profile Strip */}
        <div className="px-3 py-3 border-b border-slate-100 shrink-0">
          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl bg-slate-50/90 border border-slate-100 ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] font-bold text-xs flex items-center justify-center shrink-0">
              {userInitial}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {userDisplayName || userEmail}
                </p>
                <p className="text-[10px] text-slate-500 truncate">{roleLabel}</p>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Menu Groups */}
        <nav className="flex-1 overflow-y-auto sidebar-scroll px-3 py-3 space-y-4">
          {navGroups.map((group) => {
            const isGroupCollapsed = Boolean(collapsedGroups[group.id]);
            return (
              <div key={group.id} className="space-y-1">
                {!sidebarCollapsed && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <span>{group.label}</span>
                    {isGroupCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}

                {(!isGroupCollapsed || sidebarCollapsed) && (
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = item.id === activeTab;
                      const tone = PASTEL_TONES[item.tone];
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleNavClick(item)}
                          title={sidebarCollapsed ? item.label : undefined}
                          className={`w-full min-h-[40px] flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all relative ${
                            sidebarCollapsed ? 'justify-center' : 'justify-between'
                          } ${
                            isActive
                              ? `${tone.bg} ${tone.text} border ${tone.border}`
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                isActive
                                  ? `bg-white ${tone.iconText} shadow-2xs`
                                  : `${tone.iconBg} ${tone.iconText} opacity-85`
                              }`}
                            >
                              {item.icon}
                            </span>
                            {!sidebarCollapsed && (
                              <span className="truncate">{item.label}</span>
                            )}
                          </div>

                          {!sidebarCollapsed &&
                            typeof item.badge === 'number' &&
                            item.badge > 0 && (
                              <span
                                className={`text-[10px] font-mono font-bold tabular-nums px-1.5 py-0.5 rounded-md ${
                                  isActive
                                    ? 'bg-white/90 text-slate-800'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer: Switch Role / Logout */}
        <div className="p-3 border-t border-slate-100 shrink-0 space-y-1.5">
          <button
            type="button"
            onClick={onLogout}
            title="เปลี่ยนฝ่ายผู้ใช้งาน"
            className={`w-full min-h-[40px] flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>เปลี่ยนฝ่าย / ออก</span>}
          </button>
        </div>
      </aside>

      {/* ========================================== */}
      {/* RIGHT MAIN WORKSPACE (Header + Content)    */}
      {/* ========================================== */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Top Bar (Desktop + Compact Mobile Header) */}
        <header className="sticky top-0 z-20 h-14 lg:h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-6 flex items-center justify-between gap-3 no-print">
          {/* Left: Collapse Toggle (Desktop) or Brand Logo (Mobile) + Breadcrumb/Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarCollapsed((c) => !c)}
              className="hidden lg:flex w-9 h-9 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 items-center justify-center text-slate-500 hover:text-slate-800 transition-colors shrink-0"
              aria-label="พับหรือขยายแถบเมนู"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>

            <div className="lg:hidden w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center shrink-0 p-1">
              <img
                src="https://lh3.googleusercontent.com/d/14sHmuOzVEZbKgOZP5p7COS1rfXJvi5w_"
                alt="Logo"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="min-w-0">
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                <span>Khemthit Transport</span>
                <span>/</span>
                <span className={currentTone.text}>{currentMeta.group}</span>
              </div>
              <h1 className="text-sm lg:text-base font-bold text-slate-900 truncate leading-tight">
                {currentMeta.title}
              </h1>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {isAdminUser && (
              <div className="hidden md:inline-flex items-center bg-slate-100 border border-slate-200/80 rounded-xl p-0.5 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => onChangeWorkspaceMode('staff')}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                    workspaceMode === 'staff'
                      ? 'bg-white text-[#1D4ED8] shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ฝ่ายพนักงาน
                </button>
                <button
                  type="button"
                  onClick={() => onChangeWorkspaceMode('manager')}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                    workspaceMode === 'manager'
                      ? 'bg-white text-[#6D28D9] shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ฝ่ายผู้จัดการ
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onQuickAddExpense}
              className="hidden sm:inline-flex min-h-[38px] items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#047857] border border-[#A7F3D0] text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มรายการ</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600"
              aria-label="เปิดเมนูทั้งหมด"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 lg:px-6 py-5 pb-28 lg:pb-8">
          {children}
        </main>
      </div>

      {/* ========================================== */}
      {/* MOBILE FLOATING ACTION BUTTON (FAB)        */}
      {/* ========================================== */}
      <button
        type="button"
        onClick={onQuickAddExpense}
        className="lg:hidden fixed right-4 bottom-fab-offset z-40 min-h-[48px] px-4 rounded-2xl bg-[#047857] hover:bg-[#065F46] active:scale-[0.97] text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all no-print"
        aria-label="เพิ่มรายการค่าใช้จ่าย"
      >
        <Plus className="w-4 h-4" />
        <span>เพิ่มรายการ</span>
      </button>

      {/* ========================================== */}
      {/* MOBILE FIXED BOTTOM NAVIGATION BAR (< lg)  */}
      {/* ========================================== */}
      <nav
        aria-label="เมนูหลักมือถือ"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 pb-safe no-print"
      >
        <div className="grid grid-cols-5 h-16 items-center">
          {mobileBottomItems.map((item) => {
            const isActive =
              item.id === 'MORE'
                ? mobileMenuOpen
                : item.id === activeTab ||
                  (item.id === 'tax_report' &&
                    (activeTab === 'expense_summary' || activeTab === 'reports'));
            const tone = PASTEL_TONES[item.tone];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'MORE') {
                    setMobileMenuOpen(true);
                  } else {
                    setMobileMenuOpen(false);
                    onSelectTab(item.id);
                  }
                }}
                className="relative flex flex-col items-center justify-center h-full min-h-[44px] gap-0.5 transition-colors"
              >
                {isActive && (
                  <span
                    className={`absolute top-0 w-8 h-0.5 rounded-full ${tone.activeIndicator}`}
                  />
                )}
                <span
                  className={`p-1.5 rounded-xl transition-all ${
                    isActive
                      ? `${tone.bg} ${tone.text}`
                      : 'text-slate-400'
                  }`}
                >
                  {item.icon}
                </span>
                <span
                  className={`text-[10px] font-semibold tracking-tight leading-none ${
                    isActive ? tone.text : 'text-slate-500'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ========================================== */}
      {/* MOBILE FULL-MENU BOTTOM SHEET DRAWER       */}
      {/* ========================================== */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-[2px] flex items-end no-print"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="bg-white w-full max-h-[85vh] rounded-t-3xl border-t border-slate-200 shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle & Header */}
            <div className="pt-2.5 pb-3 px-5 border-b border-slate-100 shrink-0">
              <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] font-bold text-xs flex items-center justify-center shrink-0">
                    {userInitial}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {userDisplayName || userEmail}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{roleLabel}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-slate-100 text-slate-600"
                  aria-label="ปิดเมนู"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isAdminUser && (
                <div className="grid grid-cols-2 gap-2 mt-3 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      onChangeWorkspaceMode('staff');
                      setMobileMenuOpen(false);
                    }}
                    className={`min-h-[38px] rounded-lg transition-colors ${
                      workspaceMode === 'staff'
                        ? 'bg-white text-[#1D4ED8] shadow-2xs'
                        : 'text-slate-600'
                    }`}
                  >
                    โหมดปฏิบัติการ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onChangeWorkspaceMode('manager');
                      setMobileMenuOpen(false);
                    }}
                    className={`min-h-[38px] rounded-lg transition-colors ${
                      workspaceMode === 'manager'
                        ? 'bg-white text-[#6D28D9] shadow-2xs'
                        : 'text-slate-600'
                    }`}
                  >
                    โหมดผู้จัดการ
                  </button>
                </div>
              )}
            </div>

            {/* Scrollable All-Modules Grid */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-safe">
              {navGroups.map((group) => (
                <div key={group.id} className="space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    {group.label}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {group.items.map((item) => {
                      const isActive = item.id === activeTab;
                      const tone = PASTEL_TONES[item.tone];
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleNavClick(item)}
                          className={`min-h-[52px] px-3 py-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                            isActive
                              ? `${tone.bg} ${tone.text} ${tone.border}`
                              : 'bg-slate-50/70 border-slate-200/70 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              isActive
                                ? `bg-white ${tone.iconText}`
                                : `${tone.iconBg} ${tone.iconText}`
                            }`}
                          >
                            {item.icon}
                          </span>
                          <span className="text-xs font-semibold leading-tight line-clamp-2">
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full min-h-[46px] rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  ออกจากระบบ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
