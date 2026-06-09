import { Routes, Route } from "react-router-dom";
import { NavBar } from "./components/NavBar";
import { TimelinePage } from "./pages/TimelinePage";
import { MapPage } from "./pages/MapPage";
import { AlbumsPage } from "./pages/AlbumsPage";
import { AlbumDetailPage } from "./pages/AlbumDetailPage";

export default function App() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <NavBar />
      <Routes>
        <Route path="/" element={<TimelinePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/albums" element={<AlbumsPage />} />
        <Route path="/albums/:id" element={<AlbumDetailPage />} />
      </Routes>
    </div>
  );
}
