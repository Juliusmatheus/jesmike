const { Client } = require('pg');

async function main() {
  const client = new Client({
    user: process.env.DB_USER || 'jsmike',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
    port: Number(process.env.DB_PORT || 5432),
  });

  await client.connect();

  const email = 'admin@jesmike.com';
  const insertSql = `
    INSERT INTO smes (
      business_name,
      trading_name,
      registration_number,
      owner_name,
      email,
      region,
      city,
      industry_sector,
      employees,
      annual_turnover_range,
      business_type,
      owner_gender,
      owner_age,
      owner_address,
      nationality,
      years_experience,
      status,
      documents_count,
      created_at,
      updated_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
    )
    ON CONFLICT (email) DO NOTHING
  `;

  const values = [
    'Admin Account',
    'Admin',
    'ADMIN-000',
    'System Admin',
    email,
    'Namibia',
    'Windhoek',
    'Information Technology',
    0,
    '0-0',
    'Private Company',
    'O',
    40,
    '',
    'Namibia',
    0,
    'active',
    0,
  ];

  await client.query(insertSql, values);
  const res = await client.query('SELECT id, email, status FROM smes WHERE email = $1', [email]);
  console.log('admin user:', res.rows[0]);

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


