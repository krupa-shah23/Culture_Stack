# HeyGen Avatar Integration Setup Guide

## Current Status
✅ Backend HeyGen token generation is working
⚠️ Avatar session creation needs proper avatar IDs

## How to Get Your Avatar IDs

1. **Go to HeyGen Dashboard:**
   - Visit https://www.heygen.com/
   - Log in with your account
   - Navigate to "Avatars" or "My Avatars"

2. **Find Available Avatars:**
   - Look for your custom avatars or available templates
   - Copy the avatar ID (usually looks like: `wayne_20240711_151645_utc` or `DEFAULT`)

3. **Update Your Config:**
   Edit `frontend/src/components/layout/PersonaAvatar.jsx` and update the `AVATAR_CONFIGS`:
   
   ```javascript
   const AVATAR_CONFIGS = {
     innovator: {
       avatarId: 'YOUR_AVATAR_ID_HERE',  // Replace with actual ID
       voiceId: 'default',
     },
     riskEvaluator: {
       avatarId: 'YOUR_AVATAR_ID_HERE',  // Replace with actual ID
       voiceId: 'default',
     },
     strategist: {
       avatarId: 'YOUR_AVATAR_ID_HERE',  // Replace with actual ID
       voiceId: 'default',
     },
   };
   ```

## Test the Integration

1. **Check Token Generation:**
   ```bash
   cd backend
   node test_heygen_token.js
   ```
   This should show: `✅ SUCCESS! Token generated`

2. **Check Avatar Session:**
   Once you have avatar IDs, the app should initialize correctly.

3. **Frontend Console:**
   Open browser DevTools (F12) → Console
   Look for logs like:
   - 🎬 Starting avatar initialization
   - 🔑 Requesting HeyGen streaming token
   - ✅ Avatar session created

## Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Invalid parameters | Check avatar ID is correct |
| 401 | Invalid token | Check API key in .env |
| 404 | Avatar not found | Use correct avatar ID from dashboard |
| 500 | Server error | Check backend logs |

## HeyGen API Key Security

⚠️ **IMPORTANT:** Your API key is in `.env` and should NOT be:
- Committed to git
- Exposed in frontend code
- Shared publicly

The current setup is correct - the key only lives on the backend.

## Troubleshooting

If you still get a 400 error:

1. Check the browser console for detailed errors
2. Run the backend test: `node test_heygen_token.js`
3. Verify your HeyGen account has streaming avatars enabled
4. Try a simple text in the feedback box to trigger avatar speech
5. Check that avatar ID is from your HeyGen dashboard, not a generic name

## File Locations

- Backend token controller: `backend/controllers/aiController.js`
- Frontend avatar component: `frontend/src/components/layout/PersonaAvatar.jsx`
- Backend test script: `backend/test_heygen_token.js`
- Configuration: `backend/.env`
