'use client';

import { useState } from 'react';
import { FiInstagram, FiCheck } from 'react-icons/fi';

const INSTAGRAM_URL = 'https://www.instagram.com/stylehubjaipur/';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = () => {
    setError('');
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Show thank you and open Instagram
    setSubscribed(true);
    window.open(INSTAGRAM_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-primary-700 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {subscribed ? (
          <div className="max-w-md mx-auto">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheck className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-display text-2xl sm:text-3xl font-bold mb-2">
              You're In! 🎉
            </h3>
            <p className="text-primary-100 mb-6">
              Thank you for joining our family! Follow us on Instagram to get the latest looks, offers, and behind-the-scenes from Darshan Style Hub.
            </p>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-primary-700 px-6 py-3 rounded-full font-semibold hover:bg-accent-100 transition-colors"
            >
              <FiInstagram size={20} />
              Follow @stylehubjaipur
            </a>
          </div>
        ) : (
          <>
            <h3 className="font-display text-2xl sm:text-3xl font-bold mb-2">
              Join Our Family
            </h3>
            <p className="text-primary-100 mb-6 max-w-md mx-auto">
              Subscribe for exclusive offers, new arrivals, and styling tips
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleSubscribe()}
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-white/40"
              />
              <button
                onClick={handleSubscribe}
                className="bg-white text-primary-700 px-6 py-3 rounded-full font-medium hover:bg-accent-100 transition-colors whitespace-nowrap"
              >
                Subscribe
              </button>
            </div>
            {error && (
              <p className="text-red-300 text-sm mt-2">{error}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
