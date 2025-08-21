import { useEffect, useState, useMemo, useCallback } from "react";
import type { ReactNode } from "react";
import UpcomingEvents from "../components/UpcomingEvents";
import WeeklyCalendar from "../components/WeeklyCalender";
import TodoList from "../components/TodoList";
import GpaTracker from "../components/GpaTracker";
import TimerWidget from "../components/TimerWidget";
import { useNavigate } from "react-router-dom";
import PlannerIcon from "../assets/images/icons/planner.svg?react";
import AssignmentsIcon from "../assets/images/icons/assignments.svg?react";
import TodoIcon from "../assets/images/icons/todo.svg?react";
import GradesIcon from "../assets/images/icons/grades.svg?react";

import DashboardHeader from "../components/DashboardHeader";

// Widget types
type WidgetType = 'schedule' | 'upcoming' | 'todo' | 'grades' | 'timer';

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Widget layout state
  const [widgetLayout, setWidgetLayout] = useState<{
    left: WidgetType;
    right: WidgetType;
    bottom1: WidgetType;
    bottom2: WidgetType;
  }>({
    left: 'schedule',
    right: 'upcoming',
    bottom1: 'todo',
    bottom2: 'grades'
  });

  const [dropdownOpen, setDropdownOpen] = useState<keyof typeof widgetLayout | null>(null);

  // useEffect(() => {
  //   const today = new Date().toDateString();

  //   const fetchStreak = async () => {
  //     if (!userId) return;

  //     const docRef = doc(db, "users", userId);
  //     const snap = await getDoc(docRef);

  //     if (snap.exists()) {
  //       const data = snap.data();
  //       const lastUsedDate = data.lastUsedDate;
  //       const storedStreak = data.studyStreak || 0;

  //       // Convert dates for comparison
  //       const lastLoginDate = new Date(lastUsedDate);
  //       const currentDate = new Date();
  //       const timeDifference = currentDate.getTime() - lastLoginDate.getTime();
  //       const hoursDifference = timeDifference / (1000 * 60 * 60);

  //       // If more than 24 hours have passed, reset streak to 0
  //       if (hoursDifference > 24) {
  //         await setDoc(
  //           docRef,
  //           {
  //             lastUsedDate: today,
  //             studyStreak: 0
  //           },
  //           { merge: true }
  //         );
  //         setStreak(0);
  //       }
  //       // If it's a new day but within 24 hours, increment streak
  //       else if (lastUsedDate !== today) {
  //         await setDoc(
  //           docRef,
  //           {
  //             lastUsedDate: today,
  //             studyStreak: storedStreak + 1
  //           },
  //           { merge: true }
  //         );
  //         setStreak(storedStreak + 1);
  //       }
  //       // If same day, keep current streak
  //       else {
  //         setStreak(storedStreak);
  //       }
  //     } else {
  //       // First time user starts with streak of 0
  //       await setDoc(docRef, {
  //         lastUsedDate: today,
  //         studyStreak: 0
  //       });
  //       setStreak(0);
  //     }
  //   };

  //   fetchStreak();
  // }, [userId]);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownOpen && !(event.target as Element).closest('.widget-header')) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Memoized static widget components (no timer dependencies)
  const memoizedStaticWidgets = useMemo(() => ({
    schedule: <WeeklyCalendar limitToTodayAndTomorrow={false} />,
    upcoming: <UpcomingEvents />,
    todo: loading ? (
      <div>
        {[1, 2, 3].map((_, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 0",
              opacity: 0,
              animation: `fadeInUp 0.5s ease forwards ${index * 0.1}s`
            }}
          >
            <div
              style={{
                width: "18px",
                height: "18px",
                borderRadius: "6px",
                background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 2s infinite"
              }}
            />
            <div
              style={{
                flex: 1,
                height: "18px",
                borderRadius: "4px",
                background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 2s infinite"
              }}
            />
          </div>
        ))}
      </div>
    ) : (
      <TodoList />
    ),
    grades: <GpaTracker />
  }), [loading]);

  // Widget components
  const getWidgetComponent = useCallback((type: WidgetType) => {
    return memoizedStaticWidgets[type as keyof typeof memoizedStaticWidgets] || null;
  }, [memoizedStaticWidgets]);

  const getWidgetTitle = (type: WidgetType) => {
    switch (type) {
      case 'schedule':
        return 'Schedule';
      case 'upcoming':
        return 'Upcoming';
      case 'todo':
        return 'To-Do';
      case 'grades':
        return 'Grade Overview';
      case 'timer':
        return 'Study Timer';
      default:
        return '';
    }
  };

  const handleWidgetClick = (position: keyof typeof widgetLayout) => {
    setDropdownOpen(dropdownOpen === position ? null : position);
  };

  const handleWidgetSelect = (position: keyof typeof widgetLayout, newWidgetType: WidgetType) => {
    setWidgetLayout(prev => ({
      ...prev,
      [position]: newWidgetType
    }));
    setDropdownOpen(null);
  };



  const WidgetBox = ({
    type,
    position,
    height = "100%",
    width = "100%"
  }: {
    type: WidgetType;
    position: keyof typeof widgetLayout;
    height?: string;
    width?: string;
  }) => (
    <div style={{ height, width, minHeight: 0 }}>
      <div
        style={{
          border: "3px solid #1F0741",
          borderRadius: "16px",
          overflow: "hidden",
          backgroundColor: "#FFFBF1",
          height: "100%",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <div
          className="widget-header"
          style={{
            backgroundColor: "#1F0741",
            color: "#FFFBF1",
            padding: "0.75rem 1rem",
            fontSize: "24px",
            fontWeight: "bold",
            transition: "background-color 0.2s ease",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div
            onClick={() => handleWidgetClick(position)}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", position: "relative", cursor: "pointer" }}
          >
            <span>{getWidgetTitle(type)}</span>
            <span style={{ fontSize: "16px" }}>▼</span>

            {/* Dropdown Menu */}
            {dropdownOpen === position && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  backgroundColor: "#FFFBF1",
                  border: "2px solid #1F0741",
                  borderTop: "none",
                  borderRadius: "0 0 8px 8px",
                  zIndex: 1000,
                  boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                  width: "fit-content",
                  whiteSpace: "nowrap"
                }}
              >
                {(['schedule', 'upcoming', 'todo', 'grades', 'timer'] as WidgetType[]).map((widgetType) => (
                  <div
                    key={widgetType}
                    style={{
                      padding: "0.5rem 1rem",
                      cursor: "pointer",
                      color: "#1F0741",
                      fontSize: "18px",
                      fontWeight: "500",
                      borderBottom: "1px solid #e0e0e0",
                      transition: "background-color 0.2s ease",
                      backgroundColor: widgetType === type ? "#FFB800" : "transparent"
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWidgetSelect(position, widgetType);
                    }}
                    onMouseEnter={(e) => {
                      if (widgetType !== type) {
                        (e.currentTarget as HTMLDivElement).style.backgroundColor = "#f0f0f0";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (widgetType !== type) {
                        (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    {getWidgetTitle(widgetType)}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Top-right open page button */}
          {(() => {
            const routeMap: Record<string, string> = {
              schedule: "/planner",
              upcoming: "/assignments",
              todo: "/todo",
              grades: "/grades",
            };
            const iconMap: Record<string, ReactNode | null> = {
              schedule: <PlannerIcon style={{ width: 16, height: 16 }} />,
              upcoming: <AssignmentsIcon style={{ width: 16, height: 16 }} />,
              todo: <TodoIcon style={{ width: 16, height: 16 }} />,
              grades: <GradesIcon style={{ width: 16, height: 16 }} />,
              timer: null,
            };
            const route = routeMap[type];
            const icon = iconMap[type];
            return route && icon ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(route);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "6px 10px",
                  fontSize: "12px",
                  backgroundColor: "#FFFBF1",
                  color: "#1F0741",
                  border: "2px solid #FFFBF1",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FFE7A3";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FFFBF1";
                }}
                aria-label="Open full page"
                title="Open full page"
              >
                {icon}
              </button>
            ) : null;
          })()}
        </div>
        <div
          className="no-scrollbar"
          style={{
            padding: "15px",
            flex: 1,
            overflowY: "auto",
            minHeight: 0
          }}
        >
          {getWidgetComponent(type)}
        </div>
      </div>
    </div>
  );

  return (
    <div
      style={{
        padding: "10px 10px 35px 10px",
        fontSize: "16px",
        color: "#1F0741",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Welcome Header */}
      <DashboardHeader />
      {/* <div
        style={{
          borderTop: "3px dashed #1F0741",
          width: "100%",
          margin: "0.5rem 0",
        }}
      /> */}

      {/* Timer Bar */}
      <div
        style={{
          marginBottom: "0.75rem",
        }}
      >
        <TimerWidget />
      </div>

      <style>
        {`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>

      {/* Main Layout */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: "12px",
          maxWidth: "calc(-250px + 100vw)",
          flex: 1,
          overflow: "hidden",
          minHeight: 0
        }}
      >
        {/* Left Section - Schedule (Full Height) */}
        <div style={{ gridRow: "span 2", minHeight: 0, overflow: "hidden", height: "100%" }}>
          <WidgetBox type={widgetLayout.left} position="left" height="100%" />
        </div>

        {/* Right Section - Upcoming (Top) */}
        <div style={{ minHeight: 0, overflow: "hidden", height: "100%" }}>
          <WidgetBox type={widgetLayout.right} position="right" height="100%" />
        </div>

        {/* Right Section - Todo and Grades (Bottom) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", minHeight: 0, overflow: "hidden" }}>
          <WidgetBox type={widgetLayout.bottom1} position="bottom1" height="100%" />
          <WidgetBox type={widgetLayout.bottom2} position="bottom2" height="100%" />
        </div>
      </div>


    </div>
  );
}

export default Dashboard;



