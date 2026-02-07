import React, { createContext, useEffect, useState } from "react";
import type { TopTrack } from "../types/topTrack";

type AuthContextType = {
  token: string;
  userInfo: any | null;
  topTrack: TopTrack | null;
  login: () => void;
  logout: () => void;
  getTopTracks: () => Promise<void>;
  setToken: (t: string) => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string>("");
  const [userInfo, setUserInfo] = useState<any | null>(null);
  const [topTrack, setTopTrack] = useState<TopTrack | null>(null);

  // parse token from URL on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token");
    if (accessToken) {
      setToken(accessToken);
      // remove token from URL so it isn't visible in history
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname +
          window.location.search
            .replace(/access_token=[^&]*/, "")
            .replace(/(^\?|&)+$/, "")
      );
    }
  }, []);

  // auto-fetch profile when token becomes available
  useEffect(() => {
    if (token) {
      (async () => {
        try {
          const res = await fetch("https://api.spotify.com/v1/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) return;
          const data = await res.json();
          setUserInfo(data);
        } catch (err) {
          console.error("Error fetching profile", err);
        }
      })();
    }
  }, [token]);

  const login = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/login`;
  };

  const logout = () => {
    setToken("");
    setUserInfo(null);
    setTopTrack(null);
  };

  const getTopTracks = async () => {
    if (!token) return;
    const requestTracks =
      "https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=50";
    const res = await fetch(requestTracks, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setTopTrack(data);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        userInfo,
        topTrack,
        login,
        logout,
        getTopTracks,
        setToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
