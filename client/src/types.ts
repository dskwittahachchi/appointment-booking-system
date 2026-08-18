export type Role = "customer" | "provider" | "admin";
export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no-show";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  active: boolean;
}

export interface Service {
  _id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  category: string;
  icon: string;
  accent: "sage" | "lilac" | "sand" | "rose";
  active: boolean;
}

export interface Provider {
  _id: string;
  userId: string;
  displayName: string;
  title: string;
  bio: string;
  specialties: string[];
  serviceIds: string[];
  rating: number;
  reviewCount: number;
  yearsExperience: number;
  languages: string[];
  location: string;
  avatar: string;
  approved: boolean;
}

export interface Slot {
  startAt: string;
  endAt: string;
  label: string;
}

export interface Appointment {
  _id: string;
  customerId: string;
  providerId: string;
  serviceId: string;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  notes: string;
  service: Pick<Service, "_id" | "name" | "durationMinutes" | "price" | "category"> | null;
  provider: Pick<Provider, "_id" | "displayName" | "title" | "avatar" | "location"> | null;
  customer: Pick<User, "_id" | "name" | "avatar">;
}

export interface Availability {
  _id?: string;
  weekday: number;
  startTime: string;
  endTime: string;
  blocked?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Array<{ field: string; message: string }>;
}
