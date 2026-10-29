function Sidebar({
  outbreakData,
  selectedOutbreak,
  onSelectOutbreak,
  radius,
  setRadius,
  onAnalyze,
  analysisResult,
}) {
  return (
    <div
      style={{
        width: "320px",
        height: "100vh",
        padding: "20px",
        backgroundColor: "#ffffff",
        boxSizing: "border-box",
        overflowY: "auto",
        boxShadow: "2px 0 8px rgba(0,0,0,0.15)",
        zIndex: 1000,
      }}
    >
      <h2> Disease Analysis</h2>

      <hr />

      {/* เลือกจุดระบาด */}

      <h3>เลือกจุดระบาด</h3>

      {outbreakData.map((outbreak) => (
        <button
          key={outbreak.id}
          onClick={() => onSelectOutbreak(outbreak)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "10px",
            textAlign: "left",
            cursor: "pointer",
            border:
              selectedOutbreak?.id === outbreak.id
                ? "3px solid #ff0000"
                : "1px solid #ccc",
            borderRadius: "8px",
            backgroundColor:
              selectedOutbreak?.id === outbreak.id ? "#ffe5e5" : "#ffffff",
          }}
        >
          {outbreak.province}
          <br />
          <small>ผู้ติดเชื้อ: {outbreak.infected} คน</small>
          <br />
          <small>ความเสี่ยง: {outbreak.risk}</small>
        </button>
      ))}

      <hr />

      {/* แสดงข้อมูลจุดที่เลือก */}

      {selectedOutbreak && (
        <div>
          <h3> จุดที่เลือก</h3>

          <p>
            จังหวัด: <b>{selectedOutbreak.province}</b>
          </p>

          <p>ผู้ติดเชื้อ: {selectedOutbreak.infected} คน</p>

          <p>ความเสี่ยง: {selectedOutbreak.risk}</p>

          {/* เลือกรัศมี */}

          <label>รัศมีวิเคราะห์</label>

          <select
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            style={{
              width: "100%",
              padding: "8px",
              marginTop: "5px",
              marginBottom: "15px",
            }}
          >
            <option value={1000}>1 กิโลเมตร</option>

            <option value={3000}>3 กิโลเมตร</option>

            <option value={5000}>5 กิโลเมตร</option>

            <option value={10000}>10 กิโลเมตร</option>
          </select>

          {/* ปุ่มวิเคราะห์ */}

          <button
            onClick={onAnalyze}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "#d32f2f",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
             วิเคราะห์พื้นที่
          </button>
        </div>
      )}

      {/* ผลการวิเคราะห์ */}

      {analysisResult && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            backgroundColor: "#f5f5f5",
            borderRadius: "10px",
          }}
        >
          <h3> ผลการวิเคราะห์</h3>

          <p>
            โรงพยาบาล: <b>{analysisResult.hospitals}</b> แห่ง
          </p>

          <p>
            โรงเรียน: <b>{analysisResult.schools}</b> แห่ง
          </p>

          <p> รัศมี: {radius / 1000} กิโลเมตร</p>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
