function GpaTracker() {
    const gpa = 3.72;
    const maxGpa = 4.0;
    const percent = (gpa / maxGpa) * 100;
  
    return (
      <div
        style={{
          backgroundColor: "#f0f0f0",
          padding: "1rem",
          borderRadius: "8px",
        }}
      >
        <h3>Grade & GPA Tracker</h3>
        <div style={{ fontSize: "1.5rem", fontWeight: "bold", marginTop: "0.5rem" }}>
          GPA: {gpa.toFixed(2)} / 4.00
        </div>
  
        {/* Progress bar */}
        <div
          style={{
            marginTop: "1rem",
            height: "12px",
            backgroundColor: "#ddd",
            borderRadius: "6px",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${percent}%`,
              backgroundColor: "#6BCB77",
              borderRadius: "6px",
            }}
          ></div>
        </div>
  
        <p style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
          Keep it up! You're on track for Dean's List.
        </p>
      </div>
    );
  }
  
  export default GpaTracker;
  