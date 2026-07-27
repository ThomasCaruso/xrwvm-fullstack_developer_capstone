import React, { useEffect, useMemo, useState } from "react";

import Header from "../Header/Header";
import reviewIcon from "../assets/reviewicon.png";
import "../assets/style.css";
import "./Dealers.css";

const Dealers = () => {
  const [dealers, setDealers] = useState([]);
  const [selectedState, setSelectedState] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isLoggedIn = Boolean(sessionStorage.getItem("username"));

  const states = useMemo(
    () => [...new Set(dealers.map((dealer) => dealer.state))].sort(),
    [dealers],
  );

  const loadDealers = async (state = "All") => {
    setLoading(true);
    setError("");

    const endpoint = state === "All"
      ? "/djangoapp/get_dealers"
      : `/djangoapp/get_dealers/${encodeURIComponent(state)}`;

    try {
      const response = await fetch(endpoint);
      const result = await response.json();

      if (!response.ok || result.status !== 200) {
        throw new Error(result.message || "Unable to load dealerships.");
      }

      setDealers(Array.isArray(result.dealers) ? result.dealers : []);
    } catch (requestError) {
      setDealers([]);
      setError(requestError.message || "Unable to load dealerships.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDealers();
  }, []);

  const changeState = (event) => {
    const state = event.target.value;
    setSelectedState(state);
    loadDealers(state);
  };

  return (
    <div>
      <Header />
      <main className="page-shell">
        <div className="page-heading dealer-heading">
          <div>
            <p className="section-label">Nationwide network</p>
            <h1>Find a dealership</h1>
            <p>Browse locations, filter by state, and read verified customer reviews.</p>
          </div>

          <label className="state-filter">
            <span>Filter by state</span>
            <select value={selectedState} onChange={changeState}>
              <option value="All">All states</option>
              {states.map((state) => (
                <option value={state} key={state}>{state}</option>
              ))}
            </select>
          </label>
        </div>

        {loading && <div className="status-panel">Loading dealerships...</div>}
        {!loading && error && <div className="status-panel error">{error}</div>}

        {!loading && !error && (
          <div className="dealer-table-wrap">
            <table className="dealer-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Dealership</th>
                  <th>City</th>
                  <th>Address</th>
                  <th>ZIP</th>
                  <th>State</th>
                  {isLoggedIn && <th aria-label="Post a review">Review</th>}
                </tr>
              </thead>
              <tbody>
                {dealers.map((dealer) => (
                  <tr key={dealer.id}>
                    <td>{dealer.id}</td>
                    <td>
                      <a className="dealer-link" href={`/dealer/${dealer.id}/`}>
                        {dealer.full_name}
                      </a>
                    </td>
                    <td>{dealer.city}</td>
                    <td>{dealer.address}</td>
                    <td>{dealer.zip}</td>
                    <td><span className="state-badge">{dealer.state}</span></td>
                    {isLoggedIn && (
                      <td>
                        <a
                          className="review-link"
                          href={`/postreview/${dealer.id}/`}
                          aria-label={`Review ${dealer.full_name}`}
                        >
                          <img src={reviewIcon} alt="" />
                        </a>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {dealers.length === 0 && (
              <div className="empty-table">No dealerships were found for this state.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dealers;
