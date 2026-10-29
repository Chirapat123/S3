// ระยะฟักตัว 10 วินาที
const INCUBATION_TIME = 10 * 1000;

// ประเมินโรคทุก 1 วินาที
const DISEASE_UPDATE_INTERVAL = 1000;

// โอกาสต่อ 1 วินาที
const RECOVERY_CHANCE_LOW = 0.002; // 0.2%
const WORSEN_CHANCE_LOW = 0.01; // 1%

export function updateDisease(people) {
  const now = Date.now();

  return people.map((person) => {
    // คนที่ไม่ได้ติดเชื้อ
    if (person.status !== "infected") {
      return person;
    }

    // ถ้ายังไม่มีเวลาเริ่มติดเชื้อ
    if (!person.infectedAt) {
      return {
        ...person,
        infectedAt: now,
        severity: person.severity || "low",
        lastDiseaseUpdateAt: now,
      };
    }

    const infectionDuration = now - person.infectedAt;

    // ยังอยู่ในระยะฟักตัว
    if (infectionDuration < INCUBATION_TIME) {
      return person;
    }

    // ยังไม่ถึงเวลาประเมินรอบใหม่
    if (
      person.lastDiseaseUpdateAt &&
      now - person.lastDiseaseUpdateAt < DISEASE_UPDATE_INTERVAL
    ) {
      return person;
    }

    const severity = person.severity || "low";

    // =========================
    // ระดับต่ำ
    // =========================
    if (severity === "low") {
      const random = Math.random();

      // อาการดีขึ้น
      if (random < RECOVERY_CHANCE_LOW) {
        return {
          ...person,
          status: "recovered",
          severity: null,
          lastDiseaseUpdateAt: now,
        };
      }

      // อาการแย่ลง
      if (random < RECOVERY_CHANCE_LOW + WORSEN_CHANCE_LOW) {
        return {
          ...person,
          severity: "high",
          lastDiseaseUpdateAt: now,
        };
      }

      return {
        ...person,
        lastDiseaseUpdateAt: now,
      };
    }

    // =========================
    // ระดับสูง
    // =========================
    if (severity === "high") {
      return {
        ...person,
        severity: "high",
        lastDiseaseUpdateAt: now,
      };
    }

    return person;
  });
}
