const axios = require("axios");

const createSubscription = async (req, res) => {
  const {
    orderId, // Unique order ID
    priceAmount, // Amount to charge
    priceCurrency, // Currency for the price (e.g., USD)
    receiveCurrency, // Currency you want to receive (e.g., BTC, EUR, or DO_NOT_CONVERT)
    title, // Title of the subscription plan
    description, // Description of the subscription plan
    purchaserEmail, // Buyer's email address (optional)
    callbackUrl, // Webhook URL for payment status updates
    cancelUrl, // URL for order cancellation
    successUrl, // URL for successful payments
    interval, // Subscription interval in days or months
  } = req.body;

  try {
    // Define the order payload
    const orderPayload = {
      order_id: orderId,
      price_amount: priceAmount,
      price_currency: priceCurrency,
      receive_currency: receiveCurrency,
      title: title || "Subscription Plan",
      description: description || "Recurring subscription",
      callback_url: callbackUrl || `https://${SERVER_URL}/coin-gate-Webhook`,
      cancel_url: cancelUrl || `https://${FRONTEND_URL}/cancel`,
      success_url: successUrl || `https://${FRONTEND_URL}/success`,
      token: `${process.env.TEST_COINGATE_API_KEY}`,
      purchaser_email: purchaserEmail || "",
    };

    // Make a request to CoinGate to create the order
    const response = await axios.post(`${process.env.COINGATE_URL_DEV}/orders`, orderPayload, {
      headers: {
        Authorization: `Bearer ${process.env.TEST_COINGATE_API_KEY}`, // Replace <your-api-key> with your CoinGate API key
      },
    });

    // Payment URL for the invoice
    const paymentUrl = response.data.payment_url;

    // Schedule the next subscription payment (optional)
    if (interval) {
      scheduleNextSubscription(orderId, interval, orderPayload);
    }

    // Respond with the payment URL
    res.status(200).json({ paymentUrl });
  } catch (error) {
    console.error("Error creating subscription order:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to create subscription order", details: error.response?.data });
  }
};
function scheduleNextSubscription(orderId, interval, orderPayload) {
  const intervalMs = parseIntervalToMs(interval);

  if (intervalMs > 2147483647) {
    console.warn(`Interval exceeds maximum timeout value. Scheduling manually for intervals longer than ${2147483647}ms.`);
    // Use recursive scheduling
    setTimeout(() => {
      scheduleNextSubscription(orderId, interval, orderPayload);
    }, 2147483647);
  } else {
    setTimeout(async () => {
      try {
        // Create a new order with the same payload
        orderPayload.order_id = `${orderId}-${Date.now()}`;
        const response = await axios.post(`${process.env.COINGATE_URL_DEV}/orders`, orderPayload, {
          headers: {
            Authorization: `Bearer ${process.env.TEST_COINGATE_API_KEY}`,
          },
        });
        console.log(`Next subscription order created: ${response.data.payment_url}`);
      } catch (error) {
        console.error("Error scheduling next subscription payment:", error.response?.data || error.message);
      }
    }, intervalMs);
  }
}

function parseIntervalToMs(interval) {
  if (interval.includes("day")) {
    const days = parseInt(interval);
    return days * 24 * 60 * 60 * 1000; // Convert days to milliseconds
  }
  if (interval.includes("month")) {
    const months = parseInt(interval);
    return months * 30 * 24 * 60 * 60 * 1000; // Approximate months to 30 days
  }
  throw new Error("Invalid interval format. Use 'x days' or 'x months'.");
}
module.exports = { createSubscription };
