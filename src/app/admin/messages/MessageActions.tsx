'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiCheck, FiMail, FiX, FiChevronDown } from 'react-icons/fi';

type Props = {
  messageId: string;
  currentStatus: string;
  email: string;
};

export default function MessageActions({ messageId, currentStatus, email }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const updateStatus = async (newStatus: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setLoading(false);
      setShowDropdown(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Quick Reply via Email */}
      <a
        href={`mailto:${email}?subject=Re: Your inquiry at Darshan Style Hub`}
        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
        title="Reply via Email"
      >
        <FiMail size={18} />
      </a>

      {/* Status Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={loading}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Status'}
          <FiChevronDown size={14} />
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            <button
              onClick={() => updateStatus('NEW')}
              disabled={currentStatus === 'NEW'}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              New
            </button>
            <button
              onClick={() => updateStatus('READ')}
              disabled={currentStatus === 'READ'}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              Read
            </button>
            <button
              onClick={() => updateStatus('REPLIED')}
              disabled={currentStatus === 'REPLIED'}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Replied
            </button>
            <button
              onClick={() => updateStatus('CLOSED')}
              disabled={currentStatus === 'CLOSED'}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-gray-500"></span>
              Closed
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
