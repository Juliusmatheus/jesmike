const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const requestedPort = Number(process.env.PORT) || 5002;

// Detect Environment
const isLocalWindows = process.platform === 'win32';
const isServerless = !isLocalWindows || Boolean(process.env.NETLIFY) || Boolean(process.env.VERCEL);

// Debug logging
if (!isLocalWindows) {
  console.log('[Environment] Running on Linux/Serverless:', { 
    platform: process.platform,
    dir: __dirname 
  });
}

// Middleware
app.use(cors());
app.use(express.json());

// Health Check / API Root
app.get('/api', (req, res) => {
  res.json({ message: 'SME Platform API is alive', env: isServerless ? 'serverless' : 'local' });
});

// File Upload Configuration
const uploadDir = !isLocalWindows ? path.join(os.tmpdir(), 'uploads') : path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadDir));

// Ensure uploads directory exists (Safe check for Serverless)
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (folderErr) {
  console.warn('Could not create upload directory, skipping...', folderErr.message);
}

// File Upload Configuration
// Netlify/Vercel have a read-only filesystem. We MUST use Memory Storage.
// We only use Disk Storage for local Windows development.
const useMemoryStorage = !isLocalWindows;

const storage = useMemoryStorage
  ? multer.memoryStorage() 
  : multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      }
    });

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Reduced to 5MB for Netlify stability
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only PDF, image, and Word document files are allowed!'));
  }
});

// Ensure upload / other runtime errors return JSON (so the frontend can show a useful message)
app.use((err, req, res, next) => {
  if (!err) return next();

  // Multer-specific errors (file too large, etc.)
  if (err instanceof multer.MulterError) {
    const msg =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File too large. Max size is 10MB per file.'
        : err.message;
    return res.status(400).json({ success: false, error: msg });
  }

  // Custom fileFilter errors, etc.
  if (typeof err.message === 'string' && err.message.length) {
    return res.status(400).json({ success: false, error: err.message });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({ success: false, error: 'Internal server error' });
});

// PostgreSQL connection
let pool;
function getPool() {
  if (pool) return pool;

  const connectionString = (process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL || '').trim();

  if (isServerless && !connectionString) {
    console.warn('WARNING: No DATABASE_URL found. Database features will fail.');
  }

  const sslEnabled =
    isServerless ||
    String(process.env.DB_SSL || '').toLowerCase() === 'true' ||
    (connectionString && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1'));

  const config = {
    connectionString: connectionString || undefined,
    user: !connectionString ? (process.env.DB_USER || 'jsmike') : undefined,
    host: !connectionString ? (process.env.DB_HOST || 'localhost') : undefined,
    database: !connectionString ? (process.env.DB_NAME || 'postgres') : undefined,
    password: !connectionString ? (process.env.DB_PASSWORD || 'root') : undefined,
    port: !connectionString ? (process.env.DB_PORT || 5432) : undefined,
    ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
    max: 1,
    connectionTimeoutMillis: 5000,
  };

  pool = new Pool(config);
  
  // Handle pool errors to prevent process crashes
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    pool = null; // Reset pool so it recreates on next request
  });

  return pool;
}

// Helper to get a client from the lazy pool
async function getDbClient() {
  const p = getPool();
  return await p.connect();
}

async function pickExistingColumn(tableName, candidates) {
  for (const col of candidates) {
    // eslint-disable-next-line no-await-in-loop
    const r = await pool.query(
      `SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = $1
         AND column_name = $2
       LIMIT 1`,
      [tableName, col]
    );
    if (r.rows.length) return col;
  }
  return null;
}

// Ensure required tables exist (keeps local dev setup smooth)
async function ensureTables() {
  // On Serverless, we skip the heavy table check to prevent timeouts.
  // We assume the DB is already set up.
  if (isServerless) return;
  try {
    // Minimal schema needed by the API (safe to run repeatedly)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS investors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        region VARCHAR(100),
        investment_focus TEXT,
        min_investment NUMERIC(15,2),
        max_investment NUMERIC(15,2),
        sectors_of_interest TEXT[],
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS investment_deals (
        id SERIAL PRIMARY KEY,
        sme_id INTEGER REFERENCES smes(id),
        investor_id INTEGER REFERENCES investors(id),
        investment_amount NUMERIC(15,2) NOT NULL,
        equity_percentage NUMERIC(5,2),
        deal_type VARCHAR(100),
        status VARCHAR(50) DEFAULT 'pending',
        deal_date DATE,
        terms TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS investment_opportunities (
        id SERIAL PRIMARY KEY,
        sme_id INTEGER REFERENCES smes(id),
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        funding_required NUMERIC(15,2) NOT NULL,
        equity_offered NUMERIC(5,2),
        use_of_funds TEXT,
        expected_roi NUMERIC(5,2),
        investment_timeline VARCHAR(100),
        status VARCHAR(50) DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Admin-managed opportunities shown on the public "Investments" page
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_investment_opportunities (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        sector TEXT,
        sub_industry TEXT,
        country TEXT,
        stage TEXT,
        investment_range TEXT,
        requirements TEXT,
        contact TEXT,
        image_key TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_admin_investment_opportunities_active ON admin_investment_opportunities(is_active);`);

    // Admin-managed JESMIKE projects (shown/managed in Admin Panel)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_projects (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT,
        country TEXT,
        stage TEXT,
        start_date DATE,
        end_date DATE,
        budget TEXT,
        contact TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_admin_projects_active ON admin_projects(is_active);`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_project_files (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES admin_projects(id) ON DELETE CASCADE,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_type TEXT,
        file_size INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_admin_project_files_project_id ON admin_project_files(project_id);`);

    // Users expressing interest in an opportunity (admin-managed or SME-submitted)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS investment_interests (
        id SERIAL PRIMARY KEY,
        opportunity_source VARCHAR(20) NOT NULL, -- 'admin' | 'sme'
        opportunity_id INTEGER NOT NULL,
        name TEXT,
        email TEXT,
        phone TEXT,
        message TEXT,
        status VARCHAR(20) DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_investment_interests_opp ON investment_interests(opportunity_source, opportunity_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_investment_interests_status ON investment_interests(status);`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sme_documents (
        id SERIAL PRIMARY KEY,
        sme_id INTEGER REFERENCES smes(id) ON DELETE CASCADE,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_type TEXT,
        file_size BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sme_documents_sme_id ON sme_documents(sme_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_smes_region ON smes(region);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_smes_industry ON smes(industry_sector);`);
    // Some DBs use business_id instead of sme_id for investment_deals
    const investmentDealsBizCol = await pickExistingColumn('investment_deals', ['sme_id', 'business_id']);
    if (investmentDealsBizCol) {
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_investment_deals_business_fk ON investment_deals(${investmentDealsBizCol});`);
    }
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_investment_deals_investor_id ON investment_deals(investor_id);`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);`);

    // Admin-managed reference data
    await pool.query(`
      CREATE TABLE IF NOT EXISTS business_types (
        type_id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_config (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Soft-delete support for smes (table already exists in most setups)
    await pool.query(`ALTER TABLE smes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;`);
    await pool.query(`ALTER TABLE smes ADD COLUMN IF NOT EXISTS deleted_prev_status VARCHAR(50) NULL;`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_smes_deleted_at ON smes(deleted_at);`);
  } catch (e) {
    console.error('Error ensuring tables:', e);
  }
}
ensureTables();

function getSmtpTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

// Statistics API endpoints
app.get('/api/statistics/summary', async (req, res) => {
  try {
    const totalSMEsQuery = 'SELECT COUNT(*) as count FROM smes';
    const totalInvestorsQuery = 'SELECT COUNT(*) as count FROM investors';
    const totalDealsQuery = 'SELECT COUNT(*) as count FROM investment_deals';
    const totalEmploymentQuery = 'SELECT SUM(employees) as total FROM smes';
    const totalRegionsQuery = 'SELECT COUNT(DISTINCT region) as count FROM smes WHERE region IS NOT NULL';
    
    const [smeResult, investorResult, dealsResult, employmentResult, regionsResult] = await Promise.all([
      pool.query(totalSMEsQuery),
      pool.query(totalInvestorsQuery),
      pool.query(totalDealsQuery),
      pool.query(totalEmploymentQuery),
      pool.query(totalRegionsQuery)
    ]);

    res.json({
      totalSMEs: parseInt(smeResult.rows[0].count) || 0,
      totalInvestors: parseInt(investorResult.rows[0].count) || 0,
      totalDeals: parseInt(dealsResult.rows[0].count) || 0,
      // Now dynamic: counts distinct values in `smes.region` (used as "country" in the UI)
      totalRegions: parseInt(regionsResult.rows[0].count) || 0,
      totalEmployment: parseInt(employmentResult.rows[0].total) || 0,
      avgAnnualTurnover: 'NAD 0.00'
    });
  } catch (error) {
    console.error('Error fetching summary statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/statistics/regions', async (req, res) => {
  try {
    const query = `
      SELECT 
        region,
        COUNT(*) as smes,
        SUM(employees) as employment,
        AVG(annual_turnover) as avg_turnover
      FROM smes
      WHERE region IS NOT NULL
      GROUP BY region
      ORDER BY smes DESC
    `;
    
    const result = await pool.query(query);
    
    const regionData = result.rows.map(row => ({
      name: row.region,
      smes: parseInt(row.smes),
      investments: 0, // Placeholder until investment_deals has data
      employment: parseInt(row.employment) || 0,
      avgTurnover: Math.round(parseFloat(row.avg_turnover) || 0)
    }));

    res.json(regionData);
  } catch (error) {
    console.error('Error fetching region statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/statistics/sectors', async (req, res) => {
  try {
    const query = `
      SELECT 
        industry_sector,
        COUNT(*) as count
      FROM smes
      GROUP BY industry_sector
      ORDER BY count DESC
    `;
    
    const result = await pool.query(query);
    
    const colors = ['#003580', '#009639', '#FF6B35', '#F7931E', '#8B5CF6', '#EF4444'];
    
    const sectorData = result.rows.map((row, index) => ({
      name: row.industry_sector,
      value: parseInt(row.count),
      color: colors[index % colors.length]
    }));

    res.json(sectorData);
  } catch (error) {
    console.error('Error fetching sector statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/statistics/growth', async (req, res) => {
  try {
    const query = `
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as smes
      FROM smes
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month
    `;
    
    const result = await pool.query(query);
    
    const growthData = result.rows.map(row => ({
      month: new Date(row.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      smes: parseInt(row.smes)
    }));

    res.json(growthData);
  } catch (error) {
    console.error('Error fetching growth statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/statistics/gender', async (req, res) => {
  try {
    const query = `
      SELECT 
        owner_gender,
        COUNT(*) as count
      FROM smes
      WHERE owner_gender IS NOT NULL
      GROUP BY owner_gender
    `;
    
    const result = await pool.query(query);
    
    const genderData = result.rows.map(row => ({
      name: row.owner_gender === 'M' ? 'Male' : row.owner_gender === 'F' ? 'Female' : 'Other',
      value: parseInt(row.count),
      color: row.owner_gender === 'M' ? '#003580' : row.owner_gender === 'F' ? '#009639' : '#FF6B35'
    }));

    res.json(genderData);
  } catch (error) {
    console.error('Error fetching gender statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/statistics/size', async (req, res) => {
  try {
    const query = `
      SELECT 
        CASE 
          WHEN employees <= 10 THEN 'Micro (1-10)'
          WHEN employees <= 50 THEN 'Small (11-50)'
          WHEN employees <= 250 THEN 'Medium (51-250)'
          ELSE 'Large (250+)'
        END as size_category,
        COUNT(*) as count
      FROM smes
      GROUP BY size_category
      ORDER BY count DESC
    `;
    
    const result = await pool.query(query);
    
    const total = result.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
    
    const sizeData = result.rows.map(row => ({
      name: row.size_category,
      value: Math.round((parseInt(row.count) / total) * 100)
    }));

    res.json(sizeData);
  } catch (error) {
    console.error('Error fetching size statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dashboard API endpoints (avoid route collisions: /dashboard/summary must not be shadowed) // nodemon-reload
app.get('/api/dashboard/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const isAdminUser =
      String(userId || '').toLowerCase().includes('admin') ||
      String(userId || '').toLowerCase() === 'admin@jesmike.com';
    
    // Get user's SME information
    const smeQuery = `
      SELECT 
        id,
        business_name,
        registration_number,
        owner_name,
        email,
        status,
        created_at,
        CASE 
          WHEN business_name IS NOT NULL AND owner_name IS NOT NULL AND email IS NOT NULL 
               AND phone IS NOT NULL AND region IS NOT NULL AND industry_sector IS NOT NULL THEN 100
          WHEN business_name IS NOT NULL AND owner_name IS NOT NULL AND email IS NOT NULL 
               AND (phone IS NOT NULL OR region IS NOT NULL OR industry_sector IS NOT NULL) THEN 75
          WHEN business_name IS NOT NULL AND owner_name IS NOT NULL AND email IS NOT NULL THEN 50
          WHEN business_name IS NOT NULL OR owner_name IS NOT NULL OR email IS NOT NULL THEN 25
          ELSE 0
        END as profile_completion
      FROM smes 
      WHERE (email = $1 OR id::text = $1)
        AND deleted_at IS NULL
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    const smeResult = await pool.query(smeQuery, [userId]);
    const smeData = smeResult.rows[0];
    
    if (!smeData) {
      return res.json({
        registrationStatus: 'Not Registered',
        investmentOpportunities: 0,
        messages: 0,
        profileCompletion: 0,
        smeId: null
      });
    }

    // Quick stats differ for admin vs SME
    let opportunitiesCount = 0;
    let messagesCount = 0;

    if (isAdminUser) {
      const [adminOpps, newMsgs] = await Promise.all([
        pool.query('SELECT COUNT(*) as count FROM admin_investment_opportunities WHERE is_active = true'),
        pool.query("SELECT COUNT(*) as count FROM contact_messages WHERE LOWER(status) = 'new'"),
      ]);
      opportunitiesCount = parseInt(adminOpps.rows[0]?.count || 0, 10);
      messagesCount = parseInt(newMsgs.rows[0]?.count || 0, 10);
    } else {
      // Get investment opportunities count (schema may use sme_id or business_id)
      const oppBizCol = await pickExistingColumn('investment_opportunities', ['sme_id', 'business_id']);
      const oppStatusCol = await pickExistingColumn('investment_opportunities', ['status']);
      if (oppBizCol) {
        const oppQuery = `
          SELECT COUNT(*) as count
          FROM investment_opportunities
          WHERE ${oppBizCol} = $1
            ${oppStatusCol ? `AND LOWER(${oppStatusCol}) = 'open'` : ''}
        `;
        const oppResult = await pool.query(oppQuery, [smeData.id]);
        opportunitiesCount = parseInt(oppResult.rows[0]?.count || 0, 10);
      }

      // Placeholder "messages" for SMEs: use deals count until a real inbox exists
      const dealsBizCol = await pickExistingColumn('investment_deals', ['sme_id', 'business_id']);
      if (dealsBizCol) {
        const dealsQuery = `
          SELECT COUNT(*) as count
          FROM investment_deals
          WHERE ${dealsBizCol} = $1
        `;
        const dealsResult = await pool.query(dealsQuery, [smeData.id]);
        messagesCount = parseInt(dealsResult.rows[0]?.count || 0, 10);
      }
    }
    
    // Determine registration status
    let registrationStatus = 'Pending Review';
    if (smeData.status === 'active') {
      registrationStatus = 'Approved';
    } else if (smeData.status === 'rejected') {
      registrationStatus = 'Rejected';
    } else if (smeData.status === 'pending') {
      registrationStatus = 'Pending Review';
    }
    
    res.json({
      registrationStatus,
      investmentOpportunities: opportunitiesCount,
      messages: messagesCount,
      profileCompletion: parseInt(smeData.profile_completion),
      smeId: smeData.id,
      businessName: smeData.business_name,
      registrationNumber: smeData.registration_number
    });
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/activities/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Get user's SME ID first
    const smeQuery = 'SELECT id FROM smes WHERE email = $1 OR id::text = $1 LIMIT 1';
    const smeResult = await pool.query(smeQuery, [userId]);
    
    if (smeResult.rows.length === 0) {
      return res.json([]);
    }
    
    const smeId = smeResult.rows[0].id;
    
    const dealsBizCol = await pickExistingColumn('investment_deals', ['sme_id', 'business_id']);
    const dealsAmountCol = await pickExistingColumn('investment_deals', ['investment_amount', 'amount']);
    const dealsDateCol = await pickExistingColumn('investment_deals', ['created_at', 'deal_date']);

    const oppBizCol = await pickExistingColumn('investment_opportunities', ['sme_id', 'business_id']);
    const oppDateCol = await pickExistingColumn('investment_opportunities', ['created_at']);

    // Build a query that only references columns that actually exist in the current DB schema.
    const dealSelect = (dealsBizCol && dealsAmountCol && dealsDateCol) ? `
      SELECT
        'investment_deal' as type,
        'Investment Deal' as title,
        CONCAT('Investment of NAD ', ${dealsAmountCol}, ' received') as description,
        ${dealsDateCol} as date,
        '💰' as icon
      FROM investment_deals
      WHERE ${dealsBizCol} = $1
    ` : null;

    const oppSelect = (oppBizCol && oppDateCol) ? `
      SELECT
        'opportunity' as type,
        'Investment Opportunity' as title,
        CONCAT('Posted opportunity: ', title) as description,
        ${oppDateCol} as date,
        '📈' as icon
      FROM investment_opportunities
      WHERE ${oppBizCol} = $1
    ` : null;

    const parts = [dealSelect, oppSelect].filter(Boolean);
    if (!parts.length) return res.json([]);

    const activitiesQuery = `
      ${parts.join('\nUNION ALL\n')}
      ORDER BY date DESC
      LIMIT 10
    `;
    
    const activitiesResult = await pool.query(activitiesQuery, [smeId]);
    
    const activities = activitiesResult.rows.map(activity => ({
      type: activity.type,
      title: activity.title,
      description: activity.description,
      date: new Date(activity.date).toLocaleDateString(),
      icon: activity.icon
    }));
    
    res.json(activities);
    
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/dashboard/summary', async (req, res) => {
  try {
    // Get platform-wide statistics for dashboard
    const summaryQueries = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM smes WHERE status = $1', ['active']),
      pool.query('SELECT COUNT(*) as count FROM investors WHERE is_active = $1', [true]),
      pool.query("SELECT COUNT(*) as count FROM investment_deals WHERE LOWER(status) = 'completed'"),
      pool.query("SELECT COUNT(*) as count FROM investment_opportunities WHERE LOWER(status) = 'open'"),
      pool.query('SELECT COUNT(*) as count FROM admin_investment_opportunities WHERE is_active = true'),
    ]);
    
    const [activeSMEs, totalInvestors, completedDeals, openOpportunities, adminOpps] = summaryQueries;
    
    res.json({
      activeSMEs: parseInt(activeSMEs.rows[0].count),
      totalInvestors: parseInt(totalInvestors.rows[0].count),
      completedDeals: parseInt(completedDeals.rows[0].count),
      openOpportunities:
        parseInt(openOpportunities.rows[0].count) + parseInt(adminOpps.rows[0]?.count || 0),
    });
    
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin System Settings (reference data)
app.get('/api/admin/industry-sectors', async (req, res) => {
  try {
    const includeInactive = String(req.query.includeInactive || 'false').toLowerCase() === 'true';
    const result = await pool.query(
      `
        SELECT
          sector_id AS id,
          name,
          description,
          chart_color,
          is_active,
          created_at
        FROM industry_sectors
        WHERE ($1::boolean = true OR is_active = true)
        ORDER BY name ASC
      `,
      [includeInactive]
    );
    res.json({ sectors: result.rows });
  } catch (e) {
    console.error('Error fetching industry sectors:', e);
    res.status(500).json({ error: 'Failed to fetch industry sectors' });
  }
});

app.post('/api/admin/industry-sectors', async (req, res) => {
  try {
    const { name, description, chart_color, is_active } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    const result = await pool.query(
      `
        INSERT INTO industry_sectors (name, description, chart_color, is_active, created_at)
        VALUES ($1, $2, $3, COALESCE($4, true), CURRENT_TIMESTAMP)
        RETURNING sector_id AS id, name, description, chart_color, is_active, created_at
      `,
      [String(name).trim(), description || null, chart_color || null, typeof is_active === 'boolean' ? is_active : null]
    );
    res.status(201).json({ sector: result.rows[0] });
  } catch (e) {
    console.error('Error creating industry sector:', e);
    res.status(500).json({ error: 'Failed to create industry sector' });
  }
});

app.put('/api/admin/industry-sectors/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    const { name, description, chart_color, is_active } = req.body || {};
    const result = await pool.query(
      `
        UPDATE industry_sectors
        SET
          name = COALESCE($2, name),
          description = COALESCE($3, description),
          chart_color = COALESCE($4, chart_color),
          is_active = COALESCE($5, is_active)
        WHERE sector_id = $1
        RETURNING sector_id AS id, name, description, chart_color, is_active, created_at
      `,
      [id, name ? String(name).trim() : null, description ?? null, chart_color ?? null, typeof is_active === 'boolean' ? is_active : null]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ sector: result.rows[0] });
  } catch (e) {
    console.error('Error updating industry sector:', e);
    res.status(500).json({ error: 'Failed to update industry sector' });
  }
});

app.get('/api/admin/regions', async (req, res) => {
  try {
    const includeInactive = String(req.query.includeInactive || 'false').toLowerCase() === 'true';
    const result = await pool.query(
      `
        SELECT
          region_id AS id,
          name,
          code,
          capital,
          is_active,
          created_at
        FROM regions
        WHERE ($1::boolean = true OR is_active = true)
        ORDER BY name ASC
      `,
      [includeInactive]
    );
    res.json({ regions: result.rows });
  } catch (e) {
    console.error('Error fetching regions:', e);
    res.status(500).json({ error: 'Failed to fetch regions' });
  }
});

app.post('/api/admin/regions', async (req, res) => {
  try {
    const { name, code, capital, is_active } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    const result = await pool.query(
      `
        INSERT INTO regions (name, code, capital, is_active, created_at)
        VALUES ($1, $2, $3, COALESCE($4, true), CURRENT_TIMESTAMP)
        RETURNING region_id AS id, name, code, capital, is_active, created_at
      `,
      [String(name).trim(), code || null, capital || null, typeof is_active === 'boolean' ? is_active : null]
    );
    res.status(201).json({ region: result.rows[0] });
  } catch (e) {
    console.error('Error creating region:', e);
    res.status(500).json({ error: 'Failed to create region' });
  }
});

app.put('/api/admin/regions/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    const { name, code, capital, is_active } = req.body || {};
    const result = await pool.query(
      `
        UPDATE regions
        SET
          name = COALESCE($2, name),
          code = COALESCE($3, code),
          capital = COALESCE($4, capital),
          is_active = COALESCE($5, is_active)
        WHERE region_id = $1
        RETURNING region_id AS id, name, code, capital, is_active, created_at
      `,
      [id, name ? String(name).trim() : null, code ?? null, capital ?? null, typeof is_active === 'boolean' ? is_active : null]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ region: result.rows[0] });
  } catch (e) {
    console.error('Error updating region:', e);
    res.status(500).json({ error: 'Failed to update region' });
  }
});

app.get('/api/admin/business-types', async (req, res) => {
  try {
    const includeInactive = String(req.query.includeInactive || 'false').toLowerCase() === 'true';
    const result = await pool.query(
      `
        SELECT
          type_id AS id,
          name,
          description,
          is_active,
          created_at,
          updated_at
        FROM business_types
        WHERE ($1::boolean = true OR is_active = true)
        ORDER BY name ASC
      `,
      [includeInactive]
    );
    res.json({ businessTypes: result.rows });
  } catch (e) {
    console.error('Error fetching business types:', e);
    res.status(500).json({ error: 'Failed to fetch business types' });
  }
});

app.post('/api/admin/business-types', async (req, res) => {
  try {
    const { name, description, is_active } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    const result = await pool.query(
      `
        INSERT INTO business_types (name, description, is_active, created_at, updated_at)
        VALUES ($1, $2, COALESCE($3, true), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING type_id AS id, name, description, is_active, created_at, updated_at
      `,
      [String(name).trim(), description || null, typeof is_active === 'boolean' ? is_active : null]
    );
    res.status(201).json({ businessType: result.rows[0] });
  } catch (e) {
    console.error('Error creating business type:', e);
    res.status(500).json({ error: 'Failed to create business type' });
  }
});

app.put('/api/admin/business-types/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    const { name, description, is_active } = req.body || {};
    const result = await pool.query(
      `
        UPDATE business_types
        SET
          name = COALESCE($2, name),
          description = COALESCE($3, description),
          is_active = COALESCE($4, is_active),
          updated_at = CURRENT_TIMESTAMP
        WHERE type_id = $1
        RETURNING type_id AS id, name, description, is_active, created_at, updated_at
      `,
      [id, name ? String(name).trim() : null, description ?? null, typeof is_active === 'boolean' ? is_active : null]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ businessType: result.rows[0] });
  } catch (e) {
    console.error('Error updating business type:', e);
    res.status(500).json({ error: 'Failed to update business type' });
  }
});

app.get('/api/admin/system-config', async (req, res) => {
  try {
    const result = await pool.query(`SELECT key, value, updated_at FROM system_config ORDER BY key ASC`);
    res.json({ config: result.rows });
  } catch (e) {
    console.error('Error fetching system config:', e);
    res.status(500).json({ error: 'Failed to fetch system config' });
  }
});

app.put('/api/admin/system-config', async (req, res) => {
  try {
    const { key, value } = req.body || {};
    if (!key || !String(key).trim()) return res.status(400).json({ error: 'key is required' });
    const result = await pool.query(
      `
        INSERT INTO system_config (key, value, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
        RETURNING key, value, updated_at
      `,
      [String(key).trim(), value ?? null]
    );
    res.json({ item: result.rows[0] });
  } catch (e) {
    console.error('Error updating system config:', e);
    res.status(500).json({ error: 'Failed to update system config' });
  }
});

// SME Registration endpoints
app.post('/api/sme/register', upload.array('documents'), async (req, res) => {
  let client;
  try {
    const currentPool = getPool();
    client = await currentPool.connect();
    await client.query('BEGIN');

    // Debug: helps diagnose "all fields null" / multipart parsing issues
    console.log('[sme/register] content-type:', req.headers['content-type']);
    console.log('[sme/register] body keys:', Object.keys(req.body || {}));
    console.log('[sme/register] files:', Array.isArray(req.files) ? req.files.length : 0);

    const {
      business_name,
      trading_name,
      registration_number,
      industry_sector,
      sub_sector,
      established_date,
      address,
      region,
      city,
      employees,
      annual_turnover_range,
      business_type,
      owner_name,
      owner_id,
      owner_passport,
      owner_gender,
      owner_age,
      owner_address,
      nationality,
      years_experience,
      email,
      phone,
      status
    } = req.body;

    // Validate required fields early so we don't insert nulls
    const missing = [];
    if (!business_name) missing.push('business_name');
    if (!industry_sector) missing.push('industry_sector');
    if (!region) missing.push('region'); // used as country in the UI
    if (!owner_name) missing.push('owner_name');
    if (!email) missing.push('email');

    if (missing.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missing.join(', ')}`,
      });
    }

    // Check if email already exists
    const checkQuery = 'SELECT id FROM smes WHERE email = $1';
    const checkResult = await client.query(checkQuery, [email]);
    
    if (checkResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ 
        success: false, 
        error: 'Email already registered. Please use a different email.' 
      });
    }

    const documents_count = req.files ? req.files.length : 0;

    // Insert new SME registration
    const insertQuery = `
      INSERT INTO smes (
        business_name,
        trading_name,
        registration_number,
        industry_sector,
        sub_sector,
        established_date,
        address,
        region,
        city,
        employees,
        annual_turnover_range,
        business_type,
        owner_name,
        owner_id,
        owner_passport,
        owner_gender,
        owner_age,
        owner_address,
        nationality,
        years_experience,
        email,
        phone,
        status,
        documents_count,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *
    `;

    const values = [
      business_name,
      trading_name,
      registration_number,
      industry_sector,
      sub_sector,
      established_date,
      address,
      region,
      city || region,
      employees ? parseInt(employees) : 0,
      annual_turnover_range,
      business_type,
      owner_name,
      owner_id,
      owner_passport,
      owner_gender,
      owner_age ? parseInt(owner_age) : null,
      owner_address,
      nationality,
      years_experience ? parseInt(years_experience) : 0,
      email,
      phone,
      status || 'pending',
      documents_count
    ];

    const result = await client.query(insertQuery, values);
    const smeId = result.rows[0].id;

    // Save documents information to database
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const docQuery = `
          INSERT INTO sme_documents (
            sme_id, file_name, file_path, file_type, file_size
          ) VALUES ($1, $2, $3, $4, $5)
        `;
        try {
          if (isServerless) {
            // On Netlify, we don't save files to disk, we just record that they were received.
            // For production, you should upload file.buffer to Cloudinary/S3 here.
            await client.query(docQuery, [
              smeId,
              file.originalname,
              'memory-storage',
              file.mimetype,
              file.size
            ]);
          } else {
            const publicPath = `/uploads/${path.basename(file.path)}`;
            await client.query(docQuery, [
              smeId,
              file.originalname,
              publicPath,
              file.mimetype,
              file.size
            ]);
          }
        } catch (docError) {
          console.error('Error saving document info to database:', docError);
        }
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'SME registration submitted successfully',
      sme: result.rows[0]
    });

  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Error registering SME:', error);
    res.status(500).json({
      success: false,
      // Surface real error in dev so we can fix quickly
      error:
        process.env.NODE_ENV === 'production'
          ? 'Registration failed. Please try again later.'
          : (error && error.message) || 'Registration failed. Please try again later.',
    });
  } finally {
    if (client) client.release();
  }
});

app.get('/api/sme/check/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const query = `
      SELECT 
        id,
        business_name,
        trading_name,
        registration_number,
        industry_sector,
        sub_sector,
        established_date,
        address,
        region,
        city,
        employees,
        annual_turnover_range,
        business_type,
        owner_name,
        owner_id,
        owner_passport,
        owner_gender,
        owner_age,
        owner_address,
        nationality,
        years_experience,
        email,
        phone,
        status,
        created_at
      FROM smes
      WHERE email = $1
      LIMIT 1
    `;
    
    const result = await pool.query(query, [email]);
    
    if (result.rows.length > 0) {
      res.json({
        exists: true,
        sme: result.rows[0]
      });
    } else {
      res.json({
        exists: false
      });
    }
    
  } catch (error) {
    console.error('Error checking SME registration:', error);
    res.status(500).json({ error: 'Failed to check registration' });
  }
});

// Get uploaded documents for a given SME
app.get('/api/sme/:id/documents', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT id, file_name, file_path, file_type, file_size, created_at
      FROM sme_documents
      WHERE sme_id = $1
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [id]);

    // Return paths that can be opened from the frontend using API_BASE_URL + file_path
    res.json({
      success: true,
      documents: result.rows,
    });
  } catch (error) {
    console.error('Error fetching SME documents:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch documents' });
  }
});

app.put('/api/sme/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Build dynamic update query
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    
    const query = `
      UPDATE smes
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${fields.length + 1}
      RETURNING *
    `;
    
    const result = await pool.query(query, [...values, id]);
    
    if (result.rows.length > 0) {
      res.json({
        success: true,
        message: 'SME information updated successfully',
        sme: result.rows[0]
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'SME not found'
      });
    }
    
  } catch (error) {
    console.error('Error updating SME:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update SME information' 
    });
  }
});

app.get('/api/sme/all', async (req, res) => {
  try {
    const { status, region, sector, includeDeleted, limit = 50, offset = 0 } = req.query;

    const includeDeletedBool = String(includeDeleted || 'false').toLowerCase() === 'true';

    let query = 'SELECT * FROM smes WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (!includeDeletedBool) {
      query += ` AND deleted_at IS NULL`;
    }

    if (status) {
      query += ` AND status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    if (region) {
      query += ` AND region = $${paramCount}`;
      values.push(region);
      paramCount++;
    }

    if (sector) {
      query += ` AND industry_sector = $${paramCount}`;
      values.push(sector);
      paramCount++;
    }

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const [result, countResult] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, values.slice(0, values.length - 2)),
    ]);
    
    res.json({
      smes: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
  } catch (error) {
    console.error('Error fetching SMEs:', error);
    res.status(500).json({ error: 'Failed to fetch SMEs' });
  }
});

// Business Profiles endpoint - formatted for BusinessProfiles component
app.get('/api/businesses', async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        business_name as "businessName",
        trading_name as "tradingName",
        industry_sector as "industrySector",
        region,
        established_date as "operationStartDate",
        employees as "numberOfEmployees",
        owner_name as "ownerFullName",
        email,
        phone,
        status
      FROM smes
      WHERE deleted_at IS NULL
        AND (status = 'active' OR status = 'pending')
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    
    // Format the data to match the component's expected structure
    const businesses = result.rows.map(row => ({
      id: row.id,
      businessName: row.businessName || 'N/A',
      tradingName: row.tradingName || row.businessName || 'N/A',
      industrySector: row.industrySector || 'Other',
      region: row.region || 'N/A',
      operationStartDate: row.operationStartDate || new Date().toISOString(),
      numberOfEmployees: row.numberOfEmployees || 0,
      ownerFullName: row.ownerFullName || 'N/A',
      email: row.email || '',
      phone: row.phone || '',
      status: row.status === 'active' ? 'Approved' : 'Pending'
    }));
    
    res.json(businesses);
    
  } catch (error) {
    console.error('Error fetching businesses:', error);
    res.status(500).json({ error: 'Failed to fetch businesses' });
  }
});

// Get single business by ID
app.get('/api/business/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        id,
        business_name,
        trading_name,
        registration_number,
        industry_sector,
        sub_sector,
        established_date,
        address,
        region,
        city,
        employees,
        annual_turnover_range,
        business_type,
        owner_name,
        owner_gender,
        owner_age,
        nationality,
        years_experience,
        email,
        phone,
        status,
        created_at
      FROM smes
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }
    
    const business = result.rows[0];
    
    // Format the response
    const formattedBusiness = {
      id: business.id,
      businessName: business.business_name,
      tradingName: business.trading_name,
      registrationNumber: business.registration_number,
      industrySector: business.industry_sector,
      subSector: business.sub_sector,
      operationStartDate: business.established_date,
      address: business.address,
      region: business.region,
      city: business.city,
      numberOfEmployees: business.employees,
      annualTurnoverRange: business.annual_turnover_range,
      businessType: business.business_type,
      ownerFullName: business.owner_name,
      ownerGender: business.owner_gender,
      ownerAge: business.owner_age,
      nationality: business.nationality,
      yearsExperience: business.years_experience,
      email: business.email,
      phone: business.phone,
      status: business.status === 'active' ? 'Approved' : business.status === 'pending' ? 'Pending' : 'Rejected',
      createdAt: business.created_at
    };
    
    res.json(formattedBusiness);
    
  } catch (error) {
    console.error('Error fetching business details:', error);
    res.status(500).json({ error: 'Failed to fetch business details' });
  }
});

// Soft-delete (archive) business by ID
app.delete('/api/business/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // Check if business exists
    const checkQuery = 'SELECT business_name, status, deleted_at FROM smes WHERE id = $1';
    const checkResult = await client.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Business not found',
      });
    }

    const businessName = checkResult.rows[0].business_name;
    const currentStatus = checkResult.rows[0].status;
    const alreadyDeleted = !!checkResult.rows[0].deleted_at;

    if (!alreadyDeleted) {
      await client.query(
        `
          UPDATE smes
          SET deleted_at = CURRENT_TIMESTAMP,
              deleted_prev_status = status,
              status = 'deleted'
          WHERE id = $1
        `,
        [id]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: alreadyDeleted
        ? `Business "${businessName}" was already deleted`
        : `Business "${businessName}" has been deleted successfully (previous status: ${currentStatus})`,
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (e) {
      // ignore
    }
    console.error('Error deleting business:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete business. Please try again.',
    });
  } finally {
    client.release();
  }
});

// Restore a soft-deleted business
app.put('/api/business/:id/restore', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
        UPDATE smes
        SET
          status = COALESCE(NULLIF(deleted_prev_status, ''), 'pending'),
          deleted_at = NULL,
          deleted_prev_status = NULL
        WHERE id = $1
        RETURNING id, business_name, status
      `,
      [id]
    );

    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Business not found' });

    res.json({
      success: true,
      message: `Business "${result.rows[0].business_name}" restored`,
      business: result.rows[0],
    });
  } catch (e) {
    console.error('Error restoring business:', e);
    res.status(500).json({ success: false, error: 'Failed to restore business' });
  }
});

// Investment Opportunities endpoints
app.get('/api/investment-opportunities', async (req, res) => {
  try {
    const includeSme = String(req.query.includeSme || 'false').toLowerCase() === 'true';

    const adminResult = await pool.query(
      `
        SELECT
          id,
          title,
          description,
          sector,
          sub_industry,
          country,
          stage,
          investment_range,
          requirements,
          contact,
          image_key,
          created_at
        FROM admin_investment_opportunities
        WHERE is_active = true
        ORDER BY created_at DESC
      `
    );

    const adminOps = adminResult.rows.map((row) => ({
      id: `admin-${row.id}`,
      title: row.title,
      description: row.description,
      sector: row.sector || 'Other',
      subIndustry: row.sub_industry || '',
      country: row.country || 'Namibia',
      stage: row.stage || 'Growth',
      investmentRange: row.investment_range || '',
      requirements: row.requirements || 'Contact for details',
      contact: row.contact || '',
      imageKey: row.image_key || null,
      source: 'admin',
      created_at: row.created_at,
    }));

    if (!includeSme) {
      return res.json(adminOps);
    }

    // Optional: include SME-submitted fundraising opportunities too (legacy behavior)
    const query = `
      SELECT 
        io.id,
        io.title,
        io.description,
        io.funding_required as investment_range,
        io.status as stage,
        s.industry_sector as sector,
        s.region as country,
        io.use_of_funds as requirements,
        s.email as contact,
        io.created_at
      FROM investment_opportunities io
      JOIN smes s ON io.sme_id = s.id
      WHERE io.status = 'open'
      ORDER BY io.created_at DESC
    `;
    const result = await pool.query(query);
    const smeOps = result.rows.map((row) => ({
      id: `sme-${row.id}`,
      title: row.title,
      description: row.description,
      sector: row.sector || 'Other',
      subIndustry: '',
      country: row.country || 'Namibia',
      stage: row.stage === 'open' ? 'Growth' : 'Mature',
      investmentRange:
        typeof row.investment_range === 'number'
          ? `NAD ${(row.investment_range / 1000000).toFixed(1)}M`
          : '',
      requirements: row.requirements || 'Contact for details',
      contact: row.contact || '',
      imageKey: null,
      source: 'sme',
      created_at: row.created_at,
    }));

    return res.json([...adminOps, ...smeOps]);
    
  } catch (error) {
    console.error('Error fetching investment opportunities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function parseOpportunityRef(rawId) {
  const id = String(rawId || '');
  const m = id.match(/^(admin|sme)-(\d+)$/);
  if (m) return { source: m[1], id: Number(m[2]) };
  // Back-compat: allow plain numeric ids as SME opportunities
  const n = Number(id);
  if (Number.isFinite(n) && n > 0) return { source: 'sme', id: n };
  return null;
}

app.get('/api/investment-opportunities/:id', async (req, res) => {
  try {
    const ref = parseOpportunityRef(req.params.id);
    if (!ref) return res.status(400).json({ error: 'Invalid opportunity id' });

    if (ref.source === 'admin') {
      const r = await pool.query(
        `
          SELECT
            id,
            title,
            description,
            sector,
            sub_industry,
            country,
            stage,
            investment_range,
            requirements,
            contact,
            image_key,
            is_active,
            created_at
          FROM admin_investment_opportunities
          WHERE id = $1
        `,
        [ref.id]
      );
      if (!r.rows.length) return res.status(404).json({ error: 'Opportunity not found' });
      const row = r.rows[0];
      return res.json({
        id: `admin-${row.id}`,
        title: row.title,
        description: row.description,
        sector: row.sector || 'Other',
        subIndustry: row.sub_industry || '',
        country: row.country || 'Namibia',
        stage: row.stage || 'Growth',
        investmentRange: row.investment_range || '',
        requirements: row.requirements || '',
        contact: row.contact || '',
        imageKey: row.image_key || null,
        isActive: !!row.is_active,
        source: 'admin',
        created_at: row.created_at,
      });
    }

    // SME opportunity details (legacy)
    const r = await pool.query(
      `
        SELECT
          io.id,
          io.title,
          io.description,
          io.funding_required as investment_range,
          io.status as stage,
          io.use_of_funds as requirements,
          io.created_at,
          s.industry_sector as sector,
          s.region as country,
          s.email as contact
        FROM investment_opportunities io
        JOIN smes s ON io.sme_id = s.id
        WHERE io.id = $1
      `,
      [ref.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Opportunity not found' });
    const row = r.rows[0];
    return res.json({
      id: `sme-${row.id}`,
      title: row.title,
      description: row.description,
      sector: row.sector || 'Other',
      subIndustry: '',
      country: row.country || 'Namibia',
      stage: row.stage === 'open' ? 'Growth' : 'Mature',
      investmentRange:
        typeof row.investment_range === 'number'
          ? `NAD ${(row.investment_range / 1000000).toFixed(1)}M`
          : '',
      requirements: row.requirements || '',
      contact: row.contact || '',
      imageKey: null,
      source: 'sme',
      created_at: row.created_at,
    });
  } catch (e) {
    console.error('Error fetching opportunity:', e);
    res.status(500).json({ error: 'Failed to fetch opportunity' });
  }
});

app.post('/api/investment-opportunities/:id/interest', async (req, res) => {
  try {
    const ref = parseOpportunityRef(req.params.id);
    if (!ref) return res.status(400).json({ error: 'Invalid opportunity id' });

    const { name, email, phone, message } = req.body || {};
    // Keep it permissive, but require at least an email or a name.
    if (!String(email || '').trim() && !String(name || '').trim()) {
      return res.status(400).json({ error: 'Please provide at least your name or email' });
    }

    const r = await pool.query(
      `
        INSERT INTO investment_interests (
          opportunity_source, opportunity_id, name, email, phone, message, status
        ) VALUES ($1,$2,$3,$4,$5,$6,'new')
        RETURNING id, created_at
      `,
      [
        ref.source,
        ref.id,
        name ? String(name).trim() : null,
        email ? String(email).trim() : null,
        phone ? String(phone).trim() : null,
        message ? String(message).trim() : null,
      ]
    );

    res.status(201).json({ success: true, interest: r.rows[0] });
  } catch (e) {
    console.error('Error creating interest:', e);
    res.status(500).json({ error: 'Failed to submit interest' });
  }
});

// Admin: view recent interest submissions
app.get('/api/admin/investment-interests', async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;

    // investment_opportunities schema differs across environments:
    // - some DBs use id
    // - others use opportunity_id
    const oppIdCol = await pickExistingColumn('investment_opportunities', ['id', 'opportunity_id']);

    let query = `
      SELECT
        ii.*,
        COALESCE(aio.title, io.title) AS opportunity_title
      FROM investment_interests ii
      LEFT JOIN admin_investment_opportunities aio
        ON ii.opportunity_source = 'admin'
       AND ii.opportunity_id = aio.id
      LEFT JOIN investment_opportunities io
        ON ii.opportunity_source = 'sme'
       AND ii.opportunity_id = io.${oppIdCol || 'id'}
      WHERE 1=1
    `;
    const values = [];
    let i = 1;
    if (status) {
      query += ` AND status = $${i++}`;
      values.push(status);
    }
    query += ` ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i++}`;
    values.push(Number(limit) || 50, Number(offset) || 0);
    const r = await pool.query(query, values);
    res.json({ items: r.rows });
  } catch (e) {
    console.error('Error fetching investment interests:', e);
    res.status(500).json({ error: 'Failed to fetch interests' });
  }
});

// Admin: delete an interest submission
app.delete('/api/admin/investment-interests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const r = await pool.query('DELETE FROM investment_interests WHERE id = $1 RETURNING id', [id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Interest not found' });
    res.json({ success: true });
  } catch (e) {
    console.error('Error deleting investment interest:', e);
    res.status(500).json({ error: 'Failed to delete interest' });
  }
});

// Admin: JESMIKE Projects CRUD
app.get('/api/admin/projects', async (req, res) => {
  try {
    const includeInactive = String(req.query.includeInactive || 'false').toLowerCase() === 'true';
    const r = await pool.query(
      `
        SELECT *
        FROM admin_projects
        WHERE ($1::boolean = true) OR is_active = true
        ORDER BY created_at DESC
      `,
      [includeInactive]
    );
    res.json({ items: r.rows });
  } catch (e) {
    console.error('Error fetching projects:', e);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.post('/api/admin/projects', async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      country,
      stage,
      start_date,
      end_date,
      budget,
      contact,
      is_active,
    } = req.body || {};

    if (!title || !description) return res.status(400).json({ error: 'title and description are required' });

    const r = await pool.query(
      `
        INSERT INTO admin_projects (
          title, description, category, country, stage, start_date, end_date, budget, contact, is_active
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,COALESCE($10,true))
        RETURNING *
      `,
      [
        String(title).trim(),
        String(description).trim(),
        category ? String(category).trim() : null,
        country ? String(country).trim() : null,
        stage ? String(stage).trim() : null,
        start_date ? String(start_date).trim() : null,
        end_date ? String(end_date).trim() : null,
        budget ? String(budget).trim() : null,
        contact ? String(contact).trim() : null,
        typeof is_active === 'boolean' ? is_active : null,
      ]
    );
    res.status(201).json({ item: r.rows[0] });
  } catch (e) {
    console.error('Error creating project:', e);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.put('/api/admin/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body || {};
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);

    if (!fields.length) return res.status(400).json({ error: 'No fields provided' });

    const allowed = new Set([
      'title',
      'description',
      'category',
      'country',
      'stage',
      'start_date',
      'end_date',
      'budget',
      'contact',
      'is_active',
    ]);
    for (const f of fields) {
      if (!allowed.has(f)) return res.status(400).json({ error: `Field not allowed: ${f}` });
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const query = `
      UPDATE admin_projects
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${fields.length + 1}
      RETURNING *
    `;
    const r = await pool.query(query, [...values, id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Project not found' });
    res.json({ item: r.rows[0] });
  } catch (e) {
    console.error('Error updating project:', e);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

app.delete('/api/admin/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const r = await pool.query('DELETE FROM admin_projects WHERE id = $1 RETURNING id', [id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Project not found' });
    res.json({ success: true });
  } catch (e) {
    console.error('Error deleting project:', e);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Admin: Project files
app.get('/api/admin/projects/:id/files', async (req, res) => {
  try {
    const { id } = req.params;
    const r = await pool.query(
      `
        SELECT id, file_name, file_path, file_type, file_size, created_at
        FROM admin_project_files
        WHERE project_id = $1
        ORDER BY created_at DESC
      `,
      [id]
    );
    res.json({ files: r.rows });
  } catch (e) {
    console.error('Error fetching project files:', e);
    res.status(500).json({ error: 'Failed to fetch project files' });
  }
});

app.post('/api/admin/projects/:id/files', upload.array('files'), async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ error: 'No files uploaded' });

    // ensure project exists
    const exists = await pool.query('SELECT 1 FROM admin_projects WHERE id = $1 LIMIT 1', [id]);
    if (!exists.rows.length) return res.status(404).json({ error: 'Project not found' });

    const inserted = [];
    for (const file of files) {
      const publicPath = `/uploads/${path.basename(file.path)}`;
      // eslint-disable-next-line no-await-in-loop
      const r = await pool.query(
        `
          INSERT INTO admin_project_files (project_id, file_name, file_path, file_type, file_size)
          VALUES ($1,$2,$3,$4,$5)
          RETURNING id, file_name, file_path, file_type, file_size, created_at
        `,
        [id, file.originalname, publicPath, file.mimetype, file.size]
      );
      inserted.push(r.rows[0]);
    }

    res.status(201).json({ success: true, files: inserted });
  } catch (e) {
    console.error('Error uploading project files:', e);
    res.status(500).json({ error: 'Failed to upload project files' });
  }
});

app.delete('/api/admin/projects/:projectId/files/:fileId', async (req, res) => {
  try {
    const { projectId, fileId } = req.params;
    const r = await pool.query(
      `
        DELETE FROM admin_project_files
        WHERE id = $1 AND project_id = $2
        RETURNING file_path
      `,
      [fileId, projectId]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'File not found' });

    // best-effort delete from disk
    try {
      const filePath = r.rows[0].file_path || '';
      const diskPath = path.join(uploadDir, path.basename(filePath));
      if (fs.existsSync(diskPath)) fs.unlinkSync(diskPath);
    } catch (unlinkErr) {
      console.warn('Failed to delete file from disk:', unlinkErr);
    }

    res.json({ success: true });
  } catch (e) {
    console.error('Error deleting project file:', e);
    res.status(500).json({ error: 'Failed to delete project file' });
  }
});

// Admin CRUD for public investments opportunities
app.get('/api/admin/investment-opportunities', async (req, res) => {
  try {
    const includeInactive = String(req.query.includeInactive || 'false').toLowerCase() === 'true';
    const query = `
      SELECT *
      FROM admin_investment_opportunities
      WHERE ($1::boolean = true) OR is_active = true
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [includeInactive]);
    res.json({ items: result.rows });
  } catch (e) {
    console.error('Error fetching admin opportunities:', e);
    res.status(500).json({ error: 'Failed to fetch opportunities' });
  }
});

app.post('/api/admin/investment-opportunities', async (req, res) => {
  try {
    const {
      title,
      description,
      sector,
      sub_industry,
      country,
      stage,
      investment_range,
      requirements,
      contact,
      image_key,
      is_active,
    } = req.body || {};

    if (!title || !description) {
      return res.status(400).json({ error: 'title and description are required' });
    }

    const result = await pool.query(
      `
        INSERT INTO admin_investment_opportunities (
          title, description, sector, sub_industry, country, stage, investment_range, requirements, contact, image_key, is_active
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,COALESCE($11, true))
        RETURNING *
      `,
      [
        String(title).trim(),
        String(description).trim(),
        sector ? String(sector).trim() : null,
        sub_industry ? String(sub_industry).trim() : null,
        country ? String(country).trim() : null,
        stage ? String(stage).trim() : null,
        investment_range ? String(investment_range).trim() : null,
        requirements ? String(requirements).trim() : null,
        contact ? String(contact).trim() : null,
        image_key ? String(image_key).trim() : null,
        typeof is_active === 'boolean' ? is_active : null,
      ]
    );

    res.status(201).json({ item: result.rows[0] });
  } catch (e) {
    console.error('Error creating admin opportunity:', e);
    res.status(500).json({ error: 'Failed to create opportunity' });
  }
});

app.put('/api/admin/investment-opportunities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body || {};
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);

    if (!fields.length) return res.status(400).json({ error: 'No fields provided' });

    const allowed = new Set([
      'title',
      'description',
      'sector',
      'sub_industry',
      'country',
      'stage',
      'investment_range',
      'requirements',
      'contact',
      'image_key',
      'is_active',
    ]);
    for (const f of fields) {
      if (!allowed.has(f)) return res.status(400).json({ error: `Field not allowed: ${f}` });
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const query = `
      UPDATE admin_investment_opportunities
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${fields.length + 1}
      RETURNING *
    `;
    const result = await pool.query(query, [...values, id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Opportunity not found' });
    res.json({ item: result.rows[0] });
  } catch (e) {
    console.error('Error updating admin opportunity:', e);
    res.status(500).json({ error: 'Failed to update opportunity' });
  }
});

app.post('/api/investment-opportunities', async (req, res) => {
  try {
    const {
      sme_id,
      title,
      description,
      funding_required,
      equity_offered,
      use_of_funds,
      expected_roi,
      investment_timeline
    } = req.body;
    
    const query = `
      INSERT INTO investment_opportunities (
        sme_id,
        title,
        description,
        funding_required,
        equity_offered,
        use_of_funds,
        expected_roi,
        investment_timeline,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'open')
      RETURNING *
    `;
    
    const values = [
      sme_id,
      title,
      description,
      funding_required,
      equity_offered,
      use_of_funds,
      expected_roi,
      investment_timeline
    ];
    
    const result = await pool.query(query, values);
    
    res.status(201).json({
      message: 'Investment opportunity created successfully',
      opportunity: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error creating investment opportunity:', error);
    res.status(500).json({ error: 'Failed to create investment opportunity' });
  }
});

// Dashboard endpoints
// NOTE: legacy duplicate dashboard endpoints removed (they also conflicted with /api/dashboard/summary).

// Contact Messages endpoints
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    
    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name, email, subject, and message are required' 
      });
    }
    
    const query = `
      INSERT INTO contact_messages (
        name,
        email,
        phone,
        subject,
        message,
        status,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, 'new', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const values = [name, email, phone || null, subject, message];
    const result = await pool.query(query, values);

    // Email notification (optional; requires SMTP env vars)
    const transporter = getSmtpTransporter();
    const to = process.env.CONTACT_TO || 'tangenicoachlam@gmail.com';
    const from = process.env.CONTACT_FROM || process.env.SMTP_USER || to;

    if (transporter) {
      try {
        await transporter.sendMail({
          to,
          from,
          replyTo: email,
          subject: `[JESMIKE Contact] ${subject}`,
          text: [
            `New contact message received:`,
            ``,
            `Name: ${name}`,
            `Email: ${email}`,
            `Phone: ${phone || 'N/A'}`,
            `Subject: ${subject}`,
            ``,
            `Message:`,
            message,
            ``,
            `Message ID: ${result.rows[0].id}`,
          ].join('\n'),
        });
      } catch (mailErr) {
        console.error('Error sending contact email:', mailErr);
        // Do not fail the request; message is still stored in DB
      }
    } else {
      console.warn(
        'SMTP not configured. Set SMTP_HOST/SMTP_USER/SMTP_PASS to receive contact emails.'
      );
    }
    
    res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon!',
      contactMessage: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error saving contact message:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send message. Please try again.' 
    });
  }
});

app.get('/api/contact/messages', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM contact_messages WHERE 1=1';
    const values = [];
    let paramCount = 1;
    
    if (status) {
      query += ` AND status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);
    
    const result = await pool.query(query, values);
    
    // Get total count
    const countQuery = 'SELECT COUNT(*) FROM contact_messages WHERE 1=1' + 
      (status ? ` AND status = '${status}'` : '');
    
    const countResult = await pool.query(countQuery);
    
    res.json({
      messages: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.put('/api/contact/messages/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const query = `
      UPDATE contact_messages
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [status, id]);
    
    if (result.rows.length > 0) {
      res.json({
        success: true,
        message: 'Message status updated successfully',
        contactMessage: result.rows[0]
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }
    
  } catch (error) {
    console.error('Error updating message status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update message status' 
    });
  }
});

// Export endpoints
app.get('/api/export/csv', async (req, res) => {
  try {
    // Fetch all data for export
    const smeQuery = `
      SELECT 
        business_name,
        registration_number,
        owner_name,
        owner_gender,
        email,
        phone,
        region,
        city,
        industry_sector,
        employees,
        annual_turnover,
        established_date,
        status
      FROM smes
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(smeQuery);
    
    // Create CSV content
    const headers = [
      'Business Name',
      'Registration Number',
      'Owner Name',
      'Owner Gender',
      'Email',
      'Phone',
      'Region',
      'City',
      'Industry Sector',
      'Employees',
      'Annual Turnover',
      'Established Date',
      'Status'
    ];
    
    let csvContent = headers.join(',') + '\n';
    
    result.rows.forEach(row => {
      const rowData = [
        `"${row.business_name || ''}"`,
        `"${row.registration_number || ''}"`,
        `"${row.owner_name || ''}"`,
        `"${row.owner_gender || ''}"`,
        `"${row.email || ''}"`,
        `"${row.phone || ''}"`,
        `"${row.region || ''}"`,
        `"${row.city || ''}"`,
        `"${row.industry_sector || ''}"`,
        row.employees || 0,
        row.annual_turnover || 0,
        row.established_date ? new Date(row.established_date).toLocaleDateString() : '',
        `"${row.status || ''}"`
      ];
      csvContent += rowData.join(',') + '\n';
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=sme-data-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
    
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

app.get('/api/export/excel', async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    
    // SMEs worksheet
    const smeWorksheet = workbook.addWorksheet('SMEs');
    
    const smeQuery = `
      SELECT 
        business_name,
        registration_number,
        owner_name,
        owner_gender,
        email,
        phone,
        region,
        city,
        industry_sector,
        employees,
        annual_turnover,
        established_date,
        status
      FROM smes
      ORDER BY created_at DESC
    `;
    
    const smeResult = await pool.query(smeQuery);
    
    // Add headers
    smeWorksheet.addRow([
      'Business Name',
      'Registration Number',
      'Owner Name',
      'Owner Gender',
      'Email',
      'Phone',
      'Region',
      'City',
      'Industry Sector',
      'Employees',
      'Annual Turnover',
      'Established Date',
      'Status'
    ]);
    
    // Add data
    smeResult.rows.forEach(row => {
      smeWorksheet.addRow([
        row.business_name,
        row.registration_number,
        row.owner_name,
        row.owner_gender,
        row.email,
        row.phone,
        row.region,
        row.city,
        row.industry_sector,
        row.employees,
        row.annual_turnover,
        row.established_date,
        row.status
      ]);
    });
    
    // Statistics worksheet
    const statsWorksheet = workbook.addWorksheet('Statistics');
    
    // Add summary statistics
    const totalSMEsQuery = 'SELECT COUNT(*) as count FROM smes';
    const totalInvestorsQuery = 'SELECT COUNT(*) as count FROM investors';
    const totalDealsQuery = 'SELECT COUNT(*) as count FROM investment_deals';
    
    const [smeCount, investorCount, dealsCount] = await Promise.all([
      pool.query(totalSMEsQuery),
      pool.query(totalInvestorsQuery),
      pool.query(totalDealsQuery)
    ]);
    
    statsWorksheet.addRow(['Summary Statistics']);
    statsWorksheet.addRow(['Total SMEs', smeCount.rows[0].count]);
    statsWorksheet.addRow(['Total Investors', investorCount.rows[0].count]);
    statsWorksheet.addRow(['Total Deals', dealsCount.rows[0].count]);
    statsWorksheet.addRow([]);
    
    // Regional statistics
    const regionQuery = `
      SELECT region, COUNT(*) as smes
      FROM smes
      GROUP BY region
      ORDER BY smes DESC
    `;
    
    const regionResult = await pool.query(regionQuery);
    
    statsWorksheet.addRow(['Regional Distribution']);
    statsWorksheet.addRow(['Region', 'SMEs']);
    regionResult.rows.forEach(row => {
      statsWorksheet.addRow([row.region, row.smes]);
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=sme-statistics-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    // Write to response
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (error) {
    console.error('Error exporting Excel:', error);
    res.status(500).json({ error: 'Failed to export Excel. Make sure ExcelJS is installed.' });
  }
});

app.get('/api/export/pdf', async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=sme-statistics-${new Date().toISOString().split('T')[0]}.pdf`);
    
    // Pipe the PDF to the response
    doc.pipe(res);
    
    // Add content to PDF
    doc.fontSize(20).text('SME Platform Statistics Report', 50, 50);
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 80);
    
    // Fetch summary statistics
    const totalSMEsQuery = 'SELECT COUNT(*) as count FROM smes';
    const totalInvestorsQuery = 'SELECT COUNT(*) as count FROM investors';
    const totalDealsQuery = 'SELECT COUNT(*) as count FROM investment_deals';
    
    const [smeCount, investorCount, dealsCount] = await Promise.all([
      pool.query(totalSMEsQuery),
      pool.query(totalInvestorsQuery),
      pool.query(totalDealsQuery)
    ]);
    
    // Add summary statistics
    doc.fontSize(16).text('Summary Statistics', 50, 120);
    doc.fontSize(12)
       .text(`Total SMEs: ${smeCount.rows[0].count}`, 50, 150)
       .text(`Total Investors: ${investorCount.rows[0].count}`, 50, 170)
       .text(`Total Investment Deals: ${dealsCount.rows[0].count}`, 50, 190);
    
    // Add regional statistics
    const regionQuery = `
      SELECT region, COUNT(*) as smes
      FROM smes
      GROUP BY region
      ORDER BY smes DESC
    `;
    
    const regionResult = await pool.query(regionQuery);
    
    doc.fontSize(16).text('Regional Distribution', 50, 230);
    let yPosition = 260;
    
    regionResult.rows.forEach(row => {
      doc.fontSize(12).text(`${row.region}: ${row.smes} SMEs`, 50, yPosition);
      yPosition += 20;
    });
    
    // Add sector statistics
    const sectorQuery = `
      SELECT industry_sector, COUNT(*) as count
      FROM smes
      GROUP BY industry_sector
      ORDER BY count DESC
    `;
    
    const sectorResult = await pool.query(sectorQuery);
    
    yPosition += 20;
    doc.fontSize(16).text('Industry Sectors', 50, yPosition);
    yPosition += 30;
    
    sectorResult.rows.forEach(row => {
      doc.fontSize(12).text(`${row.industry_sector}: ${row.count} SMEs`, 50, yPosition);
      yPosition += 20;
    });
    
    // Finalize the PDF
    doc.end();
    
  } catch (error) {
    console.error('Error exporting PDF:', error);
    res.status(500).json({ error: 'Failed to export PDF. Make sure PDFKit is installed.' });
  }
});

// Final error handler (must be after routes to catch Multer + other errors)
// Ensures the frontend receives JSON instead of the default HTML error page.
app.use((err, req, res, next) => {
  if (!err) return next();

  if (err instanceof multer.MulterError) {
    const msg =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File too large. Max size is 10MB per file.'
        : err.message;
    return res.status(400).json({ success: false, error: msg });
  }

  if (typeof err.message === 'string' && err.message.length) {
    return res.status(400).json({ success: false, error: err.message });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({ success: false, error: 'Internal server error' });
});

function startServer(portToTry, attemptsLeft = 5) {
  const server = app.listen(portToTry, () => {
    console.log(`Server running on port ${portToTry}`);
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE' && attemptsLeft > 0) {
      const nextPort = portToTry + 1;
      console.error(`Port ${portToTry} is already in use. Trying ${nextPort}...`);
      // Try the next port instead of crashing
      startServer(nextPort, attemptsLeft - 1);
      return;
    }

    if (err && err.code === 'EADDRINUSE') {
      console.error(`Port ${portToTry} is already in use.`);
      console.error(`Fix: stop the process using ${portToTry}, or set PORT to a free port.`);
    } else {
      console.error('Server failed to start:', err);
    }
    process.exit(1);
  });
}

// Export the app for Vercel serverless usage; only listen when running locally
module.exports = app;

if (require.main === module) {
  startServer(requestedPort);
}