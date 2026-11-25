import React from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  declare props: ErrorBoundaryProps;
  state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error?.message || 'เกิดข้อผิดพลาดที่ไม่คาดคิด' };
  }

  componentDidCatch(error: Error) {
    console.error('Application ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h2 className="text-base font-bold">เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล</h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed break-words bg-slate-900/70 p-3 rounded-xl border border-slate-700 font-mono">
              {this.state.errorMessage}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-colors"
            >
              <RotateCw className="w-4 h-4" /> โหลดหน้าใหม่
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
