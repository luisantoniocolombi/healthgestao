import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error.message);
    console.error("Component stack:", errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-6">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold text-foreground">Algo deu errado</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Ocorreu um erro inesperado. Tente voltar à página anterior ou recarregar.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => window.history.back()}>
              Voltar
            </Button>
            <Button onClick={() => window.location.reload()}>
              Recarregar
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
