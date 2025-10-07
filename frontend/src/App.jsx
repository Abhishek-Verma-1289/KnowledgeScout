import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import DocsPage from './pages/DocsPage';
import AskPage from './pages/AskPage';
import AdminPage from './pages/AdminPage';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/ask" element={<AskPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

// Simple Home Page
const HomePage = () => (
  <div className="container mx-auto px-4 py-16 text-center">
    <h1 className="text-5xl font-bold text-gray-900 mb-6">KnowledgeScout</h1>
    <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
      Upload your documents, ask questions, and get intelligent answers with source references.
    </p>
    <div className="space-x-4">
      <Link
        to="/docs"
        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
      >
        Manage Documents
      </Link>
      <Link
        to="/ask"
        className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
      >
        Ask Questions
      </Link>
    </div>
  </div>
);

// Simple 404 Page
const NotFoundPage = () => (
  <div className="container mx-auto px-4 py-16 text-center">
    <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
    <p className="text-lg text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
    <Link
      to="/"
      className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
    >
      Go Home
    </Link>
  </div>
);

export default App;