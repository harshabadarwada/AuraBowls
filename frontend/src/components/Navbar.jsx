import React, { useState } from 'react';
import { ShoppingBag, MapPin, Sparkles, User, ShieldAlert, Calendar, Activity, Menu, X, Truck, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ activePage, setActivePage, cartCount, openCart, openQuiz, openAuth, selectedZone, setSelectedZone }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, role, user, logout } = useAuth();

  const hyderabadZones = [
    'Hitech City',
    'Madhapur',
    'Kondapur',
    'Gachibowli',
    'Financial District',
    'Jubilee Hills',
    'Banjara Hills'
  ];

  const handleNavClick = (page) => {
    // Auth guards for protected pages
    if (!isAuthenticated && (page === 'admin' || page === 'delivery' || page === 'customer' || page === 'dashboard')) {
      openAuth(page === 'admin' ? 'admin' : (page === 'delivery' ? 'delivery' : 'customer'));
      return;
    }
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-sm">
      {/* Top Banner Accent with User Role Info Bar */}
      <div className="bg-[#1C3822] text-white text-xs py-1.5 px-4 flex flex-wrap items-center justify-between gap-2 font-medium tracking-wide">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">Fresh diet meals delivered daily in Hyderabad!</span>
          <button 
            onClick={openQuiz}
            className="shrink-0 bg-emerald-700 hover:bg-emerald-600 text-white px-2.5 py-0.5 rounded text-[11px] font-semibold transition"
          >
            Custom Plan →
          </button>
        </div>

        {/* Authenticated User Status / Auth Controls */}
        <div className="flex items-center space-x-3 text-[11px]">
          {isAuthenticated ? (
            <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-bold text-slate-200">{user?.name || 'User'}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                role === 'admin' ? 'bg-amber-400 text-amber-950' : (role === 'delivery' ? 'bg-indigo-400 text-indigo-950' : 'bg-emerald-500 text-emerald-950')
              }`}>
                {role}
              </span>
              <button
                onClick={logout}
                className="text-slate-400 hover:text-red-400 transition ml-1"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => openAuth('customer')}
              className="flex items-center space-x-1 font-bold text-amber-300 hover:text-amber-200 transition bg-emerald-800/80 px-3 py-1 rounded-full border border-emerald-600"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-400" />
              <span>Login / Register</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer group" 
            onClick={() => handleNavClick(role === 'delivery' ? 'delivery' : (role === 'admin' ? 'admin' : 'home'))}
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#1C3822] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform shrink-0">
              <span className="text-xl sm:text-2xl font-serif text-emerald-300 font-bold">M</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-serif font-bold text-[#1C3822] tracking-tight leading-none group-hover:text-emerald-800 transition">
                MY MORNING
              </h1>
              <p className="text-[9px] sm:text-[10px] tracking-widest text-emerald-700 uppercase font-semibold mt-0.5">
                A HEALTHY START
              </p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 font-medium text-slate-700 text-sm">
            <button 
              onClick={() => handleNavClick('home')}
              className={`px-3 py-2 rounded-lg transition ${activePage === 'home' ? 'bg-[#EBF1E5] text-[#1C3822] font-semibold' : 'hover:text-[#1C3822]'}`}
            >
              Home
            </button>
            <button 
              onClick={() => handleNavClick('menu')}
              className={`px-3 py-2 rounded-lg transition ${activePage === 'menu' ? 'bg-[#EBF1E5] text-[#1C3822] font-semibold' : 'hover:text-[#1C3822]'}`}
            >
              Diet Menu
            </button>
            <button 
              onClick={() => handleNavClick('plans')}
              className={`px-3 py-2 rounded-lg transition ${activePage === 'plans' ? 'bg-[#EBF1E5] text-[#1C3822] font-semibold' : 'hover:text-[#1C3822]'}`}
            >
              Monthly Plans
            </button>
            <button 
              onClick={() => handleNavClick('calendar')}
              className={`px-3 py-2 rounded-lg transition flex items-center gap-1 ${activePage === 'calendar' ? 'bg-[#EBF1E5] text-[#1C3822] font-semibold' : 'hover:text-[#1C3822]'}`}
            >
              <Calendar className="w-4 h-4 text-emerald-700" />
              30-Day Menu
            </button>
            <button 
              onClick={() => handleNavClick('tracker')}
              className={`px-3 py-2 rounded-lg transition flex items-center gap-1 ${activePage === 'tracker' ? 'bg-[#EBF1E5] text-[#1C3822] font-semibold' : 'hover:text-[#1C3822]'}`}
            >
              <Activity className="w-4 h-4 text-emerald-700" />
              Nutrition Tracker
            </button>

          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Delivery Zone Selector */}
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full text-xs text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <select 
                value={selectedZone} 
                onChange={(e) => setSelectedZone(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer text-slate-800"
              >
                {hyderabadZones.map(z => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>

            {/* Single Role Portal / Account Button */}
            <button 
              onClick={() => handleNavClick(role === 'admin' ? 'admin' : (role === 'delivery' ? 'delivery' : 'customer'))}
              className={`p-2 sm:px-3 sm:py-2 rounded-full transition flex items-center gap-1.5 text-xs font-bold ${
                role === 'admin' && activePage === 'admin'
                  ? 'bg-amber-100 text-amber-950 border border-amber-300 shadow-sm'
                  : role === 'delivery' && activePage === 'delivery'
                  ? 'bg-indigo-100 text-indigo-950 border border-indigo-300 shadow-sm'
                  : activePage === 'customer'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title={isAuthenticated ? (role === 'admin' ? 'Admin Panel' : role === 'delivery' ? 'Delivery Portal' : 'My Orders') : 'Sign In'}
            >
              {role === 'admin' ? (
                <ShieldAlert className="w-4 h-4 text-amber-700" />
              ) : role === 'delivery' ? (
                <Truck className="w-4 h-4 text-indigo-700" />
              ) : (
                <User className="w-4 h-4 text-emerald-800" />
              )}
              <span className="hidden md:inline font-bold">
                {isAuthenticated ? (role === 'admin' ? 'Admin Panel' : role === 'delivery' ? 'Delivery Portal' : 'My Orders') : 'Sign In'}
              </span>
            </button>

            {/* Cart Button */}
            <button 
              onClick={openCart}
              className={`relative p-2.5 sm:px-4 sm:py-2.5 rounded-full transition shadow-md flex items-center gap-2 shrink-0 ${
                activePage === 'cart' 
                  ? 'bg-[#2A5232] text-white ring-2 ring-emerald-400' 
                  : 'bg-[#1C3822] hover:bg-[#2A5232] text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-emerald-300" />
              <span className="hidden sm:inline font-semibold text-xs">Cart</span>
              {cartCount > 0 && (
                <span className="bg-amber-400 text-amber-950 font-extrabold text-[11px] w-5 h-5 rounded-full flex items-center justify-center -mr-1">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-700 hover:text-slate-900 rounded-lg focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-emerald-100 bg-white px-4 pt-2 pb-6 space-y-2 shadow-xl animate-fadeIn">
          <button 
            onClick={() => handleNavClick('home')}
            className={`w-full text-left px-4 py-3 rounded-xl font-medium text-sm ${activePage === 'home' ? 'bg-[#EBF1E5] text-[#1C3822]' : 'text-slate-700'}`}
          >
            Home
          </button>
          <button 
            onClick={() => handleNavClick('menu')}
            className={`w-full text-left px-4 py-3 rounded-xl font-medium text-sm ${activePage === 'menu' ? 'bg-[#EBF1E5] text-[#1C3822]' : 'text-slate-700'}`}
          >
            Diet Menu
          </button>
          <button 
            onClick={() => handleNavClick('plans')}
            className={`w-full text-left px-4 py-3 rounded-xl font-medium text-sm ${activePage === 'plans' ? 'bg-[#EBF1E5] text-[#1C3822]' : 'text-slate-700'}`}
          >
            Monthly Plans
          </button>
          <button 
            onClick={() => handleNavClick('cart')}
            className={`w-full text-left px-4 py-3 rounded-xl font-medium text-sm flex items-center justify-between ${activePage === 'cart' ? 'bg-[#EBF1E5] text-[#1C3822]' : 'text-slate-700'}`}
          >
            <span>Full Page Cart</span>
            {cartCount > 0 && (
              <span className="bg-[#1C3822] text-white px-2 py-0.5 rounded-full text-xs font-bold">
                {cartCount}
              </span>
            )}
          </button>

          {isAuthenticated ? (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <button
                onClick={() => handleNavClick(role === 'admin' ? 'admin' : (role === 'delivery' ? 'delivery' : 'customer'))}
                className="w-full text-left px-4 py-3 bg-emerald-50 text-emerald-900 font-bold text-sm rounded-xl"
              >
                Go to {role.toUpperCase()} Dashboard →
              </button>
              <button
                onClick={logout}
                className="w-full text-left px-4 py-2 text-red-600 font-bold text-xs"
              >
                Sign Out ({user?.email})
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openAuth('customer');
              }}
              className="w-full py-3 bg-emerald-700 text-white font-bold text-sm rounded-xl"
            >
              Login / Register Account
            </button>
          )}
        </div>
      )}
    </header>
  );
}
