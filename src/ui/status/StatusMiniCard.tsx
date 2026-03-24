import type { ReactNode } from 'react';

type StatusMiniCardProps = {
  title: string;
  urgent?: boolean;
  positive?: boolean;
  children: ReactNode;
};

export function StatusMiniCard({ title, urgent = false, positive = false, children }: StatusMiniCardProps) {
  return (
    <section
      className={`statusScreenCardBase statusTroubleshootingCard ${urgent ? 'statusTroubleshootingCard--urgent' : ''} ${positive ? 'statusTroubleshootingCard--positive' : ''}`}
    >
      <h3 className="statusTroubleshootingCardTitle">{title}</h3>
      <div className="statusTroubleshootingCardBody">{children}</div>
    </section>
  );
}
