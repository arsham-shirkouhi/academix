import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { auth } from "../firebase";
import { updateTodos, getTodos, getUserSettings } from "../utils/firestoreUser";
import TrashIcon from "../assets/images/icons/trash.svg?react";

const COLUMN_TYPES = ["get-started", "ongoing", "done"];

function Todo() {
  const [todos, setTodos] = useState<Record<string, any[]>>({
    "get-started": [],
    "ongoing": [],
    "done": [],
  });
  const [newTodo, setNewTodo] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [subject, setSubject] = useState("General");
  const [courses, setCourses] = useState<string[]>([]);
  const [isOverTrash, setIsOverTrash] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const rawTodos = await getTodos(user.uid);
      if (
        rawTodos &&
        typeof rawTodos === "object" &&
        "get-started" in rawTodos &&
        "ongoing" in rawTodos &&
        "done" in rawTodos
      ) {
        setTodos(rawTodos);
      }

      const settings = await getUserSettings(user.uid);
      if (settings?.colorPreferences) {
        setCourses(Object.keys(settings.colorPreferences));
      }
    };
    fetchData();
  }, []);

  const saveTodos = async (newTodos: Record<string, any[]>) => {
    const user = auth.currentUser;
    if (!user) return;
    await updateTodos(user.uid, newTodos);
  };

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;

    const newItem = {
      id: generateId(),
      text: newTodo,
      completed: false,
      createdAt: new Date().toISOString(),
      priority,
      subject,
      suggested: false,
    };

    const updated = {
      ...todos,
      "get-started": [...todos["get-started"], newItem],
    };

    setTodos(updated);
    setNewTodo("");
    await saveTodos(updated);
  };

  const onDragUpdate = (update: any) => {
    const isTrash = update?.destination?.droppableId === "trash-zone";
    setIsOverTrash(isTrash);
    setActiveDragId(update?.draggableId || null);
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    setIsOverTrash(false);
    setActiveDragId(null);
    if (!destination) return;

    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;

    const updated = { ...todos };
    const [movedItem] = updated[sourceCol].splice(source.index, 1);

    if (destCol === "trash-zone") {
      setTodos(updated);
      await saveTodos(updated);
      return;
    }

    updated[destCol].splice(destination.index, 0, movedItem);
    setTodos(updated);
    await saveTodos(updated);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "#D41B1B";
      case "Medium": return "#FFB200";
      case "Low": return "#1DB815";
      default: return "#ccc";
    }
  };

  const renderColumn = (columnId: string, title: string) => (
    <div
      key={columnId}
      style={{
        flex: 1,
        minWidth: "300px",
        backgroundColor: "#FFFBF1",
        borderRadius: "16px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        border: "3px solid #1F0741",
        height: `calc(100vh - 200px)`,
      }}
    >
      <div
        style={{
          backgroundColor: "#1F0741",
          color: "#FFFBF1",
          padding: "12px 16px",
          fontWeight: "bold",
          fontSize: "18px",
          borderBottom: "3px solid #1F0741",
          textTransform: "capitalize",
        }}
      >
        {title}
      </div>

      <Droppable droppableId={columnId}>
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            style={{
              padding: "12px",
              overflowY: "auto",
              flexGrow: 1,
            }}
          >
            {todos[columnId]?.map((todo, index) => (
              <Draggable key={todo.id} draggableId={todo.id} index={index}>
  {(provided) => (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      style={{
        display: "flex",
        background: "#FFFBF1",
        border: "3px solid #1F0741",
        borderRadius: "10px",
        overflow: "hidden",
        marginBottom: "12px",
        transform:
          isOverTrash && activeDragId === todo.id
            ? "scale(0.95) rotate(-5deg)"
            : "none",
        transition: "transform 0.2s ease",
        ...provided.draggableProps.style,
      }}
    >
      {/* Priority Stripe */}
      <div
        style={{
          width: "10px",
          backgroundColor: getPriorityColor(todo.priority),
        }}
      />

      {/* Content */}
      <div style={{ padding: "14px 16px", flex: 1 }}>
        <strong style={{ fontSize: "18px", color: "#1F0741" }}>{todo.text}</strong>
        <div style={{ fontSize: "16px", color: "#1F0741" }}>
          {todo.subject}
          {/* {todo.subject} | {todo.priority} */}
        </div>
        <div style={{ fontSize: "14px", color: "#1F0741" }}>
        {new Date(todo.createdAt).toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric"
})}
        </div>
      </div>
    </div>
  )}
</Draggable>

            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );

  return (
    <div style={{ margin: "15px", position: "relative" }}>
      <DragDropContext onDragEnd={onDragEnd} onDragUpdate={onDragUpdate}>
        {/* Header Row with Title + Trash */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h1 style={{ fontSize: "42px", margin: 0, color:"#1F0741" }}>To Do</h1>
          <Droppable droppableId="trash-zone">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: snapshot.isDraggingOver ? "#d41b1b" : "#ffb703",
                  border: "3px solid #1F0741",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "0.2s ease",
                  zIndex: 1000,
                  overflow: "hidden",
                }}
              >
                <TrashIcon width={31} height={31} />
                <div style={{ display: "none" }}>{provided.placeholder}</div>
              </div>
            )}
          </Droppable>
        </div>

        {/* Input Form */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
          <input
            type="text"
            value={newTodo}
            placeholder="What task are we doing now?"
            onChange={(e) => setNewTodo(e.target.value)}
            style={{
              padding: "10px",
              fontSize: "18px",
              flex: 1,
              backgroundColor:"#FFFBF1",
              border: "3px solid #1F0741",
              borderRadius: "10px",
            }}
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            style={{
              padding: "10px",
              border: "3px solid #1F0741",
              backgroundColor:"#FFFBF1",
              borderRadius: "10px",
              fontSize: "18px",
            }}
          >
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={{
              padding: "10px",
              backgroundColor:"#FFFBF1",
              border: "3px solid #1F0741",
              borderRadius: "10px",
              fontSize: "18px",
            }}
          >
            <option>General</option>
            {courses.map((c, i) => (
              <option key={i}>{c}</option>
            ))}
          </select>
          <button
            onClick={handleAddTodo}
            style={{
              backgroundColor: "#ffb703",
              padding: "10px 20px",
              width: "75px",
              borderRadius: "6px",
              fontWeight: "bold",
              border: "3px solid #1F0741",
              cursor: "pointer",
              fontSize: "18px",
            }}
          >
            Add
          </button>
        </div>

        {/* To-Do Columns */}
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          {COLUMN_TYPES.map((colId) => renderColumn(colId, colId.replace("-", " ")))}
        </div>
      </DragDropContext>
    </div>
  );
}

export default Todo;
