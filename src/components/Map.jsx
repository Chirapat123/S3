import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Circle,
  Tooltip,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";
import { createPeople } from "../Simulation/people";
import { movePeople } from "../Simulation/movement";
import {
  checkInfection,
  INFECTION_RADIUS_METERS,
  createInitialInfection,
} from "../Simulation/infection";

import { updateDisease } from "../Simulation/disease";
import { updateTreatment } from "../Simulation/treatment";
import { getRoute } from "../Simulation/routing";

function Map() {
  const [points, setPoints] = useState([]);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [positions, setPositions] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState(["hospital"]);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  const [people, setPeople] = useState([]);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const animationRef = useRef(null);

  const INCUBATION_TIME = 10; // วินาทีสำหรับ Simulation
  const SEVERITY_CHANGE_TIME = 20; // วินาทีที่เริ่มประเมินอาการ

  const API_URL = "http://localhost:3001/api";
  useEffect(() => {
    fetch(`${API_URL}/markers`)
      .then((res) => res.json())
      .then((data) => setPositions(data))
      .catch((err) => console.error("โหลดมุดไม่สำเร็จ:", err));
  }, []);

  const handleSelectProvince = async (name) => {
    setSelectedProvince(name);
    setNearbyPlaces([]);

    if (!name) return;

    // หาจังหวัดจากข้อมูลที่โหลดมาจาก DB
    const province = points.find((p) => p.name === name);

    if (!province) {
      console.error("ไม่พบจังหวัด:", name);
      return;
    }

    console.log("จังหวัดที่เลือก:", province);

    // บันทึกจุดจังหวัดลง DB
    try {
      const res = await fetch(`${API_URL}/markers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: province.name,
          lat: province.lat,
          lng: province.lng,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const saved = await res.json();

      console.log("บันทึกจังหวัด:", saved);

      setPositions((prev) => [...prev, saved]);
    } catch (err) {
      console.error("บันทึกหมุดไม่สำเร็จ:", err);
    }

    // ถ้าไม่ได้เลือกประเภทสถานที่
    if (selectedTypes.length === 0) {
      return;
    }

    // ค้นหาสถานที่สำคัญจากจังหวัดที่เลือกโดยตรง
    setLoading(true);

    try {
      const places = await fetchNearbyPlaces(
        province.lat,
        province.lng,
        selectedTypes,
        5000,
      );

      console.log(`พบสถานที่ ${places.length} แห่ง รอบ ${province.name}`);

      setNearbyPlaces(places);
    } catch (err) {
      console.error("ค้นหาสถานที่ไม่สำเร็จ:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch(`${API_URL}/provinces`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("โหลดจังหวัดไม่สำเร็จ");
        }
        return res.json();
      })
      .then((data) => {
        const provinces = data.map((p) => ({
          name: p.province_name,
          lat: Number(p.latitude),
          lng: Number(p.longitude),
        }));

        setPoints(provinces);
      })
      .catch((err) => {
        console.error("โหลดข้อมูลจังหวัดไม่สำเร็จ:", err);
      });
  }, []);

  // ➕ เพิ่มใหม่: พอ selectedTypes เปลี่ยน (ติ๊ก/เอาออก) ให้ค้นหาใหม่ทันที โดยไม่ต้องรอเลือกจังหวัดใหม่
  useEffect(() => {
    if (!selectedProvince) return;

    const province = points.find((p) => p.name === selectedProvince);

    if (!province) return;

    if (selectedTypes.length === 0) {
      setNearbyPlaces([]);
      return;
    }

    const currentRequestId = ++requestIdRef.current;

    setLoading(true);

    fetchNearbyPlaces(province.lat, province.lng, selectedTypes, 5000)
      .then((places) => {
        if (currentRequestId !== requestIdRef.current) return;

        console.log(`พบสถานที่ ${places.length} แห่ง รอบ ${province.name}`);

        setNearbyPlaces(places);
      })
      .catch((err) => {
        console.error("ค้นหาสถานที่ไม่สำเร็จ:", err);
      })
      .finally(() => {
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
      });
  }, [selectedTypes, selectedProvince, points]);

  const nearbyIcon = new L.Icon({
    iconUrl:
      "https://unpkg.com/leaflet-color-markers@1.0.0/img/marker-icon-2x-green.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  async function fetchNearbyPlaces(lat, lng, types, radius = 5000) {
    console.log("ค้นหาสถานที่:");
    console.log("lat:", lat);
    console.log("lng:", lng);
    console.log("types:", types);
    console.log("radius:", radius);

    const queries = types
      .map(
        (type) => `nwr["amenity"="${type}"](around:${radius},${lat},${lng});`,
      )
      .join("\n");

    const query = `
[out:json][timeout:30];
(
  ${queries}
);
out center;
`;

    console.log("Overpass Query:", query);

    try {
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `data=${encodeURIComponent(query)}`,
      });

      const text = await res.text();

      console.log("Overpass HTTP:", res.status);
      console.log("Overpass Response:", text);

      if (!res.ok) {
        throw new Error(`Overpass HTTP ${res.status}: ${text}`);
      }

      const data = JSON.parse(text);

      const result = data.elements
        .map((el) => {
          const lat = el.lat ?? el.center?.lat;
          const lng = el.lon ?? el.center?.lon;

          if (lat == null || lng == null) {
            return null;
          }

          return {
            lat,
            lng,
            name: el.tags?.name || "ไม่ทราบชื่อ",
            type: el.tags?.amenity || "ไม่ทราบประเภท",
          };
        })
        .filter(Boolean);

      console.log("พบสถานที่:", result.length);

      return result;
    } catch (err) {
      console.error("Overpass API Error:", err);
      throw err;
    }
  }

  const placeTypes = [
    { key: "restaurant", label: "ร้านอาหาร" },
    { key: "fuel", label: "ปั๊มน้ำมัน" },
    { key: "hospital", label: "โรงพยาบาล" },
    { key: "school", label: "โรงเรียน" },
    { key: "bank", label: "ธนาคาร" },
    { key: "pharmacy", label: "ร้านขายยา" },
  ];

  const toggleType = (key) => {
    setSelectedTypes((prev) =>
      prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key],
    );
  };

  const provinceIcon = new L.Icon({
    iconUrl:
      "https://unpkg.com/leaflet-color-markers@1.0.0/img/marker-icon-2x-blue.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  // ✏️ แก้ไข: เปลี่ยนจาก inline arrow function ธรรมดา → เป็นฟังก์ชัน async ที่ยิง API ลบจริง
  const clearAllMarkers = async () => {
    try {
      const res = await fetch(`${API_URL}/markers`, { method: "DELETE" });
      if (!res.ok) throw new Error("ลบไม่สำเร็จ");
      setPositions([]); // ลบออกจากหน้าจอ หลังจากลบใน DB สำเร็จแล้วเท่านั้น
      setNearbyPlaces([]);
    } catch (err) {
      console.error("ลบไม่สำเร็จ:", err);
      alert("ลบข้อมูลไม่สำเร็จ ลองใหม่อีกครั้ง");
    }
  };

  const handleCreatePeople = () => {
    if (!selectedProvince) {
      alert("กรุณาเลือกจังหวัดก่อน");
      return;
    }

    if (nearbyPlaces.length === 0) {
      alert("ยังไม่มีสถานที่สำหรับให้คนเดินไป");
      return;
    }

    const province = points.find((p) => p.name === selectedProvince);

    if (!province) return;

    const newPeople = createPeople(100, province, nearbyPlaces);
    const infectedPeople = createInitialInfection(newPeople, 5);

    setPeople(infectedPeople);
  };

  //การให้ทำจุดขยับ
  useEffect(() => {
    if (!simulationRunning) {
      return;
    }

    const interval = setInterval(() => {
      setPeople((prevPeople) => {
        const movedPeople = movePeople(prevPeople, nearbyPlaces);

        const infectedPeople = checkInfection(movedPeople);

        const diseasedPeople = updateDisease(infectedPeople);

        return updateTreatment(diseasedPeople);
      });
    }, 50);

    return () => {
      clearInterval(interval);
    };
  }, [simulationRunning, nearbyPlaces]);

  const routeRequestKey = people
    .filter(
      (person) =>
        (!person.route || person.route.length === 0) &&
        !person.routeLoading &&
        person.location !== "home",
    )
    .map(
      (person) =>
        `${person.id}-${person.destinationLat}-${person.destinationLng}`,
    )
    .join("|");

  useEffect(() => {
    if (!simulationRunning || people.length === 0) {
      return;
    }

    const peopleNeedRoute = people.filter(
      (person) =>
        (!person.route || person.route.length === 0) &&
        !person.routeLoading &&
        person.location !== "home",
    );

    if (peopleNeedRoute.length === 0) {
      return;
    }

    const batch = peopleNeedRoute.slice(0, 5);

    setPeople((prevPeople) =>
      prevPeople.map((person) =>
        batch.some((p) => p.id === person.id)
          ? {
              ...person,
              routeLoading: true,
            }
          : person,
      ),
    );

    batch.forEach(async (person) => {
      const route = await getRoute(
        person.lat,
        person.lng,
        person.destinationLat,
        person.destinationLng,
      );

      setPeople((prevPeople) =>
        prevPeople.map((current) => {
          if (current.id !== person.id) {
            return current;
          }

          // destination เปลี่ยนระหว่างรอ
          if (
            current.destinationLat !== person.destinationLat ||
            current.destinationLng !== person.destinationLng
          ) {
            return { ...current, routeLoading: false };
          }

          if (!route || route.length === 0) {
            return {
              ...current,
              route: [],
              routeIndex: 0,
              routeLoading: false,
            };
          }

          return { ...current, route, routeIndex: 0, routeLoading: false };
        }),
      );
    });
  }, [simulationRunning, routeRequestKey]);

  return (
    <>
      <div
        style={{
          padding: "10px 14px",
          background: "#1e293b",
          color: "white",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <label>เลือกจังหวัด:</label>
        <select
          value={selectedProvince}
          onChange={(e) => handleSelectProvince(e.target.value)}
        >
          <option value="">-- เลือกจังหวัด --</option>
          {points.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
        <button onClick={clearAllMarkers}>ล้างมุดทั้งหมด</button>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <span>ประเภทสถานที่:</span>
        {placeTypes.map((t) => (
          <label
            key={t.key}
            style={{
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <input
              type="checkbox"
              checked={selectedTypes.includes(t.key)}
              onChange={() => toggleType(t.key)}
            />
            {t.label}
          </label>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          flexWrap: "wrap",
        }}
      >
        {/* จำนวนคน */}
        <div>
          👥 คน: <strong>{people.length}</strong>
        </div>

        <div>
          🔵 ปกติ:{" "}
          <strong>{people.filter((p) => p.status === "healthy").length}</strong>
        </div>

        <div>
          🔴 ติดเชื้อ:{" "}
          <strong>
            {people.filter((p) => p.status === "infected").length}
          </strong>
        </div>

        <div>
          🟢 หายแล้ว:{" "}
          <strong>
            {people.filter((p) => p.status === "recovered").length}
          </strong>
        </div>

        {/* สถานะ */}
        <div>{simulationRunning ? "🟢 กำลังจำลอง" : "⚪ หยุดอยู่"}</div>

        {/* ปุ่มสร้างคน */}
        <button onClick={handleCreatePeople}>👥 สร้างคน</button>

        {/* ปุ่มเริ่ม */}
        <button
          onClick={() => setSimulationRunning(true)}
          disabled={people.length === 0 || simulationRunning}
        >
          ▶ เริ่ม
        </button>

        {/* ปุ่มหยุด */}
        <button
          onClick={() => setSimulationRunning(false)}
          disabled={!simulationRunning}
        >
          ⏸ หยุด
        </button>

        {/* ปุ่มรีเซ็ต */}
        <button
          onClick={() => {
            setSimulationRunning(false);
            setPeople([]);
          }}
        >
          ↻ รีเซ็ต
        </button>
      </div>

      {loading && (
        <span style={{ fontSize: 13, color: "#94a3b8" }}>กำลังค้นหา...</span>
      )}
      {!loading && nearbyPlaces.length > 0 && (
        <span style={{ fontSize: 13, color: "#94a3b8" }}>
          พบ {nearbyPlaces.length} แห่ง
        </span>
      )}

      <MapContainer
        center={[13.7563, 100.5018]} //เซ็นแผนที่
        zoom={6}
        style={{
          height: "1000px",
          width: "100%",
        }}
      >
        {/* {แผนที่} */}
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {positions.map((data, index) => (
          <div key={index}>
            <Marker
              position={[data.latitude, data.longitude]}
              name={data.location_name}
            >
              <Popup> {data.location_name} </Popup>
            </Marker>
            <Circle
              center={[data.latitude, data.longitude]}
              radius={5000}
              pathOptions={{
                color: "red",
                fillColor: "#f03",
                fillOpacity: 0.15,
              }}
            />
          </div>
        ))}

        {nearbyPlaces.map((place, i) => (
          <Marker
            key={`nearby-${i}`}
            position={[place.lat, place.lng]}
            icon={nearbyIcon}
          >
            <Tooltip permanent direction="top" offset={[0, -10]}>
              {place.name}
            </Tooltip>
            <Popup>
              <strong>{place.name}</strong>
              <br />
              ประเภท: {place.type}
              <br />
              พิกัด: {place.lat.toFixed(5)}, {place.lng.toFixed(5)}
            </Popup>
          </Marker>
        ))}

        {people.map((person) => {
          const color =
            person.status === "infected"
              ? person.severity === "high"
                ? "red"
                : "orange"
              : person.status === "recovered"
                ? "green"
                : "blue";

          return (
            <Circle
              key={person.id}
              center={[Number(person.lat), Number(person.lng)]}
              radius={20}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 1,
              }}
            >
              <Tooltip direction="top" offset={[0, -10]}>
                <div>
                  <strong>👤 คนที่ {person.id + 1}</strong>
                  <br />
                  สถานะ:{" "}
                  {person.status === "healthy"
                    ? "🔵 ปกติ"
                    : person.status === "infected"
                      ? "🦠 ติดเชื้อ"
                      : person.status === "recovered"
                        ? "🟢 หายแล้ว"
                        : person.status}
                  {person.status === "infected" && (
                    <>
                      <br />
                      ระดับ:{" "}
                      {person.severity === "low"
                        ? "🟠 ระดับต่ำ"
                        : person.severity === "high"
                          ? "🔴 ระดับสูง"
                          : "ไม่ทราบระดับ"}
                    </>
                  )}
                </div>
              </Tooltip>
            </Circle>
          );
        })}
      </MapContainer>
    </>
  );
}

export default Map;
