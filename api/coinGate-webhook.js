const coinGateWebhook = async (req, res) => {
  try {
    const { order_id, status } = req.body;
    console.log("🚀 ~ coinGateWebhook ~ req.body:", req.body)
    console.log("🚀 ~ coinGateWebhook ~ order_id:")
    console.log("🚀 ~ coinGateWebhook ~ order_id:", order_id)

    // Update Firestore subscription status
    // await db.collection("subscriptions").doc(order_id).update({ status });

    res.status(200).send("Webhook received");
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(400).send("Error handling webhook");
  }
};
module.exports = { coinGateWebhook };
