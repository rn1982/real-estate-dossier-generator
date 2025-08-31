# Story 2.3: Emergency Fix - Photos & Client-Side Fallback

## Status: IN PROGRESS

### Problem Statement
- PDFs were generating but photos were not displaying
- No fallback mechanism when server-side generation fails
- Layout issues with text overlap and formatting

### Implementation

#### ✅ Completed
1. **Photo Display Fix**
   - Convert File[] to base64 data URLs before sending to server
   - Fixed empty photo arrays being sent
   - Photos now appear in generated PDFs

2. **Client-Side Fallback**
   - Added automatic fallback for 500/504 errors
   - Implemented html2canvas/jsPDF fallback
   - Creates styled HTML template for client-side generation

#### ⚠️ Known Issues (To Fix)
1. **Text Overlap** - "Présentation du Bien" overlaps with price stats
2. **Price Format** - Shows EUR instead of CHF, wrong formatting
3. **Large File Size** - 12.8MB PDFs (photos not optimized)
4. **Missing Fields** - Agent name/phone not showing
5. **Date Issue** - Shows future dates

### Next Steps
1. Fix price formatting to use CHF with Swiss format
2. Optimize photo compression before sending
3. Fix template layout issues
4. Add missing field mappings

### Testing
- Test with real property data
- Verify photos display correctly
- Test fallback by forcing server timeout
- Check file sizes are reasonable (<5MB)

### Definition of Done
- [ ] Photos display in all PDFs
- [ ] Client-side fallback works reliably
- [ ] Price shows in CHF format
- [ ] File sizes optimized (<5MB)
- [ ] All fields display correctly
- [ ] No text overlap issues