# 🚀 Deployment Guide - GitHub to Render

## Step 1: Prepare Your Files

✅ All files are ready! Just make sure:
- `config.js` has your Google Sheets ID and GIDs
- Your Google Sheet is set to "Anyone with link can view"

## Step 2: Push to GitHub

### If you don't have Git initialized:

```bash
# Navigate to your folder
cd "A:\WEB TEMP\My portfolio"

# Initialize Git
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - Wealth Engine Portfolio Tracker"

# Add your GitHub repository (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### If you already have a GitHub repo:

```bash
# Add all files
git add .

# Commit
git commit -m "Update portfolio tracker"

# Push
git push
```

## Step 3: Deploy on Render

1. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com
   - Sign up/Login with GitHub

2. **Create New Static Site:**
   - Click "New +" button
   - Select "Static Site"

3. **Connect Repository:**
   - Click "Connect GitHub"
   - Authorize Render
   - Select your repository

4. **Configure (Auto-detected from render.yaml):**
   - **Name:** Your app name
   - **Branch:** `main`
   - **Build Command:** (leave empty - no build needed)
   - **Publish Directory:** `.` (current directory)

5. **Deploy:**
   - Click "Create Static Site"
   - Wait 2-3 minutes for deployment
   - Your site will be live!

## Step 4: Access Your Site

Your site will be available at:
```
https://your-app-name.onrender.com
```

## 📋 Files to Push

**Push ALL these files:**
- ✅ All `.html` files
- ✅ All `.js` files
- ✅ All `.css` files
- ✅ `config.js`
- ✅ `render.yaml`
- ✅ `.gitignore`
- ✅ `README.md`

**Don't push:**
- ❌ `.DS_Store` (Mac)
- ❌ `Thumbs.db` (Windows)
- ❌ Editor config files (`.vscode/`, etc.)

## 🔧 After Deployment

1. **Test your site:**
   - Visit your Render URL
   - Check all pages work
   - Verify LTP data loads

2. **Update config.js if needed:**
   - Edit in GitHub
   - Render will auto-redeploy

3. **Custom Domain (Optional):**
   - In Render dashboard
   - Go to Settings → Custom Domain
   - Add your domain

## ⚠️ Important Notes

- **Google Sheets must be public** (Anyone with link can view)
- **CORS proxy is included** - works automatically when deployed
- **No server needed** - Render serves static files
- **Auto-deploy** - Every push to GitHub auto-deploys

## 🐛 Troubleshooting

**Data not loading?**
- Check Google Sheet is public
- Verify GIDs in `config.js` are correct
- Check browser console for errors

**Deployment failed?**
- Check `render.yaml` is correct
- Verify all files are in GitHub
- Check Render build logs

