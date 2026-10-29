// ต้องผ่านระยะฟักตัวก่อนจึงเริ่มรักษา
const INCUBATION_TIME = 10 * 1000;

// ประเมินการรักษาทุก 1 วินาที
const TREATMENT_UPDATE_INTERVAL = 1000;

// โอกาสต่อ 1 วินาที
const RECOVERY_CHANCE_HOME = 0.02; // 2%
const WORSEN_CHANCE_HOME = 0.01; // 1%

const RECOVERY_CHANCE_HOSPITAL = 0.05; // 5%

export function updateTreatment(people) {
  const now = Date.now();

  return people.map((person) => {
    // คนที่ไม่ได้ติดเชื้อ
    if (person.status !== "infected") {
      return person;
    }

    // ถ้าไม่มี infectedAt
    if (!person.infectedAt) {
      return person;
    }

    // =========================================
    // ยังอยู่ในระยะฟักตัว
    // =========================================
    const infectionDuration = now - person.infectedAt;

    if (infectionDuration < INCUBATION_TIME) {
      return person;
    }

    // =========================================
    // ยังไม่ถึงเวลาประเมินรอบใหม่
    // =========================================
    if (
      person.lastTreatmentUpdateAt &&
      now - person.lastTreatmentUpdateAt < TREATMENT_UPDATE_INTERVAL
    ) {
      return person;
    }

    const severity = person.severity || "low";

    // =========================================
    // ระดับต่ำ
    // =========================================
    if (severity === "low") {
      const random = Math.random();

      // หายจากการรักษาที่บ้าน
      if (random < RECOVERY_CHANCE_HOME) {
        return {
          ...person,
          status: "recovered",
          severity: null,
          treatment: false,
          location: "normal",

          destinationLat: null,
          destinationLng: null,
          destinationType: null,
          destinationName: null,

          route: [],
          routeIndex: 0,
          routeLoading: false,

          lastTreatmentUpdateAt: now,
        };
      }

      // อาการแย่ลง → โรงพยาบาล
      if (random < RECOVERY_CHANCE_HOME + WORSEN_CHANCE_HOME) {
        return {
          ...person,
          severity: "high",
          treatment: true,
          location: "hospital",
          lastTreatmentUpdateAt: now,
        };
      }

      // รักษาตัวที่บ้าน
      return {
        ...person,
        treatment: true,
        location: "home",
        lastTreatmentUpdateAt: now,
      };
    }

    // =========================================
    // ระดับสูง
    // =========================================
    if (severity === "high") {
      const random = Math.random();

      // หายจากการรักษาที่โรงพยาบาล
      if (random < RECOVERY_CHANCE_HOSPITAL) {
        return {
          ...person,
          status: "recovered",
          severity: null,
          treatment: false,
          location: "normal",

          destinationLat: null,
          destinationLng: null,
          destinationType: null,
          destinationName: null,

          route: [],
          routeIndex: 0,
          routeLoading: false,

          lastTreatmentUpdateAt: now,
        };
      }

      // รักษาที่โรงพยาบาลต่อ
      return {
        ...person,
        treatment: true,
        location: "hospital",
        lastTreatmentUpdateAt: now,
      };
    }

    return person;
  });
}
