import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
  Truck, Package, CheckCircle2, Clock, Phone, MapPin, 
  Navigation, AlertCircle, RefreshCw, UserCheck, ChevronRight
} from 'lucide-react';

export default function DeliveryPartnerDashboardPage() {
  const { showToast } = useToast();
  const { activePartnerId, setActivePartnerId } = useAuth();
  const [partners, setPartners] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('active'); // 'active' | 'completed'
  const [deliveryNote, setDeliveryNote] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  useEffect(() => {
    fetchPartners();
  }, []);

  useEffect(() => {
    if (activePartnerId) {
      fetchAssignedOrders();
      const interval = setInterval(() => {
        fetchAssignedOrders();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activePartnerId]);

  const fetchPartners = async () => {
    try {
      const data = await apiService.getDeliveryPartners();
      setPartners(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAssignedOrders = async () => {
    setLoading(true);
    try {
      const data = await apiService.getOrders({ delivery_partner: activePartnerId });
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const activePartner = partners.find(p => p.id === Number(activePartnerId)) || {
    name: 'Rahul Kumar',
    phone: '+91 98765 43210',
    vehicle_number: 'TS 09 EQ 4521',
    assigned_area: 'Hitech City & Madhapur'
  };

  const activeOrders = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');
  const completedOrders = orders.filter(o => o.status === 'Delivered');

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await apiService.updateOrderStatus(orderId, newStatus, deliveryNote);
      setDeliveryNote('');
      await fetchAssignedOrders();
      await fetchPartners();
      showToast(`Order status updated to "${newStatus}"!`, 'success');
    } catch (err) {
      showToast('Failed to update status', 'error');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Placed':
      case 'Confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Preparing':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Ready':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Collected':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Out for Delivery':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200 animate-pulse';
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-16">
      {/* Top Header Banner */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-30 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-white">{activePartner.name}</h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                  Delivery Partner
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Vehicle: {activePartner.vehicle_number} | Area: {activePartner.assigned_area}
              </p>
            </div>
          </div>

          {/* Switch Partner Profile Dropdown for Testing */}
          <div className="flex items-center space-x-3">
            <label className="text-xs text-slate-400 font-medium hidden sm:inline">Partner Profile:</label>
            <select
              value={activePartnerId}
              onChange={(e) => setActivePartnerId(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.phone})
                </option>
              ))}
            </select>
            <button
              onClick={fetchAssignedOrders}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition"
              title="Refresh Orders"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* KPI Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-medium">Assigned Active</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-extrabold text-amber-400">{activeOrders.length}</span>
              <Package className="w-5 h-5 text-amber-400/60" />
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-medium">Completed Today</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-extrabold text-emerald-400">{completedOrders.length}</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-400/60" />
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-medium">Partner Rating</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-extrabold text-yellow-400">{activePartner.rating || '4.9'} ★</span>
              <UserCheck className="w-5 h-5 text-yellow-400/60" />
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Delivered</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-extrabold text-blue-400">{activePartner.total_deliveries || 45}</span>
              <Truck className="w-5 h-5 text-blue-400/60" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 border-b border-slate-800 mb-6">
          <button
            onClick={() => setSelectedTab('active')}
            className={`pb-3 px-4 font-semibold text-sm transition border-b-2 flex items-center space-x-2 ${
              selectedTab === 'active'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Active Deliveries ({activeOrders.length})</span>
          </button>

          <button
            onClick={() => setSelectedTab('completed')}
            className={`pb-3 px-4 font-semibold text-sm transition border-b-2 flex items-center space-x-2 ${
              selectedTab === 'completed'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Completed Orders ({completedOrders.length})</span>
          </button>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-12 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-500" />
            Loading assigned deliveries...
          </div>
        ) : selectedTab === 'active' ? (
          activeOrders.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">All Caught Up!</h3>
              <p className="text-slate-400 text-sm mt-1">No active pending deliveries assigned right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-slate-800 border border-slate-700/90 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-600 transition"
                >
                  <div>
                    {/* Order Top Info */}
                    <div className="flex items-start justify-between pb-3 border-b border-slate-700/80 mb-4">
                      <div>
                        <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">
                          Order #{order.order_number}
                        </span>
                        <h3 className="text-lg font-bold text-white mt-0.5">{order.customer_name}</h3>
                      </div>
                      <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </div>

                    {/* Customer Phone & Address */}
                    <div className="space-y-3 mb-4 text-sm text-slate-300">
                      <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
                        <div className="flex items-center space-x-2.5">
                          <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span className="font-semibold text-white">{order.phone}</span>
                        </div>
                        <a
                          href={`tel:${order.phone}`}
                          className="px-3 py-1 bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-emerald-400 transition"
                        >
                          Call
                        </a>
                      </div>

                      <div className="flex items-start space-x-2.5">
                        <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-slate-200">{order.delivery_address}</p>
                          {order.landmark && (
                            <p className="text-xs text-amber-300 mt-0.5 font-medium">Landmark: {order.landmark}</p>
                          )}
                          <p className="text-xs text-slate-400 mt-0.5">Area: {order.delivery_area}</p>
                        </div>
                      </div>
                    </div>

                    {/* Items Summary */}
                    <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-700/50 mb-4">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Order Items</div>
                      <ul className="space-y-2 text-xs text-slate-300">
                        {order.items?.map((item, idx) => {
                          const imgSrc = item.food_image || item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80';
                          return (
                            <li key={idx} className="flex justify-between items-center bg-slate-900/80 p-2 rounded-lg border border-slate-700/60">
                              <div className="flex items-center space-x-2.5">
                                <img src={imgSrc} alt={item.food_name || 'Dish'} className="w-9 h-9 rounded-md object-cover border border-slate-700" />
                                <div>
                                  <span className="font-bold text-white block text-xs">{item.food_name}</span>
                                  <span className="text-[10px] text-slate-400">Qty: {item.quantity}</span>
                                </div>
                              </div>
                              <span className="font-semibold text-slate-200">₹{item.price * item.quantity}</span>
                            </li>
                          );
                        })}
                      </ul>
                      <div className="border-t border-slate-800 mt-2.5 pt-2 flex justify-between text-xs font-bold text-white">
                        <span>Total ({order.payment_method})</span>
                        <span className="text-emerald-400 text-sm">₹{order.total_amount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status Updates */}
                  <div className="pt-3 border-t border-slate-700/80 space-y-3">
                    {(order.status === 'Placed' || order.status === 'Confirmed' || order.status === 'Preparing' || order.status === 'Ready') && (
                      <button
                        disabled={updatingOrderId === order.id}
                        onClick={() => handleUpdateStatus(order.id, 'Collected')}
                        className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-2"
                      >
                        <Package className="w-4 h-4" />
                        <span>Mark "Collected at Restaurant"</span>
                      </button>
                    )}

                    {order.status === 'Collected' && (
                      <button
                        disabled={updatingOrderId === order.id}
                        onClick={() => handleUpdateStatus(order.id, 'Out for Delivery')}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-2"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>Mark "Out for Delivery"</span>
                      </button>
                    )}

                    {order.status === 'Out for Delivery' && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Optional delivery note (e.g. Handed to customer)"
                          value={deliveryNote}
                          onChange={(e) => setDeliveryNote(e.target.value)}
                          className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                        <button
                          disabled={updatingOrderId === order.id}
                          onClick={() => handleUpdateStatus(order.id, 'Delivered')}
                          className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Mark Order DELIVERED</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Completed Orders */
          completedOrders.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center text-slate-400">
              No completed deliveries yet today.
            </div>
          ) : (
            <div className="space-y-4">
              {completedOrders.map((order) => (
                <div key={order.id} className="bg-slate-800 border border-slate-700/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{order.customer_name} (#{order.order_number})</h4>
                      <p className="text-xs text-slate-400">{order.delivery_address} • ₹{order.total_amount}</p>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-bold rounded-full border border-emerald-500/30">
                      Delivered
                    </span>
                    {order.delivery_notes && (
                      <p className="text-slate-400 text-xs mt-1 italic">Note: "{order.delivery_notes}"</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
}
