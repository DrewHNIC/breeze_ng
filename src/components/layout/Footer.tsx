// src/components/layout/Footer.tsx
import React from 'react';
import Link from 'next/link';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from 'react-icons/fa';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-r from-[#1A2026] to-[#872816] text-[#F4D2BD] py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-between items-center">
          <div className="w-full md:w-1/3 mb-6 md:mb-0">
            <h3 className="text-2xl font-bold mb-2 text-[#C4710B]">BREEZE</h3>
            <p className="text-sm">Making food delivery a breeze for everyone.</p>
          </div>

          <div className="w-full md:w-1/3 mb-6 md:mb-0">
            <h4 className="text-lg font-semibold mb-2">Quick Links</h4>
            <ul className="text-sm">
              {['Home', 'About Us', 'Contact', 'FAQ', 'Terms of Service', 'Privacy Policy'].map((text, i) => (
                <li key={i} className="mb-1">
                  <Link href={`/${text.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-[#C4710B]">
                    {text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="w-full md:w-1/3">
            <h4 className="text-lg font-semibold mb-2">Connect With Us</h4>
            <div className="flex space-x-4">
              {[FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1A2026] hover:bg-[#C4710B] text-white transition duration-300">
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
