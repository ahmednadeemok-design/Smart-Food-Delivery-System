export const NAROWAL_CENTER = { lat: 32.1020, lng: 74.8740 };

export const validateCoordinates = (location) => {
  const lat = Number(location?.lat);
  const lng = Number(location?.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
};

export const normalizeLocation = (location, fallback = NAROWAL_CENTER) => {
  if (!validateCoordinates(location)) return fallback;
  return { lat: Number(location.lat), lng: Number(location.lng) };
};
