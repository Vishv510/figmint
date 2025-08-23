import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { CanvasProvider } from "./context/CanvasContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { useAuth } from "./hooks/useAuth.js";

import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import DashBoard from "./pages/Dashboard.jsx";
import "./App.css";
import { Canvas } from "./pages/Canvas.jsx";

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <CanvasProvider>
        <Router>
          <Routes>
            <Route path="/" element={<DashBoard/>} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/canvas"
              element={
                <PrivateRoute>
                  <Canvas />
                </PrivateRoute>
              }
            />
          </Routes>
        </Router>
      </CanvasProvider>
    </AuthProvider>
  );
}