const requireAuth = require("./_require-auth.js");
const { getUser, updateUser } = require("./_db.js");
const stripe = require("./_stripe.js");
const productsData = require("./_products-data.js");

const stripeCheckoutSession = requireAuth(async (req, res) => {
  const body = req.body;
  const user = req.user;

  if (!body.priceId) {
    return res.status(400).send({
      status: "error",
      message: "No priceId is defined in request body",
    });
  }

  try {
    let { email, stripeCustomerId } = await getUser(user.uid);

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({ email: email });

      await updateUser(user.uid, {
        stripeCustomerId: customer.id,
      });

      stripeCustomerId = customer.id;
    }

    const mode = productsData[body.priceId].type;

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: body.priceId,
          quantity: 1,
        },
      ],
      mode: mode,
      success_url: mode === "subscription" ? body.successUrl : body.successUrl + `&credit=${productsData[body.priceId].quantity}`,
      cancel_url: body.cancelUrl,
    });

    res.send({ status: "success", data: session });
  } catch (error) {
    console.log("stripe-create-checkout-session error", error);

    res.send({ status: "error", code: error.code, message: error.message });
  }
});

module.exports = { stripeCheckoutSession };
