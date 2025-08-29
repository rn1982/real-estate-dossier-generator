# Epic 2 Setup Guide

## Overview
This guide provides step-by-step instructions for setting up Epic 2: AI Content Enrichment & Professional Dossier Generation.

## Prerequisites
- [x] Epic 1 completed and deployed
- [x] Node.js 20+ and npm 10+ installed
- [ ] Gemini API key obtained
- [ ] Vercel account with sufficient limits for PDF generation

## Environment Variables Setup

### Required Variables
```bash
# AI Service
GEMINI_API_KEY=your-gemini-api-key-here

# Email Service (existing)
RESEND_API_KEY=your-existing-resend-key

# Application
APP_URL=https://real-estate-dossier-generator.vercel.app
NODE_ENV=production

# Optional: External PDF Service (if needed)
PDF_SERVICE_API_KEY=your-pdf-service-key
```

### Local Development (.env.local)
```bash
# Create .env.local file
cp .env.example .env.local

# Add your keys
GEMINI_API_KEY=AIza...
RESEND_API_KEY=re_...
APP_URL=http://localhost:5173
```

### Vercel Production
```bash
# Add via Vercel CLI
vercel env add GEMINI_API_KEY production
vercel env add PDF_SERVICE_API_KEY production

# Or via Vercel Dashboard
# Settings > Environment Variables > Add New
```

## Step 1: AI Service Integration (Gemini 2.0 Flash)

### 1.1 Obtain Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Create new API key
3. Select "Gemini 2.0 Flash" model access
4. Copy the API key (starts with `AIza`)

### 1.2 Update Backend Integration
```bash
# The aiServiceGemini.js is already created
# Update the main dossier endpoint to use it

# Test the AI service
curl -X POST http://localhost:3000/api/test-ai \
  -H "Content-Type: application/json" \
  -d '{
    "propertyType": "Maison",
    "address": "123 Rue Test",
    "price": "500000",
    "targetBuyer": "jeune_famille"
  }'
```

### 1.3 Verify AI Integration
```javascript
// api/test-ai.js (temporary test endpoint)
import { generatePropertyContent } from './aiServiceGemini.js';

export default async function handler(req, res) {
  try {
    const content = await generatePropertyContent(req.body);
    res.status(200).json(content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

## Step 2: PDF Generation Setup

### 2.1 Option A: Puppeteer Setup (Recommended)

#### Install Dependencies
```bash
npm install puppeteer-core @sparticuz/chromium
```

#### Vercel Configuration
```json
// vercel.json - Update functions config
{
  "functions": {
    "api/dossier.js": {
      "maxDuration": 30,
      "memory": 1024
    },
    "api/generate-pdf.js": {
      "maxDuration": 30,
      "memory": 1024
    }
  }
}
```

#### Create PDF Generator
```javascript
// api/pdfGenerator.js
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export async function generatePDF(html) {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
  });

  await browser.close();
  return pdf;
}
```

### 2.2 Option B: React PDF Setup (Alternative)

#### Install Dependencies
```bash
npm install @react-pdf/renderer
```

#### Create React PDF Component
```javascript
// api/templates/PropertyDossierPDF.jsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30
  },
  title: {
    fontSize: 24,
    marginBottom: 10
  }
});

export const PropertyDossier = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View>
        <Text style={styles.title}>{data.propertyType}</Text>
        <Text>{data.address}</Text>
        <Text>{data.price}</Text>
      </View>
    </Page>
  </Document>
);
```

### 2.3 Option C: External Service Setup (Fallback)

#### Carbone.io Setup
```bash
# Install SDK
npm install carbone-sdk

# Configure
export CARBONE_API_KEY=your-key
```

#### PDFShift Setup
```javascript
// api/pdfshift.js
async function generateWithPDFShift(html) {
  const response = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(API_KEY + ':').toString('base64')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      source: html,
      landscape: false,
      format: 'A4'
    })
  });
  
  return await response.buffer();
}
```

## Step 3: HTML Template Creation

### 3.1 Create Template Structure
```bash
# Create template directory
mkdir -p api/templates

# Create main template
touch api/templates/dossierTemplate.js
touch api/templates/styles.css
```

### 3.2 Professional Template Design
```javascript
// api/templates/dossierTemplate.js
export function generateHTML(data) {
  const { propertyData, aiContent, images, agentInfo } = data;
  
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <style>
        ${getStyles()}
      </style>
    </head>
    <body>
      ${generateCoverPage(propertyData, images[0])}
      ${generateOverview(propertyData, aiContent)}
      ${generatePhotoGallery(images)}
      ${generateDetails(propertyData)}
      ${generateContact(agentInfo)}
    </body>
    </html>
  `;
}
```

## Step 4: Email Service Enhancement

### 4.1 Update Email Service
```javascript
// api/emailService.js - Add attachment support
import { readFile } from 'fs/promises';

export async function sendDossierEmail(data) {
  const pdfBuffer = await readFile(data.pdfPath);
  
  return await resend.emails.send({
    from: 'noreply@yourdomain.com',
    to: data.agentEmail,
    subject: `Dossier: ${data.propertyAddress}`,
    html: generateEmailHTML(data),
    attachments: [{
      filename: 'dossier.pdf',
      content: pdfBuffer.toString('base64'),
      encoding: 'base64'
    }]
  });
}
```

## Step 5: Integration Testing

### 5.1 Create Test Script
```javascript
// test/epic2-integration.test.js
import { generatePropertyContent } from '../api/aiServiceGemini.js';
import { generatePDF } from '../api/pdfGenerator.js';
import { sendDossierEmail } from '../api/emailService.js';

describe('Epic 2 Integration', () => {
  test('Full flow: AI → PDF → Email', async () => {
    // 1. Generate AI content
    const aiContent = await generatePropertyContent(testData);
    expect(aiContent.narrative).toBeDefined();
    
    // 2. Generate PDF
    const html = generateHTML({ ...testData, aiContent });
    const pdf = await generatePDF(html);
    expect(pdf.length).toBeGreaterThan(0);
    
    // 3. Send email
    const result = await sendDossierEmail({
      pdfBuffer: pdf,
      agentEmail: 'test@example.com',
      aiContent
    });
    expect(result.id).toBeDefined();
  });
});
```

### 5.2 Run Tests
```bash
# Unit tests
npm test

# Integration test
npm run test:integration

# Manual test
npm run dev
# Navigate to http://localhost:5173
# Submit form with test data
```

## Step 6: Deployment

### 6.1 Pre-deployment Checklist
- [ ] All environment variables set in Vercel
- [ ] PDF generation tested locally
- [ ] AI service responding correctly
- [ ] Email with attachments working
- [ ] Error handling implemented
- [ ] Rate limiting configured

### 6.2 Deploy to Vercel
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Check logs
vercel logs api/dossier.js
```

### 6.3 Post-deployment Verification
```bash
# Test health endpoint
curl https://your-app.vercel.app/api/health

# Test AI service
curl -X POST https://your-app.vercel.app/api/test-ai \
  -H "Content-Type: application/json" \
  -d '{"propertyType": "Test"}'

# Monitor errors
# Check Sentry dashboard for any errors
```

## Troubleshooting

### Common Issues

#### 1. Puppeteer Fails on Vercel
```json
// Increase function size and timeout
{
  "functions": {
    "api/generate-pdf.js": {
      "maxDuration": 60,
      "memory": 3008
    }
  }
}
```

#### 2. Gemini API Rate Limits
```javascript
// Implement exponential backoff
async function callWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
}
```

#### 3. PDF Too Large for Email
```javascript
// Compress PDF or use cloud storage
async function compressPDF(buffer) {
  // Use pdf-lib or similar to compress
  // Or upload to S3 and send link instead
}
```

## Monitoring & Metrics

### Key Metrics to Track
- AI generation time (target: < 3s)
- PDF generation time (target: < 5s)
- Email delivery rate (target: > 95%)
- Total request time (target: < 15s)
- Error rate (target: < 1%)

### Setup Monitoring
```javascript
// api/metrics.js
export function trackMetric(name, value, tags = {}) {
  // Send to monitoring service
  console.log(`METRIC: ${name}=${value}`, tags);
  
  // Example: Datadog, New Relic, or custom analytics
  if (process.env.MONITORING_ENABLED) {
    // Send metric to service
  }
}

// Usage
trackMetric('pdf_generation_time', 3500, { format: 'A4' });
```

## Next Steps

1. **Immediate Actions**
   - Add Gemini API key to environment
   - Test AI content generation
   - Choose PDF generation approach

2. **Short-term (Week 1)**
   - Complete PDF generation PoC
   - Update email service
   - Deploy to staging

3. **Medium-term (Week 2)**
   - Optimize performance
   - Add monitoring
   - Gather user feedback

4. **Long-term**
   - A/B test templates
   - Add multi-language support
   - Implement advanced features

## Support & Resources

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Puppeteer on Vercel Guide](https://vercel.com/guides/using-puppeteer-with-vercel)
- [React PDF Documentation](https://react-pdf.org/)
- [Resend Email API](https://resend.com/docs)

## Contact
For issues or questions about Epic 2 implementation:
- Create an issue in the repository
- Check existing documentation in `/docs`
- Review test files for examples