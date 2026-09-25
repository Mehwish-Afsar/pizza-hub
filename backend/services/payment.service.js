const { Safepay } = require("@sfpy/node-sdk");

const safepay = new Safepay({
  environment: process.env.SAFEPAY_ENVIRONMENT || "sandbox",
  apiKey: process.env.SAFEPAY_SECRET_KEY,
  v1Secret: process.env.SAFEPAY_V1_SECRET,
  webhookSecret: process.env.SAFEPAY_WEBHOOK_SECRET,
});

const createSafepayCheckout = async ({ amount, orderId }) => {
  if (!amount || amount <= 0) {
    throw new Error("Invalid payment amount.");
  }

  const { token } = await safepay.payments.create({
    amount: Math.round(amount * 100),
    currency: "PKR",
  });

  const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

  const url = safepay.checkout.create({
    token,
    orderId: orderId.toString(),
    redirectUrl: `${backendUrl}/api/payments/callback/${orderId}`,
    cancelUrl: `${clientUrl}/orders/${orderId}?payment=cancelled`,
    source: "custom",
    webhooks: true,
  });

  return { token, url };
};

const verifySafepayRedirectSignature = async (req) => {
  try {
    return Boolean(await safepay.verify.signature(req));
  } catch (error) {
    console.error("Safepay signature verification failed:", error.message);
    return false;
  }
};

const verifySafepayWebhook = async (req) => {
  try {
    return Boolean(await safepay.verify.webhook(req));
  } catch (error) {
    console.error("Safepay webhook verification failed:", error.message);
    return false;
  }
};

module.exports = {
  createSafepayCheckout,
  verifySafepayRedirectSignature,
  verifySafepayWebhook,
};