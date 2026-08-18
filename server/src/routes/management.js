import { Router } from "express";
import { z } from "zod";
import { allowRoles, asyncRoute, requireAuth, validate } from "../middleware/index.js";
import { createService, getAdminOverview, getProviderAvailability, saveProviderAvailability } from "../services/repository.js";

const router = Router();
router.use(requireAuth);

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const scheduleSchema = z.object({
  schedule: z.array(z.object({
    weekday: z.number().int().min(0).max(6), enabled: z.boolean(),
    startTime: z.string().regex(timePattern), endTime: z.string().regex(timePattern),
  })).length(7),
});

router.get("/provider/availability", allowRoles("provider"), asyncRoute(async (req, res) => {
  const availability = await getProviderAvailability(req.user);
  res.json({ success: true, message: "Availability loaded", data: availability });
}));

router.post("/provider/availability", allowRoles("provider"), validate(scheduleSchema), asyncRoute(async (req, res) => {
  const availability = await saveProviderAvailability(req.user, req.body.schedule);
  res.json({ success: true, message: "Weekly availability saved", data: availability });
}));

router.get("/admin/overview", allowRoles("admin"), asyncRoute(async (_req, res) => {
  const overview = await getAdminOverview();
  res.json({ success: true, message: "Admin overview loaded", data: overview });
}));

const serviceSchema = z.object({
  name: z.string().trim().min(3).max(100), description: z.string().trim().min(10).max(500),
  durationMinutes: z.number().int().min(15).max(480), price: z.number().min(0),
  category: z.string().trim().min(2).max(80), icon: z.string().default("sparkles"),
  accent: z.enum(["sage", "lilac", "sand", "rose"]).default("sage"),
});

router.post("/admin/services", allowRoles("admin"), validate(serviceSchema), asyncRoute(async (req, res) => {
  const service = await createService(req.body);
  res.status(201).json({ success: true, message: "Service created", data: service });
}));

export default router;
