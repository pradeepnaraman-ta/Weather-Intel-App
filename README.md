1. GitHub Connection (from Google AI Studio)
This application was originally generated using Google AI Studio App Build.
The source code was pushed directly to this GitHub repository using the built-in AI Studio GitHub connection feature, ensuring no source code needed to be downloaded locally for version control.
2. Cloudflare Pages Deployment
The app is deployed via Cloudflare Pages by directly linking this GitHub repository.
Build Settings Used:
Framework: Vite / React
Build Command: npm run build
Build Output Directory: dist
Routing Note: To prevent 404 errors on browser refresh (due to single-page app routing), a _redirects file containing /* /index.html 200 is utilized.
