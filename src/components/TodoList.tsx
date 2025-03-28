type TodoItem = {
    id: number;
    text: string;
    completed: boolean;
  };
  
  const mockTodos: TodoItem[] = [
    { id: 1, text: "physics homework", completed: false },
    { id: 2, text: "math assignment", completed: false },
    { id: 3, text: "cs zybook", completed: false },
    { id: 4, text: "presentation slides", completed: false },
  ];
  
  function TodoList() {
    return (
      <div style={{ backgroundColor: "#f0f0f0", padding: "1rem", borderRadius: "8px" }}>
        <h3>To-Do</h3>
        <ul style={{ paddingLeft: "1rem" }}>
          {mockTodos.map((todo) => (
            <li key={todo.id}>
              <input type="checkbox" checked={todo.completed} readOnly />{" "}
              {todo.text}
            </li>
          ))}
        </ul>
        <button style={{ marginTop: "1rem" }}>View To-Do’s</button>
      </div>
    );
  }
  
  export default TodoList;
  