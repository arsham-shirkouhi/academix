import { Link, useLocation } from "react-router-dom";

function Sidebar() {
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/" },
    { name: "Assignments", path: "/assignments" },
    { name: "Planner", path: "/planner" },
    { name: "To-Do", path: "/todo" },
  ];

  return (
    <div style={{ 
      width: "250px", 
      backgroundColor: "#1e093c", 
      color: "white", 
      height: "100vh", 
      padding: "1rem",
      display: "flex",
      flexDirection: "column",
      gap: "1rem"
    }}>
      <h2 style={{ fontSize: "1.5rem", marginBottom: "2rem" }}>ACADEMIX</h2>
      <nav>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {navItems.map((item) => (
            <li key={item.path} style={{ marginBottom: "1rem" }}>
              <Link
                to={item.path}
                style={{
                  color: location.pathname === item.path ? "orange" : "white",
                  textDecoration: "none",
                  fontWeight: "bold",
                }}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export default Sidebar;
