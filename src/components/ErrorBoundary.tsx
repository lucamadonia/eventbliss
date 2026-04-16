import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, ChevronDown, Copy, Check } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  copied: boolean;
  detailsOpen: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, copied: false, detailsOpen: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private copyDiagnostics = async () => {
    const { error, errorInfo } = this.state;
    const diagnostics = [
      `EventBliss Error Report`,
      `Time: ${new Date().toISOString()}`,
      `URL: ${typeof window !== "undefined" ? window.location.href : "n/a"}`,
      `UA: ${typeof navigator !== "undefined" ? navigator.userAgent : "n/a"}`,
      ``,
      `Message: ${error?.message ?? "n/a"}`,
      ``,
      `Stack:`,
      error?.stack ?? "n/a",
      ``,
      `Component Stack:`,
      errorInfo?.componentStack ?? "n/a",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(diagnostics);
      this.setState({ copied: true });
      window.setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {
      /* ignore */
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const { error, copied, detailsOpen } = this.state;
      const message = error?.message ?? "Unknown error";

      return (
        <div className="dark min-h-screen bg-gradient-to-br from-[#0a0118] via-[#140424] to-[#0a0118] text-white flex items-center justify-center p-4 overflow-hidden relative">
          {/* Ambient glows */}
          <div className="pointer-events-none absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-violet-600/10 blur-[120px] rounded-full" />
          <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-pink-600/10 blur-[120px] rounded-full" />

          <div className="relative w-full max-w-lg">
            {/* Floating icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-600 blur-2xl opacity-40 animate-pulse" />
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-[0_20px_48px_rgba(239,68,68,0.35)]">
                  <AlertTriangle className="w-10 h-10 text-white" strokeWidth={2.5} />
                </div>
              </div>
            </div>

            {/* Card */}
            <div className="relative bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl shadow-black/50 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/70 to-transparent" />

              <div className="p-8 md:p-10">
                <h1 className="text-3xl md:text-4xl font-black text-center mb-2 leading-tight">
                  Oops — da ist was schief gelaufen
                </h1>
                <p className="text-white/70 text-center mb-8 leading-relaxed">
                  Ein unerwarteter Fehler hat die Party kurz unterbrochen. Versuch's einmal neu
                  — in fast allen Fällen reicht ein Reload.
                </p>

                {/* Primary actions */}
                <div className="grid sm:grid-cols-2 gap-3 mb-6">
                  <button
                    onClick={() => window.location.reload()}
                    className="group flex items-center justify-center gap-2 h-12 rounded-xl bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 hover:shadow-[0_12px_32px_rgba(236,72,153,0.45)] transition-all text-white font-bold cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                    Neu laden
                  </button>
                  <button
                    onClick={() => (window.location.href = "/")}
                    className="flex items-center justify-center gap-2 h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 transition-all text-white font-semibold cursor-pointer"
                  >
                    <Home className="w-4 h-4" />
                    Zur Startseite
                  </button>
                </div>

                {/* Secondary action: copy diagnostics */}
                <div className="flex items-center justify-center">
                  <button
                    onClick={this.copyDiagnostics}
                    className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Diagnose kopiert</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Fehler-Diagnose kopieren</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Collapsible details */}
                {error && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <button
                      onClick={() => this.setState({ detailsOpen: !detailsOpen })}
                      className="flex items-center gap-2 text-xs text-white/50 hover:text-white/80 transition-colors mx-auto cursor-pointer"
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${detailsOpen ? "rotate-180" : ""}`} />
                      <span>Technische Details {detailsOpen ? "ausblenden" : "anzeigen"}</span>
                    </button>
                    {detailsOpen && (
                      <div className="mt-4 rounded-lg bg-black/30 border border-red-500/20 p-3 font-mono text-[11px] text-red-300 max-h-48 overflow-auto">
                        <div className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Message</div>
                        <div className="mb-3 whitespace-pre-wrap break-words">{message}</div>
                        {error.stack && (
                          <>
                            <div className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Stack</div>
                            <pre className="whitespace-pre-wrap break-words opacity-70">{error.stack.split("\n").slice(0, 6).join("\n")}</pre>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-r from-transparent via-white/[0.02] to-transparent px-8 py-4 border-t border-white/5 text-center">
                <p className="text-[11px] text-white/40">
                  Wenn der Fehler wiederholt auftritt, schreib uns an{" "}
                  <a href="mailto:support@event-bliss.com" className="text-violet-300 hover:text-violet-200 font-semibold">
                    support@event-bliss.com
                  </a>{" "}
                  — die kopierte Diagnose hilft uns beim schnellen Fix.
                </p>
              </div>
            </div>

            <div className="text-center mt-6">
              <a
                href="/"
                className="text-xs text-white/30 hover:text-white/60 transition-colors inline-flex items-center gap-1"
              >
                EventBliss · event-bliss.com
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
