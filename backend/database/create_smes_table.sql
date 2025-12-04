-- Create SMEs table for jsmike database
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_smes_region ON smes(region);
CREATE INDEX IF NOT EXISTS idx_smes_industry ON smes(industry_sector);
CREATE INDEX IF NOT EXISTS idx_smes_created_at ON smes(created_at);

-- Insert sample data
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
('Coastal Fishing Enterprise', 'CFE', 'SME005', 'Sarah Amukoto', 'F', 48, 'sarah@coastalfish.com', '+264815678901', 'Erongo', 'Walvis Bay', 'Fisheries', 'Seafood Processing', 'Private Company', 30, 1500000.00, '1000001-5000000', '2017-11-12', 'Sustainable fishing and seafood processing', 'active', 15)
ON CONFLICT (email) DO NOTHING;