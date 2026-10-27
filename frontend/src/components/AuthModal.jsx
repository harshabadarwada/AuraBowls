import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, ShieldAlert, Truck, ArrowRight, Sparkles, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose, defaultRole = 'customer', onSuccessRedirect }) {
  const { login, register } = useAuth();
  const [selectedRole, setSelectedRole] = useState(defaultRole); // 'customer' | 'admin' | 'delivery'
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isRegisterMode && selectedRole === 'customer') {
        const result = await register({
          name: formData.name || 'New Customer',
          email: formData.email,
          password: formData.password,
          phone: formData.phone
        });
        if (result.success) {
          onClose();
          if (onSuccessRedirect) onSuccessRedirect('customer');
        } else {
          setErrorMsg(result.error || 'Registration failed');
        }
      } else {
        const result = await login({
          email: formData.email,
          username: formData.email,
          password: formData.password,
          role: selectedRole
        });
        if (result.success) {
          onClose();
          if (onSuccessRedirect) onSuccessRedirect(result.role);
        } else {
          setErrorMsg(result.error || 'Invalid credentials');
        }
      }
    } catch (err) {
      setErrorMsg('Authentication request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (roleToLogin, email, password) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const result = await login({ email, username: email, password, role: roleToLogin });
      if (result.success) {
        onClose();
        if (onSuccessRedirect) onSuccessRedirect(result.role);
      }
    } catch (err) {
      setErrorMsg('Demo login error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto glass-modal flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-emerald-100 animate-fade-in my-8">
        
        {/* Top Header */}
        <div className="bg-[#1C3822] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-white hover:bg-emerald-800/60 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Key className="w-4 h-4" />
            <span>Secure Access Portal</span>
          </div>

          <h3 className="font-serif font-bold text-2xl text-white">
            {isRegisterMode ? 'Create Customer Account' : 'Sign In to Your Account'}
          </h3>
          <p className="text-xs text-emerald-200/80 mt-1">
            Access your diet subscriptions, kitchen management, or delivery portal.
          </p>

          {/* Role Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-slate-900/60 p-1.5 rounded-2xl mt-5 border border-slate-700 text-xs font-bold">
            <button
              onClick={() => {
                setSelectedRole('customer');
                setErrorMsg('');
              }}
              className={`py-2 rounded-xl transition flex items-center justify-center space-x-1 ${
                selectedRole === 'customer'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Customer</span>
            </button>

            <button
              onClick={() => {
                setSelectedRole('admin');
                setIsRegisterMode(false);
                setErrorMsg('');
              }}
              className={`py-2 rounded-xl transition flex items-center justify-center space-x-1 ${
                selectedRole === 'admin'
                  ? 'bg-amber-400 text-slate-950 shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>

            <button
              onClick={() => {
                setSelectedRole('delivery');
                setIsRegisterMode(false);
                setErrorMsg('');
              }}
              className={`py-2 rounded-xl transition flex items-center justify-center space-x-1 ${
                selectedRole === 'delivery'
                  ? 'bg-indigo-400 text-slate-950 shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Delivery</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {isRegisterMode && selectedRole === 'customer' && (
              <>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Ananya Rao"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      placeholder="+91 98765 12345"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {selectedRole === 'admin' ? 'Admin Username or Email' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder={
                    selectedRole === 'admin'
                      ? 'admin@freshdiet.com'
                      : selectedRole === 'delivery'
                      ? 'rahul@delivery.com'
                      : 'ananya@example.com'
                  }
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1C3822] hover:bg-[#2D5A37] text-white font-bold text-sm rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Authenticating...' : isRegisterMode ? 'Create Account' : `Sign In as ${selectedRole.toUpperCase()}`}</span>
              <ArrowRight className="w-4 h-4 text-emerald-300" />
            </button>
          </form>

          {/* Switch Register/Login for Customer */}
          {selectedRole === 'customer' && (
            <div className="text-center pt-2 border-t border-slate-100 text-xs">
              <button
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                className="text-emerald-700 font-bold hover:underline"
              >
                {isRegisterMode ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
              </button>
            </div>
          )}

          {/* Quick Demo Login Preset Buttons */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Quick 1-Click Demo Logins</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('customer', 'ananya@example.com', 'customer123')}
                className="py-1.5 px-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[10px] font-bold rounded-lg border border-emerald-300 transition text-center truncate"
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin', 'admin@freshdiet.com', 'admin123')}
                className="py-1.5 px-2 bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold rounded-lg border border-amber-300 transition text-center truncate"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('delivery', 'rahul@delivery.com', 'partner123')}
                className="py-1.5 px-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 text-[10px] font-bold rounded-lg border border-indigo-300 transition text-center truncate"
              >
                Delivery Partner
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
