'use client';

import { useEffect, useState } from 'react';
import { FiTrendingUp, FiEye, FiMousePointer, FiLoader, FiRefreshCw, FiExternalLink, FiSearch } from 'react-icons/fi';

interface PageRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface DailyRow {
  keys: string[];
  clicks: number;
  impressions: number;
}

interface SEOData {
  pages: PageRow[];
  queries: PageRow[];
  daily: DailyRow[];
  period: { startDate: string; endDate: string; days: number };
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

export default function SEOPage() {
  const [data, setData] = useState<SEOData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(28);

  const load = async (d = days) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/seo-performance?days=${d}`, { credentials: 'include' });
      const json = await res.json() as SEOData & { error?: string };
      if (!res.ok) throw new Error(json.error || 'Failed to load SEO data');
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totalClicks      = data?.pages.reduce((s, r) => s + r.clicks, 0) ?? 0;
  const totalImpressions = data?.pages.reduce((s, r) => s + r.impressions, 0) ?? 0;
  const avgPosition      = data?.pages.length
    ? (data.pages.reduce((s, r) => s + r.position, 0) / data.pages.length).toFixed(1)
    : '—';
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0';

  const shortUrl = (url: string) => url.replace('https://www.darshanstylehub.com', '') || '/';

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FiTrendingUp className="text-green-500" /> SEO Performance
          </h1>
          <p className="text-gray-500 text-sm mt-1">Live data from Google Search Console</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={days} onChange={e => { setDays(+e.target.value); load(+e.target.value); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option value={7}>Last 7 days</option>
            <option value={28}>Last 28 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button onClick={() => load()} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="flex items-center justify-center py-24">
          <FiLoader className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      ) : data ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={<FiMousePointer className="text-blue-600 w-6 h-6" />} label="Total Clicks" value={totalClicks.toLocaleString()} sub={`Last ${days} days`} color="bg-blue-50" />
            <StatCard icon={<FiEye className="text-purple-600 w-6 h-6" />} label="Impressions" value={totalImpressions.toLocaleString()} sub="Times shown in Google" color="bg-purple-50" />
            <StatCard icon={<FiTrendingUp className="text-green-600 w-6 h-6" />} label="Avg CTR" value={`${avgCtr}%`} sub="Click-through rate" color="bg-green-50" />
            <StatCard icon={<FiSearch className="text-amber-600 w-6 h-6" />} label="Avg Position" value={avgPosition} sub="Google ranking" color="bg-amber-50" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top Pages */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Top Pages</h2>
              {data.pages.length === 0 ? (
                <p className="text-gray-400 text-sm py-8 text-center">No data yet — check back after Google indexes your pages</p>
              ) : (
                <div className="space-y-1">
                  <div className="grid grid-cols-4 text-xs font-bold text-gray-400 uppercase pb-2 border-b border-gray-100">
                    <span className="col-span-2">Page</span>
                    <span className="text-right">Clicks</span>
                    <span className="text-right">Impr.</span>
                  </div>
                  {data.pages.map((row, i) => (
                    <div key={i} className="grid grid-cols-4 items-center py-2 border-b border-gray-50 hover:bg-gray-50 rounded-lg px-1">
                      <div className="col-span-2 flex items-center gap-2 min-w-0">
                        <span className="text-xs text-gray-400 w-5 shrink-0">{i + 1}</span>
                        <a href={row.keys[0]} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary-600 hover:underline truncate flex items-center gap-1">
                          {shortUrl(row.keys[0])} <FiExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                      <span className="text-sm font-semibold text-blue-600 text-right">{row.clicks}</span>
                      <span className="text-sm text-gray-500 text-right">{row.impressions}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Search Queries */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Top Search Queries</h2>
              <p className="text-xs text-gray-400 mb-3">What people type in Google to find your site</p>
              {data.queries.length === 0 ? (
                <p className="text-gray-400 text-sm py-8 text-center">No search queries yet</p>
              ) : (
                <div className="space-y-1">
                  <div className="grid grid-cols-4 text-xs font-bold text-gray-400 uppercase pb-2 border-b border-gray-100">
                    <span className="col-span-2">Query</span>
                    <span className="text-right">Clicks</span>
                    <span className="text-right">Impr.</span>
                  </div>
                  {data.queries.map((row, i) => (
                    <div key={i} className="grid grid-cols-4 items-center py-2 border-b border-gray-50 hover:bg-gray-50 rounded-lg px-1">
                      <div className="col-span-2 flex items-center gap-2 min-w-0">
                        <span className="text-xs text-gray-400 w-5 shrink-0">{i + 1}</span>
                        <span className="text-xs text-gray-700 truncate">{row.keys[0]}</span>
                      </div>
                      <span className="text-sm font-semibold text-blue-600 text-right">{row.clicks}</span>
                      <span className="text-sm text-gray-500 text-right">{row.impressions}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-4 text-center">
            Data from {data.period.startDate} to {data.period.endDate} · Updates daily
          </p>
        </>
      ) : null}
    </div>
  );
}
