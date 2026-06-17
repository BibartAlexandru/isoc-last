import { createContext, useContext, useState } from "react";

interface AuthContext {
  token: string | null;
  userId: number | null;
  userName: string | null;
  login: (token: string) => void;
  logout: () => void;
}

function decodeToken(token: string | null): { userId: number | null; userName: string | null } {
  if (!token) return { userId: null, userName: null };
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return { userId: payload.user_id ?? null, userName: payload.name ?? null };
  } catch {
    return { userId: null, userName: null };
  }
}

const Context = createContext<AuthContext | null>(null);

export function AuthProvider({ children }: any) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const { userId, userName } = decodeToken(token);

  function login(t: string) {
    localStorage.setItem("token", t);
    setToken(t);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
  }

  return (
    <Context.Provider value={{ token, userId, userName, login, logout }}>
      {children}
    </Context.Provider>
  );
}

export function useAuth() {
  return useContext(Context)!;
}
