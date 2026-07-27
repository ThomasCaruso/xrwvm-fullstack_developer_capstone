import React, { useState } from "react";

import Header from "../Header/Header";
import "./Register.css";

const Register = () => {
  const [form, setForm] = useState({
    userName: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateField = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const register = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/djangoapp/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "Registration failed.");
        return;
      }

      sessionStorage.setItem("username", result.userName);
      sessionStorage.setItem("firstname", result.firstName || "");
      sessionStorage.setItem("lastname", result.lastName || "");
      window.location.assign("/dealers/");
    } catch (error) {
      setMessage("The registration service is unavailable.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <Header />
      <main className="auth-card">
        <div className="auth-copy">
          <p className="eyebrow">Create an account</p>
          <h1>Join Best Cars</h1>
          <p>Register to post verified dealership reviews and help other buyers.</p>
        </div>

        <form onSubmit={register} className="auth-form">
          <label>
            Username
            <input
              required
              name="userName"
              autoComplete="username"
              value={form.userName}
              onChange={updateField}
            />
          </label>

          <div className="field-row">
            <label>
              First name
              <input
                required
                name="firstName"
                autoComplete="given-name"
                value={form.firstName}
                onChange={updateField}
              />
            </label>
            <label>
              Last name
              <input
                required
                name="lastName"
                autoComplete="family-name"
                value={form.lastName}
                onChange={updateField}
              />
            </label>
          </div>

          <label>
            Email
            <input
              required
              type="email"
              name="email"
              autoComplete="email"
              value={form.email}
              onChange={updateField}
            />
          </label>

          <label>
            Password
            <input
              required
              minLength="8"
              type="password"
              name="password"
              autoComplete="new-password"
              value={form.password}
              onChange={updateField}
            />
          </label>

          {message && <div className="form-message" role="alert">{message}</div>}

          <button type="submit" disabled={submitting}>
            {submitting ? "Creating account..." : "Create account"}
          </button>
          <p className="auth-switch">
            Already registered? <a href="/login/">Sign in</a>
          </p>
        </form>
      </main>
    </div>
  );
};

export default Register;
