import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  AlertTriangle,
  Inbox,
} from 'lucide-react';

// ==========================================
// Pastel Accent Palette Map (AdminLTE 5 Soft Pastel)
// ==========================================
export type PastelTone = 'blue' | 'green' | 'orange' | 'purple' | 'pink' | 'slate';

export const PASTEL_TONES: Record<
  PastelTone,
  {
    bg: string;
    bgHover: string;
    border: string;
    text: string;
    iconBg: string;
    iconText: string;
    barColor: string;
    ring: string;
    activeIndicator: string;
  }
> = {
  blue: {
    bg: 'bg-[#EFF6FF]',
    bgHover: 'hover:bg-[#DBEAFE]',
    border: 'border-[#BFDBFE]',
    text: 'text-[#1D4ED8]',
    iconBg: 'bg-[#E0F2FE]',
    iconText: 'text-[#0369A1]',
    barColor: '#60A5FA',
    ring: 'focus:ring-blue-200',
    activeIndicator: 'bg-[#3B82F6]',
  },
  green: {
    bg: 'bg-[#ECFDF5]',
    bgHover: 'hover:bg-[#D1FAE5]',
    border: 'border-[#A7F3D0]',
    text: 'text-[#047857]',
    iconBg: 'bg-[#D1FAE5]',
    iconText: 'text-[#047857]',
    barColor: '#34D399',
    ring: 'focus:ring-emerald-200',
    activeIndicator: 'bg-[#10B981]',
  },
  orange: {
    bg: 'bg-[#FFF7ED]',
    bgHover: 'hover:bg-[#FFEDD5]',
    border: 'border-[#FED7AA]',
    text: 'text-[#C2410C]',
    iconBg: 'bg-[#FFEDD5]',
    iconText: 'text-[#C2410C]',
    barColor: '#FB923C',
    ring: 'focus:ring-orange-200',
    activeIndicator: 'bg-[#F97316]',
  },
  purple: {
    bg: 'bg-[#F5F3FF]',
    bgHover: 'hover:bg-[#EDE9FE]',
    border: 'border-[#DDD6FE]',
    text: 'text-[#6D28D9]',
    iconBg: 'bg-[#EDE9FE]',
    iconText: 'text-[#6D28D9]',
    barColor: '#A78BFA',
    ring: 'focus:ring-purple-200',
    activeIndicator: 'bg-[#8B5CF6]',
  },
  pink: {
    bg: 'bg-[#FDF2F8]',
    bgHover: 'hover:bg-[#FCE7F3]',
    border: 'border-[#FBCFE8]',
    text: 'text-[#BE185D]',
    iconBg: 'bg-[#FCE7F3]',
    iconText: 'text-[#BE185D]',
    barColor: '#F472B6',
    ring: 'focus:ring-pink-200',
    activeIndicator: 'bg-[#EC4899]',
  },
  slate: {
    bg: 'bg-[#F1F5F9]',
    bgHover: 'hover:bg-[#E2E8F0]',
    border: 'border-[#CBD5E1]',
    text: 'text-[#334155]',
    iconBg: 'bg-[#E2E8F0]',
    iconText: 'text-[#475569]',
    barColor: '#94A3B8',
    ring: 'focus:ring-slate-200',
    activeIndicator: 'bg-[#64748B]',
  },
};

// ==========================================
// Toast Notification System
// ==========================================
export type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev.slice(-3), { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const dismiss = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 left-4 sm:left-auto z-[100] flex flex-col gap-2.5 sm:w-96 pointer-events-none no-print"
      >
        {toasts.map((t) => {
          const styles =
            t.variant === 'success'
              ? 'bg-white border-emerald-200 text-slate-800 shadow-lg shadow-emerald-900/5'
              : t.variant === 'error'
                ? 'bg-white border-rose-200 text-slate-800 shadow-lg shadow-rose-900/5'
                : 'bg-white border-sky-200 text-slate-800 shadow-lg shadow-sky-900/5';

          const iconWrap =
            t.variant === 'success'
              ? 'bg-emerald-50 text-emerald-600'
              : t.variant === 'error'
                ? 'bg-rose-50 text-rose-600'
                : 'bg-sky-50 text-sky-600';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border ${styles} transition-all`}
            >
              <div className={`p-1.5 rounded-xl shrink-0 ${iconWrap}`}>
                {t.variant === 'success' && <CheckCircle2 className="w-4 h-4" />}
                {t.variant === 'error' && <AlertCircle className="w-4 h-4" />}
                {t.variant === 'info' && <Info className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-xs font-semibold leading-snug text-slate-800 break-words">
                  {t.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors shrink-0"
                aria-label="ปิดการแจ้งเตือน"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// ==========================================
// Confirm Dialog Component (No window.confirm)
// ==========================================
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'ยืนยันการลบ',
  cancelLabel = 'ยกเลิก',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4 no-print">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              variant === 'danger'
                ? 'bg-rose-50 text-rose-600'
                : 'bg-sky-50 text-sky-600'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[40px] px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-white text-xs font-semibold transition-colors ${
              variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-sky-600 hover:bg-sky-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Pastel Stat Card with optional Mini Bar Chart
// ==========================================
interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  tone: PastelTone;
  icon: React.ReactNode;
  miniSeries?: number[];
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  subtitle,
  tone,
  icon,
  miniSeries,
  onClick,
}: StatCardProps) {
  const palette = PASTEL_TONES[tone];
  const maxVal =
    miniSeries && miniSeries.length > 0 ? Math.max(...miniSeries, 1) : 1;

  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`w-full text-left bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs transition-all flex flex-col justify-between gap-3 ${
        onClick ? 'hover:border-slate-300 hover:shadow-sm cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 truncate">{title}</p>
          <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 tracking-tight truncate">
            {value}
          </p>
        </div>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${palette.iconBg} ${palette.iconText}`}
        >
          {icon}
        </div>
      </div>

      <div className="flex items-end justify-between gap-3 pt-1">
        {subtitle && (
          <p className="text-[11px] text-slate-500 truncate flex-1">{subtitle}</p>
        )}
        {miniSeries && miniSeries.length > 0 && (
          <div
            className="flex items-end gap-1 h-7 shrink-0"
            aria-hidden="true"
          >
            {miniSeries.map((v, idx) => {
              const pct = Math.max(16, Math.round((v / maxVal) * 100));
              return (
                <span
                  key={idx}
                  style={{
                    height: `${pct}%`,
                    backgroundColor: palette.barColor,
                    opacity: idx === miniSeries.length - 1 ? 1 : 0.45,
                  }}
                  className="w-1.5 rounded-t-sm transition-all"
                />
              );
            })}
          </div>
        )}
      </div>
    </Wrapper>
  );
}

// ==========================================
// Skeleton Loading View
// ==========================================
export function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-24 bg-white rounded-2xl border border-slate-200/70 p-5 flex items-center justify-between">
        <div className="space-y-2.5 w-2/3">
          <div className="h-4 bg-slate-200/80 rounded-lg w-48" />
          <div className="h-3 bg-slate-100 rounded-lg w-72 max-w-full" />
        </div>
        <div className="h-10 w-32 bg-slate-100 rounded-xl hidden sm:block" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="bg-white rounded-2xl border border-slate-200/70 p-5 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-slate-100 rounded w-24" />
                <div className="h-7 bg-slate-200/80 rounded w-32" />
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100" />
            </div>
            <div className="h-3 bg-slate-100 rounded w-2/3" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 p-5 space-y-3">
        <div className="h-4 bg-slate-200/80 rounded w-44" />
        {[1, 2, 3, 4].map((row) => (
          <div key={row} className="h-11 bg-slate-50 rounded-xl w-full" />
        ))}
      </div>
    </div>
  );
}

// ==========================================
// Empty State Component
// ==========================================
interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div className="py-12 px-6 flex flex-col items-center justify-center text-center space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <div className="space-y-1 max-w-sm">
        <p className="text-sm font-bold text-slate-800">{title}</p>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 min-h-[40px] px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
