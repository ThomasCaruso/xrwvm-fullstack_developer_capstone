import React, { useState } from "react";

import Header from "../Header/Header";
import "./Login.css";

const Login = () => {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submitLogin = async (event) => {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);

    try {
      const response = await fetch("/djangoapp/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, password }),
      });
      const result = await response.json();

      if (!response.ok || result.status !== "Authenticated") {
        setMessage(result.error || "The username or password is incorrect.");
        return;
      }

      sessionStorage.setItem("username", result.userName);
      sessionStorage.setItem("firstname", result.firstName || "");
      sessionStorage.setItem("lastname", result.lastName || "");
      window.location.assign("/dealers/");
    } catch {
      setMessage("The login service is unavailable.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <Header />
      <main className="login-card">
        <section className="login-copy">
          <p className="login-eyebrow">Member access</p>
          <h1>Welcome back</h1>
          <p>Sign in to publish reviews and share your dealership experience.</p>
        </section>

        <form className="login-form" onSubmit={submitLogin}>
          <label>
            Username
            <input
              required
              autoFocus
              autoComplete="username"
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
            />
          </label>

          <label>
            Password
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {message && <div className="login-message" role="alert">{message}</div>}

          <button type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </button>
          <p className="login-switch">
            New to Best Cars? <a href="/register/">Create an account</a>
          </p>
        </form>
      </main>
    </div>
  );
};

export default Login;
