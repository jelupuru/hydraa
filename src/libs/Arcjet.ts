import arcjet, { detectBot, shield, tokenBucket } from "@arcjet/next";

export default arcjet({
  key: process.env.ARCJET_KEY || "test_key",
  characteristics: ["ip.src"],
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE",
      allow: [],
    }),
    tokenBucket({
      mode: "LIVE",
      refillRate: 5,
      interval: 10,
      capacity: 10,
    }),
  ],
});