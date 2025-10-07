# KnowledgeScout Development Startup Script (Windows)

Write-Host "🚀 Starting KnowledgeScout Development Environment..." -ForegroundColor Green

# Check if dependencies are installed
Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow

if (!(Test-Path "backend/node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Blue
    Set-Location backend
    npm install
    Set-Location ..
}

if (!(Test-Path "frontend/node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Blue
    Set-Location frontend
    npm install
    Set-Location ..
}

# Check for environment files
Write-Host "⚙️ Checking environment configuration..." -ForegroundColor Yellow

if (!(Test-Path "backend/.env")) {
    Write-Host "Creating backend .env file from example..." -ForegroundColor Blue
    Copy-Item "backend/.env.example" "backend/.env"
    Write-Host "⚠️ Please update backend/.env with your actual configuration!" -ForegroundColor Red
}

if (!(Test-Path "frontend/.env")) {
    Write-Host "Creating frontend .env file from example..." -ForegroundColor Blue
    Copy-Item "frontend/.env.example" "frontend/.env"
}

Write-Host ""
Write-Host "✅ Dependencies and configuration ready!" -ForegroundColor Green
Write-Host ""
Write-Host "🔥 To start development servers:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Terminal 1 (Backend):" -ForegroundColor Cyan
Write-Host "cd backend" -ForegroundColor White
Write-Host "npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 2 (Frontend):" -ForegroundColor Cyan  
Write-Host "cd frontend" -ForegroundColor White
Write-Host "npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "🔧 Backend API: http://localhost:8000" -ForegroundColor Green
Write-Host "📚 API Docs: See README.md" -ForegroundColor Green
Write-Host ""