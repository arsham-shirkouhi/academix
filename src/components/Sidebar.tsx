import { Link, useLocation } from "react-router-dom";
import logo from "../assets/images/academix_logo.svg";

// Import SVGs as React components using ?react
import DashboardIcon from "../assets/images/icons/dashboard.svg?react";
import AssignmentsIcon from "../assets/images/icons/assignments.svg?react";
import PlannerIcon from "../assets/images/icons/planner.svg?react";
import TodoIcon from "../assets/images/icons/todo.svg?react";
import AccountIcon from "../assets/images/icons/account.svg?react"; // NEW
import GradesIcon from "../assets/images/icons/grades.svg?react";

function Sidebar() {
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/", Icon: DashboardIcon },
    { name: "Assignments", path: "/assignments", Icon: AssignmentsIcon },
    { name: "Planner", path: "/planner", Icon: PlannerIcon },
    { name: "To-Do", path: "/todo", Icon: TodoIcon },
    { name: "Grades", path: "/grades", Icon: GradesIcon },
  ];

  const isPathActive = (path: string) => location.pathname === path;

  return (
    <div
      style={{
        width: "250px",
        backgroundColor: "#1F0741",
        color: "#FBF5E5",
        height: "100vh",
        padding: "2rem 1.5rem",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        // borderTopRightRadius: "10px",
        // borderBottomRightRadius: "10px",
      }}
    >
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: "1rem" }}>
        <img src={logo} alt="Academix Logo" style={{ width: "160px", marginBottom: "0.8rem" }} />
        <div
          style={{
            height: "3px",
            width: "100%",
            backgroundColor: "#FBF5E5",
            opacity: 1,
            borderRadius: "10px",
          }}
        />
      </div>

      {/* Main Nav Items */}
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        {navItems.map(({ name, path, Icon }) => {
          const isActive = isPathActive(path);
          return (
            <li key={path}>
              <Link
                to={path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  textDecoration: "none",
                  color: isActive ? "#FFC02E" : "#FBF5E5",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "24px",
                  paddingLeft: isActive ? "0.5rem" : 0,
                  borderLeft: isActive ? "3px solid #FFC02E" : "3px solid transparent",
                  transition: "0.2s ease-in-out",
                }}
              >
                <Icon
                  style={{
                    marginRight: "0.6rem",
                    width: "28px",
                    height: "28px",
                    stroke: isActive ? "#FFC02E" : "#FBF5E5",
                    color: isActive ? "#FFC02E" : "#FBF5E5",
                  }}
                />
                {name}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Account Tab at the bottom */}
      <div style={{ marginTop: "auto" }}>
        <Link
          to="/account"
          style={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            color: isPathActive("/account") ? "#FFC02E" : "#FBF5E5",
            fontWeight: isPathActive("/account") ? 700 : 500,
            fontSize: "24px",
            paddingLeft: isPathActive("/account") ? "0.5rem" : 0,
            borderLeft: isPathActive("/account") ? "3px solid #FFC02E" : "3px solid transparent",
            transition: "0.2s ease-in-out",
            marginTop: "1.5rem",
          }}
        >
          <AccountIcon
            style={{
              marginRight: "0.6rem",
              width: "28px",
              height: "28px",
              stroke: isPathActive("/account") ? "#FFC02E" : "#FBF5E5",
              color: isPathActive("/account") ? "#FFC02E" : "#FBF5E5",
            }}
          />
          Account
        </Link>
      </div>
    </div>
  );
}

export default Sidebar;
