export function formatDataAmount(valueInGb: number): string {
  // The value is already in GB, no conversion needed
  if (valueInGb >= 1) {
    return valueInGb % 1 === 0 ? `${valueInGb} GB` : `${valueInGb.toFixed(1)} GB`;
  }
  // For values less than 1 GB, show as MB
  const mb = valueInGb * 1024;
  return `${mb} MB`;
} 