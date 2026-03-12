import { Router } from "express";

import {
  createAppointment,
  deleteAppointment,
  getDashboard,
  getSmartSuggestions,
  listAppointments,
  updateAppointment
} from "../controllers/appointmentController.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/roles.js";

export const appointmentRouter = Router();

appointmentRouter.use(requireAuth);
appointmentRouter.get("/list", listAppointments);
appointmentRouter.get("/dashboard", getDashboard);
appointmentRouter.get("/smart-slots", getSmartSuggestions);
appointmentRouter.post("/create", requireRole(["receptionist"]), createAppointment);
appointmentRouter.put("/update", requireRole(["receptionist"]), updateAppointment);
appointmentRouter.delete("/delete/:id", requireRole(["receptionist"]), deleteAppointment);
