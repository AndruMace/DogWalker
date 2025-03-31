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
  return `${miles.toFixed(2)} mi`;
}

/**
 * Get the current local date formatted as YYYY-MM-DD
 * This ensures consistent date handling throughout the app
 * 
 * This function explicitly accounts for timezone issues by using
 * the local date components rather than UTC-based methods
 */
export function getLocalDateString(date = new Date()): string {
  // Use methods that explicitly get local date components
  const localYear = date.getFullYear();
  const localMonth = date.getMonth() + 1; // Months are 0-indexed
  const localDay = date.getDate();
  
  return `${localYear}-${String(localMonth).padStart(2, '0')}-${String(localDay).padStart(2, '0')}`;
}

/**
 * Parse a YYYY-MM-DD date string to a Date object with local time
 * This is the reverse of getLocalDateString and ensures when we parse
 * our date strings, we get a Date object that maintains the intended local date.
 */
export function parseLocalDateString(dateString: string): Date {
  // Handle invalid input
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    console.warn(`Invalid date string format: ${dateString}`);
    return new Date();
  }
  
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Create date using local components (not UTC)
  // month is 0-indexed in Date constructor
  const date = new Date(year, month - 1, day);
  
  return date;
}

/**
 * Safely parse an ISO date string to a Date object, ensuring local time is preserved.
 * This helps prevent timezone issues when working with ISO strings.
 */
export function parseISOToLocalDate(isoString: string): Date {
  const date = new Date(isoString);
  
  // If the string is invalid, return current date
  if (isNaN(date.getTime())) {
    console.warn(`Invalid date string: ${isoString}, using current date instead`);
    return new Date();
  }
  
  return date;
}

// Format date string (YYYY-MM-DD) to a more readable format
export function formatDate(dateString: string): string {
  // Use our more robust date parsing
  const date = parseLocalDateString(dateString);
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
  // Use our safer date parsing function to handle timezone issues
  const date = parseISOToLocalDate(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Debug function to log date information and help diagnose timezone issues
 */
export function debugDateInfo(date: Date, label: string): void {
  console.log(`=== DEBUG DATE (${label}) ===`);
  console.log(`ISO String: ${date.toISOString()}`);
  console.log(`Local String: ${date.toString()}`);
  console.log(`Date object: ${date}`);
  console.log(`getFullYear(): ${date.getFullYear()}`);
  console.log(`getMonth(): ${date.getMonth()} (${date.getMonth() + 1} as human month)`);
  console.log(`getDate(): ${date.getDate()}`);
  console.log(`getLocalDateString(): ${getLocalDateString(date)}`);
  console.log(`Timezone offset in minutes: ${date.getTimezoneOffset()}`);
  console.log(`=====================================`);
} 