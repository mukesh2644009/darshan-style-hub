import { prisma } from '@/lib/prisma';
import { FiMail, FiPhone, FiClock, FiTag } from 'react-icons/fi';
import MessageActions from './MessageActions';

export const dynamic = 'force-dynamic';

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

function getStatusColor(status: string) {
  switch (status) {
    case 'NEW':
      return 'bg-blue-100 text-blue-700';
    case 'READ':
      return 'bg-yellow-100 text-yellow-700';
    case 'REPLIED':
      return 'bg-green-100 text-green-700';
    case 'CLOSED':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function AdminMessagesPage() {
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const newCount = messages.filter((m: ContactMessage) => m.status === 'NEW').length;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Messages</h1>
          <p className="text-gray-600 mt-1">
            {messages.length} total messages • {newCount} new
          </p>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiMail className="text-gray-400" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages yet</h3>
          <p className="text-gray-500">
            Customer messages from the Contact page will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message: ContactMessage) => (
            <div
              key={message.id}
              className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${
                message.status === 'NEW' ? 'border-l-blue-500' : 'border-l-gray-200'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-900">{message.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(message.status)}`}>
                      {message.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <FiMail size={14} />
                      <a href={`mailto:${message.email}`} className="hover:text-primary-600">
                        {message.email}
                      </a>
                    </span>
                    {message.phone && (
                      <span className="flex items-center gap-1">
                        <FiPhone size={14} />
                        <a href={`tel:${message.phone}`} className="hover:text-primary-600">
                          {message.phone}
                        </a>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <FiClock size={14} />
                      {formatDate(message.createdAt)}
                    </span>
                  </div>
                </div>
                <MessageActions messageId={message.id} currentStatus={message.status} email={message.email} />
              </div>

              <div className="flex items-center gap-2 mb-3">
                <FiTag size={14} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-700">{message.subject}</span>
              </div>

              <p className="text-gray-600 whitespace-pre-wrap">{message.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
