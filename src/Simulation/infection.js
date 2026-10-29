const INFECTION_CHANCE = 0.3;
export const INFECTION_RADIUS_METERS = 50;

export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;

  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function checkInfection(people) {
  const newPeople = [...people];

  for (let i = 0; i < newPeople.length; i++) {
    const personA = newPeople[i];

    // ต้องเป็นคนติดเชื้อก่อน
    if (personA.status !== "infected") continue;

    for (let j = 0; j < newPeople.length; j++) {
      if (i === j) continue;

      const personB = newPeople[j];

      // คนที่ไม่ใช่ healthy ไม่ต้องติดซ้ำ
      if (personB.status !== "healthy") continue;

      const distance = calculateDistance(
        personA.lat,
        personA.lng,
        personB.lat,
        personB.lng,
      );

      // ถ้าอยู่ใกล้กัน
      if (distance < INFECTION_RADIUS_METERS) {
        // สุ่มโอกาสติดเชื้อ
        if (Math.random() < INFECTION_CHANCE) {
          newPeople[j] = {
            ...personB,
            status: "infected",
            severity: "low",
            infectedAt: Date.now(),
          };

          console.log(
            `🦠 คนที่ ${personB.id + 1} ติดเชื้อจากคนที่ ${personA.id + 1}`,
          );
        }
      }
    }
  }

  return newPeople;
}

export function createInitialInfection(people, count = 5) {
  const newPeople = [...people];

  for (let i = 0; i < count && i < newPeople.length; i++) {
    newPeople[i] = {
      ...newPeople[i],
      status: "infected",
      severity: "low",
      infectedAt: Date.now(),
    };
  }

  return newPeople;
}
