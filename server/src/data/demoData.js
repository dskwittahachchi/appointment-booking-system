import bcrypt from "bcryptjs";

const ids = {
  customer: "usr_customer_maya",
  provider: "usr_provider_sarah",
  admin: "usr_admin_olivia",
};

export const demoCredentials = [
  { role: "customer", email: "customer@novacare.demo", password: "Demo123!" },
  { role: "provider", email: "provider@novacare.demo", password: "Demo123!" },
  { role: "admin", email: "admin@novacare.demo", password: "Demo123!" },
];

export const demoServices = [
  {
    _id: "svc_general",
    name: "General consultation",
    description: "A thoughtful, unhurried check-in for everyday health concerns and next steps.",
    durationMinutes: 30,
    price: 85,
    category: "Primary care",
    icon: "stethoscope",
    accent: "sage",
    active: true,
  },
  {
    _id: "svc_therapy",
    name: "Therapy session",
    description: "A private space to pause, reflect, and build practical tools with a licensed therapist.",
    durationMinutes: 50,
    price: 120,
    category: "Mental wellness",
    icon: "heart",
    accent: "lilac",
    active: true,
  },
  {
    _id: "svc_nutrition",
    name: "Nutrition coaching",
    description: "Personal nutrition guidance designed around your routines, goals, and preferences.",
    durationMinutes: 45,
    price: 95,
    category: "Wellness",
    icon: "leaf",
    accent: "sand",
    active: true,
  },
  {
    _id: "svc_skin",
    name: "Skin consultation",
    description: "Expert assessment and a clear, personalized plan for healthier, calmer skin.",
    durationMinutes: 30,
    price: 110,
    category: "Dermatology",
    icon: "sparkles",
    accent: "rose",
    active: true,
  },
];

export const demoProviders = [
  {
    _id: "prv_sarah",
    userId: ids.provider,
    displayName: "Dr. Sarah Chen",
    title: "Family medicine",
    bio: "Sarah pairs evidence-based primary care with a calm, collaborative approach.",
    specialties: ["Preventive care", "Women's health"],
    serviceIds: ["svc_general"],
    rating: 4.9,
    reviewCount: 148,
    yearsExperience: 12,
    languages: ["English", "Mandarin"],
    location: "Willow Clinic · Room 3",
    avatar: "SC",
    approved: true,
  },
  {
    _id: "prv_marcus",
    userId: "usr_provider_marcus",
    displayName: "Marcus Reed, LMFT",
    title: "Relationship therapist",
    bio: "Marcus creates a grounded, inclusive space for meaningful and sustainable change.",
    specialties: ["Anxiety", "Relationships"],
    serviceIds: ["svc_therapy"],
    rating: 5,
    reviewCount: 96,
    yearsExperience: 9,
    languages: ["English", "Spanish"],
    location: "Telehealth",
    avatar: "MR",
    approved: true,
  },
  {
    _id: "prv_amara",
    userId: "usr_provider_amara",
    displayName: "Amara Okafor, RD",
    title: "Registered dietitian",
    bio: "Amara turns nutrition science into kind, practical habits that last.",
    specialties: ["Gut health", "Plant-forward nutrition"],
    serviceIds: ["svc_nutrition"],
    rating: 4.8,
    reviewCount: 87,
    yearsExperience: 8,
    languages: ["English", "Igbo"],
    location: "Garden Studio · Suite 12",
    avatar: "AO",
    approved: true,
  },
  {
    _id: "prv_elena",
    userId: "usr_provider_elena",
    displayName: "Dr. Elena Rossi",
    title: "Consultant dermatologist",
    bio: "Elena specializes in clear explanations and realistic plans for long-term skin health.",
    specialties: ["Acne", "Sensitive skin"],
    serviceIds: ["svc_skin"],
    rating: 4.9,
    reviewCount: 121,
    yearsExperience: 14,
    languages: ["English", "Italian"],
    location: "Nova Dermatology · Floor 2",
    avatar: "ER",
    approved: true,
  },
];

function dateAt(daysFromToday, hour, minute = 0) {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString();
}

export async function createDemoStore() {
  const passwordHash = await bcrypt.hash("Demo123!", 10);
  const users = [
    { _id: ids.customer, name: "Maya Thompson", email: "customer@novacare.demo", role: "customer", avatar: "MT", passwordHash, active: true },
    { _id: ids.provider, name: "Dr. Sarah Chen", email: "provider@novacare.demo", role: "provider", avatar: "SC", passwordHash, active: true },
    { _id: ids.admin, name: "Olivia Park", email: "admin@novacare.demo", role: "admin", avatar: "OP", passwordHash, active: true },
  ];

  const appointments = [
    {
      _id: "apt_upcoming_maya",
      customerId: ids.customer,
      providerId: "prv_sarah",
      serviceId: "svc_general",
      startAt: dateAt(2, 10, 30),
      endAt: dateAt(2, 11, 0),
      status: "confirmed",
      notes: "Annual wellness check-in",
      createdAt: dateAt(-5, 9),
    },
    {
      _id: "apt_maya_past",
      customerId: ids.customer,
      providerId: "prv_amara",
      serviceId: "svc_nutrition",
      startAt: dateAt(-18, 14),
      endAt: dateAt(-18, 14, 45),
      status: "completed",
      notes: "Nutrition follow-up",
      createdAt: dateAt(-25, 10),
    },
    {
      _id: "apt_sarah_today_1",
      customerId: "usr_customer_noah",
      customerName: "Noah Williams",
      providerId: "prv_sarah",
      serviceId: "svc_general",
      startAt: dateAt(0, 9),
      endAt: dateAt(0, 9, 30),
      status: "confirmed",
      notes: "Follow-up consultation",
      createdAt: dateAt(-3, 11),
    },
    {
      _id: "apt_sarah_today_2",
      customerId: "usr_customer_emma",
      customerName: "Emma Wilson",
      providerId: "prv_sarah",
      serviceId: "svc_general",
      startAt: dateAt(0, 11),
      endAt: dateAt(0, 11, 30),
      status: "pending",
      notes: "Recurring headaches",
      createdAt: dateAt(-1, 16),
    },
    {
      _id: "apt_sarah_today_3",
      customerId: "usr_customer_lucas",
      customerName: "Lucas Brown",
      providerId: "prv_sarah",
      serviceId: "svc_general",
      startAt: dateAt(0, 14, 30),
      endAt: dateAt(0, 15),
      status: "confirmed",
      notes: "Wellness review",
      createdAt: dateAt(-4, 8),
    },
  ];

  const availability = demoProviders.flatMap((provider) =>
    [1, 2, 3, 4, 5].map((weekday) => ({
      _id: `avl_${provider._id}_${weekday}`,
      providerId: provider._id,
      weekday,
      startTime: "09:00",
      endTime: weekday === 5 ? "15:00" : "17:00",
      blocked: false,
    })),
  );

  return { users, services: structuredClone(demoServices), providers: structuredClone(demoProviders), appointments, availability };
}
