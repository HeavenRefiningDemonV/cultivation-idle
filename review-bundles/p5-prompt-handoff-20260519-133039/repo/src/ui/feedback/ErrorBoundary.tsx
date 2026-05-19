import type { ReactNode } from 'react';
import { Component } from 'react';

export type ErrorBoundaryProps = {
  children: ReactNode;
  onReset?: () => void;
  fallback?: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  handleReset = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="forgeWorkshop__error">
            <div className="forgeWorkshop__errorTitle">Forge minigame crashed.</div>
            <div className="forgeWorkshop__errorBody">Return to workshop and try again.</div>
            <button type="button" className="worldScreenModuleButton" onClick={this.handleReset}>
              Return to workshop
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
