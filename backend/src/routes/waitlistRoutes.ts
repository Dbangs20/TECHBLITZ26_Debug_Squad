import { Router } from "express";

import { addToWaitlist, listWaitlist } from "../controllers/waitlistController.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/roles.js";

export const waitlistRouter = Router();

waitlistRouter.use(requireAuth);
waitlistRouter.post("/add", requireRole(["receptionist"]), addToWaitlist);
waitlistRouter.get("/list", listWaitlist);
