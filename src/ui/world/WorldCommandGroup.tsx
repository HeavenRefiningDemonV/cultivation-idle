import type { ReactNode } from 'react';

export function WorldCommandGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="worldCommandGroup">
      <h3 className="worldCommandGroupTitle">{title}</h3>
      <div className="worldCommandGroupGrid">{children}</div>
    </section>
  );
}
