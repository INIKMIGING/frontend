// Location CRUD utilities for localStorage

const LOCATION_KEY_PREFIX = 'device_location_';

export function getDeviceLocation(deviceId: string): string | null {
  return localStorage.getItem(`${LOCATION_KEY_PREFIX}${deviceId}`);
}

export function setDeviceLocation(deviceId: string, location: string): void {
  localStorage.setItem(`${LOCATION_KEY_PREFIX}${deviceId}`, location);
}

export function deleteDeviceLocation(deviceId: string): void {
  localStorage.removeItem(`${LOCATION_KEY_PREFIX}${deviceId}`);
}

export function getAllDeviceLocations(): Record<string, string> {
  const locations: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(LOCATION_KEY_PREFIX)) {
      const deviceId = key.replace(LOCATION_KEY_PREFIX, '');
      const location = localStorage.getItem(key);
      if (location) {
        locations[deviceId] = location;
      }
    }
  }
  return locations;
}
