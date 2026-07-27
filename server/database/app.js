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

const initialReviews = loadJson('reviews.json').reviews;
const initialDealerships = loadJson('dealerships.json').dealerships;
let memoryReviews = initialReviews.map((review) => ({ ...review }));
let memoryDealerships = initialDealerships.map((dealer) => ({ ...dealer }));
let mongoAvailable = false;

const escapeRegularExpression = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const seedDatabase = async () => {
  if ((await Reviews.countDocuments()) === 0) {
    await Reviews.insertMany(initialReviews);
  }

  if ((await Dealerships.countDocuments()) === 0) {
    await Dealerships.insertMany(initialDealerships);
  }
};

const normalizeDocument = (document) => {
  if (!document) return document;
  return typeof document.toObject === 'function' ? document.toObject() : document;
};

app.get('/', (req, res) => {
  res.json({
    message: 'Dealership reviews API is running',
    storage: mongoAvailable ? 'mongodb' : 'in-memory JSON fallback',
  });
});

app.get('/fetchReviews', async (req, res) => {
  try {
    const reviews = mongoAvailable
      ? await Reviews.find().sort({ id: 1 })
      : [...memoryReviews].sort((left, right) => left.id - right.id);
    res.json(reviews.map(normalizeDocument));
  } catch (error) {
    res.status(500).json({ error: 'Error fetching reviews' });
  }
});

app.get('/fetchReviews/dealer/:id', async (req, res) => {
  try {
    const dealerId = Number(req.params.id);
    const reviews = mongoAvailable
      ? await Reviews.find({ dealership: dealerId }).sort({ id: -1 })
      : memoryReviews
          .filter((review) => Number(review.dealership) === dealerId)
          .sort((left, right) => right.id - left.id);
    res.json(reviews.map(normalizeDocument));
  } catch (error) {
    res.status(500).json({ error: 'Error fetching dealer reviews' });
  }
});

app.get('/fetchDealers', async (req, res) => {
  try {
    const dealers = mongoAvailable
      ? await Dealerships.find().sort({ id: 1 })
      : [...memoryDealerships].sort((left, right) => left.id - right.id);
    res.json(dealers.map(normalizeDocument));
  } catch (error) {
    res.status(500).json({ error: 'Error fetching dealerships' });
  }
});

app.get('/fetchDealers/:state', async (req, res) => {
  try {
    const state = req.params.state.trim();
    let dealers;

    if (mongoAvailable) {
      const query = state.toLowerCase() === 'all'
        ? {}
        : {
            $or: [
              { state: new RegExp(`^${escapeRegularExpression(state)}$`, 'i') },
              { st: new RegExp(`^${escapeRegularExpression(state)}$`, 'i') },
            ],
          };
      dealers = await Dealerships.find(query).sort({ id: 1 });
    } else {
      const normalizedState = state.toLowerCase();
      dealers = memoryDealerships
        .filter((dealer) => {
          if (normalizedState === 'all') return true;
          return String(dealer.state || '').toLowerCase() === normalizedState
            || String(dealer.st || '').toLowerCase() === normalizedState;
        })
        .sort((left, right) => left.id - right.id);
    }

    res.json(dealers.map(normalizeDocument));
  } catch (error) {
    res.status(500).json({ error: 'Error fetching dealerships by state' });
  }
});

app.get('/fetchDealer/:id', async (req, res) => {
  try {
    const dealerId = Number(req.params.id);
    const dealer = mongoAvailable
      ? await Dealerships.findOne({ id: dealerId })
      : memoryDealerships.find((item) => Number(item.id) === dealerId);

    if (!dealer) {
      return res.status(404).json({ error: 'Dealership not found' });
    }

    return res.json([normalizeDocument(dealer)]);
  } catch (error) {
    return res.status(500).json({ error: 'Error fetching dealership' });
  }
});

app.post('/insert_review', async (req, res) => {
  try {
    const latestReview = mongoAvailable
      ? await Reviews.findOne().sort({ id: -1 })
      : [...memoryReviews].sort((left, right) => right.id - left.id)[0];
    const newId = latestReview ? Number(latestReview.id) + 1 : 1;

    const reviewData = {
      id: newId,
      name: req.body.name,
      dealership: Number(req.body.dealership),
      review: req.body.review,
      purchase: Boolean(req.body.purchase),
      purchase_date: req.body.purchase_date,
      car_make: req.body.car_make,
      car_model: req.body.car_model,
      car_year: Number(req.body.car_year),
    };

    if (mongoAvailable) {
      const savedReview = await new Reviews(reviewData).save();
      return res.status(201).json(normalizeDocument(savedReview));
    }

    memoryReviews.push(reviewData);
    return res.status(201).json(reviewData);
  } catch (error) {
    return res.status(400).json({ error: 'Error inserting review', details: error.message });
  }
});

const startServer = async () => {
  try {
    await mongoose.connect(mongoUrl, { serverSelectionTimeoutMS: 3000 });
    await seedDatabase();
    mongoAvailable = true;
    console.log('Connected to MongoDB.');
  } catch (error) {
    mongoAvailable = false;
    console.warn('MongoDB is unavailable; using the bundled JSON data in memory.');
  }

  app.listen(port, () => {
    console.log(`Dealership API is running on port ${port}`);
  });
};

startServer();

module.exports = app;
