export function GateTrialSummaryCard(props: { roleTag: string; bestUsedWhen: string }) {
  const { roleTag, bestUsedWhen } = props;
  return (
    <section className="gateTrialSummaryCard">
      <div className="gateTrialSummaryCard__header">
        <strong>Gate Trial</strong>
        <span>{roleTag}</span>
      </div>
      <div>{bestUsedWhen}</div>
    </section>
  );
}
