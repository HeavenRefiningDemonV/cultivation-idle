import type { ReactNode } from 'react';

export function WorldModuleGroup(props: {
  title: string;
  children: ReactNode;
  variant?: 'default' | 'support-rail';
}) {
  const { title, children, variant = 'default' } = props;
  return (
    <section className={`worldModuleGroup ${variant === 'support-rail' ? 'worldModuleGroup--supportRail' : ''}`}>
      <h3 className="worldModuleGroup__title">{title}</h3>
      <div className="worldModuleGroup__grid">{children}</div>
    </section>
  );
}
