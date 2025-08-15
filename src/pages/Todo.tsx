import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { auth } from "../firebase";
import { updateTodos, getTodos, getUserSettings } from "../utils/firestoreUser";
import TrashIcon from "../assets/images/icons/trash.svg?react";

type ToastType = "add" | "delete" | "error" | "archive" | "restore";
type Toast = {
  message: string;
  type: ToastType;
  id: string;
  isExiting: boolean;
};

const COLUMN_TYPES = ["get-started", "ongoing", "done"];

type Priority = "High" | "Medium" | "Low" | "";
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
  archivedAt?: string;
};

function Todo() {
  const [todos, setTodos] = useState<Record<string, TodoItem[]>>({
    "get-started": [],
    "ongoing": [],
    "done": [],
  });
  const [archivedTodos, setArchivedTodos] = useState<TodoItem[]>([]);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [newTodo, setNewTodo] = useState("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [subject, setSubject] = useState("");
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

  // Add new state for modal exit animation
  const [isModalExiting, setIsModalExiting] = useState(false);

  // Add state for tracking removing subtasks
  const [removingSubtaskId, setRemovingSubtaskId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  // Add state for modal animation
  const [isDetailModalExiting, setIsDetailModalExiting] = useState(false);

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      setLoading(true);
      const rawTodos = await getTodos(user.uid);
      if (
        rawTodos &&
        typeof rawTodos === "object" &&
        "get-started" in rawTodos &&
        "ongoing" in rawTodos &&
        "done" in rawTodos
      ) {
        setTodos(rawTodos);

        // Extract archived todos from the "done" column
        const archived = rawTodos["done"]?.filter(todo => todo.archivedAt) || [];
        setArchivedTodos(archived);

        // Remove archived todos from the "done" column
        const activeDoneTodos = rawTodos["done"]?.filter(todo => !todo.archivedAt) || [];
        setTodos(prev => ({
          ...prev,
          "done": activeDoneTodos
        }));
      }

      const settings = await getUserSettings(user.uid);
      if (settings?.colorPreferences) {
        setCourses(Object.keys(settings.colorPreferences));
      }

      // Simulate minimum loading time for smooth animation
      setTimeout(() => {
        setLoading(false);
        // After initial animation completes, mark as loaded
        setTimeout(() => {
          setHasInitiallyLoaded(true);
        }, 1000); // Wait for all staggered animations to complete
      }, 1000);
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

  const archiveCompletedTodos = async () => {
    const updated = { ...todos };
    const toArchive = updated["done"].filter(todo => !todo.archivedAt);

    if (toArchive.length === 0) {
      showToast("No completed tasks to archive", "error");
      return;
    }

    const archivedWithTimestamp = toArchive.map(todo => ({
      ...todo,
      archivedAt: new Date().toISOString()
    }));

    setArchivedTodos(prev => [...prev, ...archivedWithTimestamp]);
    updated["done"] = updated["done"].filter(todo => todo.archivedAt);
    setTodos(updated);
    await saveTodos(updated);
    showToast(`${archivedWithTimestamp.length} tasks archived`, "archive");
  };

  const restoreTodo = async (todo: TodoItem) => {
    const updatedArchived = archivedTodos.filter(t => t.id !== todo.id);
    setArchivedTodos(updatedArchived);

    const todoToRestore = { ...todo, archivedAt: undefined };
    const updated = { ...todos };
    updated["done"] = [...updated["done"], todoToRestore];
    setTodos(updated);
    await saveTodos(updated);
    showToast("Task restored", "restore");
  };

  const permanentlyDeleteArchived = async (todo: TodoItem) => {
    setArchivedTodos(prev => prev.filter(t => t.id !== todo.id));
    showToast("Task permanently deleted", "delete");
  };

  const handleQuickAdd = async () => {
    if (!newTodo.trim() || priority === "" || subject === "") {
      showToast("Please fill in all required fields", "error");
      return;
    }

    const newItem: TodoItem = {
      id: generateId(),
      text: newTodo,
      completed: false,
      createdAt: new Date().toISOString(),
      priority: priority as "High" | "Medium" | "Low",
      subject,
      suggested: false,
    };

    const updated = {
      ...todos,
      "get-started": [...todos["get-started"], newItem],
    };

    setTodos(updated);
    setNewTodo("");
    setPriority("");
    setSubject("");
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
    setRemovingSubtaskId(id);
    setTimeout(() => {
      setAdvancedTodo(prev => ({
        ...prev,
        subtasks: prev.subtasks.filter(st => st.id !== id)
      }));
      setRemovingSubtaskId(null);
    }, 300); // Match animation duration
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

  const renderTodoCard = (todo: TodoItem, provided: any, index: number) => {
    const isExpanded = expandedTodoId === todo.id;
    const subtasksCompleted = todo.subtasks?.filter(st => st.completed).length || 0;
    const totalSubtasks = todo.subtasks?.length || 0;
    const isNewlyAdded = Date.now() - new Date(todo.createdAt).getTime() < 1000;

    const style = {
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
      ...provided.draggableProps.style,
      // Add initial load animation if not yet loaded or if newly added
      ...((!hasInitiallyLoaded && !loading) || isNewlyAdded ? {
        opacity: 0,
        animation: `fadeInUp 0.5s ease forwards ${index * 0.1}s`
      } : {})
    };

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
        style={style}
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
              <p style={{
                margin: 0,
                display: "-webkit-box",
                WebkitLineClamp: "2",
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}>
                {todo.description}
              </p>
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
                {todo.subtasks?.map((subtask) => (
                  <div
                    key={subtask.id}
                    className={`subtask-item ${removingSubtaskId === subtask.id ? 'subtask-exit' : 'subtask-enter'}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "4px"
                    }}
                  >
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

  const renderSkeletonCard = (index: number) => (
    <div
      style={{
        display: "flex",
        background: "#FFFBF1",
        border: "3px solid #e0e0e0",
        borderRadius: "10px",
        overflow: "hidden",
        marginBottom: "12px",
        opacity: 0,
        animation: `fadeInUp 0.5s ease forwards ${index * 0.1}s`
      }}
    >
      <div
        style={{
          width: "6px",
          background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 2s infinite"
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
            <div
              style={{
                height: "20px",
                width: "70%",
                background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 2s infinite",
                borderRadius: "4px",
                marginBottom: "8px"
              }}
            />
            <div
              style={{
                height: "16px",
                width: "40%",
                background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 2s infinite",
                borderRadius: "4px"
              }}
            />
          </div>
          <div
            style={{
              height: "16px",
              width: "80px",
              background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 2s infinite",
              borderRadius: "4px"
            }}
          />
        </div>
      </div>
    </div>
  );

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
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <span>{columnId === "ongoing" ? "On Going" : title}</span>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          {columnId === "done" && todos["done"]?.length > 0 && (
            <button
              onClick={archiveCompletedTodos}
              style={{
                backgroundColor: "#ffb703",
                color: "#1F0741",
                border: "2px solid #FFFBF1",
                borderRadius: "6px",
                padding: "4px 8px",
                fontSize: "12px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s ease",
                transform: "translateY(0)",
                boxShadow: "0 2px 0 0 #FFFBF1"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(2px)";
                e.currentTarget.style.boxShadow = "0 0 0 0 #FFFBF1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 0 0 #FFFBF1";
              }}
            >
              Archive All
            </button>
          )}
          <div style={{
            backgroundColor: "#FFFBF1",
            color: "#1F0741",
            borderRadius: "6px",
            padding: "3px 8px",
            fontSize: "14px",
            fontWeight: "bold",
            minWidth: "24px",
            textAlign: "center"
          }}>
            {todos[columnId]?.length || 0}
          </div>
        </div>
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
            {loading ? (
              Array(3).fill(null).map((_, index) => renderSkeletonCard(index))
            ) : (
              todos[columnId]?.map((todo, index) => (
                <Draggable key={todo.id} draggableId={todo.id} index={index}>
                  {(provided) => renderTodoCard(todo, provided, index)}
                </Draggable>
              ))
            )}
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

  // Update the modal close handler
  const handleModalClose = () => {
    setIsModalExiting(true);
    setTimeout(() => {
      setShowAdvancedModal(false);
      setIsModalExiting(false);
    }, 300); // Match animation duration
  };

  // Add handler for modal close with animation
  const handleDetailModalClose = () => {
    setIsDetailModalExiting(true);
    setTimeout(() => {
      setSelectedTodoId(null);
      setIsDetailModalExiting(false);
    }, 300); // Match animation duration
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
            flexDirection: "column",
            gap: "15px",
            marginBottom: "15px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h1 style={{ fontSize: "42px", margin: 0, color: "#1F0741", fontWeight: "bold" }}>To Do</h1>

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button
                onClick={() => setShowArchiveModal(true)}
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: "#FFFBF1",
                  border: "3px solid #1F0741",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  position: "relative"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.backgroundColor = "#ffb703";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.backgroundColor = "#FFFBF1";
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ color: "#1F0741" }}
                >
                  <path
                    d="M3 7V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3 7L7 3H17L21 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 11H15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 15H15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {archivedTodos.length > 0 && (
                  <div style={{
                    position: "absolute",
                    top: "-8px",
                    right: "-8px",
                    backgroundColor: "#D41B1B",
                    color: "#FFFFFF",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: "bold",
                    border: "2px solid #FFFBF1"
                  }}>
                    {archivedTodos.length}
                  </div>
                )}
              </button>

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
          </div>

          <div style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            padding: "0 4px"
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
              onChange={(e) => setPriority(e.target.value as Priority | "")}
              style={{
                padding: "8px",
                border: "3px solid #1F0741",
                backgroundColor: "rgb(255, 251, 241)",
                borderRadius: "10px",
                fontSize: "16px",
                width: "100px"
              }}
            >
              <option value="" disabled>Priority</option>
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
              <option value="" disabled>Category</option>
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
                e.currentTarget.style.transform = "translateY(4px)";
                e.currentTarget.style.boxShadow = "0 0 0 0 #1F0741";
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
                e.currentTarget.style.transform = "translateY(4px)";
                e.currentTarget.style.boxShadow = "0 0 0 0 #1F0741";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 0 0 #1F0741";
              }}
            >
              Advanced
            </button>
          </div>
        </div>

        {/* Advanced Add Modal */}
        {showAdvancedModal && (
          <div
            onClick={handleModalClose}
            style={{
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
              animation: isModalExiting ? "fadeOut 0.3s ease-out forwards" : "fadeIn 0.2s ease-out forwards",
            }}>
            <div
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the modal itself
              style={{
                backgroundColor: "#FFFBF1",
                padding: "20px",
                borderRadius: "16px",
                border: "3px solid #1F0741",
                width: "90%",
                maxWidth: "600px",
                maxHeight: "90vh",
                overflowY: "auto",
                msOverflowStyle: "none",
                scrollbarWidth: "none",
                animation: isModalExiting ? "slideOut 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" : "slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
                position: "relative" // Ensure modal content stays above overlay
              }}>
              <button
                onClick={handleModalClose}
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

              <h2 style={{ color: "#1F0741", marginTop: 0 }}>Create Detailed Task</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{
                    color: "#1F0741",
                    fontSize: "16px",
                    fontWeight: "bold"
                  }}>
                    Title
                  </label>
                  <input
                    type="text"
                    value={advancedTodo.text}
                    placeholder="Enter task title"
                    onChange={(e) => setAdvancedTodo(prev => ({ ...prev, text: e.target.value }))}
                    style={{
                      padding: "10px",
                      fontSize: "16px",
                      backgroundColor: "rgb(255, 251, 241)",
                      border: "2px solid #1F0741",
                      borderRadius: "8px",
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{
                    color: "#1F0741",
                    fontSize: "16px",
                    fontWeight: "bold"
                  }}>
                    Description
                  </label>
                  <textarea
                    value={advancedTodo.description}
                    placeholder="Enter task description"
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
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                    <label style={{
                      color: "#1F0741",
                      fontSize: "16px",
                      fontWeight: "bold"
                    }}>
                      Priority
                    </label>
                    <select
                      value={advancedTodo.priority}
                      onChange={(e) => setAdvancedTodo(prev => ({ ...prev, priority: e.target.value as "High" | "Medium" | "Low" }))}
                      style={{
                        padding: "10px",
                        backgroundColor: "rgb(255, 251, 241)",
                        border: "2px solid #1F0741",
                        borderRadius: "8px",
                      }}
                    >
                      <option style={{ color: "#D41B1B", fontWeight: "bold" }}>High</option>
                      <option style={{ color: "#FFB200", fontWeight: "bold" }}>Medium</option>
                      <option style={{ color: "#1DB815", fontWeight: "bold" }}>Low</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                    <label style={{
                      color: "#1F0741",
                      fontSize: "16px",
                      fontWeight: "bold"
                    }}>
                      Category
                    </label>
                    <select
                      value={advancedTodo.subject}
                      onChange={(e) => setAdvancedTodo(prev => ({ ...prev, subject: e.target.value }))}
                      style={{
                        padding: "10px",
                        backgroundColor: "rgb(255, 251, 241)",
                        border: "2px solid #1F0741",
                        borderRadius: "8px",
                      }}
                    >
                      <option>General</option>
                      {courses.map((c, i) => (
                        <option key={i}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{
                    color: "#1F0741",
                    fontSize: "16px",
                    fontWeight: "bold"
                  }}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={advancedTodo.dueDate}
                    onChange={(e) => setAdvancedTodo(prev => ({ ...prev, dueDate: e.target.value }))}
                    style={{
                      padding: "10px",
                      backgroundColor: "rgb(255, 251, 241)",
                      border: "2px solid #1F0741",
                      borderRadius: "8px",
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={{
                      color: "#1F0741",
                      fontSize: "16px",
                      fontWeight: "bold",
                      margin: 0
                    }}>
                      Subtasks
                    </label>
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
                    <div
                      key={subtask.id}
                      className={`subtask-item ${removingSubtaskId === subtask.id ? 'subtask-exit' : 'subtask-enter'}`}
                      style={{
                        display: "flex",
                        gap: "10px",
                        marginBottom: "10px"
                      }}
                    >
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
                    onClick={handleModalClose}
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
                      e.currentTarget.style.transform = "translateY(4px)";
                      e.currentTarget.style.boxShadow = "0 0 0 0 #1F0741";
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
                      e.currentTarget.style.transform = "translateY(4px)";
                      e.currentTarget.style.boxShadow = "0 0 0 0 #1F0741";
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
                  e.currentTarget.style.transform = "translateY(4px)";
                  e.currentTarget.style.boxShadow = "0 0 0 0 #1F0741";
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
                  e.currentTarget.style.transform = "translateY(4px)";
                  e.currentTarget.style.boxShadow = "0 0 0 0 #1F0741";
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
        <div
          className="modal-overlay"
          onClick={handleDetailModalClose}
          style={{
            animation: isDetailModalExiting ? "fadeOut 0.3s ease forwards" : "fadeIn 0.3s ease forwards"
          }}
        >
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{
              animation: isDetailModalExiting ? "slideOut 0.3s ease forwards" : "slideIn 0.3s ease forwards"
            }}
          >
            <button
              onClick={handleDetailModalClose}
              className="modal-close-button"
            >
              ×
            </button>

            {(() => {
              const todo = Object.values(todos)
                .flat()
                .find((t: TodoItem) => t.id === selectedTodoId);

              if (!todo) return null;

              return (
                <div className="modal-inner">
                  <h2 className="modal-title">{todo.text}</h2>

                  <div className="modal-content-wrapper">
                    <div className="main-info">
                      {/* Description */}
                      {todo.description && (
                        <div className="description">
                          <h3 className="section-label">DESCRIPTION</h3>
                          <p className="description-text">{todo.description}</p>
                        </div>
                      )}

                      {/* Task Info */}
                      <div className="task-info">
                        <div className="info-row">
                          <div className="info-item">
                            <h3 className="section-label">PRIORITY</h3>
                            <div className="info-content">
                              <span className="info-value priority-value" style={{ color: getPriorityColor(todo.priority) }}>
                                {todo.priority}
                              </span>
                            </div>
                          </div>

                          <div className="info-item">
                            <h3 className="section-label">CATEGORY</h3>
                            <div className="info-content">
                              <span className="info-value">{todo.subject}</span>
                            </div>
                          </div>

                          {todo.dueDate && (
                            <div className="info-item">
                              <h3 className="section-label">DUE DATE</h3>
                              <div className="info-content">
                                <span className="info-value">{new Date(todo.dueDate).toLocaleDateString()}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Subtasks */}
                      {todo.subtasks && todo.subtasks.length > 0 && (
                        <div className="subtasks">
                          <h3 className="section-label">SUBTASKS</h3>
                          <div className="subtasks-list">
                            {todo.subtasks.map((subtask: { id: string; text: string; completed: boolean }) => (
                              <div key={subtask.id} className="subtask-item">
                                <span className="subtask-text" style={{
                                  textDecoration: subtask.completed ? 'line-through' : 'none',
                                  opacity: subtask.completed ? 0.6 : 1
                                }}>
                                  {subtask.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="modal-footer">
                      <span className="modal-meta">
                        Created on {new Date(todo.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {showArchiveModal && (
        <div
          onClick={() => setShowArchiveModal(false)}
          style={{
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
            animation: "fadeIn 0.2s ease-out forwards",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#FFFBF1",
              padding: "24px",
              borderRadius: "16px",
              border: "3px solid #1F0741",
              width: "90%",
              maxWidth: "800px",
              maxHeight: "80vh",
              overflowY: "auto",
              position: "relative"
            }}
          >
            <button
              onClick={() => setShowArchiveModal(false)}
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

            <h2 style={{
              color: "#1F0741",
              margin: "0 0 20px 0",
              fontSize: "24px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}>
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ color: "#1F0741" }}
              >
                <path
                  d="M3 7V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 7L7 3H17L21 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 11H15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 15H15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Archive ({archivedTodos.length} items)
            </h2>

            {archivedTodos.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "#1F0741",
                opacity: 0.7
              }}>
                <div style={{ marginBottom: "16px", display: "flex", justifyContent: "center" }}>
                  <svg
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ color: "#1F0741", opacity: 0.5 }}
                  >
                    <path
                      d="M3 7V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M3 7L7 3H17L21 7"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 11H15"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 15H15"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 19V19.01"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p style={{ fontSize: "18px", margin: 0 }}>No archived tasks yet</p>
                <p style={{ fontSize: "14px", margin: "8px 0 0 0" }}>
                  Completed tasks will appear here when archived
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {archivedTodos.map((todo) => (
                  <div
                    key={todo.id}
                    style={{
                      display: "flex",
                      background: "#FFFBF1",
                      border: "2px solid #1F0741",
                      borderRadius: "10px",
                      padding: "16px",
                      alignItems: "center",
                      gap: "12px"
                    }}
                  >
                    <div
                      style={{
                        width: "6px",
                        height: "40px",
                        backgroundColor: getPriorityColor(todo.priority),
                        borderRadius: "3px",
                        flexShrink: 0
                      }}
                    />

                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "8px"
                      }}>
                        <div>
                          <strong style={{
                            fontSize: "16px",
                            color: "#1F0741",
                            textDecoration: "line-through",
                            opacity: 0.7
                          }}>
                            {todo.text}
                          </strong>
                          <div style={{
                            fontSize: "14px",
                            color: "#1F0741",
                            opacity: 0.6,
                            marginTop: "4px"
                          }}>
                            {todo.subject}
                          </div>
                        </div>
                        <div style={{
                          fontSize: "12px",
                          color: "#1F0741",
                          opacity: 0.5,
                          textAlign: "right"
                        }}>
                          <div>Archived</div>
                          <div>{new Date(todo.archivedAt!).toLocaleDateString()}</div>
                        </div>
                      </div>

                      {todo.description && (
                        <div style={{
                          fontSize: "14px",
                          color: "#1F0741",
                          opacity: 0.6,
                          fontStyle: "italic"
                        }}>
                          {todo.description}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                      <button
                        onClick={() => restoreTodo(todo)}
                        style={{
                          backgroundColor: "#1DB815",
                          color: "#FFFFFF",
                          border: "2px solid #1F0741",
                          borderRadius: "8px",
                          padding: "8px 12px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "bold",
                          transition: "all 0.2s ease",
                          transform: "translateY(0)",
                          boxShadow: "0 2px 0 0 #1F0741"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(2px)";
                          e.currentTarget.style.boxShadow = "0 0 0 0 #1F0741";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 2px 0 0 #1F0741";
                        }}
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => permanentlyDeleteArchived(todo)}
                        style={{
                          backgroundColor: "#D41B1B",
                          color: "#FFFFFF",
                          border: "2px solid #1F0741",
                          borderRadius: "8px",
                          padding: "8px 12px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "bold",
                          transition: "all 0.2s ease",
                          transform: "translateY(0)",
                          boxShadow: "0 2px 0 0 #1F0741"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(2px)";
                          e.currentTarget.style.boxShadow = "0 0 0 0 #1F0741";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 2px 0 0 #1F0741";
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              backgroundColor: toast.type === "add" ? "#ffb703" :
                toast.type === "delete" ? "#D41B1B" :
                  toast.type === "archive" ? "#1DB815" :
                    toast.type === "restore" ? "#ffb703" : "#1F0741",
              color: toast.type === "add" || toast.type === "restore" ? "#1F0741" : "#FFFFFF",
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
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes fadeOut {
            from {
              opacity: 1;
            }
            to {
              opacity: 0;
            }
          }

          @keyframes slideIn {
            from {
              transform: scale(0.95) translateY(10px);
              opacity: 0;
            }
            to {
              transform: scale(1) translateY(0);
              opacity: 1;
            }
          }

          @keyframes slideOut {
            from {
              transform: scale(1) translateY(0);
              opacity: 1;
            }
            to {
              transform: scale(0.95) translateY(10px);
              opacity: 0;
            }
          }

          .subtask-item {
            animation: slideInRight 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }

          .subtask-exit {
            animation: slideOutLeft 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards !important;
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

          @keyframes fadeInUp {
            0% { 
              opacity: 0; 
              transform: translateY(20px);
            }
            100% { 
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }

          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
          }

          .modal-content {
            background-color: #FFFBF1;
            padding: 24px;
            border-radius: 12px;
            border: 3px solid #1F0741;
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
          }

          .modal-inner {
            display: flex;
            flex-direction: column;
          }

          .modal-content-wrapper {
            display: flex;
            flex-direction: column;
            gap: 24px;
          }

          .modal-title {
            color: #1F0741;
            margin: 0 0 24px 0;
            font-size: 24px;
            font-weight: bold;
            padding-right: 32px;
            line-height: 1.3;
          }

          .main-info {
            display: flex;
            flex-direction: column;
            gap: 24px;
          }

          .section-label {
            color: #1F0741;
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 8px 0;
          }

          .description {
            display: flex;
            flex-direction: column;
          }

          .description-text {
            margin: 0;
            font-size: 15px;
            line-height: 1.5;
            color: #1F0741;
            opacity: 0.9;
            background-color: rgba(31, 7, 65, 0.05);
            padding: 12px;
            border-radius: 8px;
          }

          .task-info {
            display: flex;
            flex-direction: column;
          }

          .info-row {
            display: flex;
            gap: 16px;
          }

          .info-item {
            display: flex;
            flex-direction: column;
            gap: 8px;
            flex: 1;
          }

          .info-content {
            background-color: rgba(31, 7, 65, 0.05);
            padding: 12px;
            border-radius: 8px;
            min-width: 100px;
          }

          .info-value {
            font-size: 15px;
            font-weight: 500;
            color: #1F0741;
          }

          .subtasks {
            display: flex;
            flex-direction: column;
          }

          .subtasks-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 12px;
            background-color: rgba(31, 7, 65, 0.05);
            border-radius: 8px;
          }

          .subtask-item {
            display: flex;
            align-items: center;
            font-size: 15px;
            color: #1F0741;
          }

          .subtask-text {
            color: #1F0741;
          }

          .modal-footer {
            padding-top: 16px;
            border-top: 1px solid rgba(31, 7, 65, 0.1);
            text-align: right;
          }

          .modal-meta {
            font-size: 13px;
            color: #1F0741;
            opacity: 0.6;
          }

          .modal-close-button {
            position: absolute;
            top: 20px;
            right: 20px;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 24px;
            color: #1F0741;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s ease;
            opacity: 0.7;
          }

          .modal-close-button:hover {
            background-color: rgba(31, 7, 65, 0.1);
            opacity: 1;
          }

          .priority-value {
            font-weight: 700 !important;
          }
        `}
      </style>
    </div>
  );
}

export default Todo;
