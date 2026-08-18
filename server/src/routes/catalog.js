import { Router } from "express";
import { z } from "zod";
import { asyncRoute, validate } from "../middleware/index.js";
import { calculateSlots, getProvider, getService, listProviders, listServices } from "../services/repository.js";

const router = Router();

router.get("/services", asyncRoute(async (req, res) => {
  const services = await listServices({ search: req.query.search, category: req.query.category });
  res.json({ success: true, message: "Services loaded", data: services });
}));

router.get("/services/:id", asyncRoute(async (req, res) => {
  const service = await getService(req.params.id);
  if (!service) return res.status(404).json({ success: false, message: "Service not found", errors: [] });
  res.json({ success: true, message: "Service loaded", data: service });
}));

router.get("/providers", asyncRoute(async (req, res) => {
  const providers = await listProviders({ serviceId: req.query.serviceId, search: req.query.search });
  res.json({ success: true, message: "Providers loaded", data: providers });
}));

router.get("/providers/:id", asyncRoute(async (req, res) => {
  const provider = await getProvider(req.params.id);
  if (!provider) return res.status(404).json({ success: false, message: "Provider not found", errors: [] });
  res.json({ success: true, message: "Provider loaded", data: provider });
}));

const slotsSchema = z.object({
  providerId: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.iso.date(),
  excludeAppointmentId: z.string().optional(),
});

router.get("/availability/slots", validate(slotsSchema, "query"), asyncRoute(async (req, res) => {
  const slots = await calculateSlots(req.validatedQuery);
  res.json({ success: true, message: slots.length ? "Available times loaded" : "No times available on this date", data: slots });
}));

export default router;
