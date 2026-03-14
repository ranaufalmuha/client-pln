import * as React from "react";

export type Navigate = (to: string) => void;
export type AuthUser = {
  id: number;
  email: string;
  isAdmin: boolean;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

type AppRouterContextValue = {
  pathname: string;
  navigate: Navigate;
  isAuthenticated: boolean;
  token: string | null;
  currentUser: AuthUser | null;
  signIn: (session: AuthSession) => void;
  signOut: () => void;
};

type AppRouterProviderProps = {
  value: AppRouterContextValue;
  children: React.ReactNode;
};

export const AUTH_STORAGE_KEY = "pln-client:is-authenticated";
export const JWT_STORAGE_KEY = "pln-client:jwt";
export const USER_STORAGE_KEY = "pln-client:user";
export const REDIRECT_AFTER_LOGIN_KEY = "pln-client:redirect-after-login";
export const PUBLIC_ROUTES = new Set(["/auth/signin", "/auth/signup"]);

const AppRouterContext = React.createContext<AppRouterContextValue | null>(null);

export function AppRouterProvider({
  value,
  children,
}: AppRouterProviderProps) {
  return (
    <AppRouterContext.Provider value={value}>
      {children}
    </AppRouterContext.Provider>
  );
}

export function useAppRouter() {
  const context = React.useContext(AppRouterContext);

  if (!context) {
    throw new Error("useAppRouter must be used within an AppRouterProvider.");
  }

  return context;
}
