export function formatDataAmount(valueInMb: number): string {
  if (valueInMb >= 1024) {
    const gb = valueInMb / 1024;
    return gb % 1 === 0 ? `${gb} GB` : `${gb.toFixed(1)} GB`;
  }
  return `${valueInMb} MB`;
} 