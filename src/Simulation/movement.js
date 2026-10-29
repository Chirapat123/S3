function moveAlongRoute(person) {
  // ยังไม่มี route → ยังไม่ขยับ
  if (!person.route || person.route.length === 0) {
    return person;
  }

  if (person.routeIndex >= person.route.length) {
    return {
      ...person,
      lat: person.destinationLat,
      lng: person.destinationLng,
    };
  }

  const waypoint = person.route[person.routeIndex];

  const dx = waypoint.lat - person.lat;
  const dy = waypoint.lng - person.lng;

  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 0.00003) {
    return {
      ...person,
      lat: waypoint.lat,
      lng: waypoint.lng,
      routeIndex: person.routeIndex + 1,
    };
  }

  const directionLat = dx / distance;
  const directionLng = dy / distance;

  return {
    ...person,
    lat: person.lat + directionLat * person.speed,
    lng: person.lng + directionLng * person.speed,
  };
}

export function movePeople(people, nearbyPlaces) {
  if (!people || people.length === 0) {
    return people;
  }

  return people.map((person) => {
    // =========================================
    // รักษาตัวที่บ้าน
    // =========================================
    if (
      person.status === "infected" &&
      person.severity === "low" &&
      person.location === "home"
    ) {
      return moveTowardHome(person);
    }

    // =========================================
    // อาการหนัก → โรงพยาบาล
    // =========================================
    if (
      person.status === "infected" &&
      person.severity === "high" &&
      person.location === "hospital"
    ) {
      const hospitals = nearbyPlaces.filter(
        (place) => place.type === "hospital",
      );

      if (hospitals.length === 0) {
        return person;
      }

      let hospital;

      if (person.destinationType === "hospital" && person.route?.length > 0) {
        hospital = {
          lat: person.destinationLat,
          lng: person.destinationLng,
          type: "hospital",
          name: person.destinationName,
        };
      } else {
        hospital = hospitals[Math.floor(Math.random() * hospitals.length)];

        // ⭐ เปลี่ยนปลายทาง → ล้าง route เก่า
        if (person.destinationType !== "hospital") {
          return {
            ...person,

            destinationLat: hospital.lat,
            destinationLng: hospital.lng,
            destinationType: "hospital",
            destinationName: hospital.name,

            route: [],
            routeIndex: 0,
            routeLoading: false,
          };
        }
      }

      return moveAlongRoute(person);
    }

    // =========================================
    // Healthy / Recovered
    // =========================================
    if (
  person.location === "normal" ||
  person.status === "recovered"
) {
  // =========================================
  // คนเพิ่งหาย → หาสถานที่ใหม่
  // =========================================
  if (
    person.status === "recovered" &&
    (!person.destinationLat || !person.destinationLng)
  ) {
    if (!nearbyPlaces || nearbyPlaces.length === 0) {
      return person;
    }

    const newDestination =
      nearbyPlaces[
        Math.floor(Math.random() * nearbyPlaces.length)
      ];

    return {
      ...person,

      destinationLat: newDestination.lat,
      destinationLng: newDestination.lng,

      destinationType: newDestination.type,
      destinationName: newDestination.name,

      route: [],
      routeIndex: 0,
      routeLoading: false,
    };
  }

  const movedPerson = moveAlongRoute(person);

  const dx =
    movedPerson.destinationLat - movedPerson.lat;

  const dy =
    movedPerson.destinationLng - movedPerson.lng;

  const distance = Math.sqrt(dx * dx + dy * dy);

  // ถึงปลายทาง
  if (distance < 0.0001) {
    if (!nearbyPlaces || nearbyPlaces.length === 0) {
      return movedPerson;
    }

    const newDestination =
      nearbyPlaces[
        Math.floor(Math.random() * nearbyPlaces.length)
      ];

    return {
      ...movedPerson,

      destinationLat: newDestination.lat,
      destinationLng: newDestination.lng,

      destinationType: newDestination.type,
      destinationName: newDestination.name,

      route: [],
      routeIndex: 0,
      routeLoading: false,
    };
  }

  return movedPerson;
}

    return person;
  });
}

// =========================================
// กลับบ้าน
// =========================================

function moveTowardHome(person) {
  // ตอนนี้ยังใช้เส้นตรงกลับบ้าน
  // เดี๋ยวเราจะเอา OSRM มาใช้ตรงนี้ต่อ

  const dx = person.homeLat - person.lat;
  const dy = person.homeLng - person.lng;

  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 0.0001) {
    return {
      ...person,
      lat: person.homeLat,
      lng: person.homeLng,
    };
  }

  const directionLat = dx / distance;
  const directionLng = dy / distance;

  return {
    ...person,

    lat: person.lat + directionLat * person.speed,
    lng: person.lng + directionLng * person.speed,

    destinationLat: person.homeLat,
    destinationLng: person.homeLng,
  };
}
