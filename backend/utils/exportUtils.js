const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

class ExportUtils {
  constructor(pool) {
    this.pool = pool;
  }

  async generateCSV() {
    try {
      const smeQuery = `
        SELECT 
          s.business_name,
          s.registration_number,
          s.owner_name,
          s.owner_gender,
          s.email,
          s.phone,
          s.region,
          s.city,
          s.industry_sector,
          s.employees,
          s.annual_turnover,
          s.established_date,
          s.status,
          s.created_at,
          COALESCE(i.name, 'No Investor') as investor_name,
          COALESCE(id.investment_amount, 0) as investment_received
        FROM smes s
        LEFT JOIN investment_deals id ON s.id = id.sme_id
        LEFT JOIN investors i ON id.investor_id = i.id
        ORDER BY s.created_at DESC
      `;
      
      const result = await this.pool.query(smeQuery);
      
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
        'Annual Turnover (NAD)',
        'Established Date',
        'Status',
        'Registration Date',
        'Investor',
        'Investment Received (NAD)'
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
          `"${row.status || ''}"`,
          row.created_at ? new Date(row.created_at).toLocaleDateString() : '',
          `"${row.investor_name || ''}"`,
          row.investment_received || 0
        ];
        csvContent += rowData.join(',') + '\n';
      });
      
      return csvContent;
    } catch (error) {
      throw new Error(`CSV generation failed: ${error.message}`);
    }
  }

  async generateExcel() {
    try {
      const workbook = new ExcelJS.Workbook();
      
      // SMEs worksheet
      const smeWorksheet = workbook.addWorksheet('SME Directory');
      
      const smeQuery = `
        SELECT 
          s.business_name,
          s.registration_number,
          s.owner_name,
          s.owner_gender,
          s.email,
          s.phone,
          s.region,
          s.city,
          s.industry_sector,
          s.employees,
          s.annual_turnover,
          s.established_date,
          s.status,
          s.created_at
        FROM smes s
        ORDER BY s.created_at DESC
      `;
      
      const smeResult = await this.pool.query(smeQuery);
      
      // Style the header
      const headerRow = smeWorksheet.addRow([
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
        'Annual Turnover (NAD)',
        'Established Date',
        'Status',
        'Registration Date'
      ]);
      
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF003580' }
      };
      headerRow.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      
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
          row.status,
          row.created_at
        ]);
      });
      
      // Auto-fit columns
      smeWorksheet.columns.forEach(column => {
        column.width = 15;
      });
      
      // Statistics worksheet
      const statsWorksheet = workbook.addWorksheet('Statistics Summary');
      
      // Get summary statistics
      const summaryQueries = await Promise.all([
        this.pool.query('SELECT COUNT(*) as count FROM smes'),
        this.pool.query('SELECT COUNT(*) as count FROM investors'),
        this.pool.query('SELECT COUNT(*) as count FROM investment_deals'),
        this.pool.query('SELECT SUM(employees) as total FROM smes'),
        this.pool.query('SELECT AVG(annual_turnover) as avg FROM smes WHERE annual_turnover > 0')
      ]);
      
      const [smeCount, investorCount, dealsCount, employmentTotal, avgTurnover] = summaryQueries;
      
      // Add summary section
      statsWorksheet.addRow(['SME Platform Statistics Summary']);
      statsWorksheet.addRow(['Generated on:', new Date().toLocaleDateString()]);
      statsWorksheet.addRow([]);
      
      const summaryHeaderRow = statsWorksheet.addRow(['Metric', 'Value']);
      summaryHeaderRow.font = { bold: true };
      
      statsWorksheet.addRow(['Total SMEs', smeCount.rows[0].count]);
      statsWorksheet.addRow(['Total Investors', investorCount.rows[0].count]);
      statsWorksheet.addRow(['Total Investment Deals', dealsCount.rows[0].count]);
      statsWorksheet.addRow(['Total Employment', employmentTotal.rows[0].total || 0]);
      statsWorksheet.addRow(['Average Annual Turnover (NAD)', Math.round(avgTurnover.rows[0].avg || 0)]);
      
      statsWorksheet.addRow([]);
      
      // Regional distribution
      const regionQuery = `
        SELECT region, COUNT(*) as smes, SUM(employees) as employment
        FROM smes
        GROUP BY region
        ORDER BY smes DESC
      `;
      
      const regionResult = await this.pool.query(regionQuery);
      
      const regionHeaderRow = statsWorksheet.addRow(['Regional Distribution']);
      regionHeaderRow.font = { bold: true };
      statsWorksheet.addRow(['Region', 'SMEs', 'Employment']);
      
      regionResult.rows.forEach(row => {
        statsWorksheet.addRow([row.region, row.smes, row.employment || 0]);
      });
      
      statsWorksheet.addRow([]);
      
      // Sector distribution
      const sectorQuery = `
        SELECT industry_sector, COUNT(*) as count, AVG(annual_turnover) as avg_turnover
        FROM smes
        GROUP BY industry_sector
        ORDER BY count DESC
      `;
      
      const sectorResult = await this.pool.query(sectorQuery);
      
      const sectorHeaderRow = statsWorksheet.addRow(['Industry Sector Distribution']);
      sectorHeaderRow.font = { bold: true };
      statsWorksheet.addRow(['Sector', 'SMEs', 'Avg Turnover (NAD)']);
      
      sectorResult.rows.forEach(row => {
        statsWorksheet.addRow([
          row.industry_sector, 
          row.count, 
          Math.round(row.avg_turnover || 0)
        ]);
      });
      
      // Auto-fit columns
      statsWorksheet.columns.forEach(column => {
        column.width = 20;
      });
      
      return workbook;
    } catch (error) {
      throw new Error(`Excel generation failed: ${error.message}`);
    }
  }

  async generatePDF() {
    try {
      const doc = new PDFDocument({ margin: 50 });
      
      // Title
      doc.fontSize(24).text('SME Platform Statistics Report', { align: 'center' });
      doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);
      
      // Get summary statistics
      const summaryQueries = await Promise.all([
        this.pool.query('SELECT COUNT(*) as count FROM smes'),
        this.pool.query('SELECT COUNT(*) as count FROM investors'),
        this.pool.query('SELECT COUNT(*) as count FROM investment_deals'),
        this.pool.query('SELECT SUM(employees) as total FROM smes'),
        this.pool.query('SELECT AVG(annual_turnover) as avg FROM smes WHERE annual_turnover > 0')
      ]);
      
      const [smeCount, investorCount, dealsCount, employmentTotal, avgTurnover] = summaryQueries;
      
      // Summary Statistics
      doc.fontSize(18).text('Summary Statistics', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12)
         .text(`Total SMEs: ${smeCount.rows[0].count}`)
         .text(`Total Investors: ${investorCount.rows[0].count}`)
         .text(`Total Investment Deals: ${dealsCount.rows[0].count}`)
         .text(`Total Employment: ${employmentTotal.rows[0].total || 0}`)
         .text(`Average Annual Turnover: NAD ${Math.round(avgTurnover.rows[0].avg || 0).toLocaleString()}`);
      
      doc.moveDown(2);
      
      // Regional Distribution
      const regionQuery = `
        SELECT region, COUNT(*) as smes, SUM(employees) as employment
        FROM smes
        GROUP BY region
        ORDER BY smes DESC
      `;
      
      const regionResult = await this.pool.query(regionQuery);
      
      doc.fontSize(18).text('Regional Distribution', { underline: true });
      doc.moveDown(0.5);
      
      regionResult.rows.forEach(row => {
        doc.fontSize(12).text(`${row.region}: ${row.smes} SMEs, ${row.employment || 0} employees`);
      });
      
      doc.moveDown(2);
      
      // Industry Sectors
      const sectorQuery = `
        SELECT industry_sector, COUNT(*) as count
        FROM smes
        GROUP BY industry_sector
        ORDER BY count DESC
      `;
      
      const sectorResult = await this.pool.query(sectorQuery);
      
      doc.fontSize(18).text('Industry Sectors', { underline: true });
      doc.moveDown(0.5);
      
      sectorResult.rows.forEach(row => {
        doc.fontSize(12).text(`${row.industry_sector}: ${row.count} SMEs`);
      });
      
      // Add footer
      doc.fontSize(10).text(
        'This report was generated by the SME Platform Statistics Dashboard',
        50,
        doc.page.height - 50,
        { align: 'center' }
      );
      
      return doc;
    } catch (error) {
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }
}

module.exports = ExportUtils;