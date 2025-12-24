'use client';

// @ts-expect-error - swagger-ui-react doesn't have type definitions
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { useEffect, useState } from 'react';

export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null);

  useEffect(() => {
    fetch('/api/docs')
      .then((res) => res.json())
      .then((data) => setSpec(data));
  }, []);

  if (!spec) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading API Documentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gray-900 text-white py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Darshan Style Hub API</h1>
            <p className="text-gray-400 text-sm">API Documentation</p>
          </div>
          <a
            href="/"
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            Back to Store
          </a>
        </div>
      </div>
      <SwaggerUI spec={spec} />
    </div>
  );
}

