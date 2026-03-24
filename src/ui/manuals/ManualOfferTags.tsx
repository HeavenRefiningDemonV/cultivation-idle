import type { ManualOfferTag } from '../../systems/manuals/manualOfferAnalysis.js';

export function ManualOfferTags(props: { tags: ManualOfferTag[] }) {
  const { tags } = props;
  if (tags.length === 0) return null;
  return (
    <div className="manualOfferTags">
      {tags.map((tag) => (
        <span key={tag} className="manualOfferTags__tag">
          {tag}
        </span>
      ))}
    </div>
  );
}
