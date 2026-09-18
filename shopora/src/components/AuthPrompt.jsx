import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { STORE } from "../config/store";

/**
 * The login / register dialog that appears when a guest tries to do something
 * that needs an account. Whatever they were trying to do is replayed as soon as
 * they are signed in, so the action is never lost.
 */
function AuthPrompt() {
  const {
    prompt,
    login,
    register,
    closePrompt,
    setPromptMode,
    runPendingAction,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isOpen = Boolean(prompt);
  const mode = prompt?.mode || "login";

  // Reset the form whenever the dialog opens or the mode changes.
  useEffect(() => {
    if (isOpen) {
      setError("");
      setPassword("");
    }
  }, [isOpen, mode]);

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKey = (event) => {
      if (event.key === "Escape" && !submitting) {
        closePrompt();
      }
    };

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, submitting, closePrompt]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSubmitting(true);
    setError("");

    try {
      const signedInUser =
        mode === "register"
          ? await register({ name, phone, email, password })
          : await login(email, password);

      // Replay whatever the visitor was trying to do before being asked to sign in.
      await runPendingAction(signedInUser);
    } catch (err) {
      console.error("Auth prompt error:", err);

      setError(
        err.message ||
          (mode === "register"
            ? "Registration failed. Please try again."
            : "Invalid email or password.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={() => !submitting && closePrompt()}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-prompt-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close"
          onClick={closePrompt}
          disabled={submitting}
          aria-label="Close"
        >
          ×
        </button>

        <div className="modal-head">
          <span className="brand-mark" aria-hidden="true">
            S
          </span>

          <h2 id="auth-prompt-title">
            {mode === "register" ? `Join ${STORE.name}` : "Welcome back"}
          </h2>

          <p className="modal-subtitle">{prompt.message}</p>
        </div>

        <div className="tab-switch" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            className={`tab${mode === "login" ? " tab-active" : ""}`}
            onClick={() => setPromptMode("login")}
          >
            I have an account
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === "register"}
            className={`tab${mode === "register" ? " tab-active" : ""}`}
            onClick={() => setPromptMode("register")}
          >
            I&rsquo;m new here
          </button>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <>
              <div className="field">
                <label htmlFor="prompt-name">Full name</label>
                <input
                  id="prompt-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your full name"
                  required
                  autoComplete="name"
                />
              </div>

              <div className="field">
                <label htmlFor="prompt-phone">Phone</label>
                <input
                  id="prompt-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="03XXXXXXXXX"
                  required
                  autoComplete="tel"
                />
              </div>
            </>
          )}

          <div className="field">
            <label htmlFor="prompt-email">Email</label>
            <input
              id="prompt-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label htmlFor="prompt-password">Password</label>
            <input
              id="prompt-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={
                mode === "register" ? "Create a password" : "Your password"
              }
              required
              minLength={mode === "register" ? 6 : undefined}
              autoComplete={
                mode === "register" ? "new-password" : "current-password"
              }
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={submitting}
          >
            {submitting
              ? "Please wait…"
              : mode === "register"
              ? "Create Account & Continue"
              : "Login & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AuthPrompt;
