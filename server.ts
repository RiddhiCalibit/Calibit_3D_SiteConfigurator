import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: 'platform_admin' | 'tenant_admin' | 'sales_rep';
        tenantId?: string;
        userName: string;
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import fs from "fs";
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("enterprise.db");

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#14b8a6',
    subscription_tier TEXT DEFAULT 'basic',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('platform_admin', 'tenant_admin', 'sales_rep')) NOT NULL,
    name TEXT,
    phone TEXT,
    FOREIGN KEY(tenant_id) REFERENCES tenants(id)
  );

  CREATE TABLE IF NOT EXISTS equipment (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
    name TEXT NOT NULL,
    category TEXT,
    width REAL,
    depth REAL,
    height REAL,
    color TEXT,
    model_url TEXT,
    animations_enabled INTEGER DEFAULT 0,
    FOREIGN KEY(tenant_id) REFERENCES tenants(id)
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
    user_id TEXT,
    name TEXT NOT NULL,
    data TEXT NOT NULL, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(tenant_id) REFERENCES tenants(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS password_reset_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending',  -- pending | resolved
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_name TEXT,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

`);

// Migration: Add phone column to users if it doesn't exist
const tableInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
const hasPhone = tableInfo.some(col => col.name === 'phone');
if (!hasPhone) {
  db.exec("ALTER TABLE users ADD COLUMN phone TEXT");
}
// Migration: Add force_password_change column to users if it doesn't exist
const userInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
const hasForceChange = userInfo.some(col => col.name === 'force_password_change');
if (!hasForceChange) {
  db.exec("ALTER TABLE users ADD COLUMN force_password_change INTEGER DEFAULT 0");
}
// Add imageUrl column to DB if it doesn't exist
const equipmentInfo = db.prepare("PRAGMA table_info(equipment)").all() as any[];
const hasImageUrl = equipmentInfo.some((col: any) => col.name === 'image_url');
if (!hasImageUrl) {
  db.exec("ALTER TABLE equipment ADD COLUMN image_url TEXT");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Seed initial data if empty
const tenantCount = db.prepare("SELECT count(*) as count FROM tenants").get() as any;
if (tenantCount.count === 0) {
  const tenantId = "default-tenant";
  db.prepare("INSERT INTO tenants (id, name, logo_url) VALUES (?, ?, ?)").run(
    tenantId, 
    "EquipmentCo Global", 
    "https://picsum.photos/seed/logo/200/200"
  );

  // When seeding users (one-time setup), hash the password:
  const hashedPassword = await bcrypt.hash("password", 10);

  db.prepare("INSERT INTO users (id, tenant_id, email, password_hash, role, name) VALUES (?, ?, ?, ?, ?, ?)").run(
    "admin-1",
    null,
    "platform@admin.com",
    //"password", // In real app, use bcrypt
    hashedPassword,
    "platform_admin",
    "Platform Creator"
  );

  db.prepare("INSERT INTO users (id, tenant_id, email, password_hash, role, name) VALUES (?, ?, ?, ?, ?, ?)").run(
    "tenant-admin-1",
    tenantId,
    "admin@equipmentco.com",
    //"password",
    hashedPassword,
    "tenant_admin",
    "EquipmentCo Admin"
  );

  db.prepare("INSERT INTO users (id, tenant_id, email, password_hash, role, name) VALUES (?, ?, ?, ?, ?, ?)").run(
    "sales-1",
    tenantId,
    "sales@equipmentco.com",
    //"password",
    hashedPassword,
    "sales_rep",
    "John Sales"
  );
}

  // app.use(express.json());

  //  Allow up to 5MB for base64 images
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Middleware 1: verify token
function authenticate(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // expects "Bearer <token>"

  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string; tenantId?: string; userName: string };
    req.user = decoded; // attach decoded user info to request
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Middleware 2: check role
function requireRole(...roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// Checks user belongs to the tenant they're requesting
function requireTenantAccess(req: any, res: any, next: any) {
  const requestedTenantId = req.params.tenantId || req.params.id || req.query.tenantId;
  
  // Platform admins can access any tenant
  if (req.user.role === 'platform_admin') return next();
  
  // Everyone else can only access their own tenant
  if (req.user.tenantId !== requestedTenantId) {
    return res.status(403).json({ error: 'Access denied to this tenant' });
  }
  
  next();
}

function validatePassword(password: string) {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  return null;
}

function logActivity(
  userId: string,
  userName: string,
  tenantId: string | null,
  action: string,
  entityType: string,
  entityName?: string,
  details?: string
) {
  try {
    db.prepare(`
      INSERT INTO activity_logs (id, tenant_id, user_id, user_name, action, entity_type, entity_name, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), tenantId, userId, userName, action, entityType, entityName || null, details || null);
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 attempts per IP
  message: { error: 'Too many login attempts. Try again in 15 minutes.' }
});

  // API Routes
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
    //const user = db.prepare("SELECT * FROM users WHERE email = ? AND password_hash = ?").get(email, password) as any;
    const user = db.prepare("SELECT * FROM users WHERE email = ? ").get(email) as any;

    if (user && await bcrypt.compare(password, user.password_hash)) {
    const tenant = user.tenant_id 
      ? db.prepare("SELECT * FROM tenants WHERE id = ?").get(user.tenant_id) 
      : null;

    // Issue JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        tenantId: user.tenant_id,
        userName: user.name
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
  
    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, tenant, token });
    logActivity(user.id, user.name, user.tenant_id, 'LOGIN', 'auth', user.name, `Logged in as ${user.role}`);
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }

  // After successful login
logActivity(user.id, user.name, user.tenant_id, 'LOGIN', 'auth', 'Session', `Logged in as ${user.role}`);

});


// Tenant admin + platform admin API

  app.get("/api/tenant/:id/users",authenticate, requireRole('tenant_admin', 'platform_admin'),requireTenantAccess, (req, res) => {
    const users = db.prepare("SELECT id, tenant_id, email, role, name, phone FROM users WHERE tenant_id = ?").all(req.params.id);
    res.json(users);
  });

  app.post("/api/tenant/:id/users",authenticate, requireRole('tenant_admin', 'platform_admin'),requireTenantAccess, async (req, res) => { 
    const { id, email, password, role, name, phone } = req.body;

      // Check sales rep limit — max 10 per tenant
  const salesRepCount = db.prepare(
    "SELECT count(*) as count FROM users WHERE tenant_id = ? AND role = 'sales_rep'"
  ).get(req.params.id) as any;

  if (salesRepCount.count >= 10) {
    return res.status(403).json({ 
      error: 'User creation limit reached. This tenant has reached the maximum of 10 sales representatives. Please contact your platform admin for more info.' 
    });
   
  }

  const pwError = validatePassword(password);
  if (pwError) return res.status(400).json({ error: pwError });
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      db.prepare("INSERT INTO users (id, tenant_id, email, password_hash, role, name, phone) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run(id, req.params.id, email, hashedPassword, role || 'sales_rep', name, phone);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
     logActivity(req.user.userId, req.user.userName, req.params.id, 'CREATE', 'sales_rep', name, `Created sales rep: ${email}`);
  });

  // app.put("/api/users/:id",authenticate, requireRole('tenant_admin', 'platform_admin'),async (req, res) => {
  //   const { name, phone, password } = req.body;
  //   if (password) {
  //     const hashedPassword = await bcrypt.hash(password, 10);
  //     db.prepare("UPDATE users SET name = ?, phone = ?, password_hash = ? WHERE id = ?")
  //       .run(name, phone, hashedPassword, req.params.id);
  //   } else {
  //     db.prepare("UPDATE users SET name = ?, phone = ? WHERE id = ?")
  //       .run(name, phone, req.params.id);
  //   }
  //   res.json({ success: true });
  // });

//   app.put("/api/users/:id", authenticate, async (req, res) => {
//   const { name, phone, password } = req.body;

//   // Users can only update their own profile
//   // Admins can update anyone in their tenant
//   if (req.user.userId !== req.params.id && req.user.role === 'sales_rep') {
//     return res.status(403).json({ error: 'You can only update your own profile' });
//   }

//   if (password) {
//     const pwError = validatePassword(password);
//     if (pwError) return res.status(400).json({ error: pwError });
//     const hashedPassword = await bcrypt.hash(password, 10);
//     db.prepare("UPDATE users SET name = ?, phone = ?, password_hash = ?, force_password_change = 0 WHERE id = ?")
//       .run(name, phone, hashedPassword, req.params.id);
//   } else {
//     db.prepare("UPDATE users SET name = ?, phone = ? WHERE id = ?")
//       .run(name, phone, req.params.id);
//   }
//   res.json({ success: true });
// });

app.put("/api/users/:id", authenticate, async (req, res) => {
  const { name, phone, password } = req.body;

  // Allow if updating own profile OR if admin
  const isSelf = req.user.userId === req.params.id;
  console.log('DEBUG:', req.user.userId, '===', req.params.id, '| isSelf:', isSelf);
  const isAdmin = req.user.role === 'tenant_admin' || req.user.role === 'platform_admin';

  // ✅ Add this debug line temporarily
  console.log('PUT users - isSelf:', isSelf, 'isAdmin:', isAdmin, 'tokenUserId:', req.user.userId, 'paramId:', req.params.id);
  
  if (!isSelf && !isAdmin) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (password) {
    const pwError = validatePassword(password);
    if (pwError) return res.status(400).json({ error: pwError });
    const hashedPassword = await bcrypt.hash(password, 10);
    // Also clear force_password_change flag when password is updated
    db.prepare("UPDATE users SET name = ?, phone = ?, password_hash = ?, force_password_change = 0 WHERE id = ?")
      .run(name, phone, hashedPassword, req.params.id);
  } else {
    db.prepare("UPDATE users SET name = ?, phone = ? WHERE id = ?")
      .run(name, phone, req.params.id);
    logActivity(req.user.userId, req.user.userName || 'User', req.user.tenantId, 'UPDATE', 'profile', name, 'Profile updated');
  }

  res.json({ success: true });
});

  // app.delete("/api/users/:id",authenticate, requireRole('tenant_admin', 'platform_admin'), (req, res) => {
  //   db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
  //   res.json({ success: true });
  // });

  app.delete("/api/users/:id", authenticate, requireRole('tenant_admin', 'platform_admin'), (req, res) => {
  const userToDelete = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id) as any;
  db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
  logActivity(req.user.userId, req.user.userName || 'Admin', req.user.tenantId, 'DELETE', 'sales_rep', userToDelete?.name, `Deleted: ${userToDelete?.email}`);
  res.json({ success: true });
});

  app.get("/api/tenant/:id/equipment",authenticate, requireTenantAccess, (req, res) => {

      // user can only access their own tenant
  if (req.user.tenantId !== req.params.id && req.user.role !== 'platform_admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

    const equipment = db.prepare("SELECT * FROM equipment WHERE tenant_id = ?").all(req.params.id);
    res.json(equipment);
  });

  app.post("/api/tenant/:id/equipment",authenticate,requireTenantAccess, requireRole('tenant_admin', 'platform_admin'), async(req, res) => {
    const { id, name, category, width, depth, height, color, model_url, animations_enabled, image_url } = req.body;

      // Validate before touching the DB
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (isNaN(width) || isNaN(depth) || isNaN(height) || width <= 0 || depth <= 0 || height <= 0) {
    return res.status(400).json({ error: 'Invalid dimensions' });
  }

    db.prepare(`
      INSERT INTO equipment (id, tenant_id, name, category, width, depth, height, color, model_url, animations_enabled, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.params.id, name, category, width, depth, height, color, model_url, animations_enabled ? 1 : 0, image_url || null);
    res.json({ success: true });
    logActivity(req.user.userId, req.user.userName || 'Admin', req.params.id, 'CREATE', 'equipment', name, `Category: ${category}`);
  });

  app.put("/api/tenant/:tenantId/equipment/:id",authenticate,requireTenantAccess, requireRole('tenant_admin', 'platform_admin'), (req, res) => {
    const { name, category, width, depth, height, color, model_url, animations_enabled, image_url } = req.body;
    db.prepare(`
      UPDATE equipment 
      SET name = ?, category = ?, width = ?, depth = ?, height = ?, color = ?, model_url = ?, animations_enabled = ?, image_url = ?
      WHERE id = ? AND tenant_id = ?
    `).run(name, category, width, depth, height, color, model_url, animations_enabled ? 1 : 0, image_url || null, req.params.id, req.params.tenantId);
    res.json({ success: true });
    logActivity(req.user.userId, req.user.userName || 'Admin', req.params.tenantId, 'UPDATE', 'equipment', name, 'Equipment updated');
  });

  // app.delete("/api/tenant/:tenantId/equipment/:id",authenticate,requireTenantAccess, requireRole('tenant_admin', 'platform_admin'), (req, res) => {
  //   db.prepare("DELETE FROM equipment WHERE id = ? AND tenant_id = ?").run(req.params.id, req.params.tenantId);
  //   res.json({ success: true });
  // });
  app.delete("/api/tenant/:tenantId/equipment/:id", authenticate, requireTenantAccess, requireRole('tenant_admin', 'platform_admin'), (req, res) => {
  const eqToDelete = db.prepare("SELECT * FROM equipment WHERE id = ?").get(req.params.id) as any;
  db.prepare("DELETE FROM equipment WHERE id = ? AND tenant_id = ?").run(req.params.id, req.params.tenantId);
  logActivity(req.user.userId, req.user.userName || 'Admin', req.params.tenantId, 'DELETE', 'equipment', eqToDelete?.name, 'Equipment deleted');
  res.json({ success: true });
});

  // Platform Admin API only
  app.get("/api/admin/tenants",authenticate, requireRole('platform_admin'), (req, res) => {
    const tenants = db.prepare("SELECT * FROM tenants ORDER BY created_at DESC").all();
    res.json(tenants);
  });

  app.post("/api/admin/tenants",authenticate, requireRole('platform_admin'), async (req, res) => {
    const { id, name, logo_url, subscription_tier, email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required for tenant admin' });
    }

    try {
      // Insert tenant
      db.prepare("INSERT INTO tenants (id, name, logo_url, subscription_tier) VALUES (?, ?, ?, ?)")
        .run(id, name, logo_url, subscription_tier || 'basic');

      // Create tenant admin user
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = `tenant-admin-${id}`;
      db.prepare("INSERT INTO users (id, tenant_id, email, password_hash, role, name) VALUES (?, ?, ?, ?, ?, ?)")
        .run(userId, id, email, hashedPassword, 'tenant_admin', `${name} Admin`);

      res.json({ success: true });
    } catch (error: any) {
      // Rollback tenant creation if user creation fails
      db.prepare("DELETE FROM tenants WHERE id = ?").run(id);
      res.status(400).json({ error: error.message });
    }
    logActivity(req.user.userId, req.user.userName || 'Platform Admin', null, 'CREATE', 'tenant', name, `Tier: ${subscription_tier || 'basic'}`);
  });

  app.put("/api/admin/tenants/:id",authenticate, requireRole('platform_admin'), (req, res) => {
    const { name, logo_url, subscription_tier } = req.body;
    db.prepare("UPDATE tenants SET name = ?, logo_url = ?, subscription_tier = ? WHERE id = ?")
      .run(name, logo_url, subscription_tier, req.params.id);
    res.json({ success: true });
    logActivity(req.user.userId, req.user.userName || 'Platform Admin', null, 'UPDATE', 'tenant', name, 'Tenant updated');
  });

  app.get("/api/admin/stats",authenticate, requireRole('platform_admin'), (req, res) => {
    const tenantCount = db.prepare("SELECT count(*) as count FROM tenants").get() as any;
    const userCount = db.prepare("SELECT count(*) as count FROM users").get() as any;
    const projectCount = db.prepare("SELECT count(*) as count FROM projects").get() as any;
    res.json({
      tenants: tenantCount.count,
      users: userCount.count,
      projects: projectCount.count
    });
  });

  app.get("/api/admin/users",authenticate, requireRole('platform_admin'), (req, res) => {
    const users = db.prepare(`
      SELECT u.id, u.tenant_id, u.email, u.role, u.name, u.phone, t.name as tenant_name 
      FROM users u 
      LEFT JOIN tenants t ON u.tenant_id = t.id
    `).all();
    res.json(users);
  });

  app.post("/api/admin/users",authenticate, requireRole('platform_admin'), async (req, res) => {
    const { id, tenant_id, email, password, role, name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    db.prepare("INSERT INTO users (id, tenant_id, email, password_hash, role, name) VALUES (?, ?, ?, ?, ?, ?)")
      .run(id, tenant_id, email, hashedPassword, role, name);
    res.json({ success: true });
  });

  // Any logged in user API (Sales Rep)
  app.get("/api/projects",authenticate, (req, res) => {

      //user can only access their own tenant
  if (!req.user || (req.user.tenantId !== req.query.tenantId && req.user.role !== 'platform_admin')) {
    return res.status(403).json({ error: 'Access denied' });
  }

    const tenantId = req.query.tenantId;
    const projects = db.prepare("SELECT * FROM projects WHERE tenant_id = ? ORDER BY created_at DESC").all(tenantId);
    res.json(projects);
  });

  app.post("/api/projects",authenticate, (req, res) => {
    const { id, tenant_id, user_id, name, data } = req.body;
    db.prepare("INSERT INTO projects (id, tenant_id, user_id, name, data) VALUES (?, ?, ?, ?, ?)")
      .run(id, tenant_id, user_id, name, JSON.stringify(data));
    res.json({ success: true });
    logActivity(req.user.userId, req.user.userName || 'User', tenant_id, 'SAVE', 'project', name, 'Project saved');
  });

  // User submits forgot password request
  app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
  if (!user) {
    // Don't reveal if email exists or not — security best practice
    return res.json({ message: 'If this email exists, a request has been submitted.' });
  }

  const { v4: uuidv4 } = await import('uuid');
  db.prepare(`
    INSERT INTO password_reset_requests (id, user_id, email, status)
    VALUES (?, ?, ?, 'pending')
  `).run(uuidv4(), user.id, email);
 // Always return same message — don't reveal if email exists
  res.json({ message: 'If this email exists, a request has been submitted.' });
  if (user) {
  logActivity(user.id, user.name, user.tenant_id, 'REQUEST', 'password_reset', user.email, 'Password reset requested');
}
});

// Admin fetches all pending reset requests
app.get("/api/admin/reset-requests", authenticate, requireRole('tenant_admin', 'platform_admin'), (req, res) => {
  const requests = db.prepare(`
    SELECT r.*, u.name as user_name 
    FROM password_reset_requests r
    JOIN users u ON r.user_id = u.id
    WHERE r.status = 'pending'
    ORDER BY r.created_at DESC
  `).all();
  const resetUser = db.prepare("SELECT * FROM users WHERE id = ?").get(requests.user_id) as any;
logActivity(req.user.userId, req.user.userName || 'Admin', req.user.tenantId, 'RESOLVE', 'password_reset', resetUser?.name, 'Temporary password set');
  res.json(requests);
});

// Tenant admin logs
app.get("/api/tenant/:id/logs", authenticate, requireRole('tenant_admin', 'platform_admin'), requireTenantAccess, (req, res) => {
  const limit = Number(req.query.limit) || 50;
  const offset = Number(req.query.offset) || 0;
  const logs = db.prepare(`
    SELECT * FROM activity_logs 
    WHERE tenant_id = ? 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `).all(req.params.id, limit, offset);
  res.json(logs);
});

// Platform admin logs
app.get("/api/admin/logs", authenticate, requireRole('platform_admin'), (req, res) => {
  const limit = Number(req.query.limit) || 50;
  const offset = Number(req.query.offset) || 0;
  const logs = db.prepare(`
    SELECT * FROM activity_logs 
    WHERE tenant_id IS NULL 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `).all(limit, offset);
  res.json(logs);
});

// Admin sets temp password and marks request resolved
app.post("/api/admin/reset-requests/:id/resolve", authenticate, requireRole('tenant_admin', 'platform_admin'), async (req, res) => {
  const { temp_password } = req.body;

  if (!temp_password || temp_password.length < 8) {
    return res.status(400).json({ error: 'Temp password must be at least 8 characters' });
  }

  const request = db.prepare("SELECT * FROM password_reset_requests WHERE id = ?").get(req.params.id) as any;
  if (!request) return res.status(404).json({ error: 'Request not found' });

  const hashedPassword = await bcrypt.hash(temp_password, 10);

  // Update user password and flag them to change it on next login
  db.prepare("UPDATE users SET password_hash = ?, force_password_change = 1 WHERE id = ?")
    .run(hashedPassword, request.user_id);

  // Mark request as resolved
  db.prepare("UPDATE password_reset_requests SET status = 'resolved' WHERE id = ?")
    .run(req.params.id);

  res.json({ success: true });
});

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
