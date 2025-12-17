import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, Database, RefreshCw } from 'lucide-react';
import type { SavedMix } from '../types/mix';

function SavedMixesDebug() {
  const [mixes, setMixes] = useState<SavedMix[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    fetchMixes();
  }, [user]);

  const fetchMixes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, get raw data to inspect
      const { data: rawResult, error: rawError } = await supabase
        .from('saved_mixes')
        .select('*')
        .eq('user_id', user?.id);
      
      if (rawError) throw rawError;
      setRawData(rawResult || []);
      
      // Then get formatted data
      const { data, error } = await supabase
        .from('saved_mixes')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMixes(data || []);
    } catch (err) {
      console.error('Error fetching saved mixes:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching mixes');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMixes();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Database className="w-6 h-6 text-blue-700" />
          </div>
          <h2 className="text-xl font-semibold text-blue-800">
            Saved Mixes Debug
          </h2>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error fetching saved mixes</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">User Information</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p><strong>User ID:</strong> {user?.id || 'Not logged in'}</p>
          <p><strong>Email:</strong> {user?.email || 'Not available'}</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Saved Mixes Count</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p>Found <strong>{mixes.length}</strong> saved mixes for this user.</p>
        </div>
      </div>

      {mixes.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Saved Mixes</h3>
          {mixes.map(mix => (
            <div key={mix.id} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-lg">{mix.name}</h4>
                  {mix.description && <p className="text-gray-600 mt-1">{mix.description}</p>}
                </div>
                <div className="text-sm text-gray-500">
                  Created: {new Date(mix.created_at).toLocaleString()}
                </div>
              </div>
              <div className="mt-3">
                <h5 className="font-medium text-gray-700">Composition:</h5>
                <div className="mt-2 flex flex-wrap gap-2">
                  {mix.composition.map((item, index) => (
                    <div key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                      {item.flourName}: {item.percentage}%
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Saved Mixes Found</h3>
          <p className="text-yellow-700">
            There are no saved mixes associated with your account. This could be because:
          </p>
          <ul className="list-disc list-inside mt-2 text-yellow-700">
            <li>You haven't created any mixes yet</li>
            <li>There might be an issue with the user ID association</li>
            <li>The database query might be failing</li>
          </ul>
        </div>
      )}

      <div className="mt-8 border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Raw Database Response</h3>
        <div className="bg-gray-800 text-gray-200 p-4 rounded-lg overflow-x-auto">
          <pre className="text-xs">{JSON.stringify(rawData, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}

export default SavedMixesDebug;
