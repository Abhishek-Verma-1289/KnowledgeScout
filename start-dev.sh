#!/bin/bash

# KnowledgeScout Development Startup Script

echo "🚀 Starting KnowledgeScout Development Environment..."

# Check if dependencies are installed
echo "📦 Checking dependencies..."

if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Check for environment files
echo "⚙️ Checking environment configuration..."

if [ ! -f "backend/.env" ]; then
    echo "Creating backend .env file from example..."
    cp backend/.env.example backend/.env
    echo "⚠️ Please update backend/.env with your actual configuration!"
fi

if [ ! -f "frontend/.env" ]; then
    echo "Creating frontend .env file from example..."
    cp frontend/.env.example frontend/.env
fi

# Start services
echo "🔥 Starting development servers..."

# Start backend in background
echo "Starting backend server on port 8000..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "Starting frontend server on port 3000..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ KnowledgeScout is starting up!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Docs: See README.md"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for user to stop
wait $BACKEND_PID $FRONTEND_PID