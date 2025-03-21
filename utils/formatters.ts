export function formatDistance(meters: number): string {
  const miles = meters / 1609.344; // Convert meters to miles
  if (meters < 1609.344) {
    // If less than a mile, show in feet (1 meter = 3.28084 feet)
    const feet = meters * 3.28084;
    return `${feet.toFixed(0)} ft`;
  } else {
    return `${miles.toFixed(2)} mi`;
  }
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes} min`;
  }
} 