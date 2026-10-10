import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} Crafted with{' '}
          <span className="text-red-500">❤️</span> by Avantro Technologies.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
