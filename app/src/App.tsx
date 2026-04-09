import * as React from "react";

import AppLayout from "./app/layout";
import { getMe } from "./shared/lib/api";
import {
  AppRouterProvider,
  AUTH_STORAGE_KEY,
  JWT_STORAGE_KEY,
  PUBLIC_ROUTES,
  REDIRECT_AFTER_LOGIN_KEY,
  USER_STORAGE_KEY,
  type AuthSession,
  type AuthUser,
  type Navigate,
  useAppRouter,
} from "./shared/lib/app-router";
import { OfflineProvider } from "./shared/lib/offline-hooks";

type RouteComponent = React.ComponentType;
type PageModule = {
  default: RouteComponent;
};

const pageModules = import.meta.glob<PageModule>("./app/**/page.tsx", {
  eager: true,
});

function routeFromFilePath(filePath: string) {
  const routePath = filePath.replace("./app", "").replace(/\/page\.tsx$/, "");
  return routePath === "" ? "/" : routePath;
}

function createRoutes() {
  const discoveredRoutes: Record<string, RouteComponent> = {};

  for (const [filePath, module] of Object.entries(pageModules)) {
    discoveredRoutes[routeFromFilePath(filePath)] = module.default;
  }

  return discoveredRoutes;
}

const routes = createRoutes();
const ADMIN_ROUTE_PREFIX = "/admin";

function normalizePath(pathname: string) {
  if (pathname !== "/" && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function resolvePathname(
  pathname: string,
  isAuthenticated: boolean,
  currentUser: AuthUser | null,
  isSessionSyncing: boolean,
) {
  if (isAuthenticated && PUBLIC_ROUTES.has(pathname)) {
    return "/";
  }

  if (!isAuthenticated && !PUBLIC_ROUTES.has(pathname)) {
    return "/auth/signin";
  }

  if (
    pathname.startsWith(ADMIN_ROUTE_PREFIX) &&
    !isSessionSyncing &&
    (!currentUser || !currentUser.isAdmin)
  ) {
    return "/";
  }

  return pathname;
}

function readStoredUser() {
  const raw = window.localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function NotFoundPage() {
  const { navigate } = useAppRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-medium text-muted-foreground">Route not found</p>
      <h1 className="text-3xl font-semibold tracking-tight">This page does not exist.</h1>
      <button
        type="button"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        onClick={() => navigate("/")}
      >
        Back to dashboard
      </button>
    </div>
  );
}

export default function App() {
  const [pathname, setPathname] = React.useState(() =>
    normalizePath(window.location.pathname),
  );
  const [token, setToken] = React.useState<string | null>(() =>
    window.localStorage.getItem(JWT_STORAGE_KEY),
  );
  const [currentUser, setCurrentUser] = React.useState<AuthUser | null>(() =>
    readStoredUser(),
  );
  const [isSessionSyncing, setIsSessionSyncing] = React.useState(false);

  const isAuthenticated = token !== null;

  const commitNavigation = React.useCallback(
    (to: string, replace = false) => {
      const nextPath = normalizePath(to);

      if (nextPath === pathname) {
        return;
      }

      if (replace) {
        window.history.replaceState({}, "", nextPath);
      } else {
        window.history.pushState({}, "", nextPath);
        window.scrollTo(0, 0);
      }

      setPathname(nextPath);
    },
    [pathname],
  );

  React.useEffect(() => {
    const handlePopState = () => {
      setPathname(normalizePath(window.location.pathname));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  React.useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === JWT_STORAGE_KEY || event.key === USER_STORAGE_KEY) {
        setToken(window.localStorage.getItem(JWT_STORAGE_KEY));
        setCurrentUser(readStoredUser());
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Background session sync - validates token periodically but doesn't block UI
  React.useEffect(() => {
    if (!token) {
      setIsSessionSyncing(false);
      return;
    }

    let cancelled = false;
    
    // Only show syncing state on initial app load (when user data not in memory yet)
    const shouldBlockNavigation = currentUser === null;
    if (shouldBlockNavigation) {
      setIsSessionSyncing(true);
    }

    const syncSession = async () => {
      try {
        const me = await getMe(token);
        if (cancelled) {
          return;
        }

        setCurrentUser(me);
        window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(me));
      } catch {
        if (cancelled) {
          return;
        }

        // Only logout if we're not in the middle of a fresh login
        // This prevents race conditions during sign in
        const storedToken = window.localStorage.getItem(JWT_STORAGE_KEY);
        if (storedToken === token) {
          window.localStorage.removeItem(JWT_STORAGE_KEY);
          window.localStorage.removeItem(USER_STORAGE_KEY);
          window.localStorage.removeItem(AUTH_STORAGE_KEY);
          setToken(null);
          setCurrentUser(null);
          commitNavigation("/auth/signin", true);
        }
      } finally {
        if (!cancelled) {
          setIsSessionSyncing(false);
        }
      }
    };

    // Run sync in background - don't block user interaction
    void syncSession();

    return () => {
      cancelled = true;
    };
  }, [commitNavigation, token]);

  const navigate: Navigate = React.useCallback(
    (to) => {
      commitNavigation(to);
    },
    [commitNavigation],
  );

  const signIn = React.useCallback(
    (session: AuthSession) => {
      // Save session immediately
      window.localStorage.setItem(JWT_STORAGE_KEY, session.token);
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(session.user));
      window.localStorage.setItem(AUTH_STORAGE_KEY, "true");

      setToken(session.token);
      setCurrentUser(session.user);
      
      // Mark session as synced since we have valid user data from login
      // This prevents the route resolver from blocking navigation
      setIsSessionSyncing(false);

      const redirectPath = window.sessionStorage.getItem(REDIRECT_AFTER_LOGIN_KEY);
      window.sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY);

      // Navigate immediately - don't wait for background sync
      if (redirectPath && !PUBLIC_ROUTES.has(redirectPath)) {
        commitNavigation(redirectPath, true);
        return;
      }

      commitNavigation("/", true);
    },
    [commitNavigation],
  );

  const signOut = React.useCallback(() => {
    window.localStorage.removeItem(JWT_STORAGE_KEY);
    window.localStorage.removeItem(USER_STORAGE_KEY);
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY);

    setToken(null);
    setCurrentUser(null);
    commitNavigation("/auth/signin", true);
  }, [commitNavigation]);

  const activePathname = resolvePathname(
    pathname,
    isAuthenticated,
    currentUser,
    isSessionSyncing,
  );

  React.useEffect(() => {
    if (activePathname === pathname) {
      return;
    }

    if (!isAuthenticated && !PUBLIC_ROUTES.has(pathname)) {
      window.sessionStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, pathname);
    }

    commitNavigation(activePathname, true);
  }, [activePathname, commitNavigation, isAuthenticated, pathname]);

  const Page = routes[activePathname] ?? NotFoundPage;
  const routerValue = React.useMemo(
    () => ({
      pathname: activePathname,
      navigate,
      isAuthenticated,
      token,
      currentUser,
      signIn,
      signOut,
    }),
    [activePathname, currentUser, isAuthenticated, navigate, signIn, signOut, token],
  );

  return (
    <AppLayout>
      <AppRouterProvider value={routerValue}>
        <OfflineProvider token={token}>
          <Page />
        </OfflineProvider>
      </AppRouterProvider>
    </AppLayout>
  );
}
