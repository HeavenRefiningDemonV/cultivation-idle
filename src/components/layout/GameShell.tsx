import type { ReactNode } from 'react';
import './GameShell.css';

type GameShellProps = {
  children: ReactNode;
};

export function GameShell({ children }: GameShellProps) {
  return (
    <div className="game-shell-root">
      <div className="game-shell-canvas">
        <div className="game-shell-foreground">{children}</div>
      </div>
    </div>
  );
}
