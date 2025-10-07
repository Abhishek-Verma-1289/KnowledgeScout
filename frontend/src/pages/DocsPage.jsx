import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { docsAPI } from '../api/apiCalls';

const DocsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  // Fetch documents
  const fetchDocuments = async (page = 1) => {
    try {
      setLoading(true);
      const response = await docsAPI.getDocuments({
        limit: pagination.limit,
        offset: (page - 1) * pagination.limit,
      });
      
      if (response.data.success) {
        setDocuments(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      alert('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  // Upload document
  const handleUpload = async (files) => {
    if (files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name.replace(/\.[^/.]+$/, '')); // Remove extension
    formData.append('visibility', 'private');

    try {
      setUploading(true);
      const response = await docsAPI.uploadDocument(formData);
      
      if (response.data.success) {
        alert('Document uploaded successfully!');
        fetchDocuments(); // Refresh list
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  // Delete document
  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await docsAPI.deleteDocument(docId);
      alert('Document deleted successfully!');
      fetchDocuments(); // Refresh list
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Delete failed: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleUpload,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: false,
    disabled: uploading,
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Document Library</h1>

      {/* Upload Area */}
      <div className="mb-8">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'}
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <p className="text-gray-500">Uploading...</p>
          ) : isDragActive ? (
            <p className="text-blue-500">Drop the file here...</p>
          ) : (
            <div>
              <p className="text-gray-500 mb-2">Drag & drop a document here, or click to select</p>
              <p className="text-sm text-gray-400">Supported: PDF, TXT, MD, DOC, DOCX (max 10MB)</p>
            </div>
          )}
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Your Documents</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No documents found. Upload your first document!</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {documents.map((doc) => (
              <div key={doc.id} className="p-6 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{doc.title}</h3>
                  <p className="text-sm text-gray-500">
                    {doc.filename} • {Math.round(doc.size / 1024)} KB • 
                    {doc.visibility} • {doc.isIndexed ? 'Indexed' : 'Processing...'}
                  </p>
                  <p className="text-xs text-gray-400">
                    Uploaded {new Date(doc.createdAt).toLocaleDateString()} by {doc.owner}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Showing {Math.min(pagination.total, pagination.limit)} of {pagination.total} documents
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => fetchDocuments(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchDocuments(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocsPage;