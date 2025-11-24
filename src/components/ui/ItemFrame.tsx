import type { ReactNode } from 'react';
import { images } from '../../assets/images';

type ItemFrameProps = {
  children?: ReactNode;
};

export function ItemFrame({ children }: ItemFrameProps) {
  return (
    <div
      className="relative w-16 h-16 flex items-center justify-center"
      style={{
        backgroundImage: `url(${images.ui.frame})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      <div className="w-12 h-12 flex items-center justify-center">{children}</div>
    </div>
  );
}
