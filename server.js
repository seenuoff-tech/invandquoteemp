import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';
import crypto from 'crypto';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

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
      milestones: parseJSON(r.milestones, []),
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
    const { id, number, customerId, date, validUntil, items, subtotal, taxRate, taxAmount, grandTotal, notes, terms, status, paymentTermsType, milestones } = req.body;
    await pool.query(
      'INSERT INTO quotations (id, number, customerId, date, validUntil, items, subtotal, taxRate, taxAmount, grandTotal, notes, terms, status, paymentTermsType, milestones) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, number, customerId, date, validUntil, JSON.stringify(items), subtotal, taxRate, taxAmount, grandTotal, notes, terms, status, paymentTermsType || 'Standard', JSON.stringify(milestones || [])]
    );
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/quotations/:id', async (req, res) => {
  try {
    const { number, customerId, date, validUntil, items, subtotal, taxRate, taxAmount, grandTotal, notes, terms, status, paymentTermsType, milestones } = req.body;
    await pool.query(
      'UPDATE quotations SET number=?, customerId=?, date=?, validUntil=?, items=?, subtotal=?, taxRate=?, taxAmount=?, grandTotal=?, notes=?, terms=?, status=?, paymentTermsType=?, milestones=? WHERE id=?',
      [number, customerId, date, validUntil, JSON.stringify(items), subtotal, taxRate, taxAmount, grandTotal, notes, terms, status, paymentTermsType || 'Standard', JSON.stringify(milestones || []), req.params.id]
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
      milestones: parseJSON(r.milestones, []),
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
    const { id, number, quotationId, customerId, date, dueDate, items, subtotal, taxRate, taxAmount, grandTotal, paidAmount, balance, notes, status, payments, paymentTermsType, milestones } = req.body;
    await pool.query(
      'INSERT INTO invoices (id, number, quotationId, customerId, date, dueDate, items, subtotal, taxRate, taxAmount, grandTotal, paidAmount, balance, notes, status, payments, paymentTermsType, milestones) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, number, quotationId, customerId, date, dueDate, JSON.stringify(items), subtotal, taxRate, taxAmount, grandTotal, paidAmount, balance, notes, status, JSON.stringify(payments), paymentTermsType || 'Standard', JSON.stringify(milestones || [])]
    );
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/invoices/:id', async (req, res) => {
  try {
    const { number, quotationId, customerId, date, dueDate, items, subtotal, taxRate, taxAmount, grandTotal, paidAmount, balance, notes, status, payments, paymentTermsType, milestones } = req.body;
    await pool.query(
      'UPDATE invoices SET number=?, quotationId=?, customerId=?, date=?, dueDate=?, items=?, subtotal=?, taxRate=?, taxAmount=?, grandTotal=?, paidAmount=?, balance=?, notes=?, status=?, payments=?, paymentTermsType=?, milestones=? WHERE id=?',
      [number, quotationId, customerId, date, dueDate, JSON.stringify(items), subtotal, taxRate, taxAmount, grandTotal, paidAmount, balance, notes, status, JSON.stringify(payments), paymentTermsType || 'Standard', JSON.stringify(milestones || []), req.params.id]
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
    const { companyName, logoUrl, address, phone, email, bankName, bankAccount, bankIfsc, upiId, gpayNumber, gpayQrUrl, invoicePrefix, quotationPrefix, leadsPin, accountsPin, pendingPaymentsPin } = req.body;
    
    // Check if exists
    const [rows] = await pool.query('SELECT id FROM settings WHERE id=1');
    if (rows.length === 0) {
      await pool.query(
        'INSERT INTO settings (id, companyName, logoUrl, address, phone, email, bankName, bankAccount, bankIfsc, upiId, gpayNumber, gpayQrUrl, invoicePrefix, quotationPrefix, leadsPin, accountsPin, pendingPaymentsPin) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [companyName, logoUrl, address, phone, email, bankName, bankAccount, bankIfsc, upiId, gpayNumber, gpayQrUrl || '', invoicePrefix, quotationPrefix, leadsPin || '1234', accountsPin || '2807', pendingPaymentsPin || '2025']
      );
    } else {
      await pool.query(
        'UPDATE settings SET companyName=?, logoUrl=?, address=?, phone=?, email=?, bankName=?, bankAccount=?, bankIfsc=?, upiId=?, gpayNumber=?, gpayQrUrl=?, invoicePrefix=?, quotationPrefix=?, leadsPin=?, accountsPin=?, pendingPaymentsPin=? WHERE id=1',
        [companyName, logoUrl, address, phone, email, bankName, bankAccount, bankIfsc, upiId, gpayNumber, gpayQrUrl || '', invoicePrefix, quotationPrefix, leadsPin || '1234', accountsPin || '2807', pendingPaymentsPin || '2025']
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ACCOUNTS ---
app.get('/api/accounts', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM accounts ORDER BY date DESC, createdAt DESC');
    const accounts = rows.map(r => ({
      ...r,
      amount: parseFloat(r.amount)
    }));
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/accounts', async (req, res) => {
  try {
    const { id, type, date, category, amount, description, createdAt } = req.body;
    await pool.query(
      'INSERT INTO accounts (id, type, date, category, amount, description, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, type, date, category, amount, description, createdAt]
    );
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/accounts/:id', async (req, res) => {
  try {
    const { type, date, category, amount, description } = req.body;
    await pool.query(
      'UPDATE accounts SET type=?, date=?, category=?, amount=?, description=? WHERE id=?',
      [type, date, category, amount, description, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/accounts/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM accounts WHERE id=?', [req.params.id]);
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

    // If task is Overdue or passed due date without completion, notify & email employee
    const todayStr = new Date().toISOString().split('T')[0];
    const isOverdue = status === 'Overdue' || (dueDate && dueDate < todayStr && status !== 'Completed');

    if (isOverdue && employeeId) {
      const [empRows] = await pool.query('SELECT * FROM employees WHERE id=?', [employeeId]);
      if (empRows.length > 0) {
        const emp = empRows[0];
        console.log(`[OVERDUE EMAIL NOTIFICATION] Sending Overdue Alert to ${emp.name} (${emp.email}) for Task: "${title}" (Due: ${dueDate})`);
        
        // Also automatically create an in-app notification for visibility
        const notifId = `notif-task-over-${Date.now()}`;
        const notifMsg = `Task "${title}" assigned to ${emp.name} is now OVERDUE (Due date: ${dueDate}). Automated reminder email dispatched to ${emp.email}.`;
        await pool.query(
          'INSERT INTO notifications (id, title, message, type, date, read_status) VALUES (?, ?, ?, ?, ?, 0)',
          [notifId, 'Task Overdue Alert', notifMsg, 'warning', todayStr]
        ).catch(() => {});
      }
    }

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

// --- LEADS ---
app.get('/api/leads', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM leads ORDER BY createdAt DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/leads', async (req, res) => {
  try {
    const { id, name, mobile, notes, status, createdAt } = req.body;
    await pool.query(
      'INSERT INTO leads (id, name, mobile, notes, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, mobile, notes || null, status || 'New', createdAt]
    );
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/leads/:id', async (req, res) => {
  try {
    const { name, mobile, notes, status } = req.body;
    await pool.query(
      'UPDATE leads SET name=?, mobile=?, notes=?, status=? WHERE id=?',
      [name, mobile, notes || null, status, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/leads/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM leads WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Convert lead -> customer
app.post('/api/leads/:id/convert', async (req, res) => {
  try {
    const [leadRows] = await pool.query('SELECT * FROM leads WHERE id=?', [req.params.id]);
    if (leadRows.length === 0) return res.status(404).json({ error: 'Lead not found' });
    const lead = leadRows[0];

    // Build customer record
    const customerId = `cust-lead-${Date.now()}`;
    const createdAt = new Date().toISOString().split('T')[0];
    await pool.query(
      'INSERT INTO customers (id, name, companyName, mobile, email, billingAddress, shippingAddress, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [customerId, lead.name, '', lead.mobile, '', '', '', lead.notes || '', createdAt]
    );

    // Mark lead as Converted
    await pool.query("UPDATE leads SET status='Converted' WHERE id=?", [req.params.id]);

    res.json({ success: true, customerId, customerName: lead.name });
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

// --- MANUAL PENDINGS ---
app.get('/api/manual-pendings', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM manual_pendings ORDER BY createdAt DESC');
    const data = rows.map(r => ({
      ...r,
      totalAmount: parseFloat(r.totalAmount),
      paidAmount: parseFloat(r.paidAmount),
      balanceAmount: parseFloat(r.balanceAmount)
    }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/manual-pendings', async (req, res) => {
  try {
    const { id, customerId, clientName, mobile, totalAmount, paidAmount, balanceAmount, dueDate, notes, createdAt } = req.body;
    await pool.query(
      'INSERT INTO manual_pendings (id, customerId, clientName, mobile, totalAmount, paidAmount, balanceAmount, dueDate, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, customerId || null, clientName, mobile || '', totalAmount, paidAmount || 0, balanceAmount, dueDate || '', notes || '', createdAt || new Date().toISOString().split('T')[0]]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/manual-pendings/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM manual_pendings WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- LEAVE REQUESTS ---
app.get('/api/leave-requests', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM leave_requests ORDER BY createdAt DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/leave-requests', async (req, res) => {
  try {
    const { id, employeeId, employeeName, leaveType, startDate, endDate, reason, status, createdAt } = req.body;
    await pool.query(
      'INSERT INTO leave_requests (id, employeeId, employeeName, leaveType, startDate, endDate, reason, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, employeeId, employeeName, leaveType, startDate, endDate, reason || '', status || 'Pending', createdAt || new Date().toISOString().split('T')[0]]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/leave-requests/:id', async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE leave_requests SET status=? WHERE id=?', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/leave-requests/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM leave_requests WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ATTENDANCE LOGS ---
app.get('/api/attendance', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM attendance_logs ORDER BY clockIn DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/attendance', async (req, res) => {
  try {
    const { id, employeeId, employeeName, clockIn, clockOut, durationMinutes, date } = req.body;
    await pool.query(
      'INSERT INTO attendance_logs (id, employeeId, employeeName, clockIn, clockOut, durationMinutes, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, employeeId, employeeName, clockIn, clockOut || null, durationMinutes || 0, date || new Date().toISOString().split('T')[0]]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/attendance/:id', async (req, res) => {
  try {
    const { clockOut, durationMinutes } = req.body;
    await pool.query(
      'UPDATE attendance_logs SET clockOut=?, durationMinutes=? WHERE id=?',
      [clockOut, durationMinutes, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- EMPLOYEE SALARIES ---
app.get('/api/salaries', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM employee_salaries ORDER BY month DESC, createdAt DESC');
    const salaries = rows.map(r => ({
      ...r,
      salaryAmount: parseFloat(r.salaryAmount),
      paidAmount: parseFloat(r.paidAmount),
      balanceAmount: parseFloat(r.balanceAmount)
    }));
    res.json(salaries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/salaries', async (req, res) => {
  try {
    const { id, employeeId, employeeName, month, salaryAmount, paidAmount, balanceAmount, status, paidDate, paymentMethod, notes, createdAt } = req.body;
    await pool.query(
      'INSERT INTO employee_salaries (id, employeeId, employeeName, month, salaryAmount, paidAmount, balanceAmount, status, paidDate, paymentMethod, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, employeeId, employeeName, month, salaryAmount, paidAmount || 0, balanceAmount, status || 'Unpaid', paidDate || '', paymentMethod || '', notes || '', createdAt || new Date().toISOString().split('T')[0]]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/salaries/:id', async (req, res) => {
  try {
    const { salaryAmount, paidAmount, balanceAmount, status, paidDate, paymentMethod, notes } = req.body;
    await pool.query(
      'UPDATE employee_salaries SET salaryAmount=?, paidAmount=?, balanceAmount=?, status=?, paidDate=?, paymentMethod=?, notes=? WHERE id=?',
      [salaryAmount, paidAmount, balanceAmount, status, paidDate, paymentMethod, notes, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/salaries/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM employee_salaries WHERE id=?', [req.params.id]);
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
