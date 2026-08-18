import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { asyncRoute, createToken, requireAuth, validate } from "../middleware/index.js";
import { findUserByEmail, registerUser } from "../services/repository.js";

const router = Router();

const loginSchema = z.object({
  email: z.email("Enter a valid email address").transform((value) => value.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2, "Enter your full name").max(80),
});

router.post("/login", validate(loginSchema), asyncRoute(async (req, res) => {
  const user = await findUserByEmail(req.body.email, true);
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) {
    return res.status(401).json({ success: false, message: "Email or password is incorrect", errors: [] });
  }
  const safeUser = { ...user };
  delete safeUser.passwordHash;
  res.json({ success: true, message: "Welcome back", data: { token: createToken(user), user: safeUser } });
}));

router.post("/register", validate(registerSchema), asyncRoute(async (req, res) => {
  const user = await registerUser(req.body);
  res.status(201).json({ success: true, message: "Your account is ready", data: { token: createToken(user), user } });
}));

router.get("/me", requireAuth, (req, res) => {
  res.json({ success: true, message: "Session active", data: req.user });
});

export default router;
