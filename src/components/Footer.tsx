import Link from 'next/link';
import { FiInstagram, FiFacebook, FiTwitter, FiYoutube, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-accent-900 text-white">
      {/* Newsletter */}
      <div className="bg-primary-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="font-display text-2xl sm:text-3xl font-bold mb-2">
            Join Our Family
          </h3>
          <p className="text-primary-100 mb-6 max-w-md mx-auto">
            Subscribe for exclusive offers, new arrivals, and styling tips
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-white/40"
            />
            <button className="bg-white text-primary-700 px-6 py-3 rounded-full font-medium hover:bg-accent-100 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h4 className="font-display text-2xl font-bold text-white mb-4">Darshan Style Hub</h4>
            <p className="text-accent-300 mb-4 leading-relaxed">
              Your trusted destination for premium suits and kurtis in Jaipur. 
              Quality fabrics, timeless designs, and exceptional service since 2010.
            </p>
            <div className="flex gap-3">
              <a 
                href="https://www.instagram.com/stylehubjaipur/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 bg-accent-800 hover:bg-gradient-to-br hover:from-purple-600 hover:via-pink-500 hover:to-orange-400 rounded-full transition-colors"
              >
                <FiInstagram size={20} />
              </a>
              <a href="#" className="p-2 bg-accent-800 hover:bg-primary-600 rounded-full transition-colors">
                <FiFacebook size={20} />
              </a>
              <a href="#" className="p-2 bg-accent-800 hover:bg-primary-600 rounded-full transition-colors">
                <FiTwitter size={20} />
              </a>
              <a href="#" className="p-2 bg-accent-800 hover:bg-primary-600 rounded-full transition-colors">
                <FiYoutube size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-medium text-lg mb-4">Shop</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/products" className="text-accent-300 hover:text-white transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/products?category=Suits" className="text-accent-300 hover:text-white transition-colors">
                  Suits
                </Link>
              </li>
              <li>
                <Link href="/products?category=Kurtis" className="text-accent-300 hover:text-white transition-colors">
                  Kurtis
                </Link>
              </li>
              <li>
                <Link href="/products?newArrival=true" className="text-accent-300 hover:text-white transition-colors">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="/products?featured=true" className="text-accent-300 hover:text-white transition-colors">
                  Featured
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-medium text-lg mb-4">Customer Service</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/track-order" className="text-accent-300 hover:text-white transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-accent-300 hover:text-white transition-colors">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-accent-300 hover:text-white transition-colors">
                  Returns & Exchange
                </Link>
              </li>
              <li>
                <Link href="/size-guide" className="text-accent-300 hover:text-white transition-colors">
                  Size Guide
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-accent-300 hover:text-white transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-accent-300 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-medium text-lg mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <FiMapPin className="mt-1 flex-shrink-0 text-primary-400" />
                <span className="text-accent-300">
                  Johari Bazaar, Near Hawa Mahal<br />
                  Jaipur, Rajasthan 302001
                </span>
              </li>
              <li className="flex items-center gap-3">
                <FiPhone className="flex-shrink-0 text-primary-400" />
                <a href="tel:+919019076335" className="text-accent-300 hover:text-white transition-colors">
                  +91 90190 76335
                </a>
              </li>
              <li className="flex items-center gap-3">
                <FaWhatsapp className="flex-shrink-0 text-green-400" />
                <a 
                  href="https://wa.me/919019076335?text=Hi%20%F0%9F%91%8B%0AI%20visited%20your%20website%20https%3A%2F%2Fdarshan-style-hub.vercel.app%0AI'm%20interested%20in%20your%20women's%20apparel.%0APlease%20share%20product%20details%20and%20pricing." 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-300 hover:text-green-400 transition-colors"
                >
                  WhatsApp Us
                </a>
              </li>
              <li className="flex items-center gap-3">
                <FiMail className="flex-shrink-0 text-primary-400" />
                <a href="mailto:darshanstylehub@gmail.com" className="text-accent-300 hover:text-white transition-colors">
                  darshanstylehub@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-accent-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-accent-400 text-sm">
              © 2024 Darshan Style Hub, Jaipur. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/privacy" className="text-accent-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-accent-400 hover:text-white transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
