// AuthContext — Global authentication state
// Provides { user, token, login, logout } to every component in the app.
// React Context avoids prop-drilling auth state through many component layers.

import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Initialize from localStorage so auth persists on page refresh
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  // Called after a successful signup/login API call — persists the
  // session in localStorage and updates the in-memory user state.
  function login(token, userData) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook — cleaner than importing useContext + AuthContext everywhere
export function useAuth() {
  return useContext(AuthContext);
}
