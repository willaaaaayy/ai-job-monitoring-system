# GitHub Repository Setup Guide

This guide will help you set up the GitHub repository and push your code.

## Prerequisites

- GitHub account
- Git installed on your local machine
- SSH key configured with GitHub (recommended) or HTTPS access

## Step 1: Create Repository on GitHub

1. Go to [GitHub](https://github.com) and sign in
2. Click the **+** icon in the top right corner
3. Select **New repository**
4. Fill in the repository details:
   - **Repository name**: `ai-job-monitoring-system`
   - **Description**: `AI-powered Job Monitoring Service with multi-tenant SaaS architecture`
   - **Visibility**: Choose **Public** or **Private**
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **Create repository**

## Step 2: Add Remote and Push

After creating the repository, GitHub will show you commands. Use these commands:

### If using HTTPS:

```bash
# Add the remote repository
git remote add origin https://github.com/YOUR_USERNAME/ai-job-monitoring-system.git

# Rename branch to main (if not already)
git branch -M main

# Push to GitHub
git push -u origin main
```

### If using SSH:

```bash
# Add the remote repository
git remote add origin git@github.com:YOUR_USERNAME/ai-job-monitoring-system.git

# Rename branch to main (if not already)
git branch -M main

# Push to GitHub
git push -u origin main
```

**Replace `YOUR_USERNAME` with your GitHub username.**

## Step 3: Verify Push

1. Go to your repository on GitHub
2. Verify that all files are present
3. Check that the README displays correctly
4. Verify that the LICENSE file is visible

## Step 4: Configure GitHub Actions Secrets (Optional)

If you need to run CI/CD with secrets (e.g., for deployment), configure GitHub Secrets:

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add secrets as needed:
   - `DATABASE_URL` - Production database URL
   - `REDIS_URL` - Production Redis URL
   - `JWT_SECRET` - JWT secret key
   - `N8N_WEBHOOK_URL` - n8n webhook URL
   - `STRIPE_SECRET_KEY` - Stripe secret key (if using billing)
   - `SENTRY_DSN` - Sentry DSN (if using error tracking)

## Step 5: Enable GitHub Actions

GitHub Actions should be enabled by default. To verify:

1. Go to your repository on GitHub
2. Click the **Actions** tab
3. You should see the workflow file `.github/workflows/ci.yml`
4. After your first push, the workflow will run automatically

## Step 6: Configure Branch Protection (Recommended)

To protect your main branch:

1. Go to **Settings** → **Branches**
2. Click **Add rule** or **Edit** next to main branch
3. Configure:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - Select the CI workflow in required status checks

## Step 7: Add Repository Topics (Optional)

Add topics to help others discover your repository:

1. Go to your repository main page
2. Click the gear icon next to **About**
3. Add topics: `nodejs`, `typescript`, `express`, `postgresql`, `prisma`, `redis`, `nextjs`, `saas`, `job-monitoring`, `ai`

## Troubleshooting

### Authentication Issues

If you encounter authentication errors:

**For HTTPS:**
- Use a Personal Access Token instead of password
- Generate token: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
- Use token as password when pushing

**For SSH:**
- Ensure SSH key is added to GitHub: Settings → SSH and GPG keys
- Test connection: `ssh -T git@github.com`

### Large Files

If you have large files that shouldn't be committed:

1. Add them to `.gitignore`
2. Remove from git cache: `git rm --cached <file>`
3. Commit the change: `git commit -m "Remove large files"`

### Push Rejected

If push is rejected:

```bash
# Pull latest changes first
git pull origin main --rebase

# Then push again
git push origin main
```

## Next Steps

After setting up the repository:

1. ✅ Verify CI/CD is running (check Actions tab)
2. ✅ Add collaborators if needed (Settings → Collaborators)
3. ✅ Set up deployment (see [DEPLOYMENT.md](DEPLOYMENT.md))
4. ✅ Configure webhooks if needed
5. ✅ Add issue templates (optional)
6. ✅ Add pull request template (optional)

## Useful Commands

```bash
# Check remote configuration
git remote -v

# Update remote URL if needed
git remote set-url origin <new-url>

# View commit history
git log --oneline

# Create and switch to new branch
git checkout -b feature/new-feature

# Push new branch
git push -u origin feature/new-feature
```

## Support

If you encounter issues:

1. Check GitHub documentation: https://docs.github.com
2. Review Git documentation: https://git-scm.com/doc
3. Check repository issues (if any)

---

**Happy coding! 🚀**
