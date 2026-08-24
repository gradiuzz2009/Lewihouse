import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import BottomNav from "./components/BottomNav";
import Dashboard from "./pages/Dashboard";
import Rooms from "./pages/Rooms";
import Tenants from "./pages/Tenants";
import Bills from "./pages/Bills";
import Complaints from "./pages/Complaints";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div
        className="max-w-md mx-auto min-h-screen bg-bg relative pb-24 shadow-lifted overflow-x-hidden"
        data-testid="app-shell"
      >
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/tenants" element={<Tenants />} />
          <Route path="/bills" element={<Bills />} />
          <Route path="/complaints" element={<Complaints />} />
        </Routes>
        <BottomNav />
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
    </BrowserRouter>
  );
}

export default App;
