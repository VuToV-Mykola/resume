# 🚀 Deployment Guide

This guide explains how to deploy the Bewerbung Document Generator to GitHub Pages.

## 📋 Prerequisites

- GitHub account
- Git installed on your local machine
- Basic knowledge of Git commands

## 🛠️ Deployment Steps

### 1. Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click "New repository" or the "+" icon
3. Repository name: `bewerbung-stationsservice` (or your preferred name)
4. Description: "Professional job application document generator"
5. Set to **Public** (required for free GitHub Pages)
6. **Do NOT** initialize with README, .gitignore, or license
7. Click "Create repository"

### 2. Upload Your Code

```bash
# Navigate to your project directory
cd /path/to/bewerbung-stationsservice

# Initialize Git repository
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit: Mobile-optimized job application generator"

# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/bewerbung-stationsservice.git

# Push to GitHub
git push -u origin main
```

### 3. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on **Settings** tab
3. Scroll down to **Pages** section
4. Under **Source**, select **Deploy from a branch**
5. Choose **main** branch
6. Select **/ (root)** folder
7. Click **Save**

### 4. Access Your Site

- Your site will be available at: `https://YOUR_USERNAME.github.io/bewerbung-stationsservice`
- It may take a few minutes for the first deployment
- Future pushes to main branch will automatically update the site

## 🔧 Local Development

### Using Python Server

```bash
# Navigate to project directory
cd bewerbung-stationsservice

# Start Python server
python3 serve.py
# or
python serve.py
```

### Using Node.js Server

```bash
# Install dependencies
npm install

# Start development server
npm start
```

### Using Any HTTP Server

```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (if you have http-server installed)
npx http-server

# PHP
php -S localhost:8000
```

## 📱 Testing Mobile Responsiveness

1. Open your site in a web browser
2. Press **F12** to open Developer Tools
3. Click the **Device Toggle** icon (📱)
4. Test different device sizes:
   - iPhone SE (375x667)
   - iPhone 12 Pro (390x844)
   - iPad (768x1024)
   - Galaxy S20 (360x800)

## 🎯 Custom Domain (Optional)

If you have a custom domain:

1. Create a `CNAME` file in your repository root:
   ```
   yourdomain.com
   ```

2. Update your domain's DNS settings:
   - Add CNAME record: `www` → `YOUR_USERNAME.github.io`
   - Add A record: `@` → GitHub Pages IP addresses

3. Update the workflow file `.github/workflows/deploy.yml`:
   ```yaml
   cname: yourdomain.com
   ```

## 🔄 Automatic Deployment

The repository includes GitHub Actions workflow that automatically deploys when you push to the main branch:

- **File**: `.github/workflows/deploy.yml`
- **Trigger**: Push to main branch
- **Action**: Deploys to GitHub Pages automatically

## 🐛 Troubleshooting

### Common Issues

1. **Site not loading**:
   - Check if GitHub Pages is enabled
   - Verify the repository is public
   - Wait a few minutes for deployment

2. **404 errors**:
   - Ensure `index.html` is in the root directory
   - Check file paths are correct

3. **Mobile issues**:
   - Test in different browsers
   - Check viewport meta tag is present
   - Verify CSS media queries

4. **JavaScript errors**:
   - Open browser console (F12)
   - Check for CORS or path issues
   - Ensure all files are uploaded

### Debug Steps

1. **Check GitHub Pages status**:
   - Go to Settings → Pages
   - Look for deployment status

2. **Verify file structure**:
   ```
   bewerbung-stationsservice/
   ├── index.html
   ├── config.js
   ├── utils.js
   ├── locales/
   ├── data/
   └── templates/
   ```

3. **Test locally first**:
   ```bash
   python3 serve.py
   ```

## 📊 Performance Tips

- **Optimize images**: Use WebP format when possible
- **Minify CSS/JS**: For production deployment
- **Enable compression**: GitHub Pages handles this automatically
- **Use CDN**: For external resources if needed

## 🔒 Security Considerations

- **No sensitive data**: Don't store personal information in the repository
- **HTTPS only**: GitHub Pages provides SSL certificates
- **Content Security Policy**: Consider adding CSP headers

## 📈 Analytics (Optional)

To track usage:

1. Add Google Analytics to `index.html`:
   ```html
   <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
   ```

2. Or use GitHub's built-in traffic analytics in repository Insights

## 🎉 Success!

Once deployed, your job application generator will be:
- ✅ Accessible worldwide
- ✅ Mobile-optimized
- ✅ Multi-language support
- ✅ Professional appearance
- ✅ Free hosting

**Your site URL**: `https://YOUR_USERNAME.github.io/bewerbung-stationsservice`

---

Need help? Check the [GitHub Pages documentation](https://docs.github.com/en/pages) or create an issue in the repository.
