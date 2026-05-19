export function ttmuSeconds(cost: number, netRatePerSecond: number): number {
  if (cost <= 0) return 0;
  if (netRatePerSecond <= 0) return Number.POSITIVE_INFINITY;
  return cost / netRatePerSecond;
}

export function formatTtmu(seconds: number): string {
  if (!Number.isFinite(seconds)) {
    return '∞';
  }

  const totalSeconds = Math.max(0, Math.floor(seconds));
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  if (totalSeconds < 3600) {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return secs === 0 ? `${minutes}m` : `${minutes}m ${secs}s`;
  }

  if (totalSeconds < 86400) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
  }

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  return hours === 0 ? `${days}d` : `${days}d ${hours}h`;
}
