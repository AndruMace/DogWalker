// Format duration in seconds to HH:MM:SS format
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = remainingSeconds.toString().padStart(2, '0');

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

// Format distance in meters to miles with 2 decimal places
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

// Format date string (YYYY-MM-DD) to a more readable format
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return date.toLocaleDateString(undefined, options);
}

// Format time string from ISO to readable format
export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
} 