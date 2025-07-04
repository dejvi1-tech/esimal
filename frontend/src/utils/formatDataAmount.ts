export function formatDataAmount(valueInGb: number): string {
  // Handle special cases
  if (valueInGb === 0) return 'Unlimited';
  if (!valueInGb || isNaN(valueInGb)) return '0 GB';
  
  // The value is already in GB, no conversion needed
  if (valueInGb >= 1) {
    return valueInGb % 1 === 0 ? `${valueInGb} GB` : `${valueInGb.toFixed(1)} GB`;
  }
  
  // For values less than 1 GB, show as MB
  const mb = Math.round(valueInGb * 1024);
  return `${mb} MB`;
} 