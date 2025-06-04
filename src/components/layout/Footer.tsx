import React from 'react';
import Link from 'next/link';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from 'react-icons/fa';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-between items-center">
          <div className="w-full md:w-1/3 mb-6 md:mb-0">
            <h3 className="text-2xl font-bold mb-2">BREEZE</h3>
            <p className="text-sm">Making food delivery a breeze for everyone.</p>
          </div>
          <div className="w-full md:w-1/3 mb-6 md:mb-0">
  <h4 className="text-lg font-semibold mb-2 text-white">Quick Links</h4>
  <ul className="text-sm text-gray-300">
    <li className="mb-1"><Link href="/" className="hover:text-red-900">Home</Link></li>
    <li className="mb-1"><Link href="/about" className="hover:text-red-900">About Us</Link></li>
    <li className="mb-1"><Link href="/contact" className="hover:text-red-900">Contact</Link></li>
    <li className="mb-1"><Link href="/faq" className="hover:text-red-900">FAQ</Link></li>
    <li className="mb-1"><Link href="/terms-of-service" className="hover:text-red-900">Terms of Service</Link></li>
    <li className="mb-1"><Link href="/privacy-policy" className="hover:text-red-900">Privacy Policy</Link></li>
  </ul>
</div>

          <div className="w-full md:w-1/3">
  <h4 className="text-lg font-semibold mb-2 text-white">Connect With Us</h4>
  <div className="flex space-x-4">
    {[
      { icon: <FaFacebookF size={20} />, href: "#" },
      { icon: <FaTwitter size={20} />, href: "#" },
      { icon: <FaInstagram size={20} />, href: "#" },
      { icon: <FaLinkedinIn size={20} />, href: "#" }
    ].map((social, index) => (
      <a
        key={index}
        href={social.href}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-black text-white hover:bg-red-900 transition duration-300"
      >
        {social.icon}
      </a>
    ))}
  </div>
</div>

        </div>
        <div className="mt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} BREEZE. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;