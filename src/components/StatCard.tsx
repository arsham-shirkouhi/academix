type StatCardProps = {
    title: string;
    value: string;
    icon?: string;
    backgroundColor?: string;
  };
  
  function StatCard({
    title,
    value,
    icon = "📈",
    backgroundColor = "#FFA500",
  }: StatCardProps) {
    return (
      <div
        style={{
          flex: 1,
          backgroundColor,
          padding: "1.5rem",
          borderRadius: "12px",
          color: "white",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "0.5rem",
        }}
      >
        <div style={{ fontSize: "2rem" }}>{icon}</div>
        <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>{title}</div>
        <div>{value}</div>
      </div>
    );
  }
  
  export default StatCard;
  