import pool from './db.js';

async function initDB() {
  try {
    console.log('Connecting to TiDB...');
    
    // Create Database if not exists
    await pool.query('CREATE DATABASE IF NOT EXISTS skenqoutinv');
    await pool.query('USE skenqoutinv');
    console.log('Using database skenqoutinv');

    // Create Customers Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        companyName VARCHAR(255),
        mobile VARCHAR(50),
        email VARCHAR(255),
        billingAddress TEXT,
        shippingAddress TEXT,
        notes TEXT,
        createdAt VARCHAR(50)
      )
    `);

    // Create Quotations Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quotations (
        id VARCHAR(255) PRIMARY KEY,
        number VARCHAR(100) NOT NULL,
        customerId VARCHAR(255),
        date VARCHAR(50),
        validUntil VARCHAR(50),
        items JSON,
        subtotal DECIMAL(10, 2),
        taxRate DECIMAL(5, 2),
        taxAmount DECIMAL(10, 2),
        grandTotal DECIMAL(10, 2),
        notes TEXT,
        terms TEXT,
        status VARCHAR(50),
        paymentTermsType VARCHAR(50),
        milestones JSON
      )
    `);

    // Create Invoices Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id VARCHAR(255) PRIMARY KEY,
        number VARCHAR(100) NOT NULL,
        quotationId VARCHAR(255),
        customerId VARCHAR(255),
        date VARCHAR(50),
        dueDate VARCHAR(50),
        items JSON,
        subtotal DECIMAL(10, 2),
        taxRate DECIMAL(5, 2),
        taxAmount DECIMAL(10, 2),
        grandTotal DECIMAL(10, 2),
        paidAmount DECIMAL(10, 2),
        balance DECIMAL(10, 2),
        notes TEXT,
        status VARCHAR(50),
        payments JSON,
        paymentTermsType VARCHAR(50),
        milestones JSON
      )
    `);

    // Alter existing tables for milestones
    try {
      await pool.query(`ALTER TABLE quotations ADD COLUMN IF NOT EXISTS paymentTermsType VARCHAR(50)`);
      await pool.query(`ALTER TABLE quotations ADD COLUMN IF NOT EXISTS milestones JSON`);
      await pool.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paymentTermsType VARCHAR(50)`);
      await pool.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS milestones JSON`);
    } catch (_) { /* columns may already exist */ }

    // Create Settings Table (singleton)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT PRIMARY KEY DEFAULT 1,
        companyName VARCHAR(255),
        logoUrl VARCHAR(500),
        address TEXT,
        phone VARCHAR(50),
        email VARCHAR(255),
        bankName VARCHAR(255),
        bankAccount VARCHAR(255),
        bankIfsc VARCHAR(100),
        upiId VARCHAR(100),
        gpayNumber VARCHAR(100),
        gpayQrUrl VARCHAR(500),
        invoicePrefix VARCHAR(50),
        quotationPrefix VARCHAR(50),
        leadsPin VARCHAR(10),
        accountsPin VARCHAR(10),
        pendingPaymentsPin VARCHAR(10),
        whatsappInvoiceTemplate TEXT,
        whatsappQuotationTemplate TEXT,
        whatsappReminderTemplate TEXT,
        feedbackUrl VARCHAR(500),
        googleReviewUrl VARCHAR(500)
      )
    `);

    // Alter existing settings table for migrations
    try {
      await pool.query(`ALTER TABLE settings ADD COLUMN IF NOT EXISTS leadsPin VARCHAR(10)`);
      await pool.query(`ALTER TABLE settings ADD COLUMN IF NOT EXISTS accountsPin VARCHAR(10)`);
      await pool.query(`ALTER TABLE settings ADD COLUMN IF NOT EXISTS pendingPaymentsPin VARCHAR(10)`);
      await pool.query(`ALTER TABLE settings ADD COLUMN IF NOT EXISTS gpayQrUrl VARCHAR(500)`);
      await pool.query(`ALTER TABLE settings ADD COLUMN IF NOT EXISTS whatsappInvoiceTemplate TEXT`);
      await pool.query(`ALTER TABLE settings ADD COLUMN IF NOT EXISTS whatsappQuotationTemplate TEXT`);
      await pool.query(`ALTER TABLE settings ADD COLUMN IF NOT EXISTS whatsappReminderTemplate TEXT`);
      await pool.query(`ALTER TABLE settings ADD COLUMN IF NOT EXISTS feedbackUrl VARCHAR(500)`);
      await pool.query(`ALTER TABLE settings ADD COLUMN IF NOT EXISTS googleReviewUrl VARCHAR(500)`);
    } catch (_) { /* column may already exist */ }

    // Insert default settings if not exists
    await pool.query(`
      INSERT IGNORE INTO settings (id, companyName, address, phone, email, bankName, bankAccount, bankIfsc, upiId, gpayNumber, invoicePrefix, quotationPrefix, leadsPin, accountsPin, pendingPaymentsPin)
      VALUES (1, 'My Company', '123 Business St', '555-0100', 'billing@mycompany.com', 'Bank Name', '0000000000', 'IFSC0001234', 'company@upi', '', 'INV', 'QUO', '1234', '2807', '2025')
    `);


    // Create Notifications Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255),
        message TEXT,
        type VARCHAR(50),
        date VARCHAR(50),
        read_status BOOLEAN DEFAULT FALSE,
        invoiceId VARCHAR(255),
        quotationId VARCHAR(255)
      )
    `);

    // Create Accounts Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id VARCHAR(255) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        date VARCHAR(50) NOT NULL,
        category VARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        createdAt VARCHAR(50)
      )
    `);

    // Create Leads Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        mobile VARCHAR(50),
        notes TEXT,
        status VARCHAR(50) DEFAULT 'New',
        createdAt VARCHAR(50)
      )
    `);

    // Create Manual Pendings Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS manual_pendings (
        id VARCHAR(255) PRIMARY KEY,
        customerId VARCHAR(255),
        clientName VARCHAR(255) NOT NULL,
        mobile VARCHAR(50),
        totalAmount DECIMAL(10, 2) NOT NULL,
        paidAmount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        balanceAmount DECIMAL(10, 2) NOT NULL,
        dueDate VARCHAR(50),
        notes TEXT,
        createdAt VARCHAR(50)
      )
    `);

    // Create Leave Requests Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leave_requests (
        id VARCHAR(255) PRIMARY KEY,
        employeeId VARCHAR(255) NOT NULL,
        employeeName VARCHAR(255) NOT NULL,
        leaveType VARCHAR(100) NOT NULL,
        startDate VARCHAR(50) NOT NULL,
        endDate VARCHAR(50) NOT NULL,
        reason TEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        createdAt VARCHAR(50)
      )
    `);

    // Create Attendance Logs Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance_logs (
        id VARCHAR(255) PRIMARY KEY,
        employeeId VARCHAR(255) NOT NULL,
        employeeName VARCHAR(255) NOT NULL,
        clockIn VARCHAR(50) NOT NULL,
        clockOut VARCHAR(50),
        durationMinutes INT DEFAULT 0,
        date VARCHAR(50) NOT NULL
      )
    `);

    // Create Employee Salaries Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS employee_salaries (
        id VARCHAR(255) PRIMARY KEY,
        employeeId VARCHAR(255) NOT NULL,
        employeeName VARCHAR(255) NOT NULL,
        month VARCHAR(50) NOT NULL,
        salaryAmount DECIMAL(10, 2) NOT NULL,
        paidAmount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        balanceAmount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'Unpaid',
        paidDate VARCHAR(50),
        paymentMethod VARCHAR(100),
        notes TEXT,
        createdAt VARCHAR(50)
      )
    `);

    console.log('All tables created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
}

initDB();
