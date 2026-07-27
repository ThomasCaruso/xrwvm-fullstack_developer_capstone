const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const Reviews = require('./review');
const Dealerships = require('./dealership');

const app = express();
const port = process.env.PORT || 3030;
const mongoUrl = process.env.MONGODB_URL || 'mongodb://mongo_db:27017/dealershipsDB';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const loadJson = (filename) => {
  const filePath = path.join(__dirname, 'data', filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const escapeRegularExpression = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const seedDatabase = async () => {
  const reviewsData = loadJson('reviews.json').reviews;
  const dealershipsData = loadJson('dealerships.json').dealerships;

  if ((await Reviews.countDocuments()) === 0) {
    await Reviews.insertMany(reviewsData);
  }

  if ((await Dealerships.countDocuments()) === 0) {
    await Dealerships.insertMany(dealershipsData);
  }
};

app.get('/', (req, res) => {
  res.json({ message: 'Dealership reviews API is running' });
});

app.get('/fetchReviews', async (req, res) => {
  try {
    const reviews = await Reviews.find().sort({ id: 1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching reviews' });
  }
});

app.get('/fetchReviews/dealer/:id', async (req, res) => {
  try {
    const dealerId = Number(req.params.id);
    const reviews = await Reviews.find({ dealership: dealerId }).sort({ id: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching dealer reviews' });
  }
});

app.get('/fetchDealers', async (req, res) => {
  try {
    const dealers = await Dealerships.find().sort({ id: 1 });
    res.json(dealers);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching dealerships' });
  }
});

app.get('/fetchDealers/:state', async (req, res) => {
  try {
    const state = req.params.state.trim();
    const query = state.toLowerCase() === 'all'
      ? {}
      : { state: new RegExp(`^${escapeRegularExpression(state)}$`, 'i') };
    const dealers = await Dealerships.find(query).sort({ id: 1 });
    res.json(dealers);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching dealerships by state' });
  }
});

app.get('/fetchDealer/:id', async (req, res) => {
  try {
    const dealerId = Number(req.params.id);
    const dealer = await Dealerships.findOne({ id: dealerId });

    if (!dealer) {
      return res.status(404).json({ error: 'Dealership not found' });
    }

    return res.json([dealer]);
  } catch (error) {
    return res.status(500).json({ error: 'Error fetching dealership' });
  }
});

app.post('/insert_review', async (req, res) => {
  try {
    const latestReview = await Reviews.findOne().sort({ id: -1 });
    const newId = latestReview ? latestReview.id + 1 : 1;

    const review = new Reviews({
      id: newId,
      name: req.body.name,
      dealership: Number(req.body.dealership),
      review: req.body.review,
      purchase: Boolean(req.body.purchase),
      purchase_date: req.body.purchase_date,
      car_make: req.body.car_make,
      car_model: req.body.car_model,
      car_year: Number(req.body.car_year),
    });

    const savedReview = await review.save();
    return res.status(201).json(savedReview);
  } catch (error) {
    return res.status(400).json({ error: 'Error inserting review', details: error.message });
  }
});

const startServer = async () => {
  try {
    await mongoose.connect(mongoUrl);
    await seedDatabase();
    app.listen(port, () => {
      console.log(`Dealership API is running on port ${port}`);
    });
  } catch (error) {
    console.error('Unable to start the dealership API:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
