import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      const isChunkError = this.state.error?.name === 'ChunkLoadError' || 
                           this.state.error?.message?.includes('Loading chunk') || 
                           this.state.error?.message?.includes('Failed to fetch dynamically imported module');

      return (
        <div className="min-h-screen bg-[#050b18] text-slate-200 flex flex-col items-center justify-center p-6 text-center font-sans relative overflow-hidden">
          {/* Ambient background glows */}
          <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-[#a78bfa]/10 blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full bg-[#a78bfa]/10 blur-[120px] pointer-events-none"></div>

          <div className="max-w-md bg-[#0f172a]/80 backdrop-blur-md p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6 z-10 relative">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(244,63,94,0.15)]">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-extrabold text-white">Oops! Algo deu errado</h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isChunkError 
                  ? 'Uma nova versão do sistema foi lançada ou sua conexão oscilou. Recarregue a página para continuar.'
                  : 'Ocorreu um erro inesperado ao renderizar esta página. Por favor, tente recarregar.'
                }
              </p>
            </div>

            {/* Error info detail box */}
            <details className="text-left bg-black/40 border border-slate-900 rounded-xl p-3 text-[10px] text-slate-500 font-mono overflow-auto max-h-[120px] cursor-pointer">
              <summary className="font-semibold text-slate-400 select-none">Detalhes do erro</summary>
              <p className="mt-2 whitespace-pre-wrap">{this.state.error?.toString()}</p>
            </details>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-[#a78bfa] to-[#c4b5fd] hover:from-[#c4b5fd] hover:to-[#ddd6fe] text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-[#a78bfa]/20 hover:shadow-[#a78bfa]/30"
              >
                <RefreshCw className="w-4 h-4" />
                Recarregar Página
              </button>
              <button
                onClick={this.handleGoHome}
                className="w-full py-3.5 px-6 bg-slate-950/40 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Ir para o Início
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
