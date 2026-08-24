import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import BottomNav from "./components/BottomNav";
import Dashboard from "./pages/Dashboard";
import Rooms from "./pages/Rooms";
import Tenants from "./pages/Tenants";
import Bills from "./pages/Bills";
import Complaints from "./pages/Complaints";
import Access from "./pages/Access";
import Activity from "./pages/Activity";
import Login from "./pages/Login";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "./App.css";

function Protected({ children }) {
  const { user } = useAuth();
  if (user === null)
    return (
      <div className="min-h-screen grid place-items-center bg-bg" data-testid="auth-loading">
        <p className="font-serif text-primary text-lg animate-pulse">Lewi House</p>
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Shell() {
  const loc = useLocation();
  const isLogin = loc.pathname === "/login";
  return (
    <div
      className="max-w-md mx-auto min-h-screen bg-bg relative pb-24 shadow-lifted overflow-x-hidden"
      data-testid="app-shell"
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Protected><Dashboard /></Protected>} />
        <Route path="/rooms" element={<Protected><Rooms /></Protected>} />
        <Route path="/tenants" element={<Protected><Tenants /></Protected>} />
        <Route path="/bills" element={<Protected><Bills /></Protected>} />
        <Route path="/complaints" element={<Protected><Complaints /></Protected>} />
        <Route path="/access" element={<Protected><Access /></Protected>} />
        <Route path="/activity" element={<Protected><Activity /></Protected>} />
      </Routes>
      {!isLogin && <BottomNav />}
      <Toaster
        position="bottom-center"
        offset={90}
        toastOptions={{
          style: {
            background: "#1A362B",
            color: "#FDFBF7",
            border: "none",
            borderRadius: "16px",
            fontFamily: "Manrope",
          },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
