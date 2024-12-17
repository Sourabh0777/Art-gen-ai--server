const products = {
   1: {price: 0.99, quantity: 20, type: 'payment'},
   2: {price: 2.99, quantity: 50, type: 'payment'},
   3: {price: 6.99, quantity: 70, type: 'payment'},
    4: {price: 13.99, quantity: 160, type: 'payment'},
    5: {price: 24.99, quantity: 329, type: 'payment'},
    6: {price: 39.99, quantity: 550, type: 'payment'},
    PLUS: {price: 9.99, quantity: 120, type: 'subscription', cycle: 'monthly', paypal_plan_id: process.env.PAYPAL_PLAN_ID_PLUS},
    PREMIUM: {price: 67.99, quantity: 990, type: 'subscription', cycle: 'yearly', paypal_plan_id: process.env.PAYPAL_PLAN_ID_PREMIUM},
    PRO: {price: 39.99, quantity: 550, type: 'subscription', cycle: 'monthly'}
}
// Note:
// Paypal doesn't realy have id for products, so we are using stripe price id for paypal one time purchase as well.
const productsData = {
    [process.env.REACT_APP_STRIPE_PRICE_PRODUCT1]: products[1],
    [process.env.REACT_APP_STRIPE_PRICE_PRODUCT2]: products[2],
    [process.env.REACT_APP_STRIPE_PRICE_PRODUCT3]: products[3],
    [process.env.REACT_APP_STRIPE_PRICE_PRODUCT4]: products[4],
    [process.env.REACT_APP_STRIPE_PRICE_PRODUCT5]: products[5],
    [process.env.REACT_APP_STRIPE_PRICE_PRODUCT6]: products[6],
    [process.env.REACT_APP_STRIPE_PRICE_PLUS]: products['PLUS'],
    [process.env.REACT_APP_STRIPE_PRICE_PREMIUM]: products['PREMIUM'],
    [process.env.REACT_APP_STRIPE_PRICE_PRO]: products['PRO'],
    [process.env.REACT_APP_PAYPAL_PLAN_ID_PLUS]: products['PLUS'],
    [process.env.REACT_APP_PAYPAL_PLAN_ID_PREMIUM]: products['PREMIUM'],
    [process.env.REACT_APP_PAYPAL_PLAN_ID_PRO]: products['PRO'],
}



module.exports = productsData
