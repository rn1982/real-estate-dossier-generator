import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let browser = null;
  
  try {
    console.log('Starting PDF base64 test generation...');
    
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
          <h1>Test PDF Generation (Base64)</h1>
          <p>This is a test PDF generated on Vercel using base64 encoding.</p>
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

    // Convert to base64
    const base64 = pdfBuffer.toString('base64');
    
    // Send as data URL that can be directly opened
    const dataUrl = `data:application/pdf;base64,${base64}`;
    
    res.status(200).json({
      success: true,
      pdfBase64: base64,
      pdfDataUrl: dataUrl,
      size: pdfBuffer.length,
      timestamp: new Date().toISOString()
    });

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
    responseLimit: '10mb',
  }
};