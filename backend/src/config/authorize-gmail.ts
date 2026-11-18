import "dotenv/config";
import express from "express";
import googleConnectionRouter from "./connect-gmail";
import { requireEnv } from "../lib/utils/input.utils";

const redirect = new URL(requireEnv("LOCAL_GOOGLE_REDIRECT_URI"));

if (
  redirect.protocol !== "http:" ||
  !["localhost", "127.0.0.1"].includes(redirect.hostname) ||
  redirect.pathname !== "/auth/google/callback" ||
  redirect.search || redirect.hash || redirect.username || redirect.password
) {
  throw new Error(
    "LOCAL_GOOGLE_REDIRECT_URI must be an HTTP loopback URL with path /auth/google/callback.",
  );
}

const app = express();
app.use("/auth", googleConnectionRouter);

const port = Number(redirect.port || 80);
app.listen(port, redirect.hostname, () => {
  console.log(`Open ${redirect.origin}/auth/google to authorize Gmail.`);
});
