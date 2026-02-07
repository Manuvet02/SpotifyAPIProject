import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { useEffect, useState } from "react";

import Home from "./components/Home";
// @ts-ignore
import History from "./components/History";
import ArtistDetails from "./components/ArtistDetails";
import Artists from "./components/Artists";
import Tracks from "./components/Tracks";
import Tournament from "./components/Tournament";
import SongQuiz from "./components/SongQuiz";
import "./App.css";

function App() {
  const [userInfo, setUserInfo] = useState<any | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/me`, {
        credentials: "include",
      });
      if (res.ok) setUserInfo(await res.json());
    };
    checkAuth();
  }, []);

  const login = () =>
    (window.location.href = `${import.meta.env.VITE_API_URL}/login`);

  const logout = async () => {
    await fetch(`${import.meta.env.VITE_API_URL}/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUserInfo(null);
  };

  return (
    <div className="app-layout">
      <Navbar user={userInfo} onLogin={login} onLogout={logout} />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home userInfo={userInfo} />} />

          <Route
            path="/history"
            element={userInfo ? <History /> : <Navigate to="/" replace />}
          />

          <Route path="/artists" element={<Artists />} />
          <Route path="/tracks" element={<Tracks />} />
          <Route path="/tournament" element={<Tournament />} />
          <Route path="/quiz" element={<SongQuiz />} />

          <Route
            path="/artist/:id"
            element={userInfo ? <ArtistDetails /> : <Navigate to="/" replace />}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Footer />
      </main>
    </div>
  );
}

export default App;
