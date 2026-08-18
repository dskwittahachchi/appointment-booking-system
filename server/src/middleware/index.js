import jwt from "jsonwebtoken";
import { findUserById } from "../services/repository.js";

const jwtSecret = () => process.env.JWT_SECRET || "novacare-demo-secret-change-in-production";

export function createToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, jwtSecret(), { expiresIn: "7d" });
}

export async function requireAuth(req, res, next) {
  try {
    const [scheme, token] = (req.headers.authorization || "").split(" ");
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ success: false, message: "Please sign in to continue", errors: [] });
    }
    const payload = jwt.verify(token, jwtSecret());
    const user = await findUserById(payload.sub);
    if (!user?.active) {
      return res.status(401).json({ success: false, message: "Your session is no longer active", errors: [] });
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Your session has expired. Please sign in again.", errors: [] });
  }
}

export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: "You do not have permission to perform this action", errors: [] });
    }
    next();
  };
}

export function validate(schema, target = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      return res.status(422).json({
        success: false,
        message: "Please check the highlighted information",
        errors: result.error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })),
      });
    }
    if (target === "query") req.validatedQuery = result.data;
    else req[target] = result.data;
    next();
  };
}

export function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}`, errors: [] });
}

export function errorHandler(error, _req, res, _next) {
  void _next;
  const status = error.status || (error.name === "CastError" ? 404 : 500);
  if (status >= 500) console.error(error);
  res.status(status).json({
    success: false,
    message: status >= 500 && process.env.NODE_ENV === "production" ? "Something went wrong" : error.message,
    errors: error.errors || [],
  });
}

export function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}
