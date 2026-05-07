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

import express from 'express';
import cors from 'cors';
import path from 'path';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_LIBRARY } from './types';
import { GoogleGenAI, Type } from '@google/genai';

// ─── PostgreSQL Connection Pool ───────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// ─── Gemini AI ────────────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set in .env');
const genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Returns current time as IST string e.g. "2025-01-01 10:30:00"
function getISTString(): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  return istTime.toISOString().replace('T', ' ').substring(0, 19);
}

async function logActivity(
  userId: string,
  userName: string,
  tenantId: string | null,
  action: string,
  entityType: string,
  entityName?: string,
  details?: string
) {
  try {
    await pool.query(
      `INSERT INTO activity_logs (id, tenant_id, user_id, user_name, action, entity_type, entity_name, details, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [uuidv4(), tenantId, userId, userName, action, entityType, entityName || null, details || null, getISTString()]
    );
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────

function authenticate(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    console.log('❌ No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string; role: string; tenantId?: string; userName: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    console.log('❌ Token error:', (error as Error).message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(...roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

function requireTenantAccess(req: any, res: any, next: any) {
  const requestedTenantId = req.params.tenantId || req.params.id || req.query.tenantId;
  if (req.user.role === 'platform_admin') return next();
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

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
});

// ─── Server Bootstrap ─────────────────────────────────────────────────────────

async function startServer() {
  // Verify DB connection
  await pool.query('SELECT 1');
  console.log('✅ PostgreSQL connected');

  const app = express();

  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }));
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ limit: '5mb', extended: true }));

  app.use((req, res, next) => {
    console.log('👉 Incoming request:', req.method, req.url);
    next();
  });

  const PORT = 3000;

  // ─── Seed initial data if DB is empty ─────────────────────────────────────
  const { rows: tenantRows } = await pool.query('SELECT count(*) as count FROM tenants');
  if (parseInt(tenantRows[0].count) === 0) {
    const tenantId = 'default-tenant';
    await pool.query(
      'INSERT INTO tenants (id, name, logo_url) VALUES ($1, $2, $3)',
      [tenantId, 'EquipmentCo Global', 'https://picsum.photos/seed/logo/200/200']
    );

    const hashedPassword = await bcrypt.hash('password', 10);

    await pool.query(
      'INSERT INTO users (id, tenant_id, email, password_hash, role, name) VALUES ($1, $2, $3, $4, $5, $6)',
      ['admin-1', null, 'platform@admin.com', hashedPassword, 'platform_admin', 'Platform Creator']
    );
    await pool.query(
      'INSERT INTO users (id, tenant_id, email, password_hash, role, name) VALUES ($1, $2, $3, $4, $5, $6)',
      ['tenant-admin-1', tenantId, 'admin@equipmentco.com', hashedPassword, 'tenant_admin', 'EquipmentCo Admin']
    );
    await pool.query(
      'INSERT INTO users (id, tenant_id, email, password_hash, role, name) VALUES ($1, $2, $3, $4, $5, $6)',
      ['sales-1', tenantId, 'sales@equipmentco.com', hashedPassword, 'sales_rep', 'John Sales']
    );
    console.log('✅ Database seeded');
  }

  // ─── Health check ──────────────────────────────────────────────────────────
  app.get('/', (req, res) => {
    res.send('Backend is running 🚀');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // AUTH ROUTES
  // ══════════════════════════════════════════════════════════════════════════

  app.post('/api/auth/login', loginLimiter, async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];

    if (user && await bcrypt.compare(password, user.password_hash)) {
      let tenant = null;
      if (user.tenant_id) {
        const tenantResult = await pool.query('SELECT * FROM tenants WHERE id = $1', [user.tenant_id]);
        tenant = tenantResult.rows[0] || null;
      }

      const token = jwt.sign(
        { userId: user.id, role: user.role, tenantId: user.tenant_id, userName: user.name },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      const { password_hash, ...safeUser } = user;
      res.json({ user: safeUser, tenant, token });
      await logActivity(user.id, user.name, user.tenant_id, 'LOGIN', 'auth', user.name, `Logged in as ${user.role}`);
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];

    if (!user) {
      return res.json({ message: 'If this email exists, a request has been submitted.' });
    }

    const istString = getISTString();

    // Platform admin: self-reset via OTP
    if (user.role === 'platform_admin') {
      try {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAtStr = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        // Invalidate existing unused OTPs
        await pool.query(
          'UPDATE platform_admin_otps SET used = TRUE WHERE email = $1 AND used = FALSE',
          [email]
        );
        await pool.query(
          `INSERT INTO platform_admin_otps (id, user_id, email, otp, expires_at, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [uuidv4(), user.id, email, otp, expiresAtStr, istString]
        );

        console.log(`\n╔══════════════════════════════════════╗`);
        console.log(`║  PLATFORM ADMIN PASSWORD RESET OTP   ║`);
        console.log(`║  Email : ${email.padEnd(28)}║`);
        console.log(`║  OTP   : ${otp.padEnd(28)}║`);
        console.log(`║  Expires in 10 minutes               ║`);
        console.log(`╚══════════════════════════════════════╝\n`);

        await logActivity(user.id, user.name, null, 'REQUEST', 'platform_admin_reset', user.email, 'OTP generated for self-reset');
        return res.json({ requiresOtp: true, otp });
      } catch (err) {
        console.error('❌ OTP generation error:', err);
        return res.status(500).json({ error: 'Failed to generate OTP. Please try again.' });
      }
    }

    // Tenant admin or sales rep: escalate reset request
    const id = uuidv4();
    await pool.query(
      `INSERT INTO password_reset_requests (id, user_id, email, status, created_at)
       VALUES ($1, $2, $3, 'pending', $4)`,
      [id, user.id, email, istString]
    );

    if (user.role === 'tenant_admin') {
      await logActivity(user.id, user.name, null, 'REQUEST', 'tenant_admin_reset', user.email,
        'Tenant admin password reset requested — awaiting platform admin');
    } else {
      await logActivity(user.id, user.name, user.tenant_id, 'REQUEST', 'password_reset', user.email,
        'Password reset requested');
    }

    res.json({ message: 'If this email exists, a request has been submitted.' });
  });

  app.post('/api/auth/platform-reset-verify', async (req, res) => {
    const { email, otp, new_password } = req.body;
    if (!email || !otp || !new_password) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    const { rows } = await pool.query(
      `SELECT * FROM platform_admin_otps
       WHERE email = $1 AND otp = $2 AND used = FALSE
       ORDER BY created_at DESC LIMIT 1`,
      [email, otp]
    );
    const record = rows[0];

    if (!record) {
      return res.status(400).json({ error: 'Invalid OTP. Please check the code and try again.' });
    }
    if (new Date() > new Date(record.expires_at)) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    const pwError = validatePassword(new_password);
    if (pwError) return res.status(400).json({ error: pwError });

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1, force_password_change = 0 WHERE id = $2',
      [hashedPassword, record.user_id]
    );
    await pool.query('UPDATE platform_admin_otps SET used = TRUE WHERE id = $1', [record.id]);

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [record.user_id]);
    const user = userResult.rows[0];
    await logActivity(record.user_id, user?.name || 'Platform Admin', null, 'RESET', 'platform_admin_reset', email, 'Password self-reset via OTP');

    res.json({ success: true });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // USER ROUTES
  // ══════════════════════════════════════════════════════════════════════════

  app.get('/api/tenant/:id/users', authenticate, requireRole('tenant_admin', 'platform_admin'), requireTenantAccess, async (req, res) => {
    const { rows } = await pool.query(
      'SELECT id, tenant_id, email, role, name, phone FROM users WHERE tenant_id = $1',
      [req.params.id]
    );
    res.json(rows);
  });

  app.post('/api/tenant/:id/users', authenticate, requireRole('tenant_admin', 'platform_admin'), requireTenantAccess, async (req, res) => {
    const { id, email, password, role, name, phone } = req.body;

    const { rows } = await pool.query(
      "SELECT count(*) as count FROM users WHERE tenant_id = $1 AND role = 'sales_rep'",
      [req.params.id]
    );
    if (parseInt(rows[0].count) >= 10) {
      return res.status(403).json({
        error: 'User creation limit reached. This tenant has reached the maximum of 10 sales representatives.',
      });
    }

    const pwError = validatePassword(password);
    if (pwError) return res.status(400).json({ error: pwError });

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        'INSERT INTO users (id, tenant_id, email, password_hash, role, name, phone) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [id, req.params.id, email, hashedPassword, role || 'sales_rep', name, phone]
      );
      if (req.user) {
        await logActivity(req.user.userId, req.user.userName, req.params.id, 'CREATE', 'sales_rep', name, `Created sales rep: ${email}`);
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put('/api/users/:id', authenticate, async (req, res) => {
    const { name, phone, password } = req.body;
    if (!req.user) return res.status(401).json({ error: 'User not authenticated' });

    const isSelf = req.user.userId === req.params.id;
    const isAdmin = req.user.role === 'tenant_admin' || req.user.role === 'platform_admin';

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (password) {
      const pwError = validatePassword(password);
      if (pwError) return res.status(400).json({ error: pwError });
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE users SET name = $1, phone = $2, password_hash = $3, force_password_change = 0 WHERE id = $4',
        [name, phone, hashedPassword, req.params.id]
      );
    } else {
      await pool.query(
        'UPDATE users SET name = $1, phone = $2 WHERE id = $3',
        [name, phone, req.params.id]
      );
      if (req.user) {
        await logActivity(req.user.userId, req.user.userName || 'User', req.user.tenantId || null, 'UPDATE', 'profile', name, 'Profile updated');
      }
    }
    res.json({ success: true });
  });

  app.delete('/api/users/:id', authenticate, requireRole('tenant_admin', 'platform_admin'), async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    const userToDelete = rows[0];
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    if (req.user) {
      await logActivity(req.user.userId, req.user.userName || 'Admin', req.user.tenantId || null, 'DELETE', 'sales_rep', userToDelete?.name, `Deleted: ${userToDelete?.email}`);
    }
    res.json({ success: true });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // EQUIPMENT ROUTES
  // ══════════════════════════════════════════════════════════════════════════

  app.get('/api/tenant/:tenantId/equipment/stats', async (req, res) => {
    const { tenantId } = req.params;

    const { rows: customRows } = await pool.query(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) as inactive
       FROM equipment
       WHERE tenant_id = $1`,
      [tenantId]
    );
    const custom = customRows[0];

    const { rows: disabledRows } = await pool.query(
      'SELECT COUNT(*) as count FROM tenant_disabled_defaults WHERE tenant_id = $1',
      [tenantId]
    );
    const disabledCount = parseInt(disabledRows[0].count);

    const DEFAULT_COUNT = DEFAULT_LIBRARY.length;
    const total = parseInt(custom.total) + DEFAULT_COUNT;
    const active = parseInt(custom.active || 0) + (DEFAULT_COUNT - disabledCount);
    const inactive = parseInt(custom.inactive || 0) + disabledCount;

    res.json({ total, active, inactive });
  });

  app.get('/api/tenant/:id/equipment', authenticate, requireTenantAccess, async (req, res) => {
    if (!req.user || (req.user.tenantId !== req.params.id && req.user.role !== 'platform_admin')) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { rows } = await pool.query('SELECT * FROM equipment WHERE tenant_id = $1', [req.params.id]);
    res.json(rows);
  });

  app.post('/api/tenant/:id/equipment', authenticate, requireTenantAccess, requireRole('tenant_admin', 'platform_admin'), async (req, res) => {
    const { id, name, category, width, depth, height, color, model_url, animations_enabled, image_url, is_active } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (isNaN(width) || isNaN(depth) || isNaN(height) || width <= 0 || depth <= 0 || height <= 0) {
      return res.status(400).json({ error: 'Invalid dimensions' });
    }

    await pool.query(
      `INSERT INTO equipment (id, tenant_id, name, category, width, depth, height, color, model_url, animations_enabled, image_url, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [id, req.params.id, name, category, width, depth, height, color, model_url, animations_enabled || false, image_url || null, is_active !== false]
    );
    if (req.user) {
      await logActivity(req.user.userId, req.user.userName || 'Admin', req.params.id, 'CREATE', 'equipment', name, `Category: ${category}`);
    }
    res.json({ success: true });
  });

  app.put('/api/tenant/:tenantId/equipment/:id', authenticate, requireTenantAccess, requireRole('tenant_admin', 'platform_admin'), async (req, res) => {
    const { name, category, width, depth, height, color, model_url, animations_enabled, image_url, is_active } = req.body;
    await pool.query(
      `UPDATE equipment
       SET name = $1, category = $2, width = $3, depth = $4, height = $5,
           color = $6, model_url = $7, animations_enabled = $8, image_url = $9, is_active = $10
       WHERE id = $11 AND tenant_id = $12`,
      [name, category, width, depth, height, color, model_url, animations_enabled || false, image_url || null, is_active !== false, req.params.id, req.params.tenantId]
    );
    if (req.user) {
      await logActivity(req.user.userId, req.user.userName || 'Admin', req.params.tenantId, 'UPDATE', 'equipment', name, 'Equipment updated');
    }
    res.json({ success: true });
  });

  app.delete('/api/tenant/:tenantId/equipment/:id', authenticate, requireTenantAccess, requireRole('tenant_admin', 'platform_admin'), async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM equipment WHERE id = $1', [req.params.id]);
    const eqToDelete = rows[0];
    await pool.query('DELETE FROM equipment WHERE id = $1 AND tenant_id = $2', [req.params.id, req.params.tenantId]);
    if (req.user) {
      await logActivity(req.user.userId, req.user.userName || 'Admin', req.params.tenantId, 'DELETE', 'equipment', eqToDelete?.name, 'Equipment deleted');
    }
    res.json({ success: true });
  });

  app.patch('/api/tenant/:tenantId/equipment/:id/toggle', authenticate, requireTenantAccess, requireRole('tenant_admin', 'platform_admin'), async (req, res) => {
    const { is_active } = req.body;
    await pool.query(
      'UPDATE equipment SET is_active = $1 WHERE id = $2 AND tenant_id = $3',
      [is_active, req.params.id, req.params.tenantId]
    );
    if (req.user) {
      await logActivity(req.user.userId, req.user.userName || 'Admin', req.params.tenantId, 'UPDATE', 'equipment', req.params.id, is_active ? 'Equipment activated' : 'Equipment deactivated');
    }
    res.json({ success: true });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // DISABLED DEFAULTS ROUTES
  // ══════════════════════════════════════════════════════════════════════════

  app.get('/api/tenant/:tenantId/disabled-defaults', authenticate, requireTenantAccess, async (req, res) => {
    const { rows } = await pool.query(
      'SELECT equipment_id FROM tenant_disabled_defaults WHERE tenant_id = $1',
      [req.params.tenantId]
    );
    res.json(rows.map((r: any) => r.equipment_id));
  });

  app.post('/api/tenant/:tenantId/disabled-defaults/:equipmentId', authenticate, requireTenantAccess, requireRole('tenant_admin', 'platform_admin'), async (req, res) => {
    const { tenantId, equipmentId } = req.params;

    const { rows } = await pool.query(
      'SELECT 1 FROM tenant_disabled_defaults WHERE tenant_id = $1 AND equipment_id = $2',
      [tenantId, equipmentId]
    );

    if (rows.length > 0) {
      // Currently disabled → re-enable
      await pool.query(
        'DELETE FROM tenant_disabled_defaults WHERE tenant_id = $1 AND equipment_id = $2',
        [tenantId, equipmentId]
      );
      await logActivity(req.user!.userId, req.user!.userName || 'Admin', tenantId, 'UPDATE', 'equipment', equipmentId, 'Default equipment re-enabled');
      res.json({ disabled: false });
    } else {
      // Currently enabled → disable
      await pool.query(
        'INSERT INTO tenant_disabled_defaults (tenant_id, equipment_id) VALUES ($1, $2)',
        [tenantId, equipmentId]
      );
      await logActivity(req.user!.userId, req.user!.userName || 'Admin', tenantId, 'UPDATE', 'equipment', equipmentId, 'Default equipment disabled');
      res.json({ disabled: true });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PLATFORM ADMIN ROUTES
  // ══════════════════════════════════════════════════════════════════════════

  app.get('/api/admin/tenants', authenticate, requireRole('platform_admin'), async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM tenants ORDER BY created_at DESC');
    res.json(rows);
  });

  app.post('/api/admin/tenants', authenticate, requireRole('platform_admin'), async (req, res) => {
    const { id, name, logo_url, subscription_tier, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required for tenant admin' });
    }

    try {
      await pool.query(
        'INSERT INTO tenants (id, name, logo_url, subscription_tier) VALUES ($1, $2, $3, $4)',
        [id, name, logo_url, subscription_tier || 'basic']
      );

      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = `tenant-admin-${id}`;
      await pool.query(
        'INSERT INTO users (id, tenant_id, email, password_hash, role, name) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, id, email, hashedPassword, 'tenant_admin', `${name} Admin`]
      );

      if (req.user) {
        await logActivity(req.user.userId, req.user.userName || 'Platform Admin', null, 'CREATE', 'tenant', name, `Tier: ${subscription_tier || 'basic'}`);
      }
      res.json({ success: true });
    } catch (error: any) {
      // Rollback tenant if user creation fails
      await pool.query('DELETE FROM tenants WHERE id = $1', [id]);
      res.status(400).json({ error: error.message });
    }
  });

  app.put('/api/admin/tenants/:id', authenticate, requireRole('platform_admin'), async (req, res) => {
    const { name, logo_url, subscription_tier } = req.body;
    await pool.query(
      'UPDATE tenants SET name = $1, logo_url = $2, subscription_tier = $3 WHERE id = $4',
      [name, logo_url, subscription_tier, req.params.id]
    );
    if (req.user) {
      await logActivity(req.user.userId, req.user.userName || 'Platform Admin', null, 'UPDATE', 'tenant', name, 'Tenant updated');
    }
    res.json({ success: true });
  });

  app.get('/api/admin/stats', authenticate, requireRole('platform_admin'), async (req, res) => {
    const [tenantRes, userRes, projectRes] = await Promise.all([
      pool.query('SELECT count(*) as count FROM tenants'),
      pool.query('SELECT count(*) as count FROM users'),
      pool.query('SELECT count(*) as count FROM projects'),
    ]);
    res.json({
      tenants: parseInt(tenantRes.rows[0].count),
      users: parseInt(userRes.rows[0].count),
      projects: parseInt(projectRes.rows[0].count),
    });
  });

  app.get('/api/admin/users', authenticate, requireRole('platform_admin'), async (req, res) => {
    const { rows } = await pool.query(`
      SELECT u.id, u.tenant_id, u.email, u.role, u.name, u.phone, t.name as tenant_name
      FROM users u
      LEFT JOIN tenants t ON u.tenant_id = t.id
    `);
    res.json(rows);
  });

  app.post('/api/admin/users', authenticate, requireRole('platform_admin'), async (req, res) => {
    const { id, tenant_id, email, password, role, name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (id, tenant_id, email, password_hash, role, name) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, tenant_id, email, hashedPassword, role, name]
    );
    res.json({ success: true });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PROJECT ROUTES
  // ══════════════════════════════════════════════════════════════════════════

  app.get('/api/projects', authenticate, async (req, res) => {
    if (!req.user || (req.user.tenantId !== req.query.tenantId && req.user.role !== 'platform_admin')) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { rows } = await pool.query(
      'SELECT * FROM projects WHERE tenant_id = $1 ORDER BY created_at DESC',
      [req.query.tenantId]
    );
    res.json(rows);
  });

  app.post('/api/projects', authenticate, async (req, res) => {
    const { id, tenant_id, user_id, name, data } = req.body;
    await pool.query(
      'INSERT INTO projects (id, tenant_id, user_id, name, data) VALUES ($1, $2, $3, $4, $5)',
      [id, tenant_id, user_id, name, JSON.stringify(data)]
    );
    if (req.user) {
      await logActivity(req.user.userId, req.user.userName || 'User', tenant_id, 'SAVE', 'project', name, 'Project saved');
    }
    res.json({ success: true });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PASSWORD RESET ROUTES
  // ══════════════════════════════════════════════════════════════════════════

  app.get('/api/admin/reset-requests', authenticate, requireRole('tenant_admin', 'platform_admin'), async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    let rows;
    if (req.user.role === 'tenant_admin') {
      const result = await pool.query(
        `SELECT r.*, u.name as user_name, u.role as user_role
         FROM password_reset_requests r
         JOIN users u ON r.user_id = u.id
         WHERE r.status = 'pending' AND u.role = 'sales_rep' AND u.tenant_id = $1
         ORDER BY r.created_at DESC`,
        [req.user.tenantId]
      );
      rows = result.rows;
    } else {
      const result = await pool.query(
        `SELECT r.*, u.name as user_name, u.role as user_role
         FROM password_reset_requests r
         JOIN users u ON r.user_id = u.id
         WHERE r.status = 'pending'
         ORDER BY r.created_at DESC`
      );
      rows = result.rows;
    }
    res.json(rows);
  });

  app.get('/api/admin/tenant-admin-resets', authenticate, requireRole('platform_admin'), async (req, res) => {
    const { rows } = await pool.query(
      `SELECT r.*, u.name as user_name, u.role as user_role, t.name as tenant_name
       FROM password_reset_requests r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN tenants t ON u.tenant_id = t.id
       WHERE r.status = 'pending' AND u.role = 'tenant_admin'
       ORDER BY r.created_at DESC`
    );
    res.json(rows);
  });

  app.post('/api/admin/reset-requests/:id/resolve', authenticate, requireRole('tenant_admin', 'platform_admin'), async (req, res) => {
    const { temp_password } = req.body;

    if (!temp_password || temp_password.length < 8) {
      return res.status(400).json({ error: 'Temp password must be at least 8 characters' });
    }

    const { rows } = await pool.query('SELECT * FROM password_reset_requests WHERE id = $1', [req.params.id]);
    const request = rows[0];
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const hashedPassword = await bcrypt.hash(temp_password, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1, force_password_change = 1 WHERE id = $2',
      [hashedPassword, request.user_id]
    );
    await pool.query(
      "UPDATE password_reset_requests SET status = 'resolved' WHERE id = $1",
      [req.params.id]
    );

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [request.user_id]);
    const resetUser = userResult.rows[0];

    if (resetUser?.role === 'tenant_admin') {
      await logActivity(req.user!.userId, req.user!.userName || 'Platform Admin', null,
        'RESOLVE', 'tenant_admin_reset', resetUser?.name, 'Temporary password set by Platform Admin');
    } else {
      await logActivity(req.user!.userId, req.user!.userName || 'Admin', resetUser?.tenant_id,
        'RESOLVE', 'password_reset', resetUser?.name, 'Temporary password set by Tenant Admin');
    }

    res.json({ success: true });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // LOGS ROUTES
  // ══════════════════════════════════════════════════════════════════════════

  app.get('/api/tenant/:id/logs', authenticate, requireRole('tenant_admin', 'platform_admin'), requireTenantAccess, async (req, res) => {
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;
    const { rows } = await pool.query(
      `SELECT * FROM activity_logs
       WHERE tenant_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.params.id, limit, offset]
    );
    res.json(rows);
  });

  app.get('/api/admin/logs', authenticate, requireRole('platform_admin'), async (req, res) => {
    const limit = Number(req.query.limit) || 100;
    const offset = Number(req.query.offset) || 0;
    const { rows } = await pool.query(
      `SELECT * FROM activity_logs
       WHERE tenant_id IS NULL
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json(rows);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // COMPLIANCE ROUTE (Gemini AI)
  // ══════════════════════════════════════════════════════════════════════════

  app.post('/api/compliance/check', async (req, res) => {
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

      const response = await genai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallScore: { type: Type.NUMBER, description: 'Score from 0 to 100' },
              summary: { type: Type.STRING },
              checks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    status: { type: Type.STRING, enum: ['pass', 'fail', 'warning'] },
                    message: { type: Type.STRING },
                    details: { type: Type.STRING },
                  },
                  required: ['category', 'status', 'message'],
                },
              },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['overallScore', 'summary', 'checks', 'recommendations'],
          },
        },
      });

      if (!response.text) {
        throw new Error('Failed to get response text from AI');
      }
      const report = JSON.parse(response.text);
      res.json(report);
    } catch (err: any) {
      console.error('Compliance check failed:', err);
      res.status(500).json({ error: err.message || 'Compliance check failed' });
    }
  });

  // ─── Start Listening ───────────────────────────────────────────────────────
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});