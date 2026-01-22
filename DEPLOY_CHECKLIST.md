# 🚀 Quick Deployment Checklist

## Pre-Deployment

- [ ] MongoDB Atlas Network Access: Add `0.0.0.0/0`
- [ ] Verify `MONGO_URI` format: `mongodb+srv://user:pass@cluster.mongodb.net/db`
- [ ] All environment variables set in Vercel:
  - [ ] `MONGO_URI`
  - [ ] `JWT_SECRET`
  - [ ] `CLIENT_URL`
  - [ ] `CLOUDINARY_CLOUD_NAME`
  - [ ] `CLOUDINARY_API_KEY`
  - [ ] `CLOUDINARY_API_SECRET`

## Deploy

```bash
git add .
git commit -m "Fix: MongoDB serverless connection"
git push origin main
```

## Post-Deployment Verification

```bash
# Set your Vercel URL
export API_BASE_URL=https://your-app.vercel.app

# Run tests
chmod +x verify_api.sh
./verify_api.sh
```

## Quick Test

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Test brands (was failing)
curl https://your-app.vercel.app/api/brands
```

## If Issues Persist

```bash
# View logs
vercel logs --follow

# Common fixes:
# 1. Redeploy: vercel --prod
# 2. Check env vars: vercel env ls
# 3. Verify MongoDB: Check Atlas dashboard
```

## Success Indicators

✅ Health endpoint returns 200 with `"database": "connected"`  
✅ Brands endpoint returns data (not 500 error)  
✅ No "buffering timed out" errors in logs  
✅ Response time < 5 seconds on cold starts

---

**Need Help?** Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed guide.
