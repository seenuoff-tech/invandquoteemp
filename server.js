import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';
import crypto from 'crypto';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Helper to safely parse JSON or return empty array/object
const parseJSON = (data, defaultVal) => {
  if (!data) return defaultVal;
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      return defaultVal;
    }
  }
  return data;
};

// --- AUTH ---
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM employees WHERE username=?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = rows[0];
    if (!user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const [salt, key] = user.password.split(':');
    const hashedBuffer = crypto.scryptSync(password, salt, 64);
    
    const keyBuffer = Buffer.from(key, 'hex');
    const match = crypto.timingSafeEqual(hashedBuffer, keyBuffer);
    
    if (match) {
      // Don't send password hash back
      delete user.password;
      user.permissions = parseJSON(user.permissions, []);
      res.json({ success: true, user });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CUSTOMERS ---
app.get('/api/customers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM customers ORDER BY createdAt DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { id, name, companyName, mobile, email, billingAddress, shippingAddress, notes, createdAt } = req.body;
    await pool.query(
      'INSERT INTO customers (id, name, companyName, mobile, email, billingAddress, shippingAddress, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, companyName, mobile, email, billingAddress, shippingAddress, notes, createdAt]
    );
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const { name, companyName, mobile, email, billingAddress, shippingAddress, notes, createdAt } = req.body;
    await pool.query(
      'UPDATE customers SET name=?, companyName=?, mobile=?, email=?, billingAddress=?, shippingAddress=?, notes=?, createdAt=? WHERE id=?',
      [name, companyName, mobile, email, billingAddress, shippingAddress, notes, createdAt, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM customers WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- QUOTATIONS ---
app.get('/api/quotations', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM quotations ORDER BY date DESC');
    const quotations = rows.map(r => ({
      ...r,
      items: parseJSON(r.items, []),
      subtotal: parseFloat(r.subtotal),
      taxRate: parseFloat(r.taxRate),
      taxAmount: parseFloat(r.taxAmount),
      grandTotal: parseFloat(r.grandTotal),
    }));
    res.json(quotations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/quotations', async (req, res) => {
  try {
    const { id, number, customerId, date, validUntil, items, subtotal, taxRate, taxAmount, grandTotal, notes, terms, status } = req.body;
    await pool.query(
      'INSERT INTO quotations (id, number, customerId, date, validUntil, items, subtotal, taxRate, taxAmount, grandTotal, notes, terms, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, number, customerId, date, validUntil, JSON.stringify(items), subtotal, taxRate, taxAmount, grandTotal, notes, terms, status]
    );
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/quotations/:id', async (req, res) => {
  try {
    const { number, customerId, date, validUntil, items, subtotal, taxRate, taxAmount, grandTotal, notes, terms, status } = req.body;
    await pool.query(
      'UPDATE quotations SET number=?, customerId=?, date=?, validUntil=?, items=?, subtotal=?, taxRate=?, taxAmount=?, grandTotal=?, notes=?, terms=?, status=? WHERE id=?',
      [number, customerId, date, validUntil, JSON.stringify(items), subtotal, taxRate, taxAmount, grandTotal, notes, terms, status, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/quotations/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM quotations WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- INVOICES ---
app.get('/api/invoices', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM invoices ORDER BY date DESC');
    const invoices = rows.map(r => ({
      ...r,
      items: parseJSON(r.items, []),
      payments: parseJSON(r.payments, []),
      subtotal: parseFloat(r.subtotal),
      taxRate: parseFloat(r.taxRate),
      taxAmount: parseFloat(r.taxAmount),
      grandTotal: parseFloat(r.grandTotal),
      paidAmount: parseFloat(r.paidAmount),
      balance: parseFloat(r.balance),
    }));
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invoices', async (req, res) => {
  try {
    const { id, number, quotationId, customerId, date, dueDate, items, subtotal, taxRate, taxAmount, grandTotal, paidAmount, balance, notes, status, payments } = req.body;
    await pool.query(
      'INSERT INTO invoices (id, number, quotationId, customerId, date, dueDate, items, subtotal, taxRate, taxAmount, grandTotal, paidAmount, balance, notes, status, payments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, number, quotationId, customerId, date, dueDate, JSON.stringify(items), subtotal, taxRate, taxAmount, grandTotal, paidAmount, balance, notes, status, JSON.stringify(payments)]
    );
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/invoices/:id', async (req, res) => {
  try {
    const { number, quotationId, customerId, date, dueDate, items, subtotal, taxRate, taxAmount, grandTotal, paidAmount, balance, notes, status, payments } = req.body;
    await pool.query(
      'UPDATE invoices SET number=?, quotationId=?, customerId=?, date=?, dueDate=?, items=?, subtotal=?, taxRate=?, taxAmount=?, grandTotal=?, paidAmount=?, balance=?, notes=?, status=?, payments=? WHERE id=?',
      [number, quotationId, customerId, date, dueDate, JSON.stringify(items), subtotal, taxRate, taxAmount, grandTotal, paidAmount, balance, notes, status, JSON.stringify(payments), req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/invoices/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM invoices WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SETTINGS ---
app.get('/api/settings', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM settings WHERE id=1');
    if (rows.length === 0) {
      return res.json(null);
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const { companyName, logoUrl, address, phone, email, bankName, bankAccount, bankIfsc, upiId, gpayNumber, invoicePrefix, quotationPrefix } = req.body;
    
    // Check if exists
    const [rows] = await pool.query('SELECT id FROM settings WHERE id=1');
    if (rows.length === 0) {
      await pool.query(
        'INSERT INTO settings (id, companyName, logoUrl, address, phone, email, bankName, bankAccount, bankIfsc, upiId, gpayNumber, invoicePrefix, quotationPrefix) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [companyName, logoUrl, address, phone, email, bankName, bankAccount, bankIfsc, upiId, gpayNumber, invoicePrefix, quotationPrefix]
      );
    } else {
      await pool.query(
        'UPDATE settings SET companyName=?, logoUrl=?, address=?, phone=?, email=?, bankName=?, bankAccount=?, bankIfsc=?, upiId=?, gpayNumber=?, invoicePrefix=?, quotationPrefix=? WHERE id=1',
        [companyName, logoUrl, address, phone, email, bankName, bankAccount, bankIfsc, upiId, gpayNumber, invoicePrefix, quotationPrefix]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- NOTIFICATIONS ---
app.get('/api/notifications', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM notifications ORDER BY date DESC');
    const notifs = rows.map(r => ({
      ...r,
      read: r.read_status === 1 || r.read_status === true,
      read_status: undefined // map back to 'read' for frontend
    }));
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications', async (req, res) => {
  try {
    const { id, title, message, type, date, read, invoiceId, quotationId } = req.body;
    await pool.query(
      'INSERT INTO notifications (id, title, message, type, date, read_status, invoiceId, quotationId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, title, message, type, date, read ? 1 : 0, invoiceId, quotationId]
    );
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET read_status=1 WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notifications/read-all', async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET read_status=1');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/notifications/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM notifications WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- EMPLOYEES ---
app.get('/api/employees', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM employees ORDER BY createdAt DESC');
    const employees = rows.map(r => {
      delete r.password; // Hide password hashes
      return {
        ...r,
        permissions: parseJSON(r.permissions, [])
      };
    });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const { id, name, email, phone, role, status, createdAt, username, password, permissions } = req.body;
    let hashedPassword = null;
    if (password) {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.scryptSync(password, salt, 64).toString('hex');
      hashedPassword = `${salt}:${hash}`;
    }
    await pool.query(
      'INSERT INTO employees (id, name, email, phone, role, status, createdAt, username, password, permissions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, email, phone, role, status, createdAt, username || null, hashedPassword, JSON.stringify(permissions || [])]
    );
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    const { name, email, phone, role, status, createdAt, username, password, permissions } = req.body;
    
    if (password) {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.scryptSync(password, salt, 64).toString('hex');
      const hashedPassword = `${salt}:${hash}`;
      await pool.query(
        'UPDATE employees SET name=?, email=?, phone=?, role=?, status=?, createdAt=?, username=?, password=?, permissions=? WHERE id=?',
        [name, email, phone, role, status, createdAt, username || null, hashedPassword, JSON.stringify(permissions || []), req.params.id]
      );
    } else {
      await pool.query(
        'UPDATE employees SET name=?, email=?, phone=?, role=?, status=?, createdAt=?, username=?, permissions=? WHERE id=?',
        [name, email, phone, role, status, createdAt, username || null, JSON.stringify(permissions || []), req.params.id]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM employees WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- TASKS ---
app.get('/api/tasks', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tasks ORDER BY createdAt DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { id, title, description, employeeId, status, dueDate, createdAt } = req.body;
    await pool.query(
      'INSERT INTO tasks (id, title, description, employeeId, status, dueDate, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, title, description, employeeId, status, dueDate, createdAt]
    );
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { title, description, employeeId, status, dueDate, createdAt } = req.body;
    await pool.query(
      'UPDATE tasks SET title=?, description=?, employeeId=?, status=?, dueDate=?, createdAt=? WHERE id=?',
      [title, description, employeeId, status, dueDate, createdAt, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- TIME LOGS ---
app.get('/api/time-logs', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM time_logs ORDER BY startTime DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/time-logs', async (req, res) => {
  try {
    const { id, employeeId, taskId, startTime, endTime, durationMinutes, notes } = req.body;
    await pool.query(
      'INSERT INTO time_logs (id, employeeId, taskId, startTime, endTime, durationMinutes, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, employeeId, taskId, startTime, endTime, durationMinutes, notes]
    );
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/time-logs/:id', async (req, res) => {
  try {
    const { employeeId, taskId, startTime, endTime, durationMinutes, notes } = req.body;
    await pool.query(
      'UPDATE time_logs SET employeeId=?, taskId=?, startTime=?, endTime=?, durationMinutes=?, notes=? WHERE id=?',
      [employeeId, taskId, startTime, endTime, durationMinutes, notes, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/time-logs/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM time_logs WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- MEETINGS ---
app.get('/api/meetings', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM meetings ORDER BY startTime ASC');
    const meetings = rows.map(r => ({
      ...r,
      attendees: parseJSON(r.attendees, [])
    }));
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/meetings', async (req, res) => {
  try {
    const { id, title, description, startTime, endTime, organizerId, attendees } = req.body;
    await pool.query(
      'INSERT INTO meetings (id, title, description, startTime, endTime, organizerId, attendees) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, title, description, startTime, endTime, organizerId, JSON.stringify(attendees)]
    );
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/meetings/:id', async (req, res) => {
  try {
    const { title, description, startTime, endTime, organizerId, attendees } = req.body;
    await pool.query(
      'UPDATE meetings SET title=?, description=?, startTime=?, endTime=?, organizerId=?, attendees=? WHERE id=?',
      [title, description, startTime, endTime, organizerId, JSON.stringify(attendees), req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/meetings/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM meetings WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- BULK INIT (for testing / mocking) ---
app.post('/api/bulk-init', async (req, res) => {
  res.json({ success: true, message: 'Not implemented' });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

export default app;
