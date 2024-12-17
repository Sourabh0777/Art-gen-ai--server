const getRawBody = require("raw-body");
const { updateUserByCustomerId, IncrementUserCreditByCustomerId, IncrementUserExtraCreditByCustomerId, updateUserCreditByCustomerId } = require("./_db.js");
const productsData = require("./_products-data.js");
const stripe = require("./_stripe.js");

const stripWebhook = async (req, res) => {
  const headers = await req.headers;
  if (!req) {
    res.send({ status: "error", code: "Not readable" });
  }
  try {
    const rawBody = await getRawBody(req);

    const stripeEvent = stripe.webhooks.constructEvent(rawBody, headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);

    console.log(`stripeEvent: ${stripeEvent.type}`);

    // Get the object from stripeEvent
    const object = stripeEvent.data.object;
    console.log(object);

    switch (stripeEvent.type) {
      case "checkout.session.completed":
        // If sunscription Fetch subscription
        if (object.mode === "subscription") {
          const subscription = await stripe.subscriptions.retrieve(object.subscription);
          const priceId = subscription.items.data[0].price.id;

          // Add subscription info to database
          await updateUserByCustomerId(object.customer, {
            stripeSubscriptionId: subscription.id,
            // Store the Price ID for this subscription
            stripePriceId: priceId,
            // Store the subscription status ("active" or "trialing")
            stripeSubscriptionStatus: "active", //subscription.status,
          });
          // await IncrementUserCreditByCustomerId(object.customer, productsData[priceId].quantity);
        }
        //if One time purchase, fetch purchased items
        else {
          const sessionWithLineItems = await stripe.checkout.sessions.retrieve(object.id, {
            expand: ["line_items"],
          });
          console.log(sessionWithLineItems);
          const lineItems = sessionWithLineItems.line_items.data;
          console.log(lineItems);
          let totalCreditBought = 0;
          for (const item of lineItems) {
            const priceId = item.price.id;
            const creditBought = productsData[priceId].quantity * item.quantity;
            totalCreditBought = totalCreditBought + creditBought;
          }
          await IncrementUserExtraCreditByCustomerId(object.customer, totalCreditBought);
        }

        break;

      case "invoice.paid":
        // If a payment succeeded we update stored subscription status to "active"
        // in case it was previously "trialing" or "past_due".
        // We skip if amount due is 0 as that's the case at start of trial period.
        if (object.amount_due > 0) {
          await updateUserByCustomerId(object.customer, {
            stripeSubscriptionStatus: "active",
          });

          const subscription = await stripe.subscriptions.retrieve(object.subscription);
          const priceId = subscription.items.data[0].price.id;
          await updateUserCreditByCustomerId(object.customer, productsData[priceId].quantity);
        }

        break;

      case "invoice.payment_failed":
        // If a payment failed we update stored subscription status to "past_due"
        await updateUserByCustomerId(object.customer, {
          stripeSubscriptionStatus: "past_due",
        });

        break;

      case "customer.subscription.updated":
        await updateUserByCustomerId(object.customer, {
          stripePriceId: object.items.data[0].price.id,
          stripeSubscriptionStatus: object.status,
        });

        // 💡 You could also read "cancel_at_period_end" if you'd like to email user and learn why they cancelled
        // or convince them to renew before their subscription is deleted at end of payment period.
        break;

      case "customer.subscription.deleted":
        // If a subscription was deleted update stored subscription status to "canceled".
        // Keep in mind this won't be called right away if "Cancel at end of billing period" is selected
        // in Billing Portal settings (https://dashboard.stripe.com/settings/billing/portal). Instead you'll
        // get a "customer.subscription.updated" event with a cancel_at_period_end value.
        await updateUserByCustomerId(object.customer, {
          stripeSubscriptionStatus: "canceled",
        });

        break;

      case "customer.subscription.trial_will_end":
        // This event happens 3 days before a trial ends
        // 💡 You could email user letting them know their trial will end or you can have Stripe do that
        // automatically 7 days in advance: https://dashboard.stripe.com/settings/billing/automatic

        break;

      // no default
    }

    // Send success response
    res.send({ status: "success" });
  } catch (error) {
    console.log("stripe webhook error", error);

    // Send error response
    res.send({ status: "error", code: error.code, message: error.message });
  }
};

module.exports = { stripWebhook };
