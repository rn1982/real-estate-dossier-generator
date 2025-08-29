# PDF Generation Candidates Research

## Executive Summary

This document evaluates three PDF generation approaches for the Real Estate Dossier Generator project. Each approach has been researched based on Vercel deployment compatibility, French language support, performance characteristics, and cost considerations.

## 1. Puppeteer with @sparticuz/chromium

### Overview
Server-side Chrome automation that renders HTML/CSS to PDF with full browser capabilities.

### Pros
- **Full CSS Support**: Complete CSS3 support including flexbox, grid, custom fonts
- **Pixel-Perfect Rendering**: What you see in browser is what you get in PDF
- **French Language**: Native support for French characters and typography
- **Dynamic Content**: Can execute JavaScript for charts/visualizations
- **Image Handling**: Excellent support for all image formats
- **Free**: No per-document costs

### Cons
- **Resource Intensive**: Requires 1024MB+ memory on Vercel
- **Cold Start Penalty**: 3-5 second initialization on first request
- **Bundle Size**: Adds ~50MB to deployment size
- **Complexity**: Requires careful configuration for serverless
- **Timeout Risk**: May approach Vercel's 30s limit for complex documents

### Implementation Requirements
```javascript
// Dependencies
npm install puppeteer-core @sparticuz/chromium

// Vercel config needed
{
  "functions": {
    "api/generate-pdf.js": {
      "maxDuration": 30,
      "memory": 1024
    }
  }
}
```

### Performance Estimates
- First request: 5-8 seconds
- Subsequent requests: 2-4 seconds
- Memory usage: 800-1000MB

## 2. React PDF (@react-pdf/renderer)

### Overview
Pure Node.js PDF generation using React components, no browser required.

### Pros
- **Lightweight**: ~5MB bundle size
- **Fast**: 1-2 second generation time
- **Low Memory**: Works with 512MB
- **Serverless Friendly**: No browser dependencies
- **React Integration**: Natural for React developers
- **Free**: No per-document costs

### Cons
- **Limited CSS**: No grid, limited flexbox, custom styling system
- **No JavaScript**: Static rendering only
- **Font Limitations**: Requires font embedding
- **Learning Curve**: Custom component API
- **Layout Challenges**: Complex layouts require workarounds

### Implementation Requirements
```javascript
// Dependencies
npm install @react-pdf/renderer

// No special Vercel config needed
// Works with default function settings
```

### Performance Estimates
- Generation time: 1-2 seconds
- Memory usage: 200-400MB
- No cold start penalty

## 3. External Service (PDFShift)

### Overview
Cloud-based HTML to PDF conversion service with REST API.

### Pros
- **Zero Infrastructure**: No server resources needed
- **Professional Quality**: Enterprise-grade rendering
- **Fast**: Sub-second API response
- **Scalable**: Handles any volume
- **CSS Support**: Full modern CSS support
- **Reliable**: 99.9% uptime SLA

### Cons
- **Cost**: $0.01-0.05 per document
- **External Dependency**: Requires internet connection
- **Data Privacy**: Documents processed externally
- **API Limits**: Rate limiting on lower tiers
- **Vendor Lock-in**: Migration requires code changes

### Implementation Requirements
```javascript
// No npm dependencies needed
// Simple HTTP POST to API

const response = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${Buffer.from(API_KEY + ':').toString('base64')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    source: htmlContent,
    landscape: false,
    format: 'A4'
  })
});
```

### Performance Estimates
- API response: 500ms-1s
- No memory requirements
- Cost: ~$50/month for 1000 documents

## Comparison Matrix

| Criteria | Puppeteer | React PDF | PDFShift |
|----------|-----------|-----------|----------|
| **Setup Complexity** | High | Medium | Low |
| **CSS Support** | Full | Limited | Full |
| **Generation Speed** | 2-8s | 1-2s | <1s |
| **Memory Usage** | 1024MB | 512MB | 0MB |
| **Cost per Document** | $0 | $0 | $0.01-0.05 |
| **French Support** | Excellent | Good | Excellent |
| **Image Support** | Excellent | Good | Excellent |
| **Scalability** | Limited | Good | Excellent |
| **Offline Capable** | Yes | Yes | No |
| **Maintenance** | High | Medium | Low |

## Recommendations by Use Case

### For This Project (Real Estate Dossier)
**Recommended: Puppeteer with @sparticuz/chromium**

Reasons:
1. Full design flexibility needed for professional property dossiers
2. Zero per-document costs important for MVP
3. Complete French language and typography support
4. Can handle property images and layouts perfectly
5. Vercel's infrastructure can support the requirements

### Alternative Scenarios

**Choose React PDF if:**
- Simple document layouts
- Strict performance requirements (<2s)
- Limited server resources
- Already using React components

**Choose PDFShift if:**
- High volume (>10,000/month)
- Enterprise requirements
- Zero maintenance desired
- Budget available for per-document costs

## Risk Analysis

### Puppeteer Risks
- **Mitigation**: Implement caching to reduce regeneration
- **Mitigation**: Use CDN for static assets
- **Mitigation**: Monitor memory usage and optimize

### React PDF Risks
- **Mitigation**: Design within CSS limitations
- **Mitigation**: Test French character rendering early
- **Mitigation**: Plan for layout compromises

### PDFShift Risks
- **Mitigation**: Implement retry logic
- **Mitigation**: Cache generated PDFs
- **Mitigation**: Have fallback option ready

## Next Steps

1. Implement Puppeteer PoC first (recommended approach)
2. Create HTML template with real property data
3. Test French content and image handling
4. Measure actual performance metrics
5. Implement fallback to React PDF if needed

## References

- [Puppeteer on Vercel Guide](https://vercel.com/guides/using-puppeteer-with-vercel)
- [@sparticuz/chromium Documentation](https://github.com/Sparticuz/chromium)
- [React PDF Documentation](https://react-pdf.org/)
- [PDFShift API Documentation](https://pdfshift.io/documentation)