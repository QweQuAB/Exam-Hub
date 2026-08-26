# Deployment Guide

## GitHub Pages Deployment

This project is automatically deployed to GitHub Pages on every push to the `main` branch.

### Live Site

**URL**: https://QweQuAB.github.io/Exam-Hub

### Deployment Process

1. **Automatic Deployment**
   - Every push to `main` triggers the GitHub Actions workflow
   - The workflow builds the project and deploys to GitHub Pages
   - Deployment completes in ~2-5 minutes

2. **Build Steps**
   - Install dependencies
   - Run TypeScript linter
   - Build with Vite
   - Upload artifacts to GitHub Pages
   - Deploy to the live site

### Manual Build

If you need to build locally:

```bash
# Install dependencies
npm install

# Build the project
npm run build

# The output will be in the 'dist' folder
ls dist/
```

### Workflow Status

Check deployment status:
1. Go to: https://github.com/QweQuAB/Exam-Hub/actions
2. Click on the latest workflow run
3. View build logs and deployment status

### Troubleshooting

**Deployment failed**
- Check the Actions tab for error logs
- Ensure all dependencies are correctly specified in `package.json`
- Verify the build command works locally: `npm run build`

**Site not updating**
- GitHub Pages may cache the site. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Clear browser cache or open in incognito mode

**Build errors**
- Check that all imports are correctly resolved
- Verify TypeScript types with: `npm run lint`
- Review the Actions workflow logs for specific error messages

### Environment Variables

For secrets needed during deployment:
1. Go to: https://github.com/QweQuAB/Exam-Hub/settings/secrets/actions
2. Add secrets that should not be in source control
3. Reference in workflow with: `${{ secrets.SECRET_NAME }}`

### Rolling Back

If a deployment causes issues:
1. Revert the problematic commit
2. Push to `main`
3. The deployment will automatically update with the previous version

```bash
git revert <commit-hash>
git push origin main
```

### Custom Domain

To use a custom domain:
1. Go to: https://github.com/QweQuAB/Exam-Hub/settings/pages
2. Add your domain under "Custom domain"
3. Update DNS records as instructed by GitHub

### Monitoring

- **Deployment Time**: Check Actions tab for workflow duration
- **Build Logs**: Available in Actions → Workflow run → Build and deploy step
- **Site Status**: Visit https://QweQuAB.github.io/Exam-Hub

---

For issues, check the [GitHub Issues](https://github.com/QweQuAB/Exam-Hub/issues) page.