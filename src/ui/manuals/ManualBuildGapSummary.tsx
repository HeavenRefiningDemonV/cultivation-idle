export function ManualBuildGapSummary(props: {
  currentGapLine: string;
  usefulOffersLine: string;
  refreshCostLine: string;
  pityEpicLine: string;
  pityLegendaryLine: string;
}) {
  const { currentGapLine, usefulOffersLine, refreshCostLine, pityEpicLine, pityLegendaryLine } = props;
  return (
    <section className="manualBuildGapSummary">
      <div className="manualBuildGapSummary__line"><strong>Current Build Gap:</strong> {currentGapLine}</div>
      <div className="manualBuildGapSummary__line">{usefulOffersLine}</div>
      <div className="manualBuildGapSummary__line">{refreshCostLine}</div>
      <div className="manualBuildGapSummary__pity">
        <span>{pityEpicLine}</span>
        <span>{pityLegendaryLine}</span>
      </div>
    </section>
  );
}
