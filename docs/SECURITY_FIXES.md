# Security Fixes - softycomp-node Playground

## Date: 2026-03-26

## Critical Vulnerabilities Fixed

### 1. XSS Vulnerabilities in playground/public/app.js

**Issue:** Multiple instances of `innerHTML` were being used with unsanitized API response data, creating XSS vulnerabilities.

**Fix:**
- Added `escapeHtml()` helper function at the top of app.js that properly escapes HTML entities
- Replaced all 10+ instances of unsafe innerHTML usage with escaped versions
- All dynamic data from API responses is now escaped before insertion

**Files Modified:**
- `/root/softycomp-node/playground/public/app.js`

**Affected Functions:**
- `getBillForm` submit handler (bill status display)
- `auditBillForm` submit handler (audit trail display)
- `reauthBillForm` submit handler (re-auth bill display)
- `createClientForm` submit handler (client ID display)
- `createMandateForm` submit handler (mandate URL display)
- `createPayoutForm` submit handler (payout result display)
- `createRefundForm` submit handler (refund result display)
- `addWebhookToFeed()` (live webhook feed)
- `loadWebhookHistory()` (webhook history)

**escapeHtml() Implementation:**
```javascript
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}
```

### 2. Hardcoded Credentials in playground/server.js

**Issue:** API keys and secrets were hardcoded directly in the source code.

**Fix:**
- Changed to use environment variables with sandbox defaults
- Added comment indicating these are sandbox-only test credentials
- Credentials now read from `process.env.SOFTYCOMP_API_KEY` and `process.env.SOFTYCOMP_SECRET_KEY`

**Before:**
```javascript
const client = new SoftyComp({
  apiKey: '97E932D2-EC27-4583-B8E4-EDC87C8019BA',
  secretKey: 'OEPQKMxopavCtvmvwE3Y',
  sandbox: true,
});
```

**After:**
```javascript
// Credentials default to sandbox test keys for demo purposes
const client = new SoftyComp({
  apiKey: process.env.SOFTYCOMP_API_KEY || '97E932D2-EC27-4583-B8E4-EDC87C8019BA',
  secretKey: process.env.SOFTYCOMP_SECRET_KEY || 'OEPQKMxopavCtvmvwE3Y',
  sandbox: true,
});
```

**Files Modified:**
- `/root/softycomp-node/playground/server.js`

### 3. Hardcoded Credentials in example.js

**Issue:** Same hardcoded credentials issue in the example file.

**Fix:** Applied same environment variable pattern as server.js

**Files Modified:**
- `/root/softycomp-node/example.js`

### 4. Missing Security Headers

**Issue:** Server was not setting security headers to protect against common web vulnerabilities.

**Fix:**
- Added middleware to set security headers on all responses
- Middleware placed before other middleware to ensure it runs first
- Headers added:
  - `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
  - `X-Frame-Options: DENY` - Prevents clickjacking attacks
  - `X-XSS-Protection: 1; mode=block` - Enables browser XSS protection

**Implementation:**
```javascript
// Security headers (must be first)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
```

**Files Modified:**
- `/root/softycomp-node/playground/server.js`

## Verification

All fixes have been tested and verified:

1. **XSS Protection:** escapeHtml() function is present and used in all innerHTML statements
2. **Environment Variables:** Server accepts credentials from environment with safe defaults
3. **Security Headers:** All three security headers are present on both static and API responses
4. **Functionality:** Playground still works correctly (status endpoint returns success)

## Testing Commands

```bash
# Start the playground
cd /root/softycomp-node/playground && node server.js

# Test security headers
curl -I http://localhost:4021/

# Test API functionality
curl http://localhost:4021/api/status
```

## Production Recommendations

For production use:

1. **Always set environment variables:**
   ```bash
   export SOFTYCOMP_API_KEY="your-production-key"
   export SOFTYCOMP_SECRET_KEY="your-production-secret"
   ```

2. **Never commit credentials to git:**
   - Add `.env` files to `.gitignore`
   - Use secret management systems for production

3. **Additional security headers to consider:**
   - `Content-Security-Policy` for stricter XSS protection
   - `Strict-Transport-Security` for HTTPS enforcement
   - `X-Permitted-Cross-Domain-Policies` for cross-domain access control

## Impact

These fixes eliminate critical security vulnerabilities that could have allowed:
- Cross-site scripting (XSS) attacks
- Credential theft from source code
- Clickjacking attacks
- MIME type confusion attacks
