import React, { useState, useEffect } from 'react';
import { askAPI, docsAPI } from '../api/apiCalls';

const AskPage = () => {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState('');
  const [k, setK] = useState(5);
  const [history, setHistory] = useState([]);

  // Fetch available documents
  const fetchDocuments = async () => {
    try {
      const response = await docsAPI.getDocuments({ limit: 100 });
      if (response.data.success) {
        setDocuments(response.data.data.filter(doc => doc.isIndexed));
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  // Ask question
  const handleAsk = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      const requestData = {
        query: query.trim(),
        k: parseInt(k),
      };

      if (selectedDoc) {
        requestData.documentId = selectedDoc;
      }

      const response = await askAPI.askQuestion(requestData);
      
      if (response.data.success) {
        const result = response.data.data;
        setAnswer(result);
        setHistory(prev => [{ query, result, timestamp: new Date() }, ...prev.slice(0, 9)]);
      }
    } catch (error) {
      console.error('Ask failed:', error);
      setAnswer({
        answer: 'Sorry, I encountered an error while processing your question. Please try again.',
        sources: [],
        fromCache: false,
        queryId: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Clear conversation
  const handleClear = () => {
    setQuery('');
    setAnswer(null);
    setHistory([]);
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Ask Questions</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Q&A Area */}
        <div className="lg:col-span-2">
          {/* Query Form */}
          <form onSubmit={handleAsk} className="mb-8">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="mb-4">
                <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Question
                </label>
                <textarea
                  id="query"
                  rows={3}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask any question about your documents..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="document" className="block text-sm font-medium text-gray-700 mb-2">
                    Search in specific document (optional)
                  </label>
                  <select
                    id="document"
                    value={selectedDoc}
                    onChange={(e) => setSelectedDoc(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All documents</option>
                    {documents.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="k" className="block text-sm font-medium text-gray-700 mb-2">
                    Number of sources
                  </label>
                  <select
                    id="k"
                    value={k}
                    onChange={(e) => setK(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={3}>3 sources</option>
                    <option value={5}>5 sources</option>
                    <option value={10}>10 sources</option>
                    <option value={15}>15 sources</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Thinking...' : 'Ask Question'}
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
            </div>
          </form>

          {/* Answer Display */}
          {answer && (
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Answer</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  {answer.fromCache && (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                      Cached
                    </span>
                  )}
                  <span>ID: {answer.queryId}</span>
                </div>
              </div>
              
              <div className="prose max-w-none mb-6">
                <p className="text-gray-800 leading-relaxed">{answer.answer}</p>
              </div>

              {/* Sources */}
              {answer.sources && answer.sources.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Sources</h3>
                  <div className="space-y-3">
                    {answer.sources.map((source, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">{source.documentTitle}</h4>
                            <p className="text-sm text-gray-500">Page {source.pageNumber}</p>
                          </div>
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                            {Math.round(source.relevanceScore * 100)}% match
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{source.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Available Documents */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Available Documents</h3>
            {documents.length === 0 ? (
              <p className="text-gray-500 text-sm">No indexed documents available.</p>
            ) : (
              <div className="space-y-2">
                {documents.slice(0, 10).map((doc) => (
                  <div key={doc.id} className="text-sm">
                    <p className="font-medium text-gray-900">{doc.title}</p>
                    <p className="text-gray-500">{doc.pageCount} pages</p>
                  </div>
                ))}
                {documents.length > 10 && (
                  <p className="text-sm text-gray-500">+ {documents.length - 10} more documents</p>
                )}
              </div>
            )}
          </div>

          {/* Recent Questions */}
          {history.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Questions</h3>
              <div className="space-y-3">
                {history.slice(0, 5).map((item, index) => (
                  <div key={index} className="border-b border-gray-200 pb-3 last:border-b-0">
                    <button
                      onClick={() => setQuery(item.query)}
                      className="text-left w-full"
                    >
                      <p className="text-sm text-gray-900 hover:text-blue-600">
                        {item.query.length > 60 ? item.query.substring(0, 60) + '...' : item.query}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.timestamp.toLocaleTimeString()}
                      </p>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AskPage;