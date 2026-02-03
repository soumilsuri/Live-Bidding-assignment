import { useState, useEffect } from 'react';
import api from '../services/api';
import AuctionCard from '../components/auction/AuctionCard';

const Dashboard = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('LIVE');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchItems();
  }, [statusFilter, page]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/items', {
        params: {
          status: statusFilter,
          page,
          limit: 20,
        },
      });
      setItems(response.data.data.items);
      setPagination(response.data.data.pagination);
      setError(null);
    } catch (err) {
      setError('Failed to load auction items');
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading auction items...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Live Auctions</h1>
        
        {/* Filter Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => {
              setStatusFilter('LIVE');
              setPage(1);
            }}
            className={`px-4 py-2 rounded-md font-medium ${
              statusFilter === 'LIVE'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Live Auctions
          </button>
          <button
            onClick={() => {
              setStatusFilter('ENDED');
              setPage(1);
            }}
            className={`px-4 py-2 rounded-md font-medium ${
              statusFilter === 'ENDED'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Ended Auctions
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No {statusFilter.toLowerCase()} auctions found.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <AuctionCard key={item._id} item={item} />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
