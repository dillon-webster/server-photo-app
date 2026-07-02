import { useState } from "react";
import { api, setToken } from "../api";

export function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token } = isRegister
        ? await api.auth.register(username, password)
        : await api.auth.login(username, password);
      setToken(token);
      onLogin();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isRegister
            ? "Could not create account"
            : "Incorrect username or password"
      );
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode(isRegister ? "login" : "register");
    setError("");
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-full max-w-xs animate-slide-up"
      >
        <div className="flex flex-col items-center gap-3 mb-2">
          <div className="w-16 h-16 rounded-2xl bg-accent/15 flex items-center justify-center shadow-lg shadow-accent/10">
            <svg className="w-8 h-8 text-accent-bright" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">Photos</h1>
        </div>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
          autoCapitalize="none"
          autoCorrect="off"
          className="bg-neutral-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent/50 transition-shadow"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={isRegister ? "new-password" : "current-password"}
          className="bg-neutral-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent/50 transition-shadow"
        />
        {error && <p className="text-red-400 text-sm text-center animate-fade-in">{error}</p>}
        <button
          type="submit"
          disabled={loading || !username || !password}
          className="bg-accent hover:bg-accent-bright text-white font-medium rounded-xl px-4 py-3 disabled:opacity-40 cursor-pointer transition-colors tap"
        >
          {loading
            ? isRegister
              ? "Creating account…"
              : "Signing in…"
            : isRegister
              ? "Create account"
              : "Sign in"}
        </button>
        <button
          type="button"
          onClick={switchMode}
          className="text-neutral-400 hover:text-white text-sm text-center transition-colors cursor-pointer"
        >
          {isRegister ? "Already have an account? Sign in" : "No account? Create one"}
        </button>
      </form>
    </div>
  );
}
