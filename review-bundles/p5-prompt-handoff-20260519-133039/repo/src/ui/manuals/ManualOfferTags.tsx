import type { ManualOfferTag } from '../../systems/manuals/manualOfferAnalysis.js';

export function ManualOfferTags(props: { tags: ManualOfferTag[] }) {
  const { tags } = props;
  return (
    <div className={`manualOfferTags${tags.length === 0 ? " manualOfferTags--empty" : ""}`}>
      {tags.map((tag) => (
        <span key={tag} className="manualOfferTags__tag">
          {tag}
        </span>
      ))}
    </div>
  );
}
