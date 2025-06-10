// src/components/layout/Footer.tsx
import React from 'react';
import Link from 'next/link';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from 'react-icons/fa';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-t from-[#141421] to-[#0A5784] text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-between items-center">
          <div className="w-full md:w-1/3 mb-6 md:mb-0">
            <h3 className="text-2xl font-bold mb-2">BREEZE</h3>
            <p className="text-sm">Making food delivery a breeze for everyone.</p>
          </div>
          <div className="w-full md:w-1/3 mb-6 md:mb-0">
            <h4 className="text-lg font-semibold mb-2">Quick Links</h4>
            <ul className="text-sm text-gray-300">
              {['Home', 'About Us', 'Contact', 'FAQ', 'Terms of Service', 'Privacy Policy'].map((text, index) => (
                <li key={index} className="mb-1">
                  <Link href={`/${text.toLowerCase().replace(/ /g, '-')}`} className="hover:text-[#f15152]">
                    {text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="w-full md:w-1/3">
            <h4 className="text-lg font-semibold mb-2">Connect With Us</h4>
            <div className="flex space-x-4">
              {[FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn].map((Icon, idx) => (
                <a key={idx} href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-[#141421] hover:bg-[#f15152] transition">
                  <Icon size={20} />
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
