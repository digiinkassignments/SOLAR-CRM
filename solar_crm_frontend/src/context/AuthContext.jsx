import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getToken,
  getCurrentUser,
  setToken,
  setUser as setStoredUser,
  logout as clearStorage,
} from "../utils/auth";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setTokenState] = useState(() => getToken());
  const [user, setUserState] = useState(() => getCurrentUser());
  const [loading, setLoading] = useState(true);

  // App init & sync on mount (including ?token= impersonation handoff)
  useEffect(() => {
    const initAuth = async () => {
      // 1. Check if token passed via URL (e.g., from SuperAdmin Impersonation)
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get("token");

      if (urlToken) {
        try {
          // Temporarily store token so API client uses it
          setToken(urlToken);
          const res = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${urlToken}` },
          });
          const data = await res.json();
          if (data?.success && data.user) {
            login(data.user, urlToken, data.subscription);
            // Clean URL query param without reload
            window.history.replaceState({}, document.title, window.location.pathname);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("Impersonation token verification failed:", e);
        }
      }

      // 2. Fallback to localStorage
      const storedToken = getToken();
      const storedUser = getCurrentUser();

      if (storedToken && storedUser) {
        setTokenState(storedToken);
        setUserState(storedUser);
      } else {
        clearStorage();
        setTokenState(null);
        setUserState(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // userData = user object, authToken = JWT, subscription = subscription object from login API
  const login = (userData, authToken, subscription = null) => {
    setToken(authToken);
    setStoredUser(userData);
    setTokenState(authToken);
    setUserState(userData);

    // NEW — subscription status save karo
    localStorage.setItem(
      "subscription_status",
      subscription?.status || "Active"
    );
  };

  const logout = () => {
    clearStorage();
    localStorage.removeItem("subscription_status"); // NEW — logout par clear karo
    setTokenState(null);
    setUserState(null);
  };

  // Granular Permission Check helper
  const hasPermission = (permissionKey) => {
    if (!user) return false;
    // Super Admin (Role 1) has complete bypass
    if (user.role_id === 1) return true;
    const permissions = user.permissions;
    if (Array.isArray(permissions)) {
      return permissions.includes(permissionKey);
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token && !!user,
        hasPermission,
        loading,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};