import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import api from "../api/client";

const STORAGE_KEY = "shoporaUser";

const AuthContext = createContext(null);

/**
 * Reads the remembered session. Only the user id is ever trusted from storage:
 * everything else (name, email, cart id) is re-fetched from the API, which is
 * what stops a stale localStorage entry from keeping the wrong person "logged
 * in" or pointing the cart at somebody else's CartId.
 */
function readStoredUserId() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    const userId = Number(parsed?.userId);

    return Number.isInteger(userId) && userId > 0 ? userId : null;
  } catch {
    return null;
  }
}

function writeStoredUser(user) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {
    // Storage can be unavailable (private mode). The app still works for the
    // current tab, the session just will not survive a reload.
  }
}

function clearStoredUser() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do.
  }
}

export function AuthProvider({ children }) {
  // null = guest. Undefined is never used, so `user === null` always means
  // "browsing as a guest" and nothing else.
  const [user, setUser] = useState(null);

  // Until the remembered session has been checked against the API we do not
  // know whether this visitor is a guest or a returning customer.
  const [initializing, setInitializing] = useState(true);

  // Login / register prompt shown when a guest triggers a protected action.
  const [prompt, setPrompt] = useState(null);

  // Action to replay once the visitor has signed in.
  const pendingActionRef = useRef(null);

  // ---- Session validation on startup ---------------------------------
  useEffect(() => {
    let cancelled = false;

    const validateSession = async () => {
      const storedUserId = readStoredUserId();

      if (!storedUserId) {
        clearStoredUser();

        if (!cancelled) {
          setInitializing(false);
        }

        return;
      }

      try {
        const freshUser = await api.getCurrentUser(storedUserId);

        if (cancelled) {
          return;
        }

        writeStoredUser(freshUser);
        setUser(freshUser);
      } catch (error) {
        // A 404 means the account no longer exists, so the session is dropped.
        // A network failure leaves the visitor as a guest rather than trusting
        // unverified data, and the stored id is kept so the next successful
        // load can restore the session.
        if (error?.status && error.status !== 0) {
          clearStoredUser();
        }

        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setInitializing(false);
        }
      }
    };

    validateSession();

    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Prompt handling -----------------------------------------------

  /**
   * Asks a guest to sign in before an action runs. The action is remembered and
   * replayed automatically afterwards, so the visitor never has to click the
   * same button twice.
   */
  const requireAuth = useCallback(
    ({ message, mode = "login", action } = {}) => {
      pendingActionRef.current = action || null;

      setPrompt({
        mode,
        message: message || "Please sign in to continue.",
      });
    },
    []
  );

  const closePrompt = useCallback(() => {
    pendingActionRef.current = null;
    setPrompt(null);
  }, []);

  const setPromptMode = useCallback((mode) => {
    setPrompt((current) => (current ? { ...current, mode } : current));
  }, []);

  const runPendingAction = useCallback(async (signedInUser) => {
    const action = pendingActionRef.current;

    pendingActionRef.current = null;

    if (typeof action === "function") {
      try {
        await action(signedInUser);
      } catch (error) {
        console.error("Pending action failed after sign in:", error);
      }
    }
  }, []);

  // ---- Auth actions ---------------------------------------------------

  const login = useCallback(
    async (email, password) => {
      const signedInUser = await api.login(email, password);

      writeStoredUser(signedInUser);
      setUser(signedInUser);
      setPrompt(null);

      return signedInUser;
    },
    []
  );

  const register = useCallback(async (details) => {
    const newUser = await api.register(details);

    writeStoredUser(newUser);
    setUser(newUser);
    setPrompt(null);

    return newUser;
  }, []);

  const logout = useCallback(() => {
    clearStoredUser();
    pendingActionRef.current = null;
    setPrompt(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      userId: user?.userId ?? null,
      isAuthenticated: Boolean(user),
      initializing,
      prompt,
      login,
      register,
      logout,
      requireAuth,
      closePrompt,
      setPromptMode,
      runPendingAction,
    }),
    [
      user,
      initializing,
      prompt,
      login,
      register,
      logout,
      requireAuth,
      closePrompt,
      setPromptMode,
      runPendingAction,
    ]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }

  return context;
}

export default AuthContext;
