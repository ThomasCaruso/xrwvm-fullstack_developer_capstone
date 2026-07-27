import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Header from "../Header/Header";
import negativeIcon from "../assets/negative.png";
import neutralIcon from "../assets/neutral.png";
import positiveIcon from "../assets/positive.png";
import "../assets/style.css";
import "./Dealers.css";

const sentimentIcon = (sentiment) => {
  if (sentiment === "positive") return positiveIcon;
  if (sentiment === "negative") return negativeIcon;
  return neutralIcon;
};

const Dealer = () => {
  const { id } = useParams();
  const [dealer, setDealer] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isLoggedIn = Boolean(sessionStorage.getItem("username"));

  useEffect(() => {
    const loadDealer = async () => {
      setLoading(true);
      setError("");

      try {
        const [dealerResponse, reviewResponse] = await Promise.all([
          fetch(`/djangoapp/dealer/${id}`),
          fetch(`/djangoapp/reviews/dealer/${id}`),
        ]);
        const dealerResult = await dealerResponse.json();
        const reviewResult = await reviewResponse.json();

        if (!dealerResponse.ok || dealerResult.status !== 200) {
          throw new Error(dealerResult.message || "Unable to load this dealership.");
        }

        const dealerList = Array.isArray(dealerResult.dealer)
          ? dealerResult.dealer
          : [dealerResult.dealer];
        setDealer(dealerList[0] || null);

        if (reviewResponse.ok && reviewResult.status === 200) {
          setReviews(Array.isArray(reviewResult.reviews) ? reviewResult.reviews : []);
        }
      } catch (requestError) {
        setError(requestError.message || "Unable to load this dealership.");
      } finally {
        setLoading(false);
      }
    };

    loadDealer();
  }, [id]);

  return (
    <div>
      <Header />
      <main className="page-shell">
        {loading && <div className="status-panel">Loading dealership details...</div>}
        {!loading && error && <div className="status-panel error">{error}</div>}

        {!loading && !error && dealer && (
          <>
            <section className="dealer-profile">
              <div>
                <p className="section-label">Dealership profile</p>
                <h1>{dealer.full_name}</h1>
                <p>{dealer.address}, {dealer.city}, {dealer.state} {dealer.zip}</p>
              </div>

              {isLoggedIn ? (
                <a className="primary-button" href={`/postreview/${id}/`}>Write a review</a>
              ) : (
                <a className="secondary-button" href="/login/">Sign in to review</a>
              )}
            </section>

            <section aria-labelledby="customer-reviews-heading">
              <div className="reviews-heading">
                <div>
                  <p className="section-label">Customer feedback</p>
                  <h2 id="customer-reviews-heading">Reviews</h2>
                </div>
                <span>{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</span>
              </div>

              {reviews.length === 0 ? (
                <div className="status-panel">No reviews have been submitted for this dealership.</div>
              ) : (
                <div className="reviews-grid">
                  {reviews.map((review) => (
                    <article className="review-card" key={review.id}>
                      <div className="review-sentiment">
                        <img src={sentimentIcon(review.sentiment)} alt={`${review.sentiment || "neutral"} sentiment`} />
                        <span>{review.sentiment || "neutral"}</span>
                      </div>
                      <blockquote>“{review.review}”</blockquote>
                      <div className="review-meta">
                        <strong>{review.name}</strong>
                        <span>{review.car_year} {review.car_make} {review.car_model}</span>
                        {review.purchase_date && <span>Purchased {review.purchase_date}</span>}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default Dealer;
