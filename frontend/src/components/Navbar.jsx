import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // Check for stored user data
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    setUser(null);
    window.location.href = '/';
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-blue-600">
            KnowledgeScout
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-8">
            <Link
              to="/docs"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/docs')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
              }`}
            >
              Documents
            </Link>
            <Link
              to="/ask"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/ask')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
              }`}
            >
              Ask Questions
            </Link>
            {user && user.role === 'admin' && (
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/admin')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                Admin
              </Link>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Welcome, <span className="font-medium">{user.name}</span>
                  {user.role === 'admin' && (
                    <span className="ml-2 bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                      Admin
                    </span>
                  )}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-x-2">
                <button
                  onClick={() => {
                    // Simple login simulation for demo
                    const mockUser = {
                      id: 'demo-user',
                      name: 'Demo User',
                      email: 'demo@example.com',
                      role: 'admin'
                    };
                    localStorage.setItem('user', JSON.stringify(mockUser));
                    localStorage.setItem('authToken', 'demo-token');
                    setUser(mockUser);
                  }}
                  className="text-sm text-gray-700 hover:text-blue-600"
                >
                  Login (Demo)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu (simplified) */}
        <div className="md:hidden pb-4">
          <div className="flex flex-col space-y-2">
            <Link
              to="/docs"
              className={`block px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/docs')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Documents
            </Link>
            <Link
              to="/ask"
              className={`block px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/ask')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Ask Questions
            </Link>
            {user && user.role === 'admin' && (
              <Link
                to="/admin"
                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/admin')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Admin
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;