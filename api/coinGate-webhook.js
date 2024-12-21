const { updateUserByCustomerId, IncrementUserCreditByCustomerId, IncrementUserExtraCreditByCustomerId, updateUserCreditByCustomerId, getUserByEmail, updateUser } = require("./_db.js");
const { products } = require("./_products-data.js");

const coinGateWebhook = async (req, res) => {
  try {
    const { order_id, status } =await req.body;
    console.log("🚀 ~ coinGateWebhook ~ req.body:", req.body)
    let [planID, email] =await order_id.split("+");

    const product =await products[planID.toUpperCase()];
    if (!product) {
      console.error("Invalid order ID:", order_id);
      return res.status(400).send({ status: "error", message: "Invalid order ID" });
    }

    // Process status
    switch (status) {
      case "paid":
        if (product.type === "payment") {
          // Increment user credits for one-time purchases
          await IncrementUserExtraCreditByCustomerId(email, product.quantity);
        } else if (product.type === "subscription") {
          const user = await getUserByEmail(email);

          await updateUser(user.id, {
            stripeSubscriptionId: planID,
            stripePriceId:product.price,
            subscriptionCycle: product.cycle,
            stripeSubscriptionStatus: "active",
            credit:product.quantity
          });
        }
        break;

      case "failed":
        console.log("Payment failed for order:", order_id);
        break;

      case "canceled":
        if (product.type === "subscription") {
          // Handle subscription cancellation
          await updateUserByCustomerId(req.body.customer_id, {
            subscriptionPlan: null,
            subscriptionStatus: "canceled",
          });
        }
        break;

      default:
        console.log("Unhandled status:", status);
        break;
    }

    res.status(200).send({ status: "success" });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(400).send({ status: "error", message: error.message });
  }
};
module.exports = { coinGateWebhook };
