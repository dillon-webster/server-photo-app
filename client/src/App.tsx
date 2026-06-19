import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { NavBar } from "./components/NavBar";
import { BottomTabBar } from "./components/BottomTabBar";
import { TimelinePage } from "./pages/TimelinePage";
import { MapPage } from "./pages/MapPage";
import { AlbumsPage } from "./pages/AlbumsPage";
import { AlbumDetailPage } from "./pages/AlbumDetailPage";
import { LoginPage } from "./pages/LoginPage";
import { getToken } from "./api";

export default function App() {
  const [authed, setAuthed] = useState(() => !!getToken());

  if (!authed) {
    return <LoginPage onLogin={() => setAuthed(true)} />;
  }

  return (
    <div
      className="min-h-screen bg-neutral-900 text-white"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* Blocks photos from showing through the status bar on mobile */}
      <div
        className="sm:hidden fixed top-0 left-0 right-0 z-50 bg-neutral-900"
        style={{ height: "env(safe-area-inset-top)" }}
      />
      <NavBar onLogout={() => setAuthed(false)} />
      <Routes>
        <Route path="/" element={<TimelinePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/albums" element={<AlbumsPage />} />
        <Route path="/albums/:id" element={<AlbumDetailPage />} />
      </Routes>
      <BottomTabBar />
    </div>
  );
}
