-- Create all necessary tables for jsmike database

-- 1. SMEs table (already exists, but included for completeness)
CREATE TABLE IF NOT EXISTS smes (
    id SERIAL PRIMARY KEY,
    business_name VARCHAR(255) NOT NULL,
    trading_name VARCHAR(255),
    registration_number VARCHAR(100) UNIQUE,
    owner_name VARCHAR(255) NOT NULL,
    owner_id VARCHAR(50),
    owner_passport VARCHAR(50),
    owner_gender CHAR(1) CHECK (owner_gender IN ('M', 'F', 'O')),
    owner_age INTEGER,
    owner_address TEXT,
    nationality VARCHAR(100),
    years_experience INTEGER,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    region VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    address TEXT,
    industry_sector VARCHAR(100) NOT NULL,
    sub_sector VARCHAR(100),
    business_type VARCHAR(100),
    employees INTEGER DEFAULT 0,
    annual_turnover NUMERIC(15,2),
    annual_turnover_range VARCHAR(50),
    established_date DATE,
    description TEXT,
    website VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    documents_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Investors table
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

-- 3. Investment Deals table
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

-- 4. Investment Opportunities table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_smes_region ON smes(region);
CREATE INDEX IF NOT EXISTS idx_smes_industry ON smes(industry_sector);
CREATE INDEX IF NOT EXISTS idx_smes_created_at ON smes(created_at);
CREATE INDEX IF NOT EXISTS idx_smes_status ON smes(status);
CREATE INDEX IF NOT EXISTS idx_investment_deals_sme_id ON investment_deals(sme_id);
CREATE INDEX IF NOT EXISTS idx_investment_deals_investor_id ON investment_deals(investor_id);
CREATE INDEX IF NOT EXISTS idx_investment_opportunities_sme_id ON investment_opportunities(sme_id);

-- Insert sample investors
INSERT INTO investors (name, type, email, phone, region, investment_focus, min_investment, max_investment, sectors_of_interest, status)
VALUES
('JESMIKE Investment Fund', 'institutional', 'info@jesmike.com', '+264816789012', 'Khomas', 'SME growth and development', 50000.00, 2000000.00, ARRAY['Technology', 'Agriculture', 'Manufacturing'], 'active'),
('Namibia Development Corporation', 'government', 'ndc@gov.na', '+264817890123', 'Khomas', 'Economic development', 100000.00, 5000000.00, ARRAY['Agriculture', 'Energy', 'Manufacturing'], 'active'),
('Private Equity Partners', 'institutional', 'contact@pep.na', '+264818901234', 'Khomas', 'High growth potential', 200000.00, 3000000.00, ARRAY['Technology', 'Energy', 'Services'], 'active')
ON CONFLICT (email) DO NOTHING;

-- Success message
SELECT 'All tables created successfully!' as message;