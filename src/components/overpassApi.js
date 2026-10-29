// const OVERPASS_API = "https://overpass-api.de/api/interpreter";

// export async function getNearbyPlaces(lat, lon, radius) {
//   const query = `
//         [out:json][timeout:25];

//         (
//             nwr(
//                 around:${radius},${lat},${lon}
//             )[amenity=hospital];

//             nwr(
//                 around:${radius},${lat},${lon}
//             )[amenity=school];
//         );

//         out center tags;
//     `;

//   const url = `${OVERPASS_API}?data=${encodeURIComponent(query)}`;

//   const response = await fetch(url);

//   if (!response.ok) {
//     throw new Error("ไม่สามารถดึงข้อมูลจาก OpenStreetMap ได้");
//   }

//   const data = await response.json();

//   return data.elements;
// }
