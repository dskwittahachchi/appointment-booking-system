import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["customer", "provider", "admin"], default: "customer", index: true },
    avatar: String,
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const providerProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    displayName: { type: String, required: true },
    title: { type: String, required: true },
    bio: { type: String, required: true },
    specialties: [{ type: String, trim: true }],
    serviceIds: [{ type: Schema.Types.ObjectId, ref: "Service" }],
    rating: { type: Number, default: 5, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    yearsExperience: { type: Number, default: 0 },
    languages: [String],
    location: String,
    avatar: String,
    approved: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

const serviceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true },
    durationMinutes: { type: Number, required: true, min: 15, max: 480 },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, index: true },
    icon: { type: String, default: "sparkles" },
    accent: { type: String, default: "sage" },
    providerIds: [{ type: Schema.Types.ObjectId, ref: "ProviderProfile" }],
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

const availabilitySchema = new Schema(
  {
    providerId: { type: Schema.Types.ObjectId, ref: "ProviderProfile", required: true, index: true },
    weekday: { type: Number, min: 0, max: 6 },
    date: Date,
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    blocked: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const appointmentSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    providerId: { type: Schema.Types.ObjectId, ref: "ProviderProfile", required: true, index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true },
    slotKey: { type: String, unique: true, sparse: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled", "no-show"],
      default: "pending",
      index: true,
    },
    notes: { type: String, maxlength: 1000 },
    serviceSnapshot: { name: String, durationMinutes: Number, price: Number },
    providerSnapshot: { name: String, title: String, avatar: String },
  },
  { timestamps: true },
);

appointmentSchema.index({ providerId: 1, startAt: 1, status: 1 });
availabilitySchema.index({ providerId: 1, weekday: 1, date: 1 });

export const User = models.User || model("User", userSchema);
export const ProviderProfile = models.ProviderProfile || model("ProviderProfile", providerProfileSchema);
export const Service = models.Service || model("Service", serviceSchema);
export const Availability = models.Availability || model("Availability", availabilitySchema);
export const Appointment = models.Appointment || model("Appointment", appointmentSchema);
