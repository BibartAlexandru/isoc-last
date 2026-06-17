import { createContext, useContext, useState } from "react";

interface AuthContext {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const Context = createContext<AuthContext | null>(null);

export function AuthProvider({ children }: any) {
  const [token, setToken] = useState(localStorage.getItem("token"));

  function login(t: string) {
    localStorage.setItem("token", t);
    setToken(t);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
  }

  return (
    <Context.Provider
      value={{
        token,
        login,
        logout,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useAuth() {
  return useContext(Context)!;
}
