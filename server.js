const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require("dotenv").config();

const { stripeCheckoutSession } = require('./api/stripe-create-checkout-session.js');
const { stripWebhook } = require('./api/stripe-webhook.js');
const { createSubscription } = require('./api/coinGate-subscription.js');
const { coinGateWebhook } = require('./api/coinGate-webhook.js');

const app = express();
app.use(cors());

app.post('/api/stripe-webhook', stripWebhook);

app.use(bodyParser.json());

app.post('/api/stripe-create-checkout-session', stripeCheckoutSession);

// Coingate APIs

app.post("/api/create-subscription",createSubscription)
app.use(express.json());

app.post("/api/coin-gate-Webhook",coinGateWebhook)

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
