import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom"; // no BrowserRouter here!
import Dashboard from "./pages/Dashboard";
import Assignments from "./pages/Assignments";
import Planner from "./pages/Planner";
import Todo from "./pages/Todo";
import Account from "./pages/Account";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

function App() {
  const [user, setUser] = useState<null | any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("✅ Logged in as:", user.uid);
        setUser(user);
      } else {
        console.log("🚪 User is logged out");
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div style={{ display: "flex" }}>
      {user && <Sidebar />}
      <div style={{ flexGrow: 1, padding: "1rem" }}>
        <Routes>
          {user ? (
            <>
              <Route path="/" element={<Dashboard />} />
              <Route path="/assignments" element={<Assignments />} />
              <Route path="/planner" element={<Planner />} />
              <Route path="/todo" element={<Todo />} />
              <Route path="/account" element={<Account />} />
            </>
          ) : (
            <>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="*" element={<Login />} />
            </>
          )}
        </Routes>
      </div>
    </div>
  );
}

export default App;
