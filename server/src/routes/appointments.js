import { Router } from "express";
import { z } from "zod";
import { allowRoles, asyncRoute, requireAuth, validate } from "../middleware/index.js";
import { cancelAppointment, createAppointment, listAppointmentsForUser, rescheduleAppointment, updateAppointmentStatus } from "../services/repository.js";

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  providerId: z.string().min(1),
  serviceId: z.string().min(1),
  startAt: z.iso.datetime({ offset: true }),
  notes: z.string().trim().max(1000).optional().default(""),
});

router.get("/", asyncRoute(async (req, res) => {
  const appointments = await listAppointmentsForUser(req.user, { status: req.query.status });
  res.json({ success: true, message: "Appointments loaded", data: appointments });
}));

router.post("/", allowRoles("customer"), validate(createSchema), asyncRoute(async (req, res) => {
  const appointment = await createAppointment({ ...req.body, customerId: req.user._id });
  res.status(201).json({ success: true, message: "Appointment requested successfully", data: appointment });
}));

router.put("/:id/reschedule", validate(z.object({ startAt: z.iso.datetime({ offset: true }) })), asyncRoute(async (req, res) => {
  const appointment = await rescheduleAppointment(req.params.id, req.user, req.body.startAt);
  res.json({ success: true, message: "Appointment rescheduled", data: appointment });
}));

router.put("/:id/status", allowRoles("provider", "admin"), validate(z.object({ status: z.enum(["confirmed", "completed", "cancelled", "no-show"]) })), asyncRoute(async (req, res) => {
  const appointment = await updateAppointmentStatus(req.params.id, req.user, req.body.status);
  res.json({ success: true, message: "Appointment status updated", data: appointment });
}));

router.delete("/:id", asyncRoute(async (req, res) => {
  const appointment = await cancelAppointment(req.params.id, req.user);
  res.json({ success: true, message: "Appointment cancelled", data: appointment });
}));

export default router;
