import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Header from "../Header/Header";
import "../assets/style.css";
import "./Dealers.css";

const PostReview = () => {
  const { id } = useParams();
  const [dealer, setDealer] = useState(null);
  const [cars, setCars] = useState([]);
  const [selectedCarIndex, setSelectedCarIndex] = useState("");
  const [review, setReview] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [carYear, setCarYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!sessionStorage.getItem("username")) {
      window.location.replace("/login/");
      return;
    }

    const loadFormData = async () => {
      try {
        const [dealerResponse, carsResponse] = await Promise.all([
          fetch(`/djangoapp/dealer/${id}`),
          fetch("/djangoapp/get_cars"),
        ]);
        const dealerResult = await dealerResponse.json();
        const carsResult = await carsResponse.json();

        if (!dealerResponse.ok || dealerResult.status !== 200) {
          throw new Error(dealerResult.message || "Unable to load dealership.");
        }

        const dealerList = Array.isArray(dealerResult.dealer)
          ? dealerResult.dealer
          : [dealerResult.dealer];
        setDealer(dealerList[0] || null);
        setCars(Array.isArray(carsResult.CarModels) ? carsResult.CarModels : []);
      } catch (requestError) {
        setMessage(requestError.message || "Unable to load review form.");
      } finally {
        setLoading(false);
      }
    };

    loadFormData();
  }, [id]);

  const submitReview = async (event) => {
    event.preventDefault();
    setMessage("");

    if (selectedCarIndex === "") {
      setMessage("Select the car you purchased.");
      return;
    }

    const selectedCar = cars[Number(selectedCarIndex)];
    if (!selectedCar) {
      setMessage("The selected car is invalid.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/djangoapp/add_review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealership: Number(id),
          review: review.trim(),
          purchase: true,
          purchase_date: purchaseDate,
          car_make: selectedCar.CarMake,
          car_model: selectedCar.CarModel,
          car_year: Number(carYear),
        }),
      });
      const result = await response.json();

      if (!response.ok || result.status !== 200) {
        throw new Error(result.message || "The review could not be submitted.");
      }

      window.location.assign(`/dealer/${id}/`);
    } catch (requestError) {
      setMessage(requestError.message || "The review could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Header />
      <main className="page-shell review-form-shell">
        {loading && <div className="status-panel">Loading review form...</div>}

        {!loading && (
          <section className="review-form-card">
            <div className="review-form-intro">
              <p className="section-label">Share your experience</p>
              <h1>{dealer ? `Review ${dealer.full_name}` : "Post a dealership review"}</h1>
              <p>Your feedback helps other customers choose a dealership with confidence.</p>
            </div>

            <form onSubmit={submitReview} className="review-form">
              <label>
                Your review
                <textarea
                  required
                  minLength="10"
                  maxLength="1200"
                  rows="7"
                  value={review}
                  onChange={(event) => setReview(event.target.value)}
                  placeholder="Describe the service, purchase process, and overall experience."
                />
              </label>

              <div className="review-form-row">
                <label>
                  Purchase date
                  <input
                    required
                    type="date"
                    value={purchaseDate}
                    onChange={(event) => setPurchaseDate(event.target.value)}
                  />
                </label>

                <label>
                  Vehicle year
                  <input
                    required
                    type="number"
                    min="2015"
                    max="2023"
                    value={carYear}
                    onChange={(event) => setCarYear(event.target.value)}
                  />
                </label>
              </div>

              <label>
                Vehicle make and model
                <select
                  required
                  value={selectedCarIndex}
                  onChange={(event) => {
                    const index = event.target.value;
                    setSelectedCarIndex(index);
                    const selected = cars[Number(index)];
                    if (selected?.CarYear) setCarYear(String(selected.CarYear));
                  }}
                >
                  <option value="">Choose a vehicle</option>
                  {cars.map((car, index) => (
                    <option value={index} key={`${car.CarMake}-${car.CarModel}-${car.CarYear || index}`}>
                      {car.CarMake} {car.CarModel}{car.CarYear ? ` (${car.CarYear})` : ""}
                    </option>
                  ))}
                </select>
              </label>

              {message && <div className="form-message" role="alert">{message}</div>}

              <div className="review-form-actions">
                <a className="secondary-button" href={`/dealer/${id}/`}>Cancel</a>
                <button className="primary-button" type="submit" disabled={submitting}>
                  {submitting ? "Publishing..." : "Publish review"}
                </button>
              </div>
            </form>
          </section>
        )}
      </main>
    </div>
  );
};

export default PostReview;
