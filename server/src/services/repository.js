import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { addMinutes, format, isBefore, parseISO } from "date-fns";
import { Appointment, Availability, ProviderProfile, Service, User } from "../models/index.js";
import { createDemoStore } from "../data/demoData.js";
import { isDatabaseConnected } from "../config/database.js";

let memory;

export async function initializeRepository() {
  memory = await createDemoStore();
}

function asObject(value) {
  if (!value) return value;
  return typeof value.toObject === "function" ? value.toObject() : structuredClone(value);
}

function publicUser(user) {
  const data = asObject(user);
  if (!data) return null;
  delete data.passwordHash;
  return data;
}

function idOf(value) {
  return String(value?._id ?? value);
}

export async function findUserByEmail(email, includePassword = false) {
  if (isDatabaseConnected()) {
    const query = User.findOne({ email: email.toLowerCase() });
    if (includePassword) query.select("+passwordHash");
    return query.lean();
  }
  const user = memory.users.find((entry) => entry.email === email.toLowerCase());
  return includePassword ? asObject(user) : publicUser(user);
}

export async function findUserById(id) {
  if (isDatabaseConnected()) return User.findById(id).lean();
  return publicUser(memory.users.find((entry) => entry._id === id));
}

export async function registerUser({ name, email, password }) {
  const existing = await findUserByEmail(email);
  if (existing) {
    const error = new Error("An account with this email already exists");
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  if (isDatabaseConnected()) {
    const user = await User.create({ name, email: email.toLowerCase(), passwordHash, role: "customer" });
    return publicUser(user);
  }

  const user = {
    _id: `usr_${randomUUID()}`,
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: "customer",
    avatar: name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
    active: true,
    createdAt: new Date().toISOString(),
  };
  memory.users.push(user);
  return publicUser(user);
}

export async function listServices({ search = "", category = "" } = {}) {
  if (isDatabaseConnected()) {
    const query = { active: true };
    if (search) query.$or = [{ name: new RegExp(search, "i") }, { description: new RegExp(search, "i") }];
    if (category) query.category = category;
    return Service.find(query).sort({ name: 1 }).lean();
  }
  const normalized = search.toLowerCase();
  return memory.services.filter((service) =>
    service.active &&
    (!normalized || `${service.name} ${service.description}`.toLowerCase().includes(normalized)) &&
    (!category || service.category === category),
  );
}

export async function getService(id) {
  if (isDatabaseConnected()) return Service.findById(id).lean();
  return asObject(memory.services.find((entry) => entry._id === id));
}

export async function listProviders({ serviceId = "", search = "" } = {}) {
  if (isDatabaseConnected()) {
    const query = { approved: true };
    if (serviceId) query.serviceIds = serviceId;
    if (search) query.$or = [{ displayName: new RegExp(search, "i") }, { title: new RegExp(search, "i") }];
    return ProviderProfile.find(query).sort({ rating: -1 }).lean();
  }
  const normalized = search.toLowerCase();
  return memory.providers.filter((provider) =>
    provider.approved &&
    (!serviceId || provider.serviceIds.includes(serviceId)) &&
    (!normalized || `${provider.displayName} ${provider.title} ${provider.specialties.join(" ")}`.toLowerCase().includes(normalized)),
  );
}

export async function getProvider(id) {
  if (isDatabaseConnected()) return ProviderProfile.findById(id).lean();
  return asObject(memory.providers.find((entry) => entry._id === id));
}

async function existingAppointments(providerId, dayStart, dayEnd, excludeId) {
  if (isDatabaseConnected()) {
    return Appointment.find({
      providerId,
      _id: { $ne: excludeId },
      status: { $nin: ["cancelled", "no-show"] },
      startAt: { $lt: dayEnd },
      endAt: { $gt: dayStart },
    }).lean();
  }
  return memory.appointments.filter((appointment) =>
    appointment.providerId === providerId &&
    appointment._id !== excludeId &&
    !["cancelled", "no-show"].includes(appointment.status) &&
    new Date(appointment.startAt) < dayEnd &&
    new Date(appointment.endAt) > dayStart,
  );
}

async function workingWindow(providerId, date) {
  const weekday = date.getDay();
  if (isDatabaseConnected()) {
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(dateStart);
    dateEnd.setDate(dateEnd.getDate() + 1);
    return Availability.findOne({
      providerId,
      blocked: false,
      $or: [{ date: { $gte: dateStart, $lt: dateEnd } }, { date: null, weekday }],
    }).lean();
  }
  return memory.availability.find((entry) => entry.providerId === providerId && entry.weekday === weekday && !entry.blocked);
}

function applyTime(date, time) {
  const [hours, minutes] = time.split(":").map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

export async function calculateSlots({ providerId, serviceId, date, excludeAppointmentId }) {
  const service = await getService(serviceId);
  const provider = await getProvider(providerId);
  if (!service || !provider || !provider.serviceIds.map(idOf).includes(idOf(serviceId))) {
    const error = new Error("This provider does not offer the selected service");
    error.status = 404;
    throw error;
  }

  const requestedDate = parseISO(date);
  requestedDate.setHours(0, 0, 0, 0);
  const window = await workingWindow(providerId, requestedDate);
  if (!window) return [];

  const dayEnd = new Date(requestedDate);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const appointments = await existingAppointments(providerId, requestedDate, dayEnd, excludeAppointmentId);
  const open = applyTime(requestedDate, window.startTime);
  const close = applyTime(requestedDate, window.endTime);
  const now = new Date();
  const slots = [];

  for (let cursor = open; addMinutes(cursor, service.durationMinutes) <= close; cursor = addMinutes(cursor, 30)) {
    const slotEnd = addMinutes(cursor, service.durationMinutes);
    const conflict = appointments.some((appointment) =>
      new Date(appointment.startAt) < slotEnd && new Date(appointment.endAt) > cursor,
    );
    if (!conflict && (!isBefore(cursor, now) || format(cursor, "yyyy-MM-dd") !== format(now, "yyyy-MM-dd"))) {
      slots.push({
        startAt: cursor.toISOString(),
        endAt: slotEnd.toISOString(),
        label: format(cursor, "h:mm a"),
      });
    }
  }
  return slots;
}

function hydrateMemoryAppointment(appointment) {
  const service = memory.services.find((entry) => entry._id === appointment.serviceId);
  const provider = memory.providers.find((entry) => entry._id === appointment.providerId);
  const customer = memory.users.find((entry) => entry._id === appointment.customerId);
  return {
    ...asObject(appointment),
    service: service ? { _id: service._id, name: service.name, durationMinutes: service.durationMinutes, price: service.price, category: service.category } : null,
    provider: provider ? { _id: provider._id, displayName: provider.displayName, title: provider.title, avatar: provider.avatar, location: provider.location } : null,
    customer: { _id: appointment.customerId, name: appointment.customerName || customer?.name || "Guest patient", avatar: customer?.avatar || "GP" },
  };
}

export async function listAppointmentsForUser(user, { status = "" } = {}) {
  if (isDatabaseConnected()) {
    const query = {};
    if (user.role === "customer") query.customerId = user._id;
    if (user.role === "provider") {
      const profile = await ProviderProfile.findOne({ userId: user._id }).lean();
      query.providerId = profile?._id;
    }
    if (status) query.status = status;
    return Appointment.find(query)
      .populate("serviceId", "name durationMinutes price category")
      .populate("providerId", "displayName title avatar location")
      .populate("customerId", "name avatar")
      .sort({ startAt: 1 })
      .lean()
      .then((items) => items.map((item) => ({ ...item, service: item.serviceId, provider: item.providerId, customer: item.customerId })));
  }

  let providerId;
  if (user.role === "provider") providerId = memory.providers.find((entry) => entry.userId === user._id)?._id;
  return memory.appointments
    .filter((appointment) =>
      (user.role === "admin" || appointment.customerId === user._id || appointment.providerId === providerId) &&
      (!status || appointment.status === status),
    )
    .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
    .map(hydrateMemoryAppointment);
}

export async function createAppointment({ customerId, providerId, serviceId, startAt, notes }) {
  const service = await getService(serviceId);
  const provider = await getProvider(providerId);
  const date = format(parseISO(startAt), "yyyy-MM-dd");
  const slots = await calculateSlots({ providerId, serviceId, date });
  const selected = slots.find((slot) => slot.startAt === startAt);
  if (!selected) {
    const error = new Error("That time was just booked. Please choose another available slot.");
    error.status = 409;
    throw error;
  }

  if (isDatabaseConnected()) {
    try {
      return await Appointment.create({
        customerId,
        providerId,
        serviceId,
        startAt: selected.startAt,
        endAt: selected.endAt,
        slotKey: `${providerId}:${selected.startAt}`,
        notes,
        serviceSnapshot: { name: service.name, durationMinutes: service.durationMinutes, price: service.price },
        providerSnapshot: { name: provider.displayName, title: provider.title, avatar: provider.avatar },
      });
    } catch (error) {
      if (error.code === 11000) {
        error.status = 409;
        error.message = "That time was just booked. Please choose another available slot.";
      }
      throw error;
    }
  }

  const appointment = {
    _id: `apt_${randomUUID()}`,
    customerId,
    providerId,
    serviceId,
    startAt: selected.startAt,
    endAt: selected.endAt,
    status: "pending",
    notes: notes || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  memory.appointments.push(appointment);
  return hydrateMemoryAppointment(appointment);
}

async function findOwnedAppointment(id, user) {
  if (isDatabaseConnected()) {
    const appointment = await Appointment.findById(id);
    if (!appointment) return null;
    if (user.role === "customer" && idOf(appointment.customerId) !== idOf(user._id)) return null;
    if (user.role === "provider") {
      const profile = await ProviderProfile.findOne({ userId: user._id }).lean();
      if (idOf(appointment.providerId) !== idOf(profile?._id)) return null;
    }
    return appointment;
  }
  const providerId = user.role === "provider" ? memory.providers.find((entry) => entry.userId === user._id)?._id : null;
  return memory.appointments.find((appointment) =>
    appointment._id === id && (user.role === "admin" || appointment.customerId === user._id || appointment.providerId === providerId),
  );
}

export async function rescheduleAppointment(id, user, startAt) {
  const appointment = await findOwnedAppointment(id, user);
  if (!appointment) {
    const error = new Error("Appointment not found");
    error.status = 404;
    throw error;
  }
  if (!["pending", "confirmed"].includes(appointment.status)) {
    const error = new Error("Only active appointments can be rescheduled");
    error.status = 422;
    throw error;
  }
  const date = format(parseISO(startAt), "yyyy-MM-dd");
  const slots = await calculateSlots({ providerId: idOf(appointment.providerId), serviceId: idOf(appointment.serviceId), date, excludeAppointmentId: id });
  const selected = slots.find((slot) => slot.startAt === startAt);
  if (!selected) {
    const error = new Error("That time is no longer available");
    error.status = 409;
    throw error;
  }

  appointment.startAt = selected.startAt;
  appointment.endAt = selected.endAt;
  appointment.status = "pending";
  appointment.slotKey = `${idOf(appointment.providerId)}:${selected.startAt}`;
  appointment.updatedAt = new Date().toISOString();
  if (typeof appointment.save === "function") await appointment.save();
  return isDatabaseConnected() ? asObject(appointment) : hydrateMemoryAppointment(appointment);
}

export async function cancelAppointment(id, user) {
  const appointment = await findOwnedAppointment(id, user);
  if (!appointment) {
    const error = new Error("Appointment not found");
    error.status = 404;
    throw error;
  }
  if (["completed", "cancelled", "no-show"].includes(appointment.status)) {
    const error = new Error("This appointment can no longer be cancelled");
    error.status = 422;
    throw error;
  }
  appointment.status = "cancelled";
  appointment.slotKey = undefined;
  appointment.updatedAt = new Date().toISOString();
  if (typeof appointment.save === "function") await appointment.save();
  return isDatabaseConnected() ? asObject(appointment) : hydrateMemoryAppointment(appointment);
}

export async function updateAppointmentStatus(id, user, status) {
  if (!["provider", "admin"].includes(user.role)) {
    const error = new Error("You do not have permission to update appointment status");
    error.status = 403;
    throw error;
  }
  const appointment = await findOwnedAppointment(id, user);
  if (!appointment) {
    const error = new Error("Appointment not found");
    error.status = 404;
    throw error;
  }
  const transitions = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["completed", "cancelled", "no-show"],
  };
  if (!transitions[appointment.status]?.includes(status)) {
    const error = new Error(`An appointment cannot move from ${appointment.status} to ${status}`);
    error.status = 422;
    throw error;
  }
  appointment.status = status;
  if (["cancelled", "no-show"].includes(status)) appointment.slotKey = undefined;
  appointment.updatedAt = new Date().toISOString();
  if (typeof appointment.save === "function") await appointment.save();
  return isDatabaseConnected() ? asObject(appointment) : hydrateMemoryAppointment(appointment);
}

export async function getProviderAvailability(user) {
  if (isDatabaseConnected()) {
    const profile = await ProviderProfile.findOne({ userId: user._id }).lean();
    return profile ? Availability.find({ providerId: profile._id }).sort({ weekday: 1 }).lean() : [];
  }
  const provider = memory.providers.find((entry) => entry.userId === user._id);
  return memory.availability.filter((entry) => entry.providerId === provider?._id);
}

export async function saveProviderAvailability(user, schedule) {
  if (isDatabaseConnected()) {
    const profile = await ProviderProfile.findOne({ userId: user._id }).lean();
    if (!profile) throw Object.assign(new Error("Provider profile not found"), { status: 404 });
    await Availability.deleteMany({ providerId: profile._id, date: null });
    return Availability.insertMany(schedule.filter((day) => day.enabled).map((day) => ({ ...day, providerId: profile._id, blocked: false })));
  }
  const provider = memory.providers.find((entry) => entry.userId === user._id);
  if (!provider) throw Object.assign(new Error("Provider profile not found"), { status: 404 });
  memory.availability = memory.availability.filter((entry) => entry.providerId !== provider._id || entry.date);
  const created = schedule.filter((day) => day.enabled).map((day) => ({
    _id: `avl_${randomUUID()}`,
    providerId: provider._id,
    weekday: day.weekday,
    startTime: day.startTime,
    endTime: day.endTime,
    blocked: false,
  }));
  memory.availability.push(...created);
  return created;
}

export async function getAdminOverview() {
  if (isDatabaseConnected()) {
    const [users, providers, services, appointments, pendingProviders] = await Promise.all([
      User.countDocuments(),
      ProviderProfile.countDocuments({ approved: true }),
      Service.countDocuments({ active: true }),
      Appointment.countDocuments(),
      ProviderProfile.countDocuments({ approved: false }),
    ]);
    return { users, providers, services, appointments, pendingProviders };
  }
  return {
    users: 1284 + memory.users.length,
    providers: memory.providers.filter((entry) => entry.approved).length,
    services: memory.services.filter((entry) => entry.active).length,
    appointments: 3920 + memory.appointments.length,
    pendingProviders: 3,
  };
}

export async function createService(input) {
  if (isDatabaseConnected()) return Service.create(input);
  const service = { _id: `svc_${randomUUID()}`, ...input, active: true, createdAt: new Date().toISOString() };
  memory.services.push(service);
  return service;
}
