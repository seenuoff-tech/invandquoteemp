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
        status VARCHAR(50)
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
        payments JSON
      )
    `);

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
        invoicePrefix VARCHAR(50),
        quotationPrefix VARCHAR(50),
        leadsPin VARCHAR(10)
      )
    `);

    // Alter existing settings table to add leadsPin if not present (safe migration — must run BEFORE INSERT)
    try {
      await pool.query(`ALTER TABLE settings ADD COLUMN IF NOT EXISTS leadsPin VARCHAR(10)`);
    } catch (_) { /* column may already exist */ }

    // Insert default settings if not exists
    await pool.query(`
      INSERT IGNORE INTO settings (id, companyName, address, phone, email, bankName, bankAccount, bankIfsc, upiId, gpayNumber, invoicePrefix, quotationPrefix, leadsPin)
      VALUES (1, 'My Company', '123 Business St', '555-0100', 'billing@mycompany.com', 'Bank Name', '0000000000', 'IFSC0001234', 'company@upi', '', 'INV', 'QUO', '1234')
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

    console.log('All tables created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
}

initDB();
