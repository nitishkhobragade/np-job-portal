"use client";

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertCircle, RefreshCw, MessageSquare, ShieldCheck } from 'lucide-react';

interface ToolErrorBannerProps {
  toolName: string;
  errorMessage: string;
  onRetry?: () => void;
  className?: string;
}

export const ToolErrorBanner: React.FC<ToolErrorBannerProps> = ({
  toolName,
  errorMessage,
  onRetry,
  className = '',
}) => {
  const supportPhone = '8982324497';
  const cleanPhone = supportPhone.replace(/\D/g, '');
  const messageText = `नमस्ते, मुझे NP Job Portal के [${toolName}] में यह समस्या आ रही है:\n\nत्रुटि विवरण: ${errorMessage}\n\nकृपया सहायता करें।`;
  const whatsappUrl = `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encodeURIComponent(messageText)}`;

  return (
    <div className={`p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-950 space-y-3 shadow-xs ${className}`}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-black text-rose-900 leading-tight">
            फाइल प्रोसेस करने में समस्या आई
          </h4>
          <p className="text-xs text-rose-800 font-medium mt-1 leading-relaxed">
            {errorMessage || 'फाइल का फॉर्मेट या साइज़ सपोर्ट नहीं कर रहा है अथवा मेमोरी लिमिट हो गई है।'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-rose-200/80">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-rose-300 hover:bg-rose-100/60 text-rose-900 font-bold text-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-rose-600" />
            <span>पुनः प्रयास करें (Retry)</span>
          </button>
        )}

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition-all active:scale-95 cursor-pointer ml-auto"
        >
          <MessageSquare className="w-3.5 h-3.5 text-white" />
          <span>📲 WhatsApp पर सहायता प्राप्त करें (Report Error)</span>
        </a>
      </div>

      <div className="text-[10px] text-rose-600 flex items-center gap-1">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
        <span>आपकी फाइलें सुरक्षित हैं — कोई भी फाइल हमारे सर्वर पर अपलोड नहीं हुई।</span>
      </div>
    </div>
  );
};

interface ErrorBoundaryProps {
  children: ReactNode;
  toolName: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ToolErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ToolErrorBoundary caught error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 sm:p-6 bg-white rounded-2xl border border-neutral-200 shadow-sm my-4">
          <ToolErrorBanner
            toolName={this.props.toolName}
            errorMessage={this.state.error?.message || 'अज्ञात त्रुटि उत्पन्न हुई'}
            onRetry={this.handleRetry}
          />
        </div>
      );
    }
    return this.props.children;
  }
}
