import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("sa_token"));
  const [admin, setAdmin] = useState(() => {
    const a = localStorage.getItem("sa_admin");
    return a ? JSON.parse(a) : null;
  });

  const login = (adminData, authToken) => {
    localStorage.setItem("sa_token", authToken);
    localStorage.setItem("sa_admin", JSON.stringify(adminData));
    setToken(authToken);
    setAdmin(adminData);
  };

  const logout = () => {
    localStorage.removeItem("sa_token");
    localStorage.removeItem("sa_admin");
    setToken(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ token, admin, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};