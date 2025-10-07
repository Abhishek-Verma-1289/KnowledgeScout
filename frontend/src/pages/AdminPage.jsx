import React, { useState, useEffect } from 'react';
import { adminAPI, indexAPI } from '../api/apiCalls';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [indexStats, setIndexStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch dashboard data
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [dashResponse, indexResponse] = await Promise.all([
        adminAPI.getDashboard(),
        indexAPI.getStats(),
      ]);

      if (dashResponse.data.success) {
        setDashboardData(dashResponse.data.data);
      }

      if (indexResponse.data.success) {
        setIndexStats(indexResponse.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
      alert('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers({ limit: 50 });
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      alert('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Fetch documents
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllDocuments({ limit: 50 });
      if (response.data.success) {
        setDocuments(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      alert('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  // Rebuild index
  const handleRebuildIndex = async () => {
    if (!window.confirm('This will rebuild the entire search index. Continue?')) return;

    try {
      const response = await indexAPI.rebuildIndex();
      if (response.data.success) {
        alert('Index rebuild started successfully!');
        fetchDashboard(); // Refresh stats
      }
    } catch (error) {
      console.error('Failed to rebuild index:', error);
      alert('Failed to start index rebuild');
    }
  };

  // Clear cache
  const handleClearCache = async () => {
    if (!window.confirm('This will clear all cached data. Continue?')) return;

    try {
      const response = await indexAPI.clearCache();
      if (response.data.success) {
        alert(`Cache cleared! ${response.data.data.clearedEntries} entries removed.`);
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
      alert('Failed to clear cache');
    }
  };

  // Update user role
  const handleUpdateUser = async (userId, newRole) => {
    try {
      const response = await adminAPI.updateUser(userId, { role: newRole });
      if (response.data.success) {
        alert('User updated successfully!');
        fetchUsers(); // Refresh list
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Failed to update user');
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('This will permanently delete the user and all their documents. Continue?')) return;

    try {
      await adminAPI.deleteUser(userId);
      alert('User deleted successfully!');
      fetchUsers(); // Refresh list
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboard();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'documents') {
      fetchDocuments();
    }
  }, [activeTab]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'users', label: 'Users' },
    { id: 'documents', label: 'Documents' },
    { id: 'index', label: 'Index Management' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && (
        <div>
          {loading ? (
            <div className="text-center py-8">Loading dashboard...</div>
          ) : dashboardData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Stats Cards */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
                <p className="text-3xl font-bold text-gray-900">{dashboardData.overview.totalUsers}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Total Documents</h3>
                <p className="text-3xl font-bold text-gray-900">{dashboardData.overview.totalDocuments}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Total Pages</h3>
                <p className="text-3xl font-bold text-gray-900">{dashboardData.overview.totalPages}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Indexed Documents</h3>
                <p className="text-3xl font-bold text-gray-900">{dashboardData.documents.indexed}</p>
              </div>
            </div>
          ) : null}

          {/* Index Stats */}
          {indexStats && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Index Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Embeddings</p>
                  <p className="text-2xl font-bold">{indexStats.totalEmbeddings}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Unindexed Documents</p>
                  <p className="text-2xl font-bold text-orange-600">{indexStats.unindexedDocuments}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Update</p>
                  <p className="text-sm">{new Date(indexStats.lastIndexUpdate).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">User Management</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center">Loading users...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateUser(user.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Document Management</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center">Loading documents...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                          <div className="text-sm text-gray-500">{doc.filename}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doc.owner.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          doc.isIndexed 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {doc.isIndexed ? 'Indexed' : 'Processing'}
                        </span>
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          doc.visibility === 'public' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {doc.visibility}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'index' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Index Management</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium">Rebuild Search Index</h3>
                  <p className="text-sm text-gray-500">Reprocess all documents and rebuild embeddings</p>
                </div>
                <button
                  onClick={handleRebuildIndex}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Rebuild Index
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium">Clear Cache</h3>
                  <p className="text-sm text-gray-500">Clear all cached queries and responses</p>
                </div>
                <button
                  onClick={handleClearCache}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Clear Cache
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;