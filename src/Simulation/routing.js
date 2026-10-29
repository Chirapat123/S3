const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

/**
 * หาเส้นทางจากจุดเริ่มต้นไปยังปลายทาง
 *
 * OSRM ใช้รูปแบบ:
 * longitude,latitude;longitude,latitude
 */
export async function getRoute(startLat, startLng, endLat, endLng) {
  try {
    const url =
      `${OSRM_URL}/` +
      `${startLng},${startLat};${endLng},${endLat}` +
      `?overview=full&geometries=geojson`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`OSRM HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== "Ok" || !data.routes?.length) {
      throw new Error(`OSRM error: ${data.code}`);
    }

    const coordinates = data.routes[0].geometry.coordinates;

    // OSRM ส่ง [lng, lat]
    // เราแปลงเป็น { lat, lng }
    return coordinates.map(([lng, lat]) => ({
      lat,
      lng,
    }));
  } catch (error) {
    console.error("หาเส้นทาง OSRM ไม่สำเร็จ:", error);
    return null;
  }
}
