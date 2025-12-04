const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'jsmike',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || 'root',
  port: process.env.DB_PORT || 5432,
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error acquiring client', err.stack);
  } else {
    console.log('Connected to PostgreSQL database');
    release();
  }
});

// Statistics API endpoints
app.get('/api/statistics/summary', async (req, res) => {
  try {
    const totalSMEsQuery = 'SELECT COUNT(*) as count FROM smes';
    const totalInvestorsQuery = 'SELECT COUNT(*) as count FROM investors';
    const totalDealsQuery = 'SELECT COUNT(*) as count FROM investment_deals';
    const totalEmploymentQuery = 'SELECT SUM(employees) as total FROM smes';
    
    const [smeResult, investorResult, dealsResult, employmentResult] = await Promise.all([
      pool.query(totalSMEsQuery),
      pool.query(totalInvestorsQuery),
      pool.query(totalDealsQuery),
      pool.query(totalEmploymentQuery)
    ]);

    res.json({
      totalSMEs: parseInt(smeResult.rows[0].count) || 0,
      totalInvestors: parseInt(investorResult.rows[0].count) || 0,
      totalDeals: parseInt(dealsResult.rows[0].count) || 0,
      totalRegions: 14,
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

// Dashboard API endpoints
app.get('/api/dashboard/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
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
      WHERE email = $1 OR id = $2
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    const smeResult = await pool.query(smeQuery, [userId, userId]);
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
    
    // Get investment opportunities count for this SME
    const opportunitiesQuery = `
      SELECT COUNT(*) as count 
      FROM investment_opportunities 
      WHERE sme_id = $1 AND status = 'open'
    `;
    const opportunitiesResult = await pool.query(opportunitiesQuery, [smeData.id]);
    
    // Get investment deals count
    const dealsQuery = `
      SELECT COUNT(*) as count 
      FROM investment_deals 
      WHERE sme_id = $1
    `;
    const dealsResult = await pool.query(dealsQuery, [smeData.id]);
    
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
      investmentOpportunities: parseInt(opportunitiesResult.rows[0].count),
      messages: parseInt(dealsResult.rows[0].count), // Using deals as messages for now
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

app.get('/api/activities/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Get user's SME ID first
    const smeQuery = 'SELECT id FROM smes WHERE email = $1 OR id = $2 LIMIT 1';
    const smeResult = await pool.query(smeQuery, [userId, userId]);
    
    if (smeResult.rows.length === 0) {
      return res.json([]);
    }
    
    const smeId = smeResult.rows[0].id;
    
    // Get recent activities (investment deals, opportunities, etc.)
    const activitiesQuery = `
      SELECT 
        'investment_deal' as type,
        'Investment Deal' as title,
        CONCAT('Investment of NAD ', investment_amount, ' received') as description,
        created_at as date,
        '💰' as icon
      FROM investment_deals 
      WHERE sme_id = $1
      
      UNION ALL
      
      SELECT 
        'opportunity' as type,
        'Investment Opportunity' as title,
        CONCAT('Posted opportunity: ', title) as description,
        created_at as date,
        '📈' as icon
      FROM investment_opportunities 
      WHERE sme_id = $1
      
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
      pool.query('SELECT COUNT(*) as count FROM investors'),
      pool.query('SELECT COUNT(*) as count FROM investment_deals WHERE status = $1', ['completed']),
      pool.query('SELECT COUNT(*) as count FROM investment_opportunities WHERE status = $1', ['open'])
    ]);
    
    const [activeSMEs, totalInvestors, completedDeals, openOpportunities] = summaryQueries;
    
    res.json({
      activeSMEs: parseInt(activeSMEs.rows[0].count),
      totalInvestors: parseInt(totalInvestors.rows[0].count),
      completedDeals: parseInt(completedDeals.rows[0].count),
      openOpportunities: parseInt(openOpportunities.rows[0].count)
    });
    
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// SME Registration endpoints
app.post('/api/sme/register', async (req, res) => {
  try {
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
      status,
      documents_count
    } = req.body;

    // Check if email already exists
    const checkQuery = 'SELECT id FROM smes WHERE email = $1';
    const checkResult = await pool.query(checkQuery, [email]);
    
    if (checkResult.rows.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: 'Email already registered. Please use a different email.' 
      });
    }

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
      status || 'pending',
      documents_count || 0
    ];

    const result = await pool.query(insertQuery, values);

    res.status(201).json({
      success: true,
      message: 'SME registration submitted successfully',
      sme: result.rows[0]
    });

  } catch (error) {
    console.error('Error registering SME:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to register SME. Please try again.' 
    });
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
    const { status, region, sector, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM smes WHERE 1=1';
    const values = [];
    let paramCount = 1;
    
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
    
    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);
    
    const result = await pool.query(query, values);
    
    // Get total count
    const countQuery = 'SELECT COUNT(*) FROM smes WHERE 1=1' + 
      (status ? ` AND status = '${status}'` : '') +
      (region ? ` AND region = '${region}'` : '') +
      (sector ? ` AND industry_sector = '${sector}'` : '');
    
    const countResult = await pool.query(countQuery);
    
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
      WHERE status = 'active' OR status = 'pending'
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

// Delete business by ID
app.delete('/api/business/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if business exists
    const checkQuery = 'SELECT business_name FROM smes WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Business not found' 
      });
    }
    
    const businessName = checkResult.rows[0].business_name;
    
    // Delete the business
    const deleteQuery = 'DELETE FROM smes WHERE id = $1';
    await pool.query(deleteQuery, [id]);
    
    res.json({
      success: true,
      message: `Business "${businessName}" has been deleted successfully`
    });
    
  } catch (error) {
    console.error('Error deleting business:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete business. Please try again.' 
    });
  }
});

// Investment Opportunities endpoints
app.get('/api/investment-opportunities', async (req, res) => {
  try {
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
    
    const opportunities = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      sector: row.sector,
      subIndustry: '',
      country: row.country || 'Namibia',
      stage: row.stage === 'open' ? 'Growth' : 'Mature',
      investmentRange: `NAD ${(row.investment_range / 1000000).toFixed(1)}M`,
      requirements: row.requirements || 'Contact for details',
      contact: row.contact
    }));
    
    res.json(opportunities);
    
  } catch (error) {
    console.error('Error fetching investment opportunities:', error);
    res.status(500).json({ error: 'Internal server error' });
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
app.get('/api/dashboard/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user's SME information
    const smeQuery = `
      SELECT 
        business_name,
        registration_number,
        status,
        email
      FROM smes
      WHERE email = $1
      LIMIT 1
    `;
    
    const smeResult = await pool.query(smeQuery, [userId]);
    
    if (smeResult.rows.length === 0) {
      return res.json({
        registrationStatus: 'Not Registered',
        investmentOpportunities: 0,
        messages: 0,
        profileCompletion: 0,
        businessName: '',
        registrationNumber: ''
      });
    }
    
    const sme = smeResult.rows[0];
    
    // Get investment opportunities count
    const opportunitiesQuery = `
      SELECT COUNT(*) as count
      FROM investment_opportunities
      WHERE sme_id = (SELECT id FROM smes WHERE email = $1)
      AND status = 'open'
    `;
    
    const opportunitiesResult = await pool.query(opportunitiesQuery, [userId]);
    
    // Calculate profile completion
    const profileFields = [
      sme.business_name,
      sme.registration_number,
      sme.email
    ];
    const completedFields = profileFields.filter(field => field && field.trim() !== '').length;
    const profileCompletion = Math.round((completedFields / profileFields.length) * 100);
    
    res.json({
      registrationStatus: sme.status === 'active' ? 'Approved' : sme.status === 'pending' ? 'Pending' : 'Rejected',
      investmentOpportunities: parseInt(opportunitiesResult.rows[0].count) || 0,
      messages: 0, // Placeholder for future messaging feature
      profileCompletion: profileCompletion,
      businessName: sme.business_name,
      registrationNumber: sme.registration_number
    });
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/activities/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get recent activities for the user
    const activitiesQuery = `
      SELECT 
        'investment_deal' as type,
        'Investment Deal' as title,
        'Investment of NAD ' || investment_amount || ' received' as description,
        deal_date as date,
        '💰' as icon
      FROM investment_deals id
      JOIN smes s ON id.sme_id = s.id
      WHERE s.email = $1
      AND id.status = 'completed'
      
      UNION ALL
      
      SELECT 
        'opportunity' as type,
        'Investment Opportunity' as title,
        'Posted opportunity: ' || title as description,
        created_at as date,
        '📈' as icon
      FROM investment_opportunities io
      JOIN smes s ON io.sme_id = s.id
      WHERE s.email = $1
      
      UNION ALL
      
      SELECT 
        'profile' as type,
        'Profile Update' as title,
        'Business profile updated' as description,
        updated_at as date,
        '👤' as icon
      FROM smes
      WHERE email = $1
      
      ORDER BY date DESC
      LIMIT 10
    `;
    
    const result = await pool.query(activitiesQuery, [userId]);
    
    const activities = result.rows.map(row => ({
      type: row.type,
      title: row.title,
      description: row.description,
      date: new Date(row.date).toLocaleDateString(),
      icon: row.icon
    }));
    
    res.json(activities);
    
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/dashboard/summary', async (req, res) => {
  try {
    const summaryQueries = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM smes WHERE status = $1', ['active']),
      pool.query('SELECT COUNT(*) as count FROM investors WHERE is_active = $1', [true]),
      pool.query('SELECT COUNT(*) as count FROM investment_deals'),
      pool.query('SELECT COUNT(*) as count FROM investment_opportunities')
    ]);
    
    res.json({
      activeSMEs: parseInt(summaryQueries[0].rows[0].count) || 0,
      totalInvestors: parseInt(summaryQueries[1].rows[0].count) || 0,
      completedDeals: parseInt(summaryQueries[2].rows[0].count) || 0,
      openOpportunities: parseInt(summaryQueries[3].rows[0].count) || 0
    });
    
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});