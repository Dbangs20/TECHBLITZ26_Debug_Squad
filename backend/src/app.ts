import "express-async-errors";
import cors from "cors";
import express from "express";
import morgan from "morgan";

import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { appointmentRouter } from "./routes/appointmentRoutes.js";
import { authRouter } from "./routes/authRoutes.js";
import { queueRouter } from "./routes/queueRoutes.js";
import { waitlistRouter } from "./routes/waitlistRoutes.js";

export const app = express();

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/appointments", appointmentRouter);
app.use("/waitlist", waitlistRouter);
app.use("/queue", queueRouter);

app.use(notFoundHandler);
app.use(errorHandler);
