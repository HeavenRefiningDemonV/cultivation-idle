import type { ReactNode } from 'react';
import classNames from 'classnames';

type StatusMiniCardProps = {
  title: string;
  urgent?: boolean;
  positive?: boolean;
  className?: string;
  children: ReactNode;
};

export function StatusMiniCard({ title, urgent = false, positive = false, className, children }: StatusMiniCardProps) {
  return (
    <section
      className={classNames(
        'statusScreenCardBase',
        'statusTroubleshootingCard',
        {
          'statusTroubleshootingCard--urgent': urgent,
          'statusTroubleshootingCard--positive': positive,
        },
        className,
      )}
    >
      <h3 className="statusTroubleshootingCardTitle">{title}</h3>
      <div className="statusTroubleshootingCardBody">{children}</div>
    </section>
  );
}
