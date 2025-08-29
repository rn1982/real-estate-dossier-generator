# 🔒 Security Checklist - MANDATORY BEFORE EVERY COMMIT

## ⚠️ CRITICAL: API Key Exposure Prevention

### Before EVERY Commit:

1. **Check ALL files for secrets:**
   ```bash
   # Run this command to search for potential API keys
   grep -r "AIzaSy\|re_[a-zA-Z0-9_]\|sk-[a-zA-Z0-9_]\|api[_-]?key" . --exclude-dir=node_modules --exclude-dir=.git
   ```

2. **Verify .env files are gitignored:**
   ```bash
   git status --ignored | grep -E "\.env"
   ```

3. **NEVER put real API keys in:**
   - `.env.example` files
   - `.env.local.example` files  
   - Documentation files
   - Test files
   - Comments in code
   - Commit messages

### Environment File Rules:

✅ **CORRECT:**
```env
# .env.example (committed to git)
API_KEY=your_api_key_here
SECRET_KEY=your_secret_key_here
```

❌ **WRONG - NEVER DO THIS:**
```env
# .env.example (committed to git)
API_KEY=AIzaSyCdNP-ATvy9DfHlzYiUvk8bwX2jkoYAL1Q  # EXPOSED!
SECRET_KEY=sk-ant-api03-xxxxx  # EXPOSED!
```

### Gitignore Configuration:

Your `.gitignore` MUST include:
```gitignore
# Environment variables - NEVER COMMIT THESE
.env
.env.*
!.env.example
*.env
```

### If You Accidentally Expose a Key:

1. **IMMEDIATELY rotate the exposed key** in the service dashboard
2. **Remove from repository:**
   ```bash
   git rm --cached filename
   git commit -m "Remove exposed credentials"
   ```
3. **Clean git history** (if already pushed):
   ```bash
   git filter-repo --path filename --invert-paths
   ```
4. **Force push** to remote (coordinate with team):
   ```bash
   git push --force-with-lease origin main
   ```

### Vercel Deployment Security:

- Add secrets via Vercel Dashboard, NOT in code
- Use Vercel CLI for local testing: `vercel env pull`
- Never log environment variables in production

### Pre-commit Hook (Recommended):

Add to `.git/hooks/pre-commit`:
```bash
#!/bin/bash
# Check for potential API keys
if git diff --cached --name-only | xargs grep -E "AIzaSy|re_[a-zA-Z0-9_]{20,}|sk-[a-zA-Z0-9_]{20,}" 2>/dev/null; then
    echo "❌ BLOCKED: Potential API key detected in commit!"
    echo "Remove the key and try again."
    exit 1
fi
```

### Team Guidelines:

1. **Code Reviews:** Always check for exposed secrets
2. **New Developers:** Review this checklist during onboarding
3. **Regular Audits:** Run security scans monthly
4. **Use Secret Managers:** Consider AWS Secrets Manager or similar for production

## Remember: One exposed key can compromise your entire application!

---
*Last Security Incident: 2025-08-29 - API keys exposed in .env.local.example*
*Keys Rotated: ✅ RESEND_API_KEY, ✅ GEMINI_API_KEY*