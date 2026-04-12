import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Etwas ist schiefgelaufen</h1>
            <p className="text-muted-foreground mb-4">
              Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.
            </p>
            {this.state.error && (
              <details className="mb-4 text-left">
                <summary className="text-xs text-muted-foreground cursor-pointer">Fehler-Details</summary>
                <pre className="mt-2 p-3 rounded bg-muted text-xs overflow-auto max-h-32 text-red-400">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
              >
                Neu laden
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="px-4 py-2 border border-input rounded-md hover:bg-accent"
              >
                Zur Startseite
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
