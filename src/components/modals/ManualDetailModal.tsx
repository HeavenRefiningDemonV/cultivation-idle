import { resolveManualIcon } from '../../features/manuals/manualIconMap';
import { InkIcon } from '../../ui/icons/InkIcon';

interface ManualDetailModalProps {
  iconKey?: string | null;
}

export function ManualDetailModal({ iconKey }: ManualDetailModalProps) {
  return (
    <div className="rounded-lg border border-amber-200/60 bg-stone-50/95 p-4">
      <div className="flex items-center gap-2 text-stone-800">
        <InkIcon icon={resolveManualIcon(iconKey)} className="h-5 w-5" />
        <span className="font-semibold">Manual Detail</span>
      </div>
    </div>
  );
}
