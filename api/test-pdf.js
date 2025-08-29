import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let browser = null;
  
  try {
    console.log('Starting PDF test generation...');
    
    // Simple HTML content
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #333; }
          </style>
        </head>
        <body>
          <h1>Test PDF Generation</h1>
          <p>This is a test PDF generated on Vercel.</p>
          <p>Generated at: ${new Date().toISOString()}</p>
        </body>
      </html>
    `;

    // Launch browser
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    
    // Set content
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true
    });

    console.log('PDF generated, size:', pdfBuffer.length, 'bytes');

    // Close page
    await page.close();

    // Set headers and send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="test.pdf"');
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Test PDF generation failed:', error);
    res.status(500).json({ 
      error: 'PDF generation failed',
      details: error.message 
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export const config = {
  api: {
    responseLimit: false,
  }
};