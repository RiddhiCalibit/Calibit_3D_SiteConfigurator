import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import fs from "fs";
import bcrypt from 'bcryptjs';

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
`);

// Migration: Add phone column to users if it doesn't exist
const tableInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
const hasPhone = tableInfo.some(col => col.name === 'phone');
if (!hasPhone) {
  db.exec("ALTER TABLE users ADD COLUMN phone TEXT");
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

  // Password is 'password' for demo
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

  app.use(express.json());

  // Middleware 1: verify token
function authenticate(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // expects "Bearer <token>"

  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
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

  // API Routes
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    //const user = db.prepare("SELECT * FROM users WHERE email = ? AND password_hash = ?").get(email, password) as any;
    const user = db.prepare("SELECT * FROM users WHERE email = ? ").get(email) as any;
    
  //   if (user) {
  //     const tenant = user.tenant_id ? db.prepare("SELECT * FROM tenants WHERE id = ?").get(user.tenant_id) : null;
  //     res.json({ user, tenant });
  //   } else {
  //     res.status(401).json({ error: "Invalid credentials" });
  //   }
  // });

    if (user && await bcrypt.compare(password, user.password_hash)) {
    const tenant = user.tenant_id 
      ? db.prepare("SELECT * FROM tenants WHERE id = ?").get(user.tenant_id) 
      : null;

    // Issue JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        role: user.role, 
        tenantId: user.tenant_id 
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Don't send password_hash to the frontend
    const { password_hash, ...safeUser } = user;

    // res.json({ user, tenant });
    res.json({ user: safeUser, tenant, token });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// Tenant admin + platform admin API

  app.get("/api/tenant/:id/users",authenticate, requireRole('tenant_admin', 'platform_admin'), (req, res) => {
    const users = db.prepare("SELECT id, tenant_id, email, role, name, phone FROM users WHERE tenant_id = ?").all(req.params.id);
    res.json(users);
  });

  app.post("/api/tenant/:id/users",authenticate, requireRole('tenant_admin', 'platform_admin'), async (req, res) => { 
    const { id, email, password, role, name, phone } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      db.prepare("INSERT INTO users (id, tenant_id, email, password_hash, role, name, phone) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run(id, req.params.id, email, hashedPassword, role || 'sales_rep', name, phone);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/users/:id",authenticate, requireRole('tenant_admin', 'platform_admin'),async (req, res) => {
    const { name, phone, password } = req.body;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      db.prepare("UPDATE users SET name = ?, phone = ?, password_hash = ? WHERE id = ?")
        .run(name, phone, hashedPassword, req.params.id);
    } else {
      db.prepare("UPDATE users SET name = ?, phone = ? WHERE id = ?")
        .run(name, phone, req.params.id);
    }
    res.json({ success: true });
  });

  app.delete("/api/users/:id",authenticate, requireRole('tenant_admin', 'platform_admin'), (req, res) => {
    db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/tenant/:id/equipment",authenticate, requireRole('tenant_admin', 'platform_admin'), (req, res) => {
    const equipment = db.prepare("SELECT * FROM equipment WHERE tenant_id = ?").all(req.params.id);
    res.json(equipment);
  });

  app.post("/api/tenant/:id/equipment",authenticate, requireRole('tenant_admin', 'platform_admin'), (req, res) => {
    const { id, name, category, width, depth, height, color, model_url, animations_enabled } = req.body;
    db.prepare(`
      INSERT INTO equipment (id, tenant_id, name, category, width, depth, height, color, model_url, animations_enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.params.id, name, category, width, depth, height, color, model_url, animations_enabled ? 1 : 0);
    res.json({ success: true });
  });

  app.put("/api/tenant/:tenantId/equipment/:id",authenticate, requireRole('tenant_admin', 'platform_admin'), (req, res) => {
    const { name, category, width, depth, height, color, model_url, animations_enabled } = req.body;
    db.prepare(`
      UPDATE equipment 
      SET name = ?, category = ?, width = ?, depth = ?, height = ?, color = ?, model_url = ?, animations_enabled = ?
      WHERE id = ? AND tenant_id = ?
    `).run(name, category, width, depth, height, color, model_url, animations_enabled ? 1 : 0, req.params.id, req.params.tenantId);
    res.json({ success: true });
  });

  app.delete("/api/tenant/:tenantId/equipment/:id",authenticate, requireRole('tenant_admin', 'platform_admin'), (req, res) => {
    db.prepare("DELETE FROM equipment WHERE id = ? AND tenant_id = ?").run(req.params.id, req.params.tenantId);
    res.json({ success: true });
  });

  // Platform Admin API only
  app.get("/api/admin/tenants",authenticate, requireRole('platform_admin'), (req, res) => {
    const tenants = db.prepare("SELECT * FROM tenants ORDER BY created_at DESC").all();
    res.json(tenants);
  });

  app.post("/api/admin/tenants",authenticate, requireRole('platform_admin'), (req, res) => {
    const { id, name, logo_url, subscription_tier } = req.body;
    db.prepare("INSERT INTO tenants (id, name, logo_url, subscription_tier) VALUES (?, ?, ?, ?)")
      .run(id, name, logo_url, subscription_tier || 'basic');
    res.json({ success: true });
  });

  app.put("/api/admin/tenants/:id",authenticate, requireRole('platform_admin'), (req, res) => {
    const { name, logo_url, subscription_tier } = req.body;
    db.prepare("UPDATE tenants SET name = ?, logo_url = ?, subscription_tier = ? WHERE id = ?")
      .run(name, logo_url, subscription_tier, req.params.id);
    res.json({ success: true });
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
    const tenantId = req.query.tenantId;
    const projects = db.prepare("SELECT * FROM projects WHERE tenant_id = ? ORDER BY created_at DESC").all(tenantId);
    res.json(projects);
  });

  app.post("/api/projects",authenticate, (req, res) => {
    const { id, tenant_id, user_id, name, data } = req.body;
    db.prepare("INSERT INTO projects (id, tenant_id, user_id, name, data) VALUES (?, ?, ?, ?, ?)")
      .run(id, tenant_id, user_id, name, JSON.stringify(data));
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
