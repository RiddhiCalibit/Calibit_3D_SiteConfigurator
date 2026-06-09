import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

import fs from "fs";
dotenv.config();

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: "platform_admin" | "tenant_admin" | "sales_rep";
        tenantId?: string;
        userName: string;
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("❌ FATAL: JWT_SECRET env var is not set. Refusing to start.");
  process.exit(1);
}

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { v4 as uuidv4 } from "uuid";
import { DEFAULT_LIBRARY } from "./types";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// ─── PostgreSQL Connection Pool ───────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_URL?.includes("sslmode=require") ||
    process.env.DATABASE_URL?.includes("neon.tech") ||
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// ─── Gemini AI ────────────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set in .env");
const genai = new GoogleGenerativeAI(GEMINI_API_KEY);

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Returns current time as IST string e.g. "2025-01-01 10:30:00"
function getISTString(): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  return istTime.toISOString().replace("T", " ").substring(0, 19);
}

// ── Safe error message — never expose internals in production ──────────────
function safeError(err: any, fallback = "An error occurred"): string {
  if (process.env.NODE_ENV === "production") return fallback;
  return err?.message || fallback;
}
// async function ensureDatabaseSchema() {
//   // const schemaPath = path.resolve(process.cwd(), "schema.sql");
//   const schemaPath = path.resolve(__dirname, "../schema.sql");
//   if (!fs.existsSync(schemaPath)) {
//     throw new Error(`Database schema file missing: ${schemaPath}`);
//   }

async function ensureDatabaseSchema() {
  const candidates = [
    path.resolve(__dirname, "../schema.sql"),
    path.resolve(__dirname, "../../schema.sql"),
    path.resolve(process.cwd(), "backend/schema.sql"),
    path.resolve(process.cwd(), "schema.sql"),
  ];

  const schemaPath = candidates.find((p) => fs.existsSync(p));

  if (!schemaPath) {
    throw new Error(
      `Database schema file missing. Checked paths:\n  ${candidates.join("\n  ")}`,
    );
  }

  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  const statements = schemaSql
    .split(/;\s*(?:\r?\n|$)/)
    .map((stmt) => stmt.trim())
    .filter(Boolean);

  console.log(`📋 Executing ${statements.length} schema statements...`);

  for (const statement of statements) {
    try {
      await pool.query(statement);
    } catch (err) {
      console.error(
        "❌ Schema statement failed:",
        statement.substring(0, 50),
        err,
      );
      throw err;
    }
  }
  console.log(
    `✅ All ${statements.length} schema statements executed successfully`,
  );
}

async function logActivity(
  userId: string,
  userName: string,
  tenantId: string | null,
  action: string,
  entityType: string,
  entityName?: string,
  details?: string,
) {
  try {
    await pool.query(
      `INSERT INTO activity_logs (id, tenant_id, user_id, user_name, action, entity_type, entity_name, details, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        uuidv4(),
        tenantId,
        userId,
        userName,
        action,
        entityType,
        entityName || null,
        details || null,
        getISTString(),
      ],
    );
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────

function authenticate(req: any, res: any, next: any) {
  // Fix #6: read token from httpOnly cookie first, fall back to Authorization header
  const cookieToken = req.cookies?.auth_token;
  const authHeader = req.headers["authorization"];
  const token = cookieToken || (authHeader ? authHeader.split(" ")[1] : null);
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
      tenantId?: string;
      userName: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    console.log("❌ Token error:", (error as Error).message);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

function requireRole(...roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

function requireTenantAccess(req: any, res: any, next: any) {
  const requestedTenantId =
    req.params.tenantId || req.params.id || req.query.tenantId;
  if (req.user.role === "platform_admin") return next();
  if (req.user.tenantId !== requestedTenantId) {
    return res.status(403).json({ error: "Access denied to this tenant" });
  }
  next();
}

function validatePassword(password: string) {
  if (typeof password !== "string" || password.length < 8) {
    return "Password must be at least 8 characters";
  }
  return null;
}

// ─── Account Lockout Helpers ──────────────────────────────────────────────────

async function checkAccountLocked(userId: string) {
  const { rows } = await pool.query(
    "SELECT * FROM locked_accounts WHERE user_id = $1",
    [userId],
  );
  return rows[0] || null;
}

async function getLoginAttempts(userId: string) {
  const { rows } = await pool.query(
    "SELECT * FROM login_attempts WHERE user_id = $1",
    [userId],
  );
  return rows[0] || null;
}

async function recordFailedLoginAttempt(
  userId: string,
  email: string,
  userRole: string,
  tenantId: string | null,
) {
  const attempts = await getLoginAttempts(userId);
  const failedCount = (attempts?.failed_count || 0) + 1;

  if (failedCount >= 3) {
    // Lock the account
    const canUnlockByRoles =
      userRole === "sales_rep" ? "tenant_admin" : "platform_admin";
    const lockId = uuidv4();

    await pool.query(
      `INSERT INTO locked_accounts (id, user_id, email, user_role, locked_at, can_unlock_by_roles)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET locked_at = $5`,
      [lockId, userId, email, userRole, getISTString(), canUnlockByRoles],
    );

    // Clear login attempts
    await pool.query("DELETE FROM login_attempts WHERE user_id = $1", [userId]);

    return { isLocked: true, failedCount };
  } else {
    // Update login attempts
    if (attempts) {
      await pool.query(
        "UPDATE login_attempts SET failed_count = $1, last_attempt_at = $2 WHERE user_id = $3",
        [failedCount, getISTString(), userId],
      );
    } else {
      await pool.query(
        "INSERT INTO login_attempts (id, user_id, email, failed_count, last_attempt_at) VALUES ($1, $2, $3, $4, $5)",
        [uuidv4(), userId, email, failedCount, getISTString()],
      );
    }
    return { isLocked: false, failedCount };
  }
}

async function clearLoginAttempts(userId: string) {
  await pool.query("DELETE FROM login_attempts WHERE user_id = $1", [userId]);
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts. Try again in 15 minutes." },
});

// Max 5 password reset requests per IP per hour
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "Too many password reset requests. Try again in 1 hour." },
});

// Max 10 OTP verify attempts per IP per 15 minutes
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: "Too many verification attempts. Try again in 15 minutes.",
  },
});

// Global rate limiter — 200 requests per IP per 15 minutes across all routes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: "Too many requests. Please slow down." },
  skip: (req) => req.path === "/health", // skip health check
});

// ─── Server Bootstrap ─────────────────────────────────────────────────────────

async function startServer() {
  // Verify DB connection
  await pool.query("SELECT 1");
  console.log("✅ PostgreSQL connected");

  // Ensure database schema is created before handling requests
  await ensureDatabaseSchema();
  console.log("✅ Database schema verified");

  const app = express();
  app.use(globalLimiter); // ← Fix #5: global rate limit
  app.use(cookieParser()); // ← Fix #6: parse cookies

  app.use(
    cors({
      origin: [
        process.env.FRONTEND_URL || "http://localhost:5173",
        "http://localhost:5173",
      ],
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ limit: "25mb", extended: true }));

  app.use((req, res, next) => {
    console.log("👉 Incoming request:", req.method, req.url);
    next();
  });

  // const PORT = 3000;
  const PORT = parseInt(process.env.PORT || "3000", 10);

  // ─── Seed initial data if DB is empty ─────────────────────────────────────
  const { rows: tenantRows } = await pool.query(
    "SELECT count(*) as count FROM tenants",
  );
  if (parseInt(tenantRows[0].count) === 0) {
    const tenantId = "default-tenant";
    await pool.query(
      "INSERT INTO tenants (id, name, logo_url) VALUES ($1, $2, $3)",
      [
        tenantId,
        "EquipmentCo Global",
        "https://picsum.photos/seed/logo/200/200",
      ],
    );

    const hashedPassword = await bcrypt.hash("password", 10);

    await pool.query(
      "INSERT INTO users (id, tenant_id, email, password_hash, role, name) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        "admin-1",
        null,
        "platform@admin.com",
        hashedPassword,
        "platform_admin",
        "Platform Creator",
      ],
    );
    await pool.query(
      "INSERT INTO users (id, tenant_id, email, password_hash, role, name) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        "tenant-admin-1",
        tenantId,
        "admin@equipmentco.com",
        hashedPassword,
        "tenant_admin",
        "EquipmentCo Admin",
      ],
    );
    await pool.query(
      "INSERT INTO users (id, tenant_id, email, password_hash, role, name) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        "sales-1",
        tenantId,
        "sales@equipmentco.com",
        hashedPassword,
        "sales_rep",
        "John Sales",
      ],
    );
    console.log("✅ Database seeded");
  }

  // ─── Health check ──────────────────────────────────────────────────────────
  app.get("/api/health", (req, res) => {
    res.send("Backend is running 🚀");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // AUTH ROUTES
  // ══════════════════════════════════════════════════════════════════════════

  app.post("/api/auth/login", loginLimiter, async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      const { rows } = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email],
      );
      const user = rows[0];

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check if account is locked
      const lockedAccount = await checkAccountLocked(user.id);
      if (lockedAccount) {
        return res.status(423).json({
          error: "Account is locked due to too many failed login attempts",
          accountLocked: true,
          canUnlockByRoles: lockedAccount.can_unlock_by_roles,
          userRole: lockedAccount.user_role,
          lockedAt: lockedAccount.locked_at,
        });
      }

      // Check if sales rep account is inactive or archived
      // status column may not exist yet on older DBs — fall back to is_active
      const repStatus =
        user.status ?? (user.is_active === false ? "inactive" : "active");
      if (
        user.role === "sales_rep" &&
        (repStatus === "inactive" || repStatus === "archived")
      ) {
        return res.status(403).json({
          error:
            repStatus === "archived"
              ? "Your account has been archived. Please contact your administrator."
              : "Your account has been deactivated. Please contact your administrator.",
          accountDeactivated: true,
        });
      }

      if (user && (await bcrypt.compare(password, user.password_hash))) {
        // Clear login attempts on successful login
        await clearLoginAttempts(user.id);

        let tenant = null;
        if (user.tenant_id) {
          const tenantResult = await pool.query(
            "SELECT * FROM tenants WHERE id = $1",
            [user.tenant_id],
          );
          tenant = tenantResult.rows[0] || null;
        }

        const token = jwt.sign(
          {
            userId: user.id,
            role: user.role,
            tenantId: user.tenant_id,
            userName: user.name,
          },
          JWT_SECRET,
          { expiresIn: "8h" },
        );

        const { password_hash, ...safeUser } = user;
        // Fix #6: send token as httpOnly cookie (not in JSON body)
        res.cookie("auth_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
          maxAge: 8 * 60 * 60 * 1000, // 8 hours (matches JWT expiry)
          path: "/",
        });
        res.json({ user: safeUser, tenant, token }); // token also in body for backward compat during migration
        await logActivity(
          user.id,
          user.name,
          user.tenant_id,
          "LOGIN",
          "auth",
          user.name,
          `Logged in as ${user.role}`,
        );
      } else {
        // Record failed login attempt
        const lockResult = await recordFailedLoginAttempt(
          user.id,
          email,
          user.role,
          user.tenant_id,
        );

        if (lockResult.isLocked) {
          await logActivity(
            user.id,
            user.name,
            user.tenant_id,
            "LOGIN_FAILED",
            "auth",
            user.name,
            `Account locked after ${lockResult.failedCount} failed attempts`,
          );

          return res.status(423).json({
            error: "Account locked due to too many failed login attempts",
            accountLocked: true,
            canUnlockByRoles:
              user.role === "sales_rep" ? "tenant_admin" : "platform_admin",
            userRole: user.role,
          });
        } else {
          await logActivity(
            user.id,
            user.name,
            user.tenant_id,
            "LOGIN_FAILED",
            "auth",
            user.name,
            `Failed login attempt (${lockResult.failedCount}/3)`,
          );

          return res.status(401).json({
            error: `Invalid credentials (${lockResult.failedCount}/3 failed attempts)`,
            failedAttempts: lockResult.failedCount,
          });
        }
      }
    } catch (err: any) {
      console.error("Login route error:", err);
      return res.status(500).json({ error: "Login failed. Please try again." });
    }
  });

  // ── Logout — clears httpOnly cookie ────────────────────────────────────────
  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("auth_token", { path: "/" });
    res.json({ success: true });
  });

  app.post(
    "/api/auth/forgot-password",
    forgotPasswordLimiter,
    async (req, res) => {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email is required" });

      const { rows } = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email],
      );
      const user = rows[0];

      if (!user) {
        return res.json({
          message: "If this email exists, a request has been submitted.",
        });
      }

      const istString = getISTString();

      // Platform admin: self-reset via OTP
      if (user.role === "platform_admin") {
        try {
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          const expiresAtStr = new Date(
            Date.now() + 10 * 60 * 1000,
          ).toISOString();

          // Invalidate existing unused OTPs
          await pool.query(
            "UPDATE platform_admin_otps SET used = TRUE WHERE email = $1 AND used = FALSE",
            [email],
          );
          await pool.query(
            `INSERT INTO platform_admin_otps (id, user_id, email, otp, expires_at, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
            [uuidv4(), user.id, email, otp, expiresAtStr, istString],
          );

          console.log(`\n╔══════════════════════════════════════╗`);
          console.log(`║  PLATFORM ADMIN PASSWORD RESET OTP   ║`);
          console.log(`║  Email : ${email.padEnd(28)}║`);
          console.log(`║  OTP   : ${otp.padEnd(28)}║`);
          console.log(`║  Expires in 10 minutes               ║`);
          console.log(`╚══════════════════════════════════════╝\n`);

          await logActivity(
            user.id,
            user.name,
            null,
            "REQUEST",
            "platform_admin_reset",
            user.email,
            "OTP generated for self-reset",
          );
          return res.json({ requiresOtp: true, otp });
        } catch (err) {
          console.error("❌ OTP generation error:", err);
          return res
            .status(500)
            .json({ error: "Failed to generate OTP. Please try again." });
        }
      }

      // Tenant admin or sales rep: escalate reset request
      const id = uuidv4();
      await pool.query(
        `INSERT INTO password_reset_requests (id, user_id, email, status, created_at)
       VALUES ($1, $2, $3, 'pending', $4)`,
        [id, user.id, email, istString],
      );

      if (user.role === "tenant_admin") {
        await logActivity(
          user.id,
          user.name,
          null,
          "REQUEST",
          "tenant_admin_reset",
          user.email,
          "Tenant admin password reset requested — awaiting platform admin",
        );
      } else {
        await logActivity(
          user.id,
          user.name,
          user.tenant_id,
          "REQUEST",
          "password_reset",
          user.email,
          "Password reset requested",
        );
      }

      res.json({
        message: "If this email exists, a request has been submitted.",
      });
    },
  );

  app.post(
    "/api/auth/platform-reset-verify",
    otpVerifyLimiter,
    async (req, res) => {
      const { email, otp, new_password } = req.body;
      if (!email || !otp || !new_password) {
        return res
          .status(400)
          .json({ error: "Email, OTP, and new password are required" });
      }

      const { rows } = await pool.query(
        `SELECT * FROM platform_admin_otps
       WHERE email = $1 AND otp = $2 AND used = FALSE
       ORDER BY created_at DESC LIMIT 1`,
        [email, otp],
      );
      const record = rows[0];

      if (!record) {
        return res
          .status(400)
          .json({ error: "Invalid OTP. Please check the code and try again." });
      }
      if (new Date() > new Date(record.expires_at)) {
        return res
          .status(400)
          .json({ error: "OTP has expired. Please request a new one." });
      }

      const pwError = validatePassword(new_password);
      if (pwError) return res.status(400).json({ error: pwError });

      const hashedPassword = await bcrypt.hash(new_password, 10);
      await pool.query(
        "UPDATE users SET password_hash = $1, force_password_change = 0 WHERE id = $2",
        [hashedPassword, record.user_id],
      );
      await pool.query(
        "UPDATE platform_admin_otps SET used = TRUE WHERE id = $1",
        [record.id],
      );

      const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [
        record.user_id,
      ]);
      const user = userResult.rows[0];
      await logActivity(
        record.user_id,
        user?.name || "Platform Admin",
        null,
        "RESET",
        "platform_admin_reset",
        email,
        "Password self-reset via OTP",
      );

      res.json({ success: true });
    },
  );

  // ══════════════════════════════════════════════════════════════════════════
  // ACCOUNT LOCKOUT ROUTES
  // ══════════════════════════════════════════════════════════════════════════

  // Get all locked accounts (tenant admin sees their users, platform admin sees all)
  app.get(
    "/api/locked-accounts",
    authenticate,
    requireRole("tenant_admin", "platform_admin"),
    async (req, res) => {
      try {
        let query = "SELECT * FROM locked_accounts WHERE 1=1";
        const params: any[] = [];

        if (req.user?.role === "tenant_admin") {
          query += ` AND user_id IN (SELECT id FROM users WHERE tenant_id = $1)`;
          params.push(req.user.tenantId);
        }

        const { rows } = await pool.query(query, params);
        res.json(rows);
      } catch (err) {
        res.status(500).json({ error: "Failed to fetch locked accounts" });
      }
    },
  );

  // Unlock an account (with role-based authorization)
  app.post(
    "/api/locked-accounts/:userId/unlock",
    authenticate,
    requireRole("tenant_admin", "platform_admin"),
    async (req, res) => {
      try {
        const { userId } = req.params;
        const { reason } = req.body;

        // Get the locked account info
        const { rows: lockedRows } = await pool.query(
          "SELECT * FROM locked_accounts WHERE user_id = $1",
          [userId],
        );
        const lockedAccount = lockedRows[0];

        if (!lockedAccount) {
          return res
            .status(404)
            .json({ error: "Account not found or not locked" });
        }

        // Check authorization
        if (
          req.user?.role === "tenant_admin" &&
          lockedAccount.can_unlock_by_roles !== "tenant_admin"
        ) {
          return res.status(403).json({
            error: "Only platform admin can unlock this account",
          });
        }

        if (
          req.user?.role === "platform_admin" &&
          lockedAccount.can_unlock_by_roles !== "platform_admin"
        ) {
          return res.status(403).json({
            error: "Only tenant admin can unlock this account",
          });
        }

        // Verify tenant access for tenant_admin
        if (req.user?.role === "tenant_admin") {
          const { rows: userRows } = await pool.query(
            "SELECT * FROM users WHERE id = $1",
            [userId],
          );
          const targetUser = userRows[0];
          if (targetUser.tenant_id !== req.user.tenantId) {
            return res.status(403).json({ error: "Access denied" });
          }
        }

        // Unlock the account
        await pool.query("DELETE FROM locked_accounts WHERE user_id = $1", [
          userId,
        ]);

        // Log the action
        await logActivity(
          req.user!.userId,
          req.user!.userName,
          req.user?.tenantId || null,
          "UNLOCK",
          "account_lockout",
          lockedAccount.email,
          `Account unlocked by ${req.user?.role} - ${reason || "Admin unlock"}`,
        );

        res.json({ success: true, message: "Account unlocked" });
      } catch (err) {
        console.error("❌ Unlock error:", err);
        res.status(500).json({ error: "Failed to unlock account" });
      }
    },
  );

  // Get locked accounts that current user can unlock
  app.get(
    "/api/lockable-accounts",
    authenticate,
    requireRole("tenant_admin", "platform_admin"),
    async (req, res) => {
      try {
        let query = "SELECT * FROM locked_accounts WHERE 1=1";
        const params: any[] = [];

        if (req.user?.role === "tenant_admin") {
          // Tenant admin can unlock sales_rep accounts
          query += ` AND user_role = 'sales_rep' AND can_unlock_by_roles = 'tenant_admin'
                    AND user_id IN (SELECT id FROM users WHERE tenant_id = $1)`;
          params.push(req.user.tenantId);
        } else if (req.user?.role === "platform_admin") {
          // Platform admin can unlock tenant_admin accounts
          query += ` AND user_role = 'tenant_admin' AND can_unlock_by_roles = 'platform_admin'`;
        }

        const { rows } = await pool.query(query, params);
        res.json(rows);
      } catch (err) {
        res.status(500).json({ error: "Failed to fetch lockable accounts" });
      }
    },
  );

  // ══════════════════════════════════════════════════════════════════════════
  // USER ROUTES
  // ══════════════════════════════════════════════════════════════════════════

  app.get(
    "/api/tenant/:id/users",
    authenticate,
    requireRole("tenant_admin", "platform_admin"),
    requireTenantAccess,
    async (req, res) => {
      const { rows } = await pool.query(
        "SELECT id, tenant_id, email, role, name, phone, is_active, status FROM users WHERE tenant_id = $1",
        [req.params.id],
      );
      res.json(rows);
    },
  );

  app.post(
    "/api/tenant/:id/users",
    authenticate,
    requireRole("tenant_admin", "platform_admin"),
    requireTenantAccess,
    async (req, res) => {
      const { id, email, password, role, name, phone } = req.body;

      const { rows } = await pool.query(
        "SELECT count(*) as count FROM users WHERE tenant_id = $1 AND role = 'sales_rep' AND is_active = TRUE",
        [req.params.id],
      );
      if (parseInt(rows[0].count) >= 10) {
        return res.status(403).json({
          error:
            "User creation limit reached. This tenant has reached the maximum of 10 sales representatives.",
        });
      }

      const pwError = validatePassword(password);
      if (pwError) return res.status(400).json({ error: pwError });

      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
          "INSERT INTO users (id, tenant_id, email, password_hash, role, name, phone) VALUES ($1, $2, $3, $4, $5, $6, $7)",
          [
            id,
            req.params.id,
            email,
            hashedPassword,
            role || "sales_rep",
            name,
            phone,
          ],
        );
        if (req.user) {
          await logActivity(
            req.user.userId,
            req.user.userName,
            req.params.id,
            "CREATE",
            "sales_rep",
            name,
            `Created sales rep: ${email}`,
          );
        }
        res.json({ success: true });
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    },
  );

  app.put("/api/users/:id", authenticate, async (req, res) => {
    const { name, phone, password } = req.body;
    if (!req.user)
      return res.status(401).json({ error: "User not authenticated" });

    const isSelf = req.user.userId === req.params.id;
    const isAdmin =
      req.user.role === "tenant_admin" || req.user.role === "platform_admin";

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (password) {
      const pwError = validatePassword(password);
      if (pwError) return res.status(400).json({ error: pwError });
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        "UPDATE users SET name = $1, phone = $2, password_hash = $3, force_password_change = 0 WHERE id = $4",
        [name, phone, hashedPassword, req.params.id],
      );
      if (req.user) {
        await logActivity(
          req.user.userId,
          req.user.userName || "User",
          req.user.tenantId || null,
          "UPDATE",
          "profile",
          name,
          "Profile updated with password change",
        );
      }
    } else {
      await pool.query("UPDATE users SET name = $1, phone = $2 WHERE id = $3", [
        name,
        phone,
        req.params.id,
      ]);
      if (req.user) {
        await logActivity(
          req.user.userId,
          req.user.userName || "User",
          req.user.tenantId || null,
          "UPDATE",
          "profile",
          name,
          "Profile updated",
        );
      }
    }
    res.json({ success: true });
  });

  app.delete(
    "/api/users/:id",
    authenticate,
    requireRole("tenant_admin", "platform_admin"),
    async (req, res) => {
      try {
        const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [
          req.params.id,
        ]);
        const userToDelete = rows[0];

        if (!userToDelete) {
          return res.status(404).json({ error: "User not found" });
        }

        // Prevent deleting tenant_admin or platform_admin accounts
        if (
          userToDelete.role === "tenant_admin" ||
          userToDelete.role === "platform_admin"
        ) {
          return res
            .status(403)
            .json({ error: "Cannot delete admin accounts" });
        }

        // Nullify user_id on all related tables before deleting
        // so FK constraints don't block the delete
        await pool.query(
          "UPDATE projects SET user_id = NULL WHERE user_id = $1",
          [req.params.id],
        );
        await pool
          .query(
            "UPDATE shared_configurations SET user_id = NULL WHERE user_id = $1",
            [req.params.id],
          )
          .catch(() => {});
        await pool
          .query("UPDATE activity_logs SET user_id = NULL WHERE user_id = $1", [
            req.params.id,
          ])
          .catch(() => {});

        await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);

        if (req.user) {
          await logActivity(
            req.user.userId,
            req.user.userName || "Admin",
            req.user.tenantId || null,
            "DELETE",
            "sales_rep",
            userToDelete?.name,
            `Deleted: ${userToDelete?.email}`,
          );
        }
        res.json({ success: true });
      } catch (err: any) {
        console.error("Delete user error:", err);
        res
          .status(500)
          .json({ error: safeError(err, "Failed to delete user") });
      }
    },
  );

  // ══════════════════════════════════════════════════════════════════════════
  // SALES REP ACTIVE / INACTIVE TOGGLE
  // ══════════════════════════════════════════════════════════════════════════

  app.patch(
    "/api/users/:id/toggle-active",
    authenticate,
    requireRole("tenant_admin", "platform_admin"),
    async (req, res) => {
      try {
        const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [
          req.params.id,
        ]);
        const targetUser = rows[0];
        if (!targetUser) {
          return res.status(404).json({ error: "User not found" });
        }
        if (targetUser.role !== "sales_rep") {
          return res
            .status(400)
            .json({ error: "Can only toggle sales rep accounts" });
        }

        // Flip the current status (NULL / TRUE → FALSE, FALSE → TRUE)
        const currentlyActive = targetUser.is_active !== false;
        const newStatus = !currentlyActive;

        await pool.query(
          "UPDATE users SET is_active = $1, status = $2 WHERE id = $3",
          [newStatus, newStatus ? "active" : "inactive", req.params.id],
        );

        if (req.user) {
          await logActivity(
            req.user.userId,
            req.user.userName,
            targetUser.tenant_id,
            "UPDATE",
            "sales_rep",
            targetUser.name,
            `Sales rep ${targetUser.name} ${newStatus ? "activated" : "deactivated"}`,
          );
        }

        res.json({ success: true, is_active: newStatus });
      } catch (err: any) {
        res.status(500).json({ error: safeError(err) });
      }
    },
  );

  // ══════════════════════════════════════════════════════════════════════════
  // REASSIGN PROJECTS
  // ══════════════════════════════════════════════════════════════════════════

  // GET projects for a sales rep
  app.get(
    "/api/users/:id/projects",
    authenticate,
    requireRole("tenant_admin", "platform_admin"),
    async (req, res) => {
      try {
        const { rows } = await pool.query(
          "SELECT id, name, created_at, user_id FROM projects WHERE user_id = $1",
          [req.params.id],
        );
        res.json(rows);
      } catch (err: any) {
        res.status(500).json({ error: safeError(err) });
      }
    },
  );

  // PATCH reassign a single project to another sales rep
  app.patch(
    "/api/projects/:projectId/reassign",
    authenticate,
    requireRole("tenant_admin", "platform_admin"),
    async (req, res) => {
      try {
        const { newUserId } = req.body;
        if (!newUserId)
          return res.status(400).json({ error: "newUserId required" });

        // Get project + old user info
        const { rows: pRows } = await pool.query(
          "SELECT p.*, u.name as old_user_name FROM projects p LEFT JOIN users u ON p.user_id = u.id WHERE p.id = $1",
          [req.params.projectId],
        );
        const project = pRows[0];
        if (!project)
          return res.status(404).json({ error: "Project not found" });

        // Get new user info
        const { rows: uRows } = await pool.query(
          "SELECT * FROM users WHERE id = $1",
          [newUserId],
        );
        const newUser = uRows[0];
        if (!newUser)
          return res.status(404).json({ error: "New user not found" });

        // Reassign
        await pool.query("UPDATE projects SET user_id = $1 WHERE id = $2", [
          newUserId,
          req.params.projectId,
        ]);

        // Log the reassignment
        if (req.user) {
          await logActivity(
            req.user.userId,
            req.user.userName,
            project.tenant_id,
            "UPDATE",
            "project",
            project.name,
            `Project reassigned from "${project.old_user_name || "Unassigned"}" to "${newUser.name}" by admin`,
          );
        }
        res.json({ success: true });
      } catch (err: any) {
        res.status(500).json({ error: safeError(err) });
      }
    },
  );

  // PATCH bulk reassign all projects from one rep to another
  app.patch(
    "/api/users/:id/reassign-all-projects",
    authenticate,
    requireRole("tenant_admin", "platform_admin"),
    async (req, res) => {
      try {
        const { newUserId } = req.body;
        if (!newUserId)
          return res.status(400).json({ error: "newUserId required" });

        const { rows: fromUser } = await pool.query(
          "SELECT * FROM users WHERE id = $1",
          [req.params.id],
        );
        const { rows: toUser } = await pool.query(
          "SELECT * FROM users WHERE id = $1",
          [newUserId],
        );
        if (!fromUser[0] || !toUser[0])
          return res.status(404).json({ error: "User not found" });

        const { rows: projects } = await pool.query(
          "SELECT id, name, tenant_id FROM projects WHERE user_id = $1",
          [req.params.id],
        );

        // Reassign all
        await pool.query(
          "UPDATE projects SET user_id = $1 WHERE user_id = $2",
          [newUserId, req.params.id],
        );

        // Log each reassignment
        if (req.user) {
          for (const project of projects) {
            await logActivity(
              req.user.userId,
              req.user.userName,
              project.tenant_id,
              "UPDATE",
              "project",
              project.name,
              `Project reassigned from "${fromUser[0].name}" to "${toUser[0].name}" by admin (bulk)`,
            );
          }
        }
        res.json({ success: true, count: projects.length });
      } catch (err: any) {
        res.status(500).json({ error: safeError(err) });
      }
    },
  );

  // ══════════════════════════════════════════════════════════════════════════
  // ARCHIVE SALES REP
  // ══════════════════════════════════════════════════════════════════════════

  app.patch(
    "/api/users/:id/archive",
    authenticate,
    requireRole("tenant_admin", "platform_admin"),
    async (req, res) => {
      try {
        const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [
          req.params.id,
        ]);
        const targetUser = rows[0];
        if (!targetUser)
          return res.status(404).json({ error: "User not found" });
        if (targetUser.role !== "sales_rep")
          return res
            .status(400)
            .json({ error: "Can only archive sales rep accounts" });
        if (targetUser.status === "archived")
          return res.status(400).json({ error: "User is already archived" });

        // Check if they still have projects
        const { rows: projectRows } = await pool.query(
          "SELECT COUNT(*) as count FROM projects WHERE user_id = $1",
          [req.params.id],
        );
        const projectCount = parseInt(projectRows[0].count);
        if (projectCount > 0) {
          return res.status(409).json({
            error: "Cannot archive: this rep still has projects assigned.",
            projectCount,
          });
        }

        await pool.query(
          "UPDATE users SET status = 'archived', is_active = FALSE WHERE id = $1",
          [req.params.id],
        );

        if (req.user) {
          await logActivity(
            req.user.userId,
            req.user.userName,
            targetUser.tenant_id,
            "UPDATE",
            "sales_rep",
            targetUser.name,
            `Sales rep ${targetUser.name} archived by admin`,
          );
        }
        res.json({ success: true });
      } catch (err: any) {
        res.status(500).json({ error: safeError(err) });
      }
    },
  );

  // ══════════════════════════════════════════════════════════════════════════
  // EQUIPMENT ROUTES
  // ══════════════════════════════════════════════════════════════════════════

  app.get(
    "/api/tenant/:tenantId/equipment/stats",
    authenticate,
    requireTenantAccess,
    async (req, res) => {
      const { tenantId } = req.params;

      const { rows: customRows } = await pool.query(
        `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) as inactive
       FROM equipment
       WHERE tenant_id = $1`,
        [tenantId],
      );
      const custom = customRows[0];

      const { rows: disabledRows } = await pool.query(
        "SELECT COUNT(*) as count FROM tenant_disabled_defaults WHERE tenant_id = $1",
        [tenantId],
      );
      const disabledCount = parseInt(disabledRows[0].count);

      const DEFAULT_COUNT = DEFAULT_LIBRARY.length;
      const total = parseInt(custom.total) + DEFAULT_COUNT;
      const active =
        parseInt(custom.active || 0) + (DEFAULT_COUNT - disabledCount);
      const inactive = parseInt(custom.inactive || 0) + disabledCount;

      res.json({ total, active, inactive });
    },
  );

  app.get(
    "/api/tenant/:id/equipment",
    authenticate,
    requireTenantAccess,
    async (req, res) => {
      if (
        !req.user ||
        (req.user.tenantId !== req.params.id &&
          req.user.role !== "platform_admin")
      ) {
        return res.status(403).json({ error: "Access denied" });
      }
      const { rows } = await pool.query(
        "SELECT * FROM equipment WHERE tenant_id = $1",
        [req.params.id],
      );
      res.json(rows);
    },
  );

  app.post(
    "/api/tenant/:id/equipment",
    authenticate,
    requireTenantAccess,
    requireRole("tenant_admin", "platform_admin"),
    async (req, res) => {
      const {
        id,
        name,
        category,
        width,
        depth,
        height,
        color,
        model_url,
        animations_enabled,
        image_url,
        is_active,
      } = req.body;

      if (!name || typeof name !== "string" || name.trim() === "") {
        return res.status(400).json({ error: "Name is required" });
      }
      if (
        isNaN(width) ||
        isNaN(depth) ||
        isNaN(height) ||
        width <= 0 ||
        depth <= 0 ||
        height <= 0
      ) {
        return res.status(400).json({ error: "Invalid dimensions" });
      }

      await pool.query(
        `INSERT INTO equipment (id, tenant_id, name, category, width, depth, height, color, model_url, animations_enabled, image_url, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          id,
          req.params.id,
          name,
          category,
          width,
          depth,
          height,
          color,
          model_url,
          animations_enabled || false,
          image_url || null,
          is_active !== false,
        ],
      );
      if (req.user) {
        await logActivity(
          req.user.userId,
          req.user.userName || "Admin",
          req.params.id,
          "CREATE",
          "equipment",
          name,
          `Category: ${category}`,
        );
      }
      res.json({ success: true });
    },
  );

  app.put(
    "/api/tenant/:tenantId/equipment/:id",
    authenticate,
    requireTenantAccess,
    requireRole("tenant_admin", "platform_admin"),
    async (req, res) => {
      const {
        name,
        category,
        width,
        depth,
        height,
        color,
        model_url,
        animations_enabled,
        image_url,
        is_active,
      } = req.body;
      await pool.query(
        `UPDATE equipment
       SET name = $1, category = $2, width = $3, depth = $4, height = $5,
           color = $6, model_url = $7, animations_enabled = $8, image_url = $9, is_active = $10
       WHERE id = $11 AND tenant_id = $12`,
        [
          name,
          category,
          width,
          depth,
          height,
          color,
          model_url,
          animations_enabled || false,
          image_url || null,
          is_active !== false,
          req.params.id,
          req.params.tenantId,
        ],
      );
      if (req.user) {
        await logActivity(
          req.user.userId,
          req.user.userName || "Admin",
          req.params.tenantId,
          "UPDATE",
          "equipment",
          name,
          "Equipment updated",
        );
      }
      res.json({ success: true });
    },
  );

  app.delete(
    "/api/tenant/:tenantId/equipment/:id",
    authenticate,
    requireTenantAccess,
    requireRole("tenant_admin", "platform_admin"),
    async (req, res) => {
      const { rows } = await pool.query(
        "SELECT * FROM equipment WHERE id = $1",
        [req.params.id],
      );
      const eqToDelete = rows[0];
      await pool.query(
        "DELETE FROM equipment WHERE id = $1 AND tenant_id = $2",
        [req.params.id, req.params.tenantId],
      );
      if (req.user) {
        await logActivity(
          req.user.userId,
          req.user.userName || "Admin",
          req.params.tenantId,
          "DELETE",
          "equipment",
          eqToDelete?.name,
          "Equipment deleted",
        );
      }
      res.json({ success: true });
    },
  );

  app.patch(
    "/api/tenant/:tenantId/equipment/:id/toggle",
    authenticate,
    requireTenantAccess,
    requireRole("tenant_admin", "platform_admin"),
    async (req, res) => {
      const { is_active } = req.body;
      const { rows: equipmentRows } = await pool.query(
        "SELECT name FROM equipment WHERE id = $1 AND tenant_id = $2",
        [req.params.id, req.params.tenantId],
      );
      const equipmentName = equipmentRows[0]?.name || req.params.id;
      await pool.query(
        "UPDATE equipment SET is_active = $1 WHERE id = $2 AND tenant_id = $3",
        [is_active, req.params.id, req.params.tenantId],
      );
      if (req.user) {
        await logActivity(
          req.user.userId,
          req.user.userName || "Admin",
          req.params.tenantId,
          "UPDATE",
          "equipment",
          equipmentName,
          is_active ? "Equipment activated" : "Equipment deactivated",
        );
      }
      res.json({ success: true });
    },
  );

  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  // Validate Cloudinary config at startup
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    console.warn(
      "⚠️  Cloudinary env vars missing — GLB model uploads will not work.\n" +
        "   Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.",
    );
  }

  // Cloudinary storage for GLB uploads
  const cloudinaryStorage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "calibit-models",
      resource_type: "raw", // required for non-image files like .glb
      allowed_formats: ["glb", "gltf"],
    } as any,
  });

  const upload = multer({
    storage: cloudinaryStorage,
    limits: { fileSize: 25 * 1024 * 1024 },
  });

  // Still serve bundled/local models (duck.glb, tower.glb, etc.)
  app.use("/models", express.static(path.join(__dirname, "public/models")));

  app.post(
    "/api/upload/model",
    authenticate,
    upload.single("file"),
    (req: any, res: any) => {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      // req.file.path is the full Cloudinary HTTPS URL
      res.json({ url: (req.file as any).path });
    },
  );

  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

  // ══════════════════════════════════════════════════════════════════════════
  // DISABLED DEFAULTS ROUTES
  // ══════════════════════════════════════════════════════════════════════════

  app.get(
    "/api/tenant/:tenantId/disabled-defaults",
    authenticate,
    requireTenantAccess,
    async (req, res) => {
      const { rows } = await pool.query(
        "SELECT equipment_id FROM tenant_disabled_defaults WHERE tenant_id = $1",
        [req.params.tenantId],
      );
      res.json(rows.map((r: any) => r.equipment_id));
    },
  );

  app.post(
    "/api/tenant/:tenantId/disabled-defaults/:equipmentId",
    authenticate,
    requireTenantAccess,
    requireRole("tenant_admin", "platform_admin"),
    async (req, res) => {
      const { tenantId, equipmentId } = req.params;
      const equipmentName =
        DEFAULT_LIBRARY.find((item) => item.id === equipmentId)?.name ||
        equipmentId;

      const { rows } = await pool.query(
        "SELECT 1 FROM tenant_disabled_defaults WHERE tenant_id = $1 AND equipment_id = $2",
        [tenantId, equipmentId],
      );

      if (rows.length > 0) {
        // Currently disabled → re-enable
        await pool.query(
          "DELETE FROM tenant_disabled_defaults WHERE tenant_id = $1 AND equipment_id = $2",
          [tenantId, equipmentId],
        );
        await logActivity(
          req.user!.userId,
          req.user!.userName || "Admin",
          tenantId,
          "UPDATE",
          "equipment",
          equipmentName,
          "Default equipment re-enabled",
        );
        res.json({ disabled: false });
      } else {
        // Currently enabled → disable
        await pool.query(
          "INSERT INTO tenant_disabled_defaults (tenant_id, equipment_id) VALUES ($1, $2)",
          [tenantId, equipmentId],
        );
        await logActivity(
          req.user!.userId,
          req.user!.userName || "Admin",
          tenantId,
          "UPDATE",
          "equipment",
          equipmentName,
          "Default equipment disabled",
        );
        res.json({ disabled: true });
      }
    },
  );

  // ══════════════════════════════════════════════════════════════════════════
  // PLATFORM ADMIN ROUTES
  // ══════════════════════════════════════════════════════════════════════════

  app.get(
    "/api/admin/tenants",
    authenticate,
    requireRole("platform_admin"),
    async (req, res) => {
      // const { rows } = await pool.query(
      //   "SELECT * FROM tenants ORDER BY created_at DESC",
      // );
      const { rows } = await pool.query(`
       SELECT t.*, 
       CAST (COUNT(p.id) AS INTEGER) AS project_count
       FROM tenants t
       LEFT JOIN projects p ON p.tenant_id = t.id
       GROUP BY t.id
       ORDER BY t.created_at DESC
      `);
      res.json(rows);
    },
  );

  app.post(
    "/api/admin/tenants",
    authenticate,
    requireRole("platform_admin"),
    async (req, res) => {
      const { id, name, logo_url, subscription_tier, email, password } =
        req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required for tenant admin" });
      }

      try {
        await pool.query(
          "INSERT INTO tenants (id, name, logo_url, subscription_tier) VALUES ($1, $2, $3, $4)",
          [id, name, logo_url, subscription_tier || "basic"],
        );

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = `tenant-admin-${id}`;
        await pool.query(
          "INSERT INTO users (id, tenant_id, email, password_hash, role, name) VALUES ($1, $2, $3, $4, $5, $6)",
          [userId, id, email, hashedPassword, "tenant_admin", `${name} Admin`],
        );

        if (req.user) {
          await logActivity(
            req.user.userId,
            req.user.userName || "Platform Admin",
            null,
            "CREATE",
            "tenant",
            name,
            `Tier: ${subscription_tier || "basic"}`,
          );
        }
        res.json({ success: true });
      } catch (error: any) {
        // Rollback tenant if user creation fails
        await pool.query("DELETE FROM tenants WHERE id = $1", [id]);
        res.status(400).json({ error: error.message });
      }
    },
  );

  app.put(
    "/api/admin/tenants/:id",
    authenticate,
    requireRole("platform_admin"),
    async (req, res) => {
      const { name, logo_url, subscription_tier } = req.body;
      await pool.query(
        "UPDATE tenants SET name = $1, logo_url = $2, subscription_tier = $3 WHERE id = $4",
        [name, logo_url, subscription_tier, req.params.id],
      );
      if (req.user) {
        await logActivity(
          req.user.userId,
          req.user.userName || "Platform Admin",
          null,
          "UPDATE",
          "tenant",
          name,
          "Tenant updated",
        );
      }
      res.json({ success: true });
    },
  );

  app.get(
    "/api/admin/stats",
    authenticate,
    requireRole("platform_admin"),
    async (req, res) => {
      const [tenantRes, userRes, projectRes] = await Promise.all([
        pool.query("SELECT count(*) as count FROM tenants"),
        pool.query(
          "SELECT count(*) as count FROM users WHERE status != 'archived' OR status IS NULL",
        ),
        pool.query("SELECT count(*) as count FROM projects"),
      ]);
      res.json({
        tenants: parseInt(tenantRes.rows[0].count),
        users: parseInt(userRes.rows[0].count),
        projects: parseInt(projectRes.rows[0].count),
      });
    },
  );

  app.get(
    "/api/admin/users",
    authenticate,
    requireRole("platform_admin"),
    async (req, res) => {
      const { rows } = await pool.query(`
      SELECT u.id, u.tenant_id, u.email, u.role, u.name, u.phone,
             u.is_active, u.status, t.name as tenant_name
      FROM users u
      LEFT JOIN tenants t ON u.tenant_id = t.id
    `);
      res.json(rows);
    },
  );

  app.post(
    "/api/admin/users",
    authenticate,
    requireRole("platform_admin"),
    async (req, res) => {
      const { id, tenant_id, email, password, role, name } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        "INSERT INTO users (id, tenant_id, email, password_hash, role, name) VALUES ($1, $2, $3, $4, $5, $6)",
        [id, tenant_id, email, hashedPassword, role, name],
      );
      res.json({ success: true });
    },
  );

  // ══════════════════════════════════════════════════════════════════════════
  // PROJECT ROUTES
  // ══════════════════════════════════════════════════════════════════════════

  // app.get('/api/projects', authenticate, async (req, res) => {
  //   if (!req.user || (req.user.tenantId !== req.query.tenantId && req.user.role !== 'platform_admin')) {
  //     return res.status(403).json({ error: 'Access denied' });
  //   }
  //   const { rows } = await pool.query(
  //     'SELECT * FROM projects WHERE tenant_id = $1 ORDER BY created_at DESC',
  //     [req.query.tenantId]
  //   );
  //   res.json(rows);
  // });

  // app.post('/api/projects', authenticate, async (req, res) => {
  //   const { id, tenant_id, user_id, name, data } = req.body;
  //   await pool.query(
  //     'INSERT INTO projects (id, tenant_id, user_id, name, data) VALUES ($1, $2, $3, $4, $5)',
  //     [id, tenant_id, user_id, name, JSON.stringify(data)]
  //   );
  //   if (req.user) {
  //     await logActivity(req.user.userId, req.user.userName || 'User', tenant_id, 'SAVE', 'project', name, 'Project saved');
  //   }
  //   res.json({ success: true });
  // });

  // // 1. Get projects for a specific sales rep (for their own list)
  // //GET /api/projects?tenantId=x&userId=x

  // // 2. Update existing project (for edit/re-save)
  // //PUT /api/projects/:id

  // // 3. Delete a project
  // //DELETE /api/projects/:id

  // // 4. Generate share token for a project
  // //POST /api/projects/:id/share

  // // 5. Load a project via share token (public, no auth)
  // //GET /api/projects/shared/:token

  // // 6. Project stats per sales rep (for Tenant Admin)
  // //GET /api/tenant/:tenantId/project-stats

  // // 7. Active projects count (modified in last 5 days)
  // //GET /api/tenant/:tenantId/active-projects

  // GET all projects for a tenant (sales rep sees only their own)
  app.get("/api/projects", authenticate, async (req, res) => {
    const { tenantId, userId } = req.query as {
      tenantId: string;
      userId?: string;
    };

    if (
      !req.user ||
      (req.user.tenantId !== tenantId && req.user.role !== "platform_admin")
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Sales rep: only their own projects
    if (req.user.role === "sales_rep") {
      const { rows } = await pool.query(
        `SELECT id, tenant_id, user_id, name, client_name, created_at, updated_at
         FROM projects WHERE tenant_id = $1 AND user_id = $2
         ORDER BY COALESCE(updated_at, created_at) DESC`,
        [tenantId, req.user.userId],
      );
      return res.json(rows);
    }

    // Tenant admin / platform admin — optionally filter by userId
    if (userId) {
      const { rows } = await pool.query(
        `SELECT id, tenant_id, user_id, name, client_name, created_at, updated_at
         FROM projects WHERE tenant_id = $1 AND user_id = $2
         ORDER BY COALESCE(updated_at, created_at) DESC`,
        [tenantId, userId],
      );
      return res.json(rows);
    }

    const { rows } = await pool.query(
      `SELECT id, tenant_id, user_id, name, client_name, created_at, updated_at
       FROM projects WHERE tenant_id = $1
       ORDER BY COALESCE(updated_at, created_at) DESC`,
      [tenantId],
    );
    res.json(rows);
  });

  // GET a single project by ID — returns full data for loading into map
  // NOTE: This route must come BEFORE /api/projects/shared/:token
  app.get("/api/projects/:id", authenticate, async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM projects WHERE id = $1", [
      req.params.id,
    ]);
    const project = rows[0];
    if (!project) return res.status(404).json({ error: "Project not found" });

    if (
      req.user!.role === "sales_rep" &&
      project.user_id !== req.user!.userId
    ) {
      return res.status(403).json({ error: "Access denied" });
    }
    if (
      req.user!.role === "tenant_admin" &&
      project.tenant_id !== req.user!.tenantId
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (typeof project.data === "string")
      project.data = JSON.parse(project.data);
    res.json(project);
  });

  // POST create a new project
  app.post("/api/projects", authenticate, async (req, res) => {
    const { id, tenant_id, user_id, name, data, client_name } = req.body;
    const now = getISTString();
    await pool.query(
      "INSERT INTO projects (id, tenant_id, user_id, name, data, client_name, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [
        id,
        tenant_id,
        user_id,
        name,
        JSON.stringify(data),
        client_name || null,
        now,
        now,
      ],
    );
    if (req.user) {
      await logActivity(
        req.user.userId,
        req.user.userName || "User",
        tenant_id,
        "CREATE",
        "project",
        name,
        "Project created",
      );
    }
    res.json({ success: true, id });
  });

  // PUT update/re-save an existing project
  app.put("/api/projects/:id", authenticate, async (req, res) => {
    const { name, data, client_name } = req.body;
    const { rows } = await pool.query("SELECT * FROM projects WHERE id = $1", [
      req.params.id,
    ]);
    const project = rows[0];
    if (!project) return res.status(404).json({ error: "Project not found" });

    if (
      req.user!.role === "sales_rep" &&
      project.user_id !== req.user!.userId
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    const now = getISTString();
    await pool.query(
      "UPDATE projects SET name = $1, data = $2, client_name = $3, updated_at = $4 WHERE id = $5 ",
      [
        name || project.name,
        JSON.stringify(data),
        // client_name || project.client_name,
        client_name !== undefined ? client_name : project.client_name,
        now,
        req.params.id,
      ],
    );
    if (req.user) {
      await logActivity(
        req.user.userId,
        req.user.userName || "User",
        project.tenant_id,
        "UPDATE",
        "project",
        name || project.name,
        "Project updated",
      );
    }
    res.json({ success: true });
  });

  // DELETE a project
  app.delete("/api/projects/:id", authenticate, async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM projects WHERE id = $1", [
      req.params.id,
    ]);
    const project = rows[0];
    if (!project) return res.status(404).json({ error: "Project not found" });

    if (
      req.user!.role === "sales_rep" &&
      project.user_id !== req.user!.userId
    ) {
      return res.status(403).json({ error: "Access denied" });
    }
    if (
      req.user!.role === "tenant_admin" &&
      project.tenant_id !== req.user!.tenantId
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    await pool.query("DELETE FROM projects WHERE id = $1", [req.params.id]);
    if (req.user) {
      await logActivity(
        req.user.userId,
        req.user.userName || "User",
        project.tenant_id,
        "DELETE",
        "project",
        project.name,
        "Project deleted",
      );
    }
    res.json({ success: true });
  });

  // POST generate or retrieve share link for a project
  app.post("/api/projects/:id/share", authenticate, async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM projects WHERE id = $1", [
      req.params.id,
    ]);
    const project = rows[0];
    if (!project) return res.status(404).json({ error: "Project not found" });

    if (
      req.user!.role === "sales_rep" &&
      project.user_id !== req.user!.userId
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    let token = project.share_token;
    if (!token) {
      token = uuidv4().replace(/-/g, "");
      await pool.query("UPDATE projects SET share_token = $1 WHERE id = $2", [
        token,
        req.params.id,
      ]);
    }

    if (req.user) {
      await logActivity(
        req.user.userId,
        req.user.userName || "User",
        project.tenant_id,
        "SHARE",
        "project",
        project.name,
        "Share link generated",
      );
    }
    res.json({
      token,
      shareUrl: `${process.env.FRONTEND_URL || "http://localhost:5173"}/shared/${token}`,
    });
  });

  // GET load a shared project by token — no auth required (view-only)
  app.get("/api/projects/shared/:token", async (req, res) => {
    const { rows } = await pool.query(
      "SELECT * FROM projects WHERE share_token = $1",
      [req.params.token],
    );
    const project = rows[0];
    if (!project)
      return res
        .status(404)
        .json({ error: "Shared project not found or link has expired" });

    if (typeof project.data === "string")
      project.data = JSON.parse(project.data);

    // Fetch custom equipment for this tenant so shared view can show names
    const { rows: equipmentRows } = await pool.query(
      "SELECT id, name, color, width, depth, height FROM equipment WHERE tenant_id = $1",
      [project.tenant_id],
    );

    res.json({
      id: project.id,
      name: project.name,
      client_name: project.client_name,
      created_at: project.created_at,
      updated_at: project.updated_at,
      data: project.data,
      customEquipment: equipmentRows,
    });
  });

  // GET project stats per sales rep (Tenant Admin dashboard)
  app.get(
    "/api/tenant/:tenantId/project-stats",
    authenticate,
    requireRole("tenant_admin", "platform_admin"),
    requireTenantAccess,
    async (req, res) => {
      const { rows } = await pool.query(
        `SELECT
         u.id as user_id,
         u.name as user_name,
         u.email,
         COUNT(p.id) as project_count,
         MAX(COALESCE(p.updated_at, p.created_at)) as last_active
       FROM users u
       LEFT JOIN projects p ON p.user_id = u.id AND p.tenant_id = $1
       WHERE u.tenant_id = $1 AND u.role = 'sales_rep'
       GROUP BY u.id, u.name, u.email
       ORDER BY project_count DESC`,
        [req.params.tenantId],
      );
      res.json(rows);
    },
  );

  // GET count of active projects (modified in last 5 days)
  app.get(
    "/api/tenant/:tenantId/active-projects",
    authenticate,
    requireRole("tenant_admin", "platform_admin"),
    requireTenantAccess,
    async (req, res) => {
      const { rows } = await pool.query(
        `SELECT COUNT(*) as count FROM projects
       WHERE tenant_id = $1
       AND COALESCE(updated_at, created_at) >= NOW() - INTERVAL '5 days'`,
        [req.params.tenantId],
      );
      res.json({ count: parseInt(rows[0].count) });
    },
  );

  // ══════════════════════════════════════════════════════════════════════════
  // PASSWORD RESET ROUTES
  // ══════════════════════════════════════════════════════════════════════════

  app.get(
    "/api/admin/reset-requests",
    authenticate,
    requireRole("tenant_admin", "platform_admin"),
    async (req, res) => {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      let rows;
      if (req.user.role === "tenant_admin") {
        const result = await pool.query(
          `SELECT r.*, u.name as user_name, u.role as user_role
         FROM password_reset_requests r
         JOIN users u ON r.user_id = u.id
         WHERE r.status = 'pending' AND u.role = 'sales_rep' AND u.tenant_id = $1
         ORDER BY r.created_at DESC`,
          [req.user.tenantId],
        );
        rows = result.rows;
      } else {
        const result = await pool.query(
          `SELECT r.*, u.name as user_name, u.role as user_role
         FROM password_reset_requests r
         JOIN users u ON r.user_id = u.id
         WHERE r.status = 'pending'
         ORDER BY r.created_at DESC`,
        );
        rows = result.rows;
      }
      res.json(rows);
    },
  );

  app.get(
    "/api/admin/tenant-admin-resets",
    authenticate,
    requireRole("platform_admin"),
    async (req, res) => {
      const { rows } = await pool.query(
        `SELECT r.*, u.name as user_name, u.role as user_role, t.name as tenant_name
       FROM password_reset_requests r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN tenants t ON u.tenant_id = t.id
       WHERE r.status = 'pending' AND u.role = 'tenant_admin'
       ORDER BY r.created_at DESC`,
      );
      res.json(rows);
    },
  );

  app.post(
    "/api/admin/reset-requests/:id/resolve",
    authenticate,
    requireRole("tenant_admin", "platform_admin"),
    async (req, res) => {
      const { temp_password } = req.body;

      if (!temp_password || temp_password.length < 8) {
        return res
          .status(400)
          .json({ error: "Temp password must be at least 8 characters" });
      }

      const { rows } = await pool.query(
        "SELECT * FROM password_reset_requests WHERE id = $1",
        [req.params.id],
      );
      const request = rows[0];
      if (!request) return res.status(404).json({ error: "Request not found" });

      const hashedPassword = await bcrypt.hash(temp_password, 10);
      await pool.query(
        "UPDATE users SET password_hash = $1, force_password_change = 1 WHERE id = $2",
        [hashedPassword, request.user_id],
      );
      await pool.query(
        "UPDATE password_reset_requests SET status = 'resolved' WHERE id = $1",
        [req.params.id],
      );

      const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [
        request.user_id,
      ]);
      const resetUser = userResult.rows[0];

      if (resetUser?.role === "tenant_admin") {
        await logActivity(
          req.user!.userId,
          req.user!.userName || "Platform Admin",
          null,
          "RESOLVE",
          "tenant_admin_reset",
          resetUser?.name,
          "Temporary password set by Platform Admin",
        );
      } else {
        await logActivity(
          req.user!.userId,
          req.user!.userName || "Admin",
          resetUser?.tenant_id,
          "RESOLVE",
          "password_reset",
          resetUser?.name,
          "Temporary password set by Tenant Admin",
        );
      }

      res.json({ success: true });
    },
  );

  // ══════════════════════════════════════════════════════════════════════════
  // LOGS ROUTES
  // ══════════════════════════════════════════════════════════════════════════

  app.get(
    "/api/tenant/:id/logs",
    authenticate,
    requireRole("tenant_admin", "platform_admin"),
    requireTenantAccess,
    async (req, res) => {
      const limit = Number(req.query.limit) || 50;
      const offset = Number(req.query.offset) || 0;
      const { rows } = await pool.query(
        `SELECT * FROM activity_logs
       WHERE tenant_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
        [req.params.id, limit, offset],
      );
      res.json(rows);
    },
  );

  app.get(
    "/api/admin/logs",
    authenticate,
    requireRole("platform_admin"),
    async (req, res) => {
      const limit = Number(req.query.limit) || 100;
      const offset = Number(req.query.offset) || 0;
      const { rows } = await pool.query(
        `SELECT * FROM activity_logs
       WHERE tenant_id IS NULL
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
        [limit, offset],
      );
      res.json(rows);
    },
  );

  // ══════════════════════════════════════════════════════════════════════════
  // COMPLIANCE ROUTE (Gemini AI)
  // ══════════════════════════════════════════════════════════════════════════

  app.post("/api/compliance/check", async (req, res) => {
    try {
      const siteData = req.body;

      const prompt = `
        Analyze the following 3D site configuration for compliance with safety and operational standards.
        The site is a water park / recreational facility.

        Rules to check:
        1. Safety Distances: Pools (category 'pools') should have at least 5m clearance from facilities (category 'facilities').
        2. Capacity: If there are more than 5 major attractions (slides/pools) but only 1 ticket booth or food kiosk, flag as a capacity warning.
        3. Accessibility: Seating areas should be distributed near pools.
        4. Safety: Slides should not be placed too close to each other (min 3m).

        Site Data:
        ${JSON.stringify(siteData, null, 2)}

        Return a structured JSON report.
      `;

      const model = genai.getGenerativeModel({
        model: "gemini-3-flash-preview",
      });

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              overallScore: {
                type: SchemaType.NUMBER,
                description: "Score from 0 to 100",
              },
              summary: { type: SchemaType.STRING },
              checks: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    category: { type: SchemaType.STRING },
                    status: {
                      type: SchemaType.STRING,
                      format: "enum",
                      enum: ["pass", "fail", "warning"],
                    },
                    message: { type: SchemaType.STRING },
                    details: { type: SchemaType.STRING },
                  },
                  required: ["category", "status", "message"],
                },
              },
              recommendations: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
              },
            },
            required: ["overallScore", "summary", "checks", "recommendations"],
          },
        },
      });

      const response = result.response;
      const text = response.text();
      if (!text) {
        throw new Error("Failed to get response text from AI");
      }
      const report = JSON.parse(text);
      res.json(report);
    } catch (err: any) {
      console.error("Compliance check failed:", err);
      res
        .status(500)
        .json({ error: safeError(err, "Compliance check failed") });
    }
  });

  // ─── Serve frontend (must be AFTER all API routes) ────────────────────────
  const frontendDist = path.join(__dirname, "../../frontend/dist");
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    // Catch-all: send index.html for React Router — but NOT for static assets
    app.get("*", (req, res) => {
      // If request is for a file with an extension, let it 404 naturally
      if (req.path.includes(".")) {
        res.status(404).send("Not found");
        return;
      }
      res.sendFile(path.join(frontendDist, "index.html"));
    });
    console.log("✅ Serving frontend from:", frontendDist);
  } else {
    console.warn("⚠️  Frontend dist not found at:", frontendDist);
    console.warn("   Run: cd frontend && npm install && npm run build");
  }

  // ─── Start Listening ───────────────────────────────────────────────────────
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
