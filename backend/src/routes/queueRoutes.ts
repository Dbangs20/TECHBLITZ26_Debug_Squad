import { Router } from "express";

import { completeAppointment, getCurrentQueue } from "../controllers/queueController.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/roles.js";

export const queueRouter = Router();

queueRouter.use(requireAuth);
queueRouter.get("/current", getCurrentQueue);
queueRouter.patch("/complete/:id", requireRole(["doctor"]), completeAppointment);
