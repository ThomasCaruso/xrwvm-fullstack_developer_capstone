import React from "react";

import "../assets/bootstrap.min.css";
import "../assets/style.css";

const Header = () => {
  const username = sessionStorage.getItem("username");

  const logoutUser = async (event) => {
    event.preventDefault();

    try {
      await fetch("/djangoapp/logout", { method: "GET" });
    } finally {
      sessionStorage.removeItem("username");
      sessionStorage.removeItem("firstname");
      sessionStorage.removeItem("lastname");
      window.location.assign("/");
    }
  };

  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Primary navigation">
        <a className="brand" href="/">Best Cars</a>

        <div className="primary-links">
          <a href="/">Home</a>
          <a href="/about/">About Us</a>
          <a href="/contact/">Contact Us</a>
          <a href="/dealers/">Dealerships</a>
        </div>

        <div className="account-links">
          {username ? (
            <>
              <span className="signed-in-user">{username}</span>
              <a href="/djangoapp/logout" onClick={logoutUser}>Logout</a>
            </>
          ) : (
            <>
              <a href="/login/">Login</a>
              <a className="nav-cta" href="/register/">Register</a>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
