-- SME Platform Database Schema

-- Create SMEs table
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
    annual_turnover DECIMAL(15,2),
    annual_turnover_range VARCHAR(50),
    established_date DATE,
    description TEXT,
    website VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    documents_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Investors table
CREATE TABLE IF NOT EXISTS investors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- individual, institutional, government
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    region VARCHAR(100),
    investment_focus TEXT,
    min_investment DECIMAL(15,2),
    max_investment DECIMAL(15,2),
    sectors_of_interest TEXT[],
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Investment Deals table
CREATE TABLE IF NOT EXISTS investment_deals (
    id SERIAL PRIMARY KEY,
    sme_id INTEGER REFERENCES smes(id),
    investor_id INTEGER REFERENCES investors(id),
    investment_amount DECIMAL(15,2) NOT NULL,
    equity_percentage DECIMAL(5,2),
    deal_type VARCHAR(100), -- equity, loan, grant
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, completed, rejected
    deal_date DATE,
    terms TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Investment Opportunities table
CREATE TABLE IF NOT EXISTS investment_opportunities (
    id SERIAL PRIMARY KEY,
    sme_id INTEGER REFERENCES smes(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    funding_required DECIMAL(15,2) NOT NULL,
    equity_offered DECIMAL(5,2),
    use_of_funds TEXT,
    expected_roi DECIMAL(5,2),
    investment_timeline VARCHAR(100),
    status VARCHAR(50) DEFAULT 'open', -- open, closed, funded
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data for testing
INSERT INTO smes (
    business_name, 
    trading_name,
    registration_number, 
    owner_name, 
    owner_gender, 
    owner_age,
    email, 
    phone, 
    region, 
    city, 
    industry_sector,
    sub_sector,
    business_type,
    employees, 
    annual_turnover,
    annual_turnover_range,
    established_date, 
    description,
    status,
    years_experience
) VALUES
('Namibian Craft Co.', 'NCC', 'SME001', 'Maria Shikongo', 'F', 42, 'maria@namibiancraft.com', '+264811234567', 'Khomas', 'Windhoek', 'Manufacturing', 'Textiles', 'Private Company', 15, 500000.00, '500001-1000000', '2020-01-15', 'Traditional Namibian crafts and textiles', 'active', 8),
('Desert Solar Solutions', 'DSS', 'SME002', 'Johannes Hamutenya', 'M', 38, 'johannes@desertsolar.com', '+264812345678', 'Erongo', 'Swakopmund', 'Renewable Energy', 'Solar Power', 'Private Company', 8, 750000.00, '500001-1000000', '2019-06-20', 'Solar energy solutions for rural communities', 'active', 10),
('Kalahari Organic Farms', 'KOF', 'SME003', 'Anna Nghipondoka', 'F', 45, 'anna@kalahariorganic.com', '+264813456789', 'Omaheke', 'Gobabis', 'Agriculture', 'Crop Production', 'Partnership', 25, 1200000.00, '1000001-5000000', '2018-03-10', 'Organic farming and sustainable agriculture', 'active', 12),
('Windhoek Tech Hub', 'WTH', 'SME004', 'David Nujoma', 'M', 40, 'david@wdhtech.com', '+264814567890', 'Khomas', 'Windhoek', 'Information Technology', 'Software Development', 'Private Company', 12, 900000.00, '500001-1000000', '2021-09-05', 'Software development and IT services', 'active', 7),
('Coastal Fishing Enterprise', 'CFE', 'SME005', 'Sarah Amukoto', 'F', 48, 'sarah@coastalfish.com', '+264815678901', 'Erongo', 'Walvis Bay', 'Fisheries', 'Seafood Processing', 'Private Company', 30, 1500000.00, '1000001-5000000', '2017-11-12', 'Sustainable fishing and seafood processing', 'active', 15);

INSERT INTO investors (name, type, email, phone, region, investment_focus, min_investment, max_investment, sectors_of_interest) VALUES
('JESMIKE Investment Fund', 'institutional', 'info@jesmike.com', '+264816789012', 'Khomas', 'SME growth and development', 50000.00, 2000000.00, ARRAY['Technology', 'Agriculture', 'Manufacturing']),
('Namibia Development Corporation', 'government', 'ndc@gov.na', '+264817890123', 'Khomas', 'Economic development', 100000.00, 5000000.00, ARRAY['Agriculture', 'Energy', 'Manufacturing']),
('Private Equity Partners', 'institutional', 'contact@pep.na', '+264818901234', 'Khomas', 'High growth potential', 200000.00, 3000000.00, ARRAY['Technology', 'Energy', 'Services']);

INSERT INTO investment_deals (sme_id, investor_id, investment_amount, equity_percentage, deal_type, status, deal_date) VALUES
(1, 1, 150000.00, 15.0, 'equity', 'completed', '2023-06-15'),
(2, 2, 300000.00, 20.0, 'equity', 'completed', '2023-08-20'),
(3, 1, 250000.00, 12.0, 'equity', 'approved', '2023-10-10');

INSERT INTO investment_opportunities (sme_id, title, description, funding_required, equity_offered, use_of_funds, expected_roi, investment_timeline, status) VALUES
(1, 'Expansion to Northern Regions', 'Seeking funding to expand craft production to northern Namibia', 200000.00, 10.0, 'Equipment purchase and facility setup', 15.0, '12 months', 'open'),
(2, 'Solar Panel Manufacturing', 'Investment needed for solar panel manufacturing facility', 500000.00, 25.0, 'Manufacturing equipment and working capital', 20.0, '18 months', 'open'),
(3, 'Organic Certification Program', 'Funding for organic certification and export market entry', 100000.00, 8.0, 'Certification costs and marketing', 12.0, '6 months', 'open'),
(4, 'Tech Hub Expansion', 'Scaling software development services across SADC region', 300000.00, 15.0, 'Team expansion and infrastructure', 18.0, '24 months', 'open'),
(5, 'Cold Storage Facility', 'Investment in cold storage for seafood processing', 400000.00, 20.0, 'Cold storage equipment and facility', 16.0, '15 months', 'open');

-- Create indexes for better performance
CREATE INDEX idx_smes_region ON smes(region);
CREATE INDEX idx_smes_industry ON smes(industry_sector);
CREATE INDEX idx_smes_created_at ON smes(created_at);
CREATE INDEX idx_investment_deals_sme_id ON investment_deals(sme_id);
CREATE INDEX idx_investment_deals_investor_id ON investment_deals(investor_id);