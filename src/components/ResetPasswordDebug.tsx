import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

function ResetPasswordDebug() {
  const [urlInfo, setUrlInfo] = useState<any>({});
  const navigate = useNavigate();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);

    const info = {
      fullUrl: window.location.href,
      origin: window.location.origin,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      hashParams: {
        access_token: hashParams.get('access_token'),
        refresh_token: hashParams.get('refresh_token'),
        type: hashParams.get('type'),
        error: hashParams.get('error'),
        error_description: hashParams.get('error_description'),
      },
      queryParams: {
        token: queryParams.get('token'),
        token_hash: queryParams.get('token_hash'),
        type: queryParams.get('type'),
        error: queryParams.get('error'),
        error_description: queryParams.get('error_description'),
      },
    };

    setUrlInfo(info);
    console.log('Reset Password Debug Info:', info);
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-blue-700" />
          </div>
          <h2 className="text-2xl font-bold text-blue-800">
            Password Reset Debug Information
          </h2>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Full URL:</h3>
            <pre className="text-xs overflow-x-auto bg-white p-2 rounded border">
              {urlInfo.fullUrl}
            </pre>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Origin:</h3>
            <pre className="text-xs overflow-x-auto bg-white p-2 rounded border">
              {urlInfo.origin}
            </pre>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Pathname:</h3>
            <pre className="text-xs overflow-x-auto bg-white p-2 rounded border">
              {urlInfo.pathname}
            </pre>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Search (Query String):</h3>
            <pre className="text-xs overflow-x-auto bg-white p-2 rounded border">
              {urlInfo.search || '(empty)'}
            </pre>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Hash:</h3>
            <pre className="text-xs overflow-x-auto bg-white p-2 rounded border">
              {urlInfo.hash || '(empty)'}
            </pre>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Hash Parameters:</h3>
            <pre className="text-xs overflow-x-auto bg-white p-2 rounded border">
              {JSON.stringify(urlInfo.hashParams, null, 2)}
            </pre>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Query Parameters:</h3>
            <pre className="text-xs overflow-x-auto bg-white p-2 rounded border">
              {JSON.stringify(urlInfo.queryParams, null, 2)}
            </pre>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={() => navigate('/auth/reset-password')}
            className="flex-1 bg-blue-700 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Reset Password Page
          </button>
          <button
            onClick={() => navigate('/auth')}
            className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Back to Login
          </button>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Instructions:</h3>
          <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
            <li>Copy this debug information</li>
            <li>Share it to help diagnose the reset password issue</li>
            <li>Check if you have hash parameters (access_token) or query parameters (token/token_hash)</li>
            <li>Look for any error parameters</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordDebug;
