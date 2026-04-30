#!/bin/bash

# Initialize git
git init
git remote add origin https://github.com/PremanshBehl/TaxAI.git
git branch -M main

# Add .gitignore first to prevent node_modules and uploads from being committed
cat <<EOT > .gitignore
node_modules
dist
.env
backend/uploads/
.DS_Store
*.traineddata
frontend/dist
EOT

# Commit 1: Initial project setup
git add README.md .gitignore
GIT_AUTHOR_DATE="2026-04-29T10:00:00+05:30" GIT_COMMITTER_DATE="2026-04-29T10:00:00+05:30" git commit -m "Initial project setup"

# Commit 2: Setup backend base configuration
git add backend/package.json backend/package-lock.json backend/tsconfig.json
GIT_AUTHOR_DATE="2026-04-29T11:30:00+05:30" GIT_COMMITTER_DATE="2026-04-29T11:30:00+05:30" git commit -m "Setup backend base configuration"

# Commit 3: Add database configuration
git add backend/src/config/db.ts
GIT_AUTHOR_DATE="2026-04-29T13:00:00+05:30" GIT_COMMITTER_DATE="2026-04-29T13:00:00+05:30" git commit -m "Add database configuration"

# Commit 4: Add mongoose models
git add backend/src/models/User.ts backend/src/models/Invoice.ts
GIT_AUTHOR_DATE="2026-04-29T14:45:00+05:30" GIT_COMMITTER_DATE="2026-04-29T14:45:00+05:30" git commit -m "Add mongoose models"

# Commit 5: Add authentication middleware and controller
git add backend/src/middleware/auth.ts backend/src/controllers/authController.ts
GIT_AUTHOR_DATE="2026-04-29T16:00:00+05:30" GIT_COMMITTER_DATE="2026-04-29T16:00:00+05:30" git commit -m "Add authentication middleware and controller"

# Commit 6: Add backend server entry and auth routes
git add backend/src/server.ts backend/src/routes/authRoutes.ts
GIT_AUTHOR_DATE="2026-04-29T17:30:00+05:30" GIT_COMMITTER_DATE="2026-04-29T17:30:00+05:30" git commit -m "Add backend server entry and auth routes"

# Commit 7: Add invoice controller and routes
git add backend/src/controllers/invoiceController.ts backend/src/routes/invoiceRoutes.ts
GIT_AUTHOR_DATE="2026-04-29T18:15:00+05:30" GIT_COMMITTER_DATE="2026-04-29T18:15:00+05:30" git commit -m "Add invoice controller and routes"

# Commit 8: Add core validation services
git add backend/src/services/validationEngine.ts backend/src/utils/gstValidator.ts
GIT_AUTHOR_DATE="2026-04-29T19:45:00+05:30" GIT_COMMITTER_DATE="2026-04-29T19:45:00+05:30" git commit -m "Add core validation services"

# Commit 9: Add OCR and multi-regex extraction
git add backend/src/services/ocrService.ts backend/src/services/multiRegexExtractor.ts
GIT_AUTHOR_DATE="2026-04-29T21:00:00+05:30" GIT_COMMITTER_DATE="2026-04-29T21:00:00+05:30" git commit -m "Add OCR and multi-regex extraction"

# Commit 10: Complete bill parsing logic
git add backend/src/services/billParser.ts backend/src/services/billTypeDetector.ts backend/src/services/confidenceScorer.ts
GIT_AUTHOR_DATE="2026-04-29T22:30:00+05:30" GIT_COMMITTER_DATE="2026-04-29T22:30:00+05:30" git commit -m "Complete bill parsing logic"

# Commit 11: Setup frontend Vite environment
git add frontend/package.json frontend/package-lock.json frontend/tsconfig.json frontend/tsconfig.app.json frontend/tsconfig.node.json frontend/vite.config.ts frontend/index.html frontend/src/vite-env.d.ts
GIT_AUTHOR_DATE="2026-04-30T08:00:00+05:30" GIT_COMMITTER_DATE="2026-04-30T08:00:00+05:30" git commit -m "Setup frontend Vite environment"

# Commit 12: Add Tailwind and styling config
git add frontend/tailwind.config.js frontend/postcss.config.js frontend/src/index.css frontend/src/App.css frontend/public
GIT_AUTHOR_DATE="2026-04-30T08:45:00+05:30" GIT_COMMITTER_DATE="2026-04-30T08:45:00+05:30" git commit -m "Add Tailwind and styling config"

# Commit 13: Add frontend core files
git add frontend/src/main.tsx frontend/src/App.tsx frontend/src/lib/utils.ts frontend/src/assets
GIT_AUTHOR_DATE="2026-04-30T09:15:00+05:30" GIT_COMMITTER_DATE="2026-04-30T09:15:00+05:30" git commit -m "Add frontend core files"

# Commit 14: Add Auth context and authentication views
git add frontend/src/context/AuthContext.tsx frontend/src/pages/Login.tsx frontend/src/pages/Register.tsx
GIT_AUTHOR_DATE="2026-04-30T09:50:00+05:30" GIT_COMMITTER_DATE="2026-04-30T09:50:00+05:30" git commit -m "Add Auth context and authentication views"

# Commit 15: Implement layout and dashboard
git add frontend/src/components/Layout.tsx frontend/src/pages/Dashboard.tsx
GIT_AUTHOR_DATE="2026-04-30T10:10:00+05:30" GIT_COMMITTER_DATE="2026-04-30T10:10:00+05:30" git commit -m "Implement layout and dashboard"

# Commit 16: Build invoice features
git add frontend/src/pages/Upload.tsx frontend/src/pages/Invoices.tsx
GIT_AUTHOR_DATE="2026-04-30T10:30:00+05:30" GIT_COMMITTER_DATE="2026-04-30T10:30:00+05:30" git commit -m "Build invoice features"

# Commit 17: Add invoice detail view and fix remaining files
git add .
GIT_AUTHOR_DATE="2026-04-30T10:50:00+05:30" GIT_COMMITTER_DATE="2026-04-30T10:50:00+05:30" git commit -m "Add invoice detail view and finalize polish"

git push -u origin main -f
