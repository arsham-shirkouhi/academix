import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { auth } from "../firebase";
import { updateTodos, getTodos, getUserSettings } from "../utils/firestoreUser";
import TrashIcon from "../assets/images/icons/trash.svg?react";

type ToastType = "add" | "delete";
type Toast = {
  message: string;
  type: ToastType;
  id: string;
  isExiting: boolean;
};

const COLUMN_TYPES = ["get-started", "ongoing", "done"];

type Priority = "High" | "Medium" | "Low";
type TodoItem = {
  id: string;
  text: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  priority: Priority;
  subject: string;
  suggested: boolean;
  dueDate?: string;
  subtasks?: { id: string; text: string; completed: boolean }[];
};

function Todo() {
  const [todos, setTodos] = useState<Record<string, TodoItem[]>>({
    "get-started": [],
    "ongoing": [],
    "done": [],
  });
  const [newTodo, setNewTodo] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [subject, setSubject] = useState("General");
  const [courses, setCourses] = useState<string[]>([]);
  const [isOverTrash, setIsOverTrash] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    show: boolean;
    todoItem: TodoItem | null;
    sourceColumn: string;
  }>({
    show: false,
    todoItem: null,
    sourceColumn: ""
  });

  // Advanced todo modal state
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [advancedTodo, setAdvancedTodo] = useState<{
    text: string;
    description: string;
    priority: "High" | "Medium" | "Low";
    subject: string;
    dueDate: string;
    subtasks: { id: string; text: string; completed: boolean }[];
  }>({
    text: "",
    description: "",
    priority: "Medium",
    subject: "General",
    dueDate: "",
    subtasks: [],
  });

  const [expandedTodoId, setExpandedTodoId] = useState<string | null>(null);
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);

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

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      ::-webkit-scrollbar {
        display: none;
      }
      * {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const saveTodos = async (newTodos: Record<string, TodoItem[]>) => {
    const user = auth.currentUser;
    if (!user) return;
    await updateTodos(user.uid, newTodos);
  };

  const handleQuickAdd = async () => {
    if (!newTodo.trim()) return;

    const newItem: TodoItem = {
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
    showToast("Task added successfully", "add");
  };

  const handleAdvancedAdd = async () => {
    if (!advancedTodo.text.trim()) return;

    // Filter out empty subtasks
    const filteredSubtasks = advancedTodo.subtasks.filter(st => st.text.trim() !== "");

    const newItem: TodoItem = {
      id: generateId(),
      text: advancedTodo.text,
      description: advancedTodo.description,
      completed: false,
      createdAt: new Date().toISOString(),
      priority: advancedTodo.priority,
      subject: advancedTodo.subject,
      suggested: false,
      dueDate: advancedTodo.dueDate || undefined,
      subtasks: filteredSubtasks.length > 0 ? filteredSubtasks : undefined,
    };

    const updated = {
      ...todos,
      "get-started": [...todos["get-started"], newItem],
    };

    setTodos(updated);
    setShowAdvancedModal(false);
    setAdvancedTodo({
      text: "",
      description: "",
      priority: "Medium",
      subject: "General",
      dueDate: "",
      subtasks: [],
    });
    await saveTodos(updated);
    showToast("Task added successfully", "add");
  };

  const addSubtask = () => {
    setAdvancedTodo(prev => ({
      ...prev,
      subtasks: [...prev.subtasks, { id: generateId(), text: "", completed: false }]
    }));
  };

  const updateSubtask = (id: string, text: string) => {
    setAdvancedTodo(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(st => st.id === id ? { ...st, text } : st)
    }));
  };

  const removeSubtask = (id: string) => {
    setAdvancedTodo(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter(st => st.id !== id)
    }));
  };

  const onDragStart = (start: any) => {
    setActiveDragId(start.draggableId);

    // Create overlay immediately on drag start
    const newOverlay = document.createElement("div");
    newOverlay.id = "drag-overlay";
    newOverlay.style.position = "fixed";
    newOverlay.style.top = "0";
    newOverlay.style.left = "0";
    newOverlay.style.width = "100%";
    newOverlay.style.height = "100%";
    newOverlay.style.backgroundColor = "rgba(0, 0, 0, 0)";
    newOverlay.style.zIndex = "5";
    newOverlay.style.pointerEvents = "none";
    newOverlay.style.transition = "background-color 0.1s ease"; // Quick 0.1s fade
    document.body.appendChild(newOverlay);

    // Trigger the fade in immediately
    requestAnimationFrame(() => {
      newOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    });

    // Bring columns and trash above overlay
    const columnsContainer = document.querySelector('[style*="display: flex"][style*="gap: 20px"]') as HTMLElement;
    if (columnsContainer) {
      columnsContainer.style.position = "relative";
      columnsContainer.style.zIndex = "10";
    }

    // Style individual columns
    COLUMN_TYPES.forEach(colId => {
      const column = document.querySelector(`[data-rbd-droppable-id="${colId}"]`)?.closest('[style*="flex: 1"]') as HTMLElement;
      if (column) {
        column.style.transform = "scale(1.02)";
        column.style.transition = "all 0.2s ease";
        column.style.boxShadow = "0 0 20px rgba(0,0,0,0.2)";
      }
    });

    // Style trash zone
    const trashZone = document.querySelector('[data-rbd-droppable-id="trash-zone"]') as HTMLElement;
    if (trashZone) {
      trashZone.style.position = "relative";
      trashZone.style.zIndex = "10";
      trashZone.style.transform = "scale(1.02)";
    }
  };

  const onDragUpdate = (update: any) => {
    const isTrash = update?.destination?.droppableId === "trash-zone";
    setIsOverTrash(isTrash);
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    setIsOverTrash(false);
    setActiveDragId(null);

    // Remove overlay effect with quick fade
    const overlay = document.getElementById("drag-overlay");
    if (overlay) {
      // Trigger fade out immediately
      overlay.style.transition = "background-color 0.15s ease";
      overlay.style.backgroundColor = "rgba(0, 0, 0, 0)";

      // Reset column styles immediately
      const columnsContainer = document.querySelector('[style*="display: flex"][style*="gap: 20px"]') as HTMLElement;
      if (columnsContainer) {
        columnsContainer.style.position = "";
        columnsContainer.style.zIndex = "";
      }

      // Reset individual columns with transition
      COLUMN_TYPES.forEach(colId => {
        const column = document.querySelector(`[data-rbd-droppable-id="${colId}"]`)?.closest('[style*="flex: 1"]') as HTMLElement;
        if (column) {
          column.style.transition = "all 0.15s ease";
          column.style.transform = "";
          column.style.boxShadow = "";
        }
      });

      // Reset trash zone with transition
      const trashZone = document.querySelector('[data-rbd-droppable-id="trash-zone"]') as HTMLElement;
      if (trashZone) {
        trashZone.style.transition = "all 0.15s ease";
        trashZone.style.position = "";
        trashZone.style.zIndex = "";
        trashZone.style.transform = "";
      }

      // Remove overlay after fade completes
      setTimeout(() => {
        if (overlay.parentNode) {
          document.body.removeChild(overlay);
        }
      }, 150); // Match the transition duration
    }

    if (!destination) return;

    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;

    if (destCol === "trash-zone") {
      // Show delete confirmation modal instead of deleting immediately
      const todoToDelete = todos[sourceCol][source.index];
      setDeleteConfirmation({
        show: true,
        todoItem: todoToDelete,
        sourceColumn: sourceCol
      });
      return;
    }

    const updated = { ...todos };
    const [movedItem] = updated[sourceCol].splice(source.index, 1);
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

  const renderTodoCard = (todo: TodoItem, provided: any) => {
    const isExpanded = expandedTodoId === todo.id;
    const subtasksCompleted = todo.subtasks?.filter(st => st.completed).length || 0;
    const totalSubtasks = todo.subtasks?.length || 0;

    return (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...{
          ...provided.dragHandleProps,
          style: {
            ...provided.dragHandleProps?.style,
            cursor: 'default'
          }
        }}
        className={activeDragId === todo.id ? "dragging" : ""}
        style={{
          display: "flex",
          background: "#FFFBF1",
          border: "3px solid #1F0741",
          borderRadius: "10px",
          overflow: "hidden",
          marginBottom: "12px",
          transform: isOverTrash && activeDragId === todo.id
            ? "scale(0) rotate(-10deg)"
            : provided.draggableProps.style?.transform || "none",
          transition: isOverTrash && activeDragId === todo.id
            ? "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            : "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          position: "relative",
          ...provided.draggableProps.style
        }}
        onMouseEnter={(e) => {
          const element = e.currentTarget;
          element.style.transform = "scale(1.003)";
          setExpandedTodoId(todo.id);
        }}
        onMouseLeave={(e) => {
          const element = e.currentTarget;
          element.style.transform = "none";
          setExpandedTodoId(null);
        }}
      >
        <div
          style={{
            width: "6px",
            backgroundColor: getPriorityColor(todo.priority),
          }}
        />

        <div style={{ padding: "12px", flex: 1 }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "8px"
          }}>
            <div style={{ flex: 1, marginRight: "16px" }}>
              <strong
                onClick={() => setSelectedTodoId(todo.id)}
                style={{
                  fontSize: "16px",
                  color: "#1F0741",
                  cursor: "pointer",
                  display: "inline-block",
                  position: "relative",
                  transition: "color 0.2s ease",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#2f1161";
                  e.currentTarget.style.textDecoration = "underline";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#1F0741";
                  e.currentTarget.style.textDecoration = "none";
                }}
              >
                {todo.text}
              </strong>
              <div style={{
                fontSize: "14px",
                color: "#1F0741",
                opacity: 0.8,
                marginTop: "4px"
              }}>
                {todo.subject}
              </div>
            </div>
            {todo.dueDate && (
              <div style={{
                fontSize: "14px",
                color: "#1F0741",
                opacity: 0.8,
                whiteSpace: "nowrap"
              }}>
                {new Date(todo.dueDate).toLocaleDateString()}
              </div>
            )}
          </div>

          {todo.description && (
            <div style={{
              backgroundColor: "rgba(31, 7, 65, 0.05)",
              borderRadius: "6px",
              fontSize: "14px",
              color: "#1F0741",
              opacity: isExpanded ? 0.8 : 0,
              maxHeight: isExpanded ? "500px" : "0",
              overflow: "hidden",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              marginBottom: isExpanded ? "12px" : "0",
              padding: isExpanded ? "8px" : "0"
            }}>
              {todo.description}
            </div>
          )}

          {todo.subtasks && todo.subtasks.length > 0 && (
            <>
              <div style={{
                marginTop: isExpanded ? "8px" : "0",
                maxHeight: isExpanded ? "500px" : "0",
                opacity: isExpanded ? 1 : 0,
                overflow: "hidden",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              }}>
                {todo.subtasks.map(subtask => (
                  <div key={subtask.id} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "4px"
                  }}>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        const columnId = COLUMN_TYPES.find(colId => todos[colId].some(t => t.id === todo.id)) || 'get-started';

                        // First, update the subtask completion
                        const updatedTodo = {
                          ...todo,
                          subtasks: todo.subtasks?.map(st =>
                            st.id === subtask.id ? { ...st, completed: !st.completed } : st
                          )
                        };

                        // Calculate new status based on subtask completion
                        const completedSubtasks = updatedTodo.subtasks?.filter(st => st.completed).length || 0;
                        const totalSubtasks = updatedTodo.subtasks?.length || 0;

                        // Determine which column the todo should be in
                        let targetColumn = columnId;
                        if (completedSubtasks === totalSubtasks) {
                          targetColumn = "done";
                        } else if (completedSubtasks > 0) {
                          targetColumn = "ongoing";
                        } else {
                          targetColumn = "get-started";
                        }

                        // If the column needs to change, move the todo
                        const updated = { ...todos };
                        if (targetColumn !== columnId) {
                          // Remove from current column
                          updated[columnId] = todos[columnId].filter(t => t.id !== todo.id);
                          // Add to new column
                          updated[targetColumn] = [...todos[targetColumn], updatedTodo];
                        } else {
                          // Just update the todo in its current column
                          updated[columnId] = todos[columnId].map(t =>
                            t.id === todo.id ? updatedTodo : t
                          );
                        }

                        setTodos(updated);
                        saveTodos(updated);
                      }}
                      style={{
                        width: "16px",
                        height: "16px",
                        border: "2px solid #1F0741",
                        borderRadius: "3px",
                        backgroundColor: subtask.completed ? "#1DB815" : "transparent",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        flexShrink: 0
                      }}
                    />
                    <span style={{
                      fontSize: "14px",
                      textDecoration: subtask.completed ? "line-through" : "none",
                      opacity: subtask.completed ? 0.7 : 1,
                      color: "#1F0741"
                    }}>
                      {subtask.text}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{
                fontSize: "14px",
                color: "#1F0741",
                opacity: 0.8,
                marginTop: "8px"
              }}>
                {subtasksCompleted}/{totalSubtasks} subtasks complete
              </div>
            </>
          )}
        </div>
      </div>
    );
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
        height: "100%",
        transition: "all 0.3s ease",
        minHeight: 0
      }}
      onMouseEnter={(e) => {
        const columns = e.currentTarget.parentElement?.children;
        if (columns) {
          Array.from(columns).forEach((col: any) => {
            if (col === e.currentTarget) {
              col.style.flex = "1.01";
            } else {
              col.style.flex = "0.9";
            }
          });
        }
      }}
      onMouseLeave={(e) => {
        const columns = e.currentTarget.parentElement?.children;
        if (columns) {
          Array.from(columns).forEach((col: any) => {
            col.style.flex = "1";
          });
        }
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
              flex: 1,
              msOverflowStyle: "none",
              scrollbarWidth: "none"
            }}
          >
            {todos[columnId]?.map((todo, index) => (
              <Draggable key={todo.id} draggableId={todo.id} index={index}>
                {(provided) => renderTodoCard(todo, provided)}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );

  const showToast = (message: string, type: ToastType) => {
    const newToast: Toast = {
      message,
      type,
      id: generateId(),
      isExiting: false
    };
    setToasts(prev => [...prev, newToast]);

    // Start exit animation after 2.7 seconds
    setTimeout(() => {
      setToasts(prev =>
        prev.map(t => t.id === newToast.id ? { ...t, isExiting: true } : t)
      );
    }, 2700);

    // Remove toast after exit animation completes (3 seconds total)
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 3000);
  };

  return (
    <div style={{
      padding: "15px",
      position: "relative",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      maxHeight: "100vh",
      boxSizing: "border-box"
    }}>
      <DragDropContext
        onDragStart={onDragStart}
        onDragUpdate={onDragUpdate}
        onDragEnd={onDragEnd}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            marginBottom: "15px"
          }}
        >
          <h1 style={{ fontSize: "42px", margin: 0, color: "#1F0741", flex: "0 0 auto" }}>To Do</h1>

          <div style={{
            display: "flex",
            gap: "8px",
            flex: 1,
            alignItems: "center",
            padding: "8px 12px",
            borderRadius: "16px"
          }}>
            <input
              type="text"
              value={newTodo}
              placeholder="Quick add a task..."
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
              style={{
                padding: "8px",
                fontSize: "16px",
                flex: 1,
                backgroundColor: "rgb(255, 251, 241)",
                border: "3px solid #1F0741",
                borderRadius: "10px",
                minWidth: "200px"
              }}
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              style={{
                padding: "8px",
                border: "3px solid #1F0741",
                backgroundColor: "rgb(255, 251, 241)",
                borderRadius: "10px",
                fontSize: "16px",
                width: "100px"
              }}
            >
              <option style={{ color: "#D41B1B", fontWeight: "bold" }}>High</option>
              <option style={{ color: "#FFB200", fontWeight: "bold" }}>Medium</option>
              <option style={{ color: "#1DB815", fontWeight: "bold" }}>Low</option>
            </select>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{
                padding: "8px",
                backgroundColor: "rgb(255, 251, 241)",
                border: "3px solid #1F0741",
                borderRadius: "10px",
                fontSize: "16px",
                width: "120px"
              }}
            >
              <option>General</option>
              {courses.map((c, i) => (
                <option key={i}>{c}</option>
              ))}
            </select>
            <button
              onClick={handleQuickAdd}
              style={{
                backgroundColor: "#ffb703",
                color: "#1F0741",
                padding: "8px 16px",
                borderRadius: "10px",
                fontWeight: "bold",
                border: "3px solid #1F0741",
                cursor: "pointer",
                fontSize: "16px",
                transition: "all 0.2s ease",
                transform: "translateY(0)",
                boxShadow: "0 4px 0 0 #1F0741"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(2px)";
                e.currentTarget.style.boxShadow = "0 2px 0 0 #1F0741";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 0 0 #1F0741";
              }}
            >
              Add
            </button>
            <button
              onClick={() => setShowAdvancedModal(true)}
              style={{
                backgroundColor: "#1F0741",
                color: "#FFFFFF",
                padding: "8px 16px",
                borderRadius: "10px",
                fontWeight: "bold",
                border: "3px solid #1F0741",
                cursor: "pointer",
                fontSize: "16px",
                transition: "all 0.2s ease",
                transform: "translateY(0)",
                boxShadow: "0 4px 0 0 #1F0741"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(2px)";
                e.currentTarget.style.boxShadow = "0 2px 0 0 #1F0741";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 0 0 #1F0741";
              }}
            >
              Advanced
            </button>
          </div>

          <Droppable droppableId="trash-zone">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: snapshot.isDraggingOver ? "#d41b1b" : "#FFFBF1",
                  border: snapshot.isDraggingOver ? "3px solid #1F0741" : "3px dashed #1F0741",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                  zIndex: 10,
                  overflow: "hidden",
                  flex: "0 0 auto"
                }}
              >
                <div style={{
                  animation: snapshot.isDraggingOver ? "rotate 1s ease-in-out infinite" : "none",
                  transformOrigin: "center"
                }}>
                  <TrashIcon width={31} height={31} />
                </div>
                <div style={{ display: "none" }}>{provided.placeholder}</div>
              </div>
            )}
          </Droppable>
        </div>

        {/* Advanced Add Modal */}
        {showAdvancedModal && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}>
            <div style={{
              backgroundColor: "#FFFBF1",
              padding: "20px",
              borderRadius: "16px",
              border: "3px solid #1F0741",
              width: "90%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
              msOverflowStyle: "none",
              scrollbarWidth: "none"
            }}>
              <h2 style={{ color: "#1F0741", marginTop: 0 }}>Create Detailed Task</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <input
                  type="text"
                  value={advancedTodo.text}
                  placeholder="Task title"
                  onChange={(e) => setAdvancedTodo(prev => ({ ...prev, text: e.target.value }))}
                  style={{
                    padding: "10px",
                    fontSize: "18px",
                    backgroundColor: "rgb(255, 251, 241)",
                    border: "2px solid #1F0741",
                    borderRadius: "8px",
                  }}
                />

                <textarea
                  value={advancedTodo.description}
                  placeholder="Task description"
                  onChange={(e) => setAdvancedTodo(prev => ({ ...prev, description: e.target.value }))}
                  style={{
                    padding: "10px",
                    fontSize: "16px",
                    backgroundColor: "rgb(255, 251, 241)",
                    border: "2px solid #1F0741",
                    borderRadius: "8px",
                    minHeight: "100px",
                    resize: "vertical",
                  }}
                />

                <div style={{ display: "flex", gap: "10px" }}>
                  <select
                    value={advancedTodo.priority}
                    onChange={(e) => setAdvancedTodo(prev => ({ ...prev, priority: e.target.value as "High" | "Medium" | "Low" }))}
                    style={{
                      padding: "10px",
                      backgroundColor: "rgb(255, 251, 241)",
                      border: "2px solid #1F0741",
                      borderRadius: "8px",
                      flex: 1,
                    }}
                  >
                    <option style={{ color: "#D41B1B", fontWeight: "bold" }}>High</option>
                    <option style={{ color: "#FFB200", fontWeight: "bold" }}>Medium</option>
                    <option style={{ color: "#1DB815", fontWeight: "bold" }}>Low</option>
                  </select>

                  <select
                    value={advancedTodo.subject}
                    onChange={(e) => setAdvancedTodo(prev => ({ ...prev, subject: e.target.value }))}
                    style={{
                      padding: "10px",
                      backgroundColor: "rgb(255, 251, 241)",
                      border: "2px solid #1F0741",
                      borderRadius: "8px",
                      flex: 1,
                    }}
                  >
                    <option>General</option>
                    {courses.map((c, i) => (
                      <option key={i}>{c}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <input
                    type="date"
                    value={advancedTodo.dueDate}
                    onChange={(e) => setAdvancedTodo(prev => ({ ...prev, dueDate: e.target.value }))}
                    style={{
                      padding: "10px",
                      backgroundColor: "rgb(255, 251, 241)",
                      border: "2px solid #1F0741",
                      borderRadius: "8px",
                      flex: 1,
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <h3 style={{ margin: 0, color: "#1F0741" }}>Subtasks</h3>
                    <div
                      onClick={addSubtask}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        color: "#ffb703",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "bold",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = "0.8";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = "1";
                      }}
                    >
                      <span style={{ fontSize: "18px", lineHeight: 1 }}>+</span>
                      Add Subtask
                    </div>
                  </div>

                  {advancedTodo.subtasks.map((subtask, index) => (
                    <div key={subtask.id} style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                      <input
                        type="text"
                        value={subtask.text}
                        placeholder={`Subtask ${index + 1}`}
                        onChange={(e) => updateSubtask(subtask.id, e.target.value)}
                        style={{
                          padding: "8px",
                          backgroundColor: "rgb(255, 251, 241)",
                          border: "2px solid #1F0741",
                          borderRadius: "8px",
                          flex: 1,
                        }}
                      />
                      <button
                        onClick={() => removeSubtask(subtask.id)}
                        style={{
                          width: "28px",
                          height: "32px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          fontSize: "32px",
                          color: "#1F0741",
                          backgroundColor: "transparent",
                          fontWeight: "normal",
                          border: "none",
                          padding: 0,
                          transition: "opacity 0.2s ease",
                          lineHeight: "1",
                          marginTop: "1px"
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
                  <button
                    onClick={() => setShowAdvancedModal(false)}
                    style={{
                      backgroundColor: "#FFFBF1",
                      color: "#1F0741",
                      padding: "10px 20px",
                      borderRadius: "10px",
                      fontWeight: "bold",
                      border: "3px solid #1F0741",
                      cursor: "pointer",
                      fontSize: "16px",
                      transition: "all 0.2s ease",
                      transform: "translateY(0)",
                      boxShadow: "0 4px 0 0 #1F0741"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(2px)";
                      e.currentTarget.style.boxShadow = "0 2px 0 0 #1F0741";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 0 0 #1F0741";
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdvancedAdd}
                    style={{
                      backgroundColor: "#ffb703",
                      color: "#1F0741",
                      padding: "10px 20px",
                      borderRadius: "10px",
                      fontWeight: "bold",
                      border: "3px solid #1F0741",
                      cursor: "pointer",
                      fontSize: "16px",
                      transition: "all 0.2s ease",
                      transform: "translateY(0)",
                      boxShadow: "0 4px 0 0 #1F0741"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(2px)";
                      e.currentTarget.style.boxShadow = "0 2px 0 0 #1F0741";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 0 0 #1F0741";
                    }}
                  >
                    Create Task
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          flex: 1,
          minHeight: 0,
          paddingBottom: "15px"
        }}>
          {COLUMN_TYPES.map((colId) => renderColumn(colId, colId.replace("-", " ")))}
        </div>
      </DragDropContext>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: "#FFFBF1",
            padding: "24px",
            borderRadius: "16px",
            border: "3px solid #1F0741",
            width: "90%",
            maxWidth: "400px",
          }}>
            <h3 style={{
              color: "#1F0741",
              margin: "0 0 16px 0",
              fontSize: "20px"
            }}>
              Delete Confirmation
            </h3>
            <p style={{
              color: "#1F0741",
              marginBottom: "24px",
              fontSize: "16px"
            }}>
              Are you sure you want to delete "{deleteConfirmation.todoItem?.text}"?
            </p>
            <div style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end"
            }}>
              <button
                onClick={() => {
                  setDeleteConfirmation({ show: false, todoItem: null, sourceColumn: "" });
                }}
                style={{
                  backgroundColor: "#FFFBF1",
                  color: "#1F0741",
                  padding: "8px 16px",
                  borderRadius: "10px",
                  fontWeight: "bold",
                  border: "3px solid #1F0741",
                  cursor: "pointer",
                  fontSize: "16px",
                  transition: "all 0.2s ease",
                  transform: "translateY(0)",
                  boxShadow: "0 4px 0 0 #1F0741"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(2px)";
                  e.currentTarget.style.boxShadow = "0 2px 0 0 #1F0741";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 0 0 #1F0741";
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (deleteConfirmation.todoItem && deleteConfirmation.sourceColumn) {
                    const updated = { ...todos };
                    updated[deleteConfirmation.sourceColumn] =
                      todos[deleteConfirmation.sourceColumn].filter(
                        item => item.id !== deleteConfirmation.todoItem?.id
                      );
                    setTodos(updated);
                    await saveTodos(updated);
                    showToast("Task deleted", "delete");
                  }
                  setDeleteConfirmation({ show: false, todoItem: null, sourceColumn: "" });
                }}
                style={{
                  backgroundColor: "#D41B1B",
                  color: "#FFFFFF",
                  padding: "8px 16px",
                  borderRadius: "10px",
                  fontWeight: "bold",
                  border: "3px solid #1F0741",
                  cursor: "pointer",
                  fontSize: "16px",
                  transition: "all 0.2s ease",
                  transform: "translateY(0)",
                  boxShadow: "0 4px 0 0 #1F0741"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(2px)";
                  e.currentTarget.style.boxShadow = "0 2px 0 0 #1F0741";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 0 0 #1F0741";
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedTodoId && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: "#FFFBF1",
            padding: "24px",
            borderRadius: "16px",
            border: "3px solid #1F0741",
            width: "90%",
            maxWidth: "600px",
            maxHeight: "90vh",
            overflowY: "auto",
            msOverflowStyle: "none",
            scrollbarWidth: "none"
          }}>
            <button
              onClick={() => setSelectedTodoId(null)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "24px",
                color: "#1F0741",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(31, 7, 65, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <div style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        zIndex: 2000,
      }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              backgroundColor: "#ffb703",
              color: "#1F0741",
              padding: "12px 20px",
              borderRadius: "10px",
              border: "3px solid #1F0741",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              animation: `${toast.isExiting ? 'slideOut' : 'slideIn'} 0.3s ease-out forwards`,
              minWidth: "200px"
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>

      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
            }
            to {
              transform: translateX(0);
            }
          }
          @keyframes slideOut {
            from {
              transform: translateX(0);
            }
            to {
              transform: translateX(100%);
            }
          }
          @keyframes rotate {
            0% { transform: rotate(0deg); }
            25% { transform: rotate(-10deg); }
            75% { transform: rotate(10deg); }
            100% { transform: rotate(0deg); }
          }
          .dragging {
            z-index: 9999 !important;
          }
        `}
      </style>
    </div>
  );
}

export default Todo;
