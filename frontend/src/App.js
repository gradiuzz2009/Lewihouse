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
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import TenantPortal from "./pages/TenantPortal";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "./App.css";

function AdminProtected({ children }) {
  const { user } = useAuth();
  if (user === null)
    return (
      <div className="min-h-screen grid place-items-center bg-bg" data-testid="auth-loading">
        <p className="font-serif text-primary text-lg animate-pulse">Lewi House</p>
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "tenant") return <Navigate to="/portal" replace />;
  return children;
}

function TenantProtected({ children }) {
  const { user } = useAuth();
  if (user === null)
    return (
      <div className="min-h-screen grid place-items-center bg-bg" data-testid="auth-loading">
        <p className="font-serif text-primary text-lg animate-pulse">Lewi House</p>
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "tenant") return <Navigate to="/" replace />;
  return children;
}

function PostLoginRedirect() {
  const { user } = useAuth();
  if (user === null)
    return (
      <div className="min-h-screen grid place-items-center bg-bg">
        <p className="font-serif text-primary text-lg animate-pulse">Lewi House</p>
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "tenant") return <Navigate to="/portal" replace />;
  return <Dashboard />;
}

function Shell() {
  const loc = useLocation();
  const { user } = useAuth();
  const isLogin = loc.pathname === "/login";
  const isPortal = loc.pathname.startsWith("/portal");
  const showAdminNav = !isLogin && !isPortal && user && user.role !== "tenant";

  return (
    <div
      className={`${isPortal ? "" : "max-w-md"} mx-auto min-h-screen bg-bg relative ${showAdminNav ? "pb-24" : ""} shadow-lifted overflow-x-hidden`}
      data-testid="app-shell"
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PostLoginRedirect />} />
        <Route path="/rooms" element={<AdminProtected><Rooms /></AdminProtected>} />
        <Route path="/tenants" element={<AdminProtected><Tenants /></AdminProtected>} />
        <Route path="/bills" element={<AdminProtected><Bills /></AdminProtected>} />
        <Route path="/complaints" element={<AdminProtected><Complaints /></AdminProtected>} />
        <Route path="/access" element={<AdminProtected><Access /></AdminProtected>} />
        <Route path="/activity" element={<AdminProtected><Activity /></AdminProtected>} />
        <Route path="/chat" element={<AdminProtected><Chat /></AdminProtected>} />
        <Route path="/portal" element={<TenantProtected><TenantPortal /></TenantProtected>} />
        <Route path="/portal/*" element={<TenantProtected><TenantPortal /></TenantProtected>} />
      </Routes>
      {showAdminNav && <BottomNav />}
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
