import type { ReactNode } from 'react';
import './GameLayoutFxSeam.scss';

export interface GameLayoutFxSeamProps {
  children?: ReactNode;
}

export function GameLayoutFxSeam({ children }: GameLayoutFxSeamProps) {
  return (
    <div className="gameLayoutFxSeam" data-ui-fx-seam="screen-host">
      {children}
    </div>
  );
}
