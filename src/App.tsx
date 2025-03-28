import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Assignments from './pages/Assignments';
import Planner from './pages/Planner';
import Todo from './pages/Todo';
import Sidebar from './components/Sidebar';

function App() {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ flexGrow: 1, padding: '1rem' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assignments" element={<Assignments />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/todo" element={<Todo />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
