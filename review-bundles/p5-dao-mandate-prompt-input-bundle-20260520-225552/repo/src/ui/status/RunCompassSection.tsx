import type { ReactNode } from 'react';

interface RunCompassSectionProps {
  title: string;
  children: ReactNode;
}

export function RunCompassSection({ title, children }: RunCompassSectionProps) {
  return (
    <section className="runCompassSection">
      <div className="runCompassSection__title">{title}</div>
      <div className="runCompassSection__body">{children}</div>
    </section>
  );
}
