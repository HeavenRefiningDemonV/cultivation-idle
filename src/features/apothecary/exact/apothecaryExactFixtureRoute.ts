export function isApothecaryExactFixtureRouteEnabled(): boolean {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  return (
    params.get('apothecaryExactMode') === 'fixture'
    || params.get('apothecaryExactFixture') === '1'
    || window.location.hash.includes('apothecaryExactMode=fixture')
    || window.location.hash.includes('apothecaryExactFixture=1')
  );
}
