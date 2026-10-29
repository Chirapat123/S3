export function createPeople(count, province, nearbyPlaces) {
  if (!province) {
    return [];
  }

  if (!nearbyPlaces || nearbyPlaces.length === 0) {
    return [];
  }

  const people = Array.from({ length: count }, (_, i) => {
    const destination =
      nearbyPlaces[Math.floor(Math.random() * nearbyPlaces.length)];

    const startLat = province.lat + (Math.random() - 0.5) * 0.02;

    const startLng = province.lng + (Math.random() - 0.5) * 0.02;

    return {
      id: i,

      lat: startLat,
      lng: startLng,

      homeLat: startLat,
      homeLng: startLng,

      destinationLat: destination.lat,
      destinationLng: destination.lng,

      destinationType: destination.type,
      destinationName: destination.name,

      speed: 0.00003 + Math.random() * 0.00003,

      route: [],
      routeIndex: 0,
      routeLoading: false,

      status: "healthy",
      severity: null,

      exposedAt: null,
      infectedAt: null,

      treatment: false,
      location: "normal",
    };
  });

  return people;
}
