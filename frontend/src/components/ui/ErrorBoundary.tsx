import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import NeuButton from './NeuButton';
import NeuCard from './NeuCard';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('VeriTrust UI ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/chat';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <NeuCard className="max-w-md w-full p-8 text-center space-y-5 border border-rose-200 bg-white/90 shadow-xl rounded-3xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner">
              <AlertTriangle size={28} />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {this.props.fallbackTitle || 'Component Encountered an Issue'}
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                The guardrail interface intercepted a rendering error and kept the rest of the application running safely.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-mono text-left overflow-auto max-h-24 border border-slate-200">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <NeuButton variant="subtle" size="sm" onClick={this.handleGoHome}>
                <Home size={14} />
                <span>Return to Chat</span>
              </NeuButton>
              <NeuButton variant="accent" size="sm" onClick={this.handleReset}>
                <RefreshCw size={14} />
                <span>Reload Page</span>
              </NeuButton>
            </div>
          </NeuCard>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
