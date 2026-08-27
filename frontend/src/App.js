import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import BottomNav from "./components/BottomNav";
import SpeedDial from "./components/SpeedDial";
import Dashboard from "./pages/Dashboard";
import Rooms from "./pages/Rooms";
import Tenants from "./pages/Tenants";
import Bills from "./pages/Bills";
import Complaints from "./pages/Complaints";
import Access from "./pages/Access";
import Activity from "./pages/Activity";
import Chat from "./pages/Chat";
import Staff from "./pages/Staff";
import Login from "./pages/Login";
import TenantPortal from "./pages/TenantPortal";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LangProvider } from "./i18n";
import { RouteErrorBoundary } from "./components/ErrorBoundary";
import "./App.css";

function AdminProtected({ children, title }) {
  const { user } = useAuth();
  if (user === null)
    return (
      <div className="min-h-screen grid place-items-center bg-bg" data-testid="auth-loading">
        <p className="font-serif text-primary text-lg animate-pulse">Lewi House</p>
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "tenant") return <Navigate to="/portal" replace />;
  return <RouteErrorBoundary title={title}>{children}</RouteErrorBoundary>;
}

function TenantProtected({ children, title }) {
  const { user } = useAuth();
  if (user === null)
    return (
      <div className="min-h-screen grid place-items-center bg-bg" data-testid="auth-loading">
        <p className="font-serif text-primary text-lg animate-pulse">Lewi House</p>
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "tenant") return <Navigate to="/" replace />;
  return <RouteErrorBoundary title={title}>{children}</RouteErrorBoundary>;
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
  return <RouteErrorBoundary title="Dashboard"><Dashboard /></RouteErrorBoundary>;
}

function Shell() {
  const loc = useLocation();
  const { user } = useAuth();
  const isLogin = loc.pathname === "/login";
  const isPortal = loc.pathname.startsWith("/portal");
  const showAdminNav = !isLogin && !isPortal && user && user.role !== "tenant";

  return (
    <div
      className="w-full max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto min-h-screen bg-bg relative main-content-scroll shadow-lifted overflow-x-hidden"
      data-testid="app-shell"
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PostLoginRedirect />} />
        <Route path="/rooms" element={<AdminProtected title="Kamar"><Rooms /></AdminProtected>} />
        <Route path="/tenants" element={<AdminProtected title="Penghuni"><Tenants /></AdminProtected>} />
        <Route path="/bills" element={<AdminProtected title="Tagihan"><Bills /></AdminProtected>} />
        <Route path="/complaints" element={<AdminProtected title="Perbaikan"><Complaints /></AdminProtected>} />
        <Route path="/access" element={<AdminProtected title="Akses & Token"><Access /></AdminProtected>} />
        <Route path="/activity" element={<AdminProtected title="Riwayat Aktivitas"><Activity /></AdminProtected>} />
        <Route path="/chat" element={<AdminProtected title="Chat Penghuni"><Chat /></AdminProtected>} />
        <Route path="/staff" element={<AdminProtected title="Manajemen Staff"><Staff /></AdminProtected>} />
        <Route path="/portal" element={<TenantProtected title="Portal Penghuni"><TenantPortal /></TenantProtected>} />
        <Route path="/portal/*" element={<TenantProtected title="Portal Penghuni"><TenantPortal /></TenantProtected>} />
      </Routes>
      {showAdminNav && <BottomNav />}
      {showAdminNav && <SpeedDial />}
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
    <LangProvider>
      <AuthProvider>
        <BrowserRouter>
          <Shell />
        </BrowserRouter>
      </AuthProvider>
    </LangProvider>
  );
}

export default App;
