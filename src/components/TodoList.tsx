import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

type TodoItem = {
  id: string;
  text: string;
  completed: boolean;
};

function TodoList() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const fetchTodos = async (userId: string) => {
      const userDocRef = doc(db, "users", userId);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        console.warn("No user document found.");
        setTodos([]);
        setLoading(false);
        return;
      }

      const userData = userSnap.data();
      const getStartedArray = userData?.todos?.["get-started"] || [];

      const fetchedTodos: TodoItem[] = getStartedArray.map(
        (item: any, index: number) => ({
          id: String(index),
          text: item.text || item.subject || "Untitled task",
          completed: false, // always start as not completed
        })
      );

      setTodos(fetchedTodos);
      setLoading(false);
    };

    unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchTodos(user.uid);
      } else {
        setTodos([]);
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleCheck = async (id: string) => {
    // Update UI immediately
    const updated = todos.map((todo) =>
      todo.id === id ? { ...todo, completed: true } : todo
    );
    setTodos(updated);

    // 🔥 Remove from Firestore too
    const user = auth.currentUser;
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) return;

    const userData = userSnap.data();
    const getStartedArray = userData?.todos?.["get-started"] || [];

    // Keep the item here to avoid the TS error and actually use it:
    const newArray = getStartedArray.filter(
      (item: any, index: number) => {
        const keep = String(index) !== id;
        // Just to use 'item' and avoid the TS warning:
        if (!keep) {
          console.log("Removing item:", item); // or any other logic if needed
        }
        return keep;
      }
    );

    await updateDoc(userDocRef, {
      [`todos.get-started`]: newArray,
    });
  };

  return (
    <div
      style={{
        backgroundColor: "#FFFBF1",
        display: "flex",
        flexDirection: "column",
        height: "300px", // Fixed height
        position: "relative"
      }}
    >
      <style>
        {`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }

          @keyframes fadeInUp {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }

          @keyframes slideOut {
            0% { 
              opacity: 1; 
              transform: translateX(0); 
              height: 24px;
              margin-bottom: 0.75rem;
            }
            70% {
              opacity: 0;
              transform: translateX(100px);
              height: 24px;
              margin-bottom: 0.75rem;
            }
            100% { 
              opacity: 0; 
              transform: translateX(100px); 
              height: 0;
              margin-bottom: 0;
            }
          }
        `}
      </style>

      <div
        className="no-scrollbar"
        style={{
          height: "calc(100% - 55px)", // Adjusted for smaller spacing
          overflowY: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          position: "relative",
        }}
      >
        {loading ? (
          <div style={{ margin: 0, fontSize: "14px" }}>Loading tasks...</div>
        ) : todos.filter((todo) => !todo.completed).length > 0 ? (
          todos.map((todo, index) => (
            <div
              key={todo.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom:
                  index === todos.length - 1 ? "0" : "0.75rem",
                opacity: 0,
                animation: todo.completed
                  ? "slideOut 0.8s forwards"
                  : `fadeInUp 0.5s ease forwards`,
                animationDelay: todo.completed
                  ? "0s"
                  : `${index * 0.05}s`,
                transition: "transform 0.5s ease, opacity 0.5s ease",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flex: 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleCheck(todo.id)}
                  style={{
                    appearance: "none",
                    WebkitAppearance: "none",
                    width: "18px",
                    height: "18px",
                    border: "2.5px solid #000",
                    borderRadius: "6px",
                    backgroundColor: todo.completed ? "green" : "white",
                    cursor: "pointer",
                  }}
                />
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: "normal",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "200px",
                  }}
                >
                  {todo.text}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              color: "#1F0741",
              textAlign: "center",
            }}
          >
            Yay! no more things to do for now!
          </div>
        )}
      </div>
      <div style={{
        position: "absolute",
        bottom: "5px",
        left: "5px",
        right: "5px",
        backgroundColor: "#FFFBF1",
      }}>
        <button
          onClick={() => navigate("/todo")}
          style={{
            width: "100%",
            height: "35px",
            backgroundColor: "#ffb703",
            border: "3px solid #1F0741",
            borderRadius: "10px",
            fontWeight: "bold",
            fontSize: "14px",
            cursor: "pointer",
            boxShadow: "0 3px #1F0741",
            transition: "all 0.2s ease",
            transform: "translateY(0)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(2px)";
            e.currentTarget.style.boxShadow = "0 0 #1F0741";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 3px #1F0741";
          }}
        >
          View To-do's
        </button>
      </div>
    </div>
  );
}

export default TodoList;
