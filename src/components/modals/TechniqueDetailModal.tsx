import { InkIcon } from '../../ui/icons/InkIcon';

interface TechniqueDetailModalProps {
  iconKey?: 'technique_generic';
}

export function TechniqueDetailModal({ iconKey = 'technique_generic' }: TechniqueDetailModalProps) {
  return (
    <div className="rounded-lg border border-amber-200/60 bg-stone-50/95 p-4">
      <div className="flex items-center gap-2 text-stone-800">
        <InkIcon icon={iconKey} className="h-5 w-5" />
        <span className="font-semibold">Technique Detail</span>
      </div>
    </div>
  );
}
