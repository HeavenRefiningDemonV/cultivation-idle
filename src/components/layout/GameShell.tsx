import type { ReactNode } from 'react';
import { images } from '../../assets/images';
import './GameShell.css';

type GameShellProps = {
  background?: string;
  children: ReactNode;
};

export function GameShell({ background, children }: GameShellProps) {
  const bg = background ?? images.backgrounds.cultivation;

  return (
    <div className="game-shell-root">
      <div className="game-shell-canvas">
        <img src={bg} alt="" className="game-shell-bg" />
        <div className="game-shell-foreground">{children}</div>
      </div>
    </div>
  );
}
