# Vercel Serverless Deployment Guide

## 🔧 Fixes Applied

This deployment has been optimized for Vercel serverless functions to prevent MongoDB connection timeouts and crashes.

### Key Changes

1. **MongoDB Connection Caching**
   - Implemented singleton pattern with global caching
   - Prevents reconnection on every serverless invocation
   - Handles connection reuse across warm starts

2. **Serverless Entry Point**
   - Created dedicated `api/index.js` for serverless functions
   - Removed Socket.IO (not compatible with serverless)
   - Removed scheduler initialization (use Vercel Cron instead)
   - Ensures DB connection before each request

3. **Lazy Configuration Loading**
   - Config seeding now happens on first request, not startup
   - Prevents timeout issues during cold starts
   - Uses bulkWrite for better performance

4. **Optimized Vercel Configuration**
   - Updated `vercel.json` to use new entry point
   - Added 30s max duration for functions
   - Proper routing configuration

## 🚀 Deployment Steps

### 1. Verify Environment Variables in Vercel

Go to your Vercel project settings and ensure these variables are set:

```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your_jwt_secret
CLIENT_URL=https://your-frontend.vercel.app
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NODE_ENV=production
```

### 2. Configure MongoDB Atlas

**Allow Vercel IPs:**

1. Go to MongoDB Atlas → Network Access
2. Add IP Address: `0.0.0.0/0` (allows all IPs)
3. Or add specific Vercel IP ranges if preferred

**Verify Connection String:**
- Ensure `MONGO_URI` includes credentials
- Format: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority`

### 3. Deploy to Vercel

```bash
# Commit changes
git add .
git commit -m "Fix MongoDB serverless connection issues"

# Push to deploy
git push origin main
```

Vercel will automatically deploy from your repository.

### 4. Verify Deployment

After deployment, test the endpoints:

```bash
# Set your Vercel URL
export API_BASE_URL=https://your-app.vercel.app

# Run verification script
chmod +x verify_api.sh
./verify_api.sh
```

Or test manually:

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Test brands endpoint (was failing before)
curl https://your-app.vercel.app/api/brands

# Test categories
curl https://your-app.vercel.app/api/categories
```

## 📊 Expected Results

### Successful Response

```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-01-23T10:30:00.000Z"
}
```

### If Still Failing

Check Vercel deployment logs:

```bash
vercel logs
```

Common issues:
1. **MONGO_URI not set** → Add in Vercel Environment Variables
2. **IP not whitelisted** → Add 0.0.0.0/0 to MongoDB Atlas
3. **Wrong credentials** → Verify MongoDB username/password
4. **Network timeout** → Check MongoDB cluster is running

## 🔄 Socket.IO & Real-time Features

**Note:** Socket.IO is not compatible with Vercel serverless functions.

For real-time features (chat, notifications), consider:

1. **Separate WebSocket Server**: Deploy Socket.IO to Railway, Render, or Heroku
2. **Vercel + Pusher**: Use Pusher for real-time events
3. **Vercel + Ably**: Use Ably for WebSocket functionality
4. **Long Polling**: Implement polling-based updates as fallback

## 📝 Local Development

The original `src/index.js` still works for local development with Socket.IO:

```bash
# Local development (with Socket.IO)
npm start

# Test locally
./verify_api.sh
```

## 🏗️ Architecture

```
Vercel Request → api/index.js (serverless)
                    ↓
              Connect to MongoDB (cached)
                    ↓
              Express Routes
                    ↓
              Response
```

Each serverless invocation:
1. Checks for cached MongoDB connection
2. Reuses if available (warm start)
3. Creates new if needed (cold start)
4. Processes request
5. Returns response

## 🐛 Troubleshooting

### Error: "buffering timed out after 10000ms"

**Solution:** Connection caching now prevents this. If still occurring:
- Check MongoDB Atlas network access
- Verify MONGO_URI is correct
- Check Vercel logs for specific error

### Error: "MONGO_URI environment variable is not defined"

**Solution:** Add MONGO_URI to Vercel Environment Variables and redeploy.

### Error: 500 Internal Server Error

**Solution:** Check Vercel function logs for stack trace:
```bash
vercel logs --follow
```

## 📚 Additional Resources

- [Vercel Serverless Functions](https://vercel.com/docs/concepts/functions/serverless-functions)
- [MongoDB Atlas Vercel Integration](https://vercel.com/integrations/mongodbatlas)
- [Mongoose Serverless Best Practices](https://mongoosejs.com/docs/lambda.html)

---

**Last Updated:** January 23, 2026
**Status:** ✅ Deployment Ready
