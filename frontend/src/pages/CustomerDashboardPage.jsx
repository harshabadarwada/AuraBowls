import React, { useState, useEffect } from 'react';
import { User, Calendar, Pause, Play, RefreshCw, CheckCircle2, Clock, MapPin, Truck, Package, ShieldCheck, Lock } from 'lucide-react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CustomerDashboardPage({ selectedZone }) {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [activeSub, setActiveSub] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomerData();
    const interval = setInterval(() => {
      loadCustomerData();
    }, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const loadCustomerData = async () => {
    setLoading(true);
    try {
      const [subs, allDbOrders] = await Promise.all([
        apiService.getSubscriptions(),
        apiService.getOrders()
      ]);
      setSubscriptions(subs);
      if (subs && subs.length > 0) setActiveSub(subs[0]);

      // Filter strictly by the logged in customer's email
      let userEmail = (user?.email || '').toLowerCase().trim();
      
      let matchedOrders = allDbOrders.filter(o => {
        if (!userEmail) return false;
        return (o.email || '').toLowerCase().trim() === userEmail;
      });

      setUserOrders(matchedOrders);
    } catch (e) {
      console.error('Error loading customer data', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    if (!activeSub) return;
    await apiService.pauseSubscription(activeSub.id);
    setActiveSub({ ...activeSub, status: 'Paused' });
  };

  const handleResume = async () => {
    if (!activeSub) return;
    await apiService.resumeSubscription(activeSub.id);
    setActiveSub({ ...activeSub, status: 'Active' });
  };

  const statusSteps = ['Placed', 'Confirmed', 'Preparing', 'Ready', 'Collected', 'Out for Delivery', 'Delivered'];

  const getStatusStepIndex = (status) => {
    const idx = statusSteps.indexOf(status);
    return idx === -1 ? 0 : idx;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-100 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Customer Dashboard
          </span>
          <h1 className="font-serif font-bold text-3xl text-[#1C3822] mt-1">Welcome back, {user?.name || 'Customer'}</h1>
          <p className="text-xs text-slate-500">Manage your active monthly subscriptions, order history & live delivery tracking.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadCustomerData}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-700 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800">
            Zone: <span className="text-emerald-800">{selectedZone || user?.area || 'Hitech City'}, Hyderabad</span>
          </div>
        </div>
      </div>

      {/* Active Subscription Box */}
      <div className="bg-[#FAF8F3] p-8 rounded-3xl border border-emerald-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-bold text-xl text-[#1C3822]">Active Monthly Subscription</h2>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${activeSub?.status === 'Active' ? 'bg-emerald-700 text-white' : 'bg-amber-500 text-white'}`}>
                {activeSub?.status || 'Active'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Standard Plan (Breakfast + Lunch) • Start: Sept 1, 2026 • End: Sept 30, 2026
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeSub?.status === 'Active' ? (
              <button 
                onClick={handlePause}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
              >
                <Pause className="w-4 h-4" />
                <span>Pause Subscription</span>
              </button>
            ) : (
              <button 
                onClick={handleResume}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
              >
                <Play className="w-4 h-4" />
                <span>Resume Subscription</span>
              </button>
            )}
          </div>
        </div>

        {/* Subscription Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-xs text-slate-500 font-semibold block">Remaining Meals</span>
            <span className="font-serif font-bold text-3xl text-[#1C3822]">{activeSub?.remaining_meals || 38}</span>
            <span className="text-[10px] text-slate-400 block mt-1">Out of {activeSub?.total_meals || 52} meals</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-xs text-slate-500 font-semibold block">Delivery Location</span>
            <span className="font-bold text-sm text-slate-800 block mt-1">{user?.area || 'Hitech City'}, Hyderabad</span>
            <span className="text-[10px] text-emerald-700 font-semibold block mt-1">Priority Slot: 7:30 AM - 8:30 AM</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-xs text-slate-500 font-semibold block">Today's Meal Menu</span>
            <span className="font-bold text-sm text-slate-800 block mt-1">Avocado Toast & Egg Rice Bowl</span>
            <span className="text-[10px] text-amber-700 font-semibold block mt-1">1,450 kcal total plan</span>
          </div>
        </div>
      </div>

      {/* Real Orders & Tracking Timeline */}
      <div className="space-y-6">
        <h2 className="font-serif font-bold text-2xl text-[#1C3822]">Your Orders & Delivery Tracker</h2>

        {userOrders.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-500 text-sm">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            No orders placed yet. Browse our Diet Menu to order fresh meals!
          </div>
        ) : (
          <div className="space-y-6">
            {userOrders.map((order) => {
              const currentIdx = getStatusStepIndex(order.status);
              return (
                <div key={order.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                  {/* Order Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                        Order #{order.order_number}
                      </span>
                      <h3 className="font-serif font-bold text-lg text-slate-900 mt-0.5">
                        ₹{order.total_amount} • {order.payment_method}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Placed on {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-300">
                        Status: {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Delivery Tracking Stepper */}
                  <div className="py-2">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                      Live Delivery Progress
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 text-center">
                      {statusSteps.map((step, i) => {
                        const isDone = i <= currentIdx;
                        const isCurrent = i === currentIdx;
                        return (
                          <div key={step} className="flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition ${
                                isCurrent
                                  ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 scale-110'
                                  : isDone
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200'
                              }`}
                            >
                              {isDone ? '✓' : i + 1}
                            </div>
                            <span className={`text-[10px] font-semibold mt-2 line-clamp-1 ${isDone ? 'text-slate-800' : 'text-slate-400'}`}>
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Assigned Delivery Partner Details */}
                  {order.delivery_partner_details && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between text-xs text-indigo-900">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-600 text-white rounded-xl">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold block">Assigned Delivery Partner</span>
                          <span>{order.delivery_partner_details.name} ({order.delivery_partner_details.vehicle_number})</span>
                        </div>
                      </div>
                      <a
                        href={`tel:${order.delivery_partner_details.phone}`}
                        className="px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition"
                      >
                        Call Partner
                      </a>
                    </div>
                  )}

                  {/* Delivery Location & Locked Status Indicator */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl mt-0.5 shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">Delivery Address</span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                            <Lock className="w-3 h-3 text-amber-700" />
                            Locked Location
                          </span>
                        </div>
                        <p className="text-slate-700 mt-1 font-medium">{order.delivery_address}</p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                          {order.landmark && <span>Near: {order.landmark} •</span>}
                          <span className="font-bold text-emerald-800">Zone: {order.delivery_area}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 italic sm:text-right bg-white sm:bg-transparent px-2.5 py-1 rounded border sm:border-0 border-slate-200 shrink-0">
                      🔒 Location cannot be changed post-order
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="border-t border-slate-100 pt-4">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Order Items</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {order.items?.map((item, idx) => {
                        const imgSrc = item.food_image || item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80';
                        return (
                          <div key={idx} className="p-2.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between font-medium">
                            <div className="flex items-center gap-3">
                              <img 
                                src={imgSrc} 
                                alt={item.food_name || 'Dish'} 
                                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0" 
                              />
                              <div>
                                <span className="font-bold text-slate-900 block text-xs">{item.food_name}</span>
                                <span className="text-[11px] text-emerald-700 font-semibold">Qty: {item.quantity} × ₹{item.price}</span>
                              </div>
                            </div>
                            <span className="font-bold text-slate-800 text-xs">₹{item.price * item.quantity}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
