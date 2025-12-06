import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm">&copy; {new Date().getFullYear()} Dexorzo Creations. All rights reserved.</p>
        {/* <div className="mt-4 flex justify-center space-x-6">
          <a href="/privacy-policy" className="hover:text-white transition">Privacy Policy</a>
          <a href="/terms-of-service" className="hover:text-white transition">Terms of Service</a>
          <a href="/contact" className="hover:text-white transition">Contact</a>
        </div> */}
      </div>
    </footer>
  );
};

export default Footer;