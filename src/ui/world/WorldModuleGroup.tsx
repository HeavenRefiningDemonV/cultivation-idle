import type { ReactNode } from 'react';

export function WorldModuleGroup(props: {
  title: string;
  children: ReactNode;
}) {
  const { title, children } = props;
  return (
    <section className="worldModuleGroup">
      <h3 className="worldModuleGroup__title">{title}</h3>
      <div className="worldModuleGroup__grid">{children}</div>
    </section>
  );
}
