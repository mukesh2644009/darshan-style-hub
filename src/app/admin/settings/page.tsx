import { FiHome, FiPhone, FiMapPin, FiExternalLink, FiTruck, FiDollarSign, FiPackage, FiRepeat } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import NimbusConnectionTestCard from './NimbusConnectionTestCard';
import ChangePasswordCard from './ChangePasswordCard';

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your store settings</p>
      </div>

      <div className="grid gap-6">
        {/* Security — always first */}
        <ChangePasswordCard />
        {/* Store Information */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiHome className="w-5 h-5" />
            Store Information
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store Name
              </label>
              <input
                type="text"
                defaultValue="Darshan Style Hub™"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store Email
              </label>
              <input
                type="email"
                defaultValue="contact@darshanstylehub.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiPhone className="w-5 h-5" />
            Contact Information
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                defaultValue="+91 98765 43210"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FaWhatsapp className="w-4 h-4 text-green-500" />
                WhatsApp Number
              </label>
              <input
                type="tel"
                defaultValue="+91 98765 43210"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">Used for WhatsApp chat button and order notifications</p>
            </div>
          </div>
        </div>

        {/* Store Address */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiMapPin className="w-5 h-5" />
            Store Address
          </h2>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 1
              </label>
              <input
                type="text"
                defaultValue="PN B-11, Shriram Vihar-B, Shrikishanpura, Sanganer"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  defaultValue="Jaipur"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <input
                  type="text"
                  defaultValue="Rajasthan"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PIN Code
                </label>
                <input
                  type="text"
                  defaultValue="302017"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium">
            Save Settings
          </button>
        </div>

        <NimbusConnectionTestCard />

        {/* NimbusPost Quick Links */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
            <FiTruck className="w-5 h-5" />
            NimbusPost Dashboard Links
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            NimbusPost does not expose a COD balance API — open their dashboard directly to check remittances and wallet.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              {
                icon: FiDollarSign,
                label: 'COD Remittance',
                desc: 'Check pending & paid COD payouts',
                url: 'https://ship.nimbuspost.com/cod-remittance',
                color: 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100',
              },
              {
                icon: FiPackage,
                label: 'Shipments',
                desc: 'All shipments & their statuses',
                url: 'https://ship.nimbuspost.com/shipments',
                color: 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100',
              },
              {
                icon: FiRepeat,
                label: 'Returns / Reverse Pickups',
                desc: 'Manage reverse shipments & QC',
                url: 'https://ship.nimbuspost.com/reverse-shipments',
                color: 'text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100',
              },
              {
                icon: FiDollarSign,
                label: 'Wallet Balance',
                desc: 'Top up & check wallet balance',
                url: 'https://ship.nimbuspost.com/wallet',
                color: 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100',
              },
            ].map((item) => (
              <a
                key={item.label}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${item.color}`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs opacity-75">{item.desc}</p>
                </div>
                <FiExternalLink className="w-4 h-4 shrink-0 opacity-60" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

