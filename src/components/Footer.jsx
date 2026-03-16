import React from "react";

const Footer = () => {
  return (
    <footer className="fixed bottom-0 left-0 z-20 w-full border-t border-white/10 bg-white shadow-md">
      <div className="flex w-full justify-end px-6 py-3">
        <p className="text-xs text-gray-700 sm:text-sm text-right">
          © {new Date().getFullYear()} NEO DESK | Developed by{" "}
          <span className="font-semibold text-green-700">ENIS</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
