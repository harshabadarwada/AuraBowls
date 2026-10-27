import React, { useState, useEffect } from 'react';
import { 
  X, ShoppingBag, Plus, Minus, Trash2, CheckCircle2, CreditCard, QrCode, 
  Building, ArrowRight, UserCheck, MapPin, Home, Briefcase, Navigation, Lock, Loader2 
} from 'lucide-react';
import { apiService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const DEFAULT_SAVED_ADDRESSES = [
  {
    id: 'addr-home',
    label: 'Home',
    address: 'Flat 402, Oakwood Apartments, Near Mindspace',
    landmark: 'Near Mindspace Circle',
    area: 'Hitech City'
  },
  {
    id: 'addr-work',
    label: 'Work',
    address: 'Tower B, 5th Floor, Cyber Gateway, HITEC City',
    landmark: 'Opp. Cyber Towers',
    area: 'Madhapur'
  }
];

export default function CartCheckoutModal({ isOpen, onClose, cart, updateQuantity, removeItem, clearCart, selectedZone, subPackage, clearSubPackage, onTrackOrder, openAuth }) {
  const { showToast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState('cart'); // 'cart', 'checkout', 'payment_processing', 'success'
  const [loading, setLoading] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [upiId, setUpiId] = useState('user@upi');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');

  // Saved addresses & GPS state
  const [savedAddresses, setSavedAddresses] = useState(() => {
    try {
      const stored = localStorage.getItem('fresh_saved_addresses');
      return stored ? JSON.parse(stored) : DEFAULT_SAVED_ADDRESSES;
    } catch {
      return DEFAULT_SAVED_ADDRESSES;
    }
  });
  const [selectedAddressId, setSelectedAddressId] = useState('addr-home');
  const [addressTag, setAddressTag] = useState('Home');
  const [saveAddressForFuture, setSaveAddressForFuture] = useState(true);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    delivery_address: user?.address || DEFAULT_SAVED_ADDRESSES[0].address,
    delivery_area: selectedZone || DEFAULT_SAVED_ADDRESSES[0].area,
    payment_method: 'UPI',
    delivery_slot: 'Morning 7:30 AM - 8:30 AM'
  });

  useEffect(() => {
    if (subPackage) {
      setStep('checkout');
    } else if (cart.length > 0) {
      setStep('cart');
    }
  }, [subPackage, isOpen]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        customer_name: user.name || prev.customer_name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        delivery_address: user.address || prev.delivery_address,
        delivery_area: selectedZone || prev.delivery_area
      }));
    }
  }, [user, selectedZone]);

  if (!isOpen) return null;

  const totalAmount = subPackage ? subPackage.price : cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSelectSavedAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setAddressTag(addr.label || 'Home');
    setFormData(prev => ({
      ...prev,
      delivery_address: addr.address,
      delivery_area: addr.area || prev.delivery_area
    }));
    showToast(`Loaded saved address (${addr.label})`, 'info');
  };

  const handleDetectCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            const displayName = data.display_name || '';
            const addrDetails = data.address || {};
            const street = addrDetails.road || addrDetails.suburb || addrDetails.neighbourhood || '';
            const city = addrDetails.city || addrDetails.state_district || 'Hyderabad';
            const formatted = street ? `${street}, ${city}`.trim() : displayName;

            let matchedZone = 'Hitech City';
            const lower = displayName.toLowerCase();
            if (lower.includes('madhapur')) matchedZone = 'Madhapur';
            else if (lower.includes('gachibowli')) matchedZone = 'Gachibowli';
            else if (lower.includes('kondapur')) matchedZone = 'Kondapur';
            else if (lower.includes('jubilee')) matchedZone = 'Jubilee Hills';
            else if (lower.includes('banjara')) matchedZone = 'Banjara Hills';
            else if (lower.includes('financial')) matchedZone = 'Financial District';

            setFormData(prev => ({
              ...prev,
              delivery_address: formatted || displayName,
              delivery_area: matchedZone
            }));
            setSelectedAddressId(null);
            showToast('Current GPS location detected! Please verify flat/door number.', 'success');
          } else {
            throw new Error('Geocoding failed');
          }
        } catch {
          setFormData(prev => ({
            ...prev,
            delivery_address: `GPS Pin: ${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E, Hyderabad`
          }));
          showToast('GPS coordinates obtained. Please add house details.', 'info');
        } finally {
          setDetectingLocation(false);
        }
      },
      (err) => {
        setDetectingLocation(false);
        showToast(err.message || 'Unable to access your location. Check browser permissions.', 'error');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Please sign in to place an order', 'warning');
      onClose();
      if (openAuth) openAuth('customer');
      return;
    }
    setLoading(true);

    // Simulate payment processing
    setTimeout(async () => {
      const payload = {
        customer_name: formData.customer_name,
        email: formData.email,
        phone: formData.phone,
        delivery_address: formData.delivery_address,
        delivery_area: formData.delivery_area,
        payment_method: formData.payment_method,
        total_amount: totalAmount,
        items: subPackage ? [
          {
            food_item_id: 1,
            quantity: subPackage.total_meals || 52
          }
        ] : cart.map(item => ({
          food_item_id: item.id,
          quantity: item.quantity
        }))
      };

      const response = await apiService.createOrder(payload);
      setLoading(false);
      if (response) {
        if (saveAddressForFuture && formData.delivery_address) {
          try {
            const updated = [
              {
                id: `addr-${Date.now()}`,
                label: addressTag,
                address: formData.delivery_address,
                area: formData.delivery_area
              },
              ...savedAddresses.filter(a => a.label !== addressTag)
            ];
            setSavedAddresses(updated);
            localStorage.setItem('fresh_saved_addresses', JSON.stringify(updated));
          } catch (err) {
            console.error('Error saving address', err);
          }
        }
        setPlacedOrder(response);
        setStep('success');
        if (!subPackage) clearCart();
        if (clearSubPackage) clearSubPackage();
        showToast(`Order #${response.order_number || 'MYM-101'} paid & confirmed!`, 'success');
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto glass-modal flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-emerald-100 animate-fade-in my-8">
        
        {/* Header */}
        <div className="bg-[#1C3822] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            <h3 className="font-serif font-bold text-lg">
              {step === 'cart' && 'Your Daily Diet Cart'}
              {step === 'checkout' && 'Delivery & Payment Details'}
              {step === 'success' && 'Order Confirmed!'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-emerald-900/60 hover:bg-emerald-800 flex items-center justify-center text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          
          {step === 'cart' && (
            <div>
              {cart.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-800 mx-auto mb-3">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg">Your cart is empty</h4>
                  <p className="text-sm text-slate-500 mt-1">Browse our healthy diet menu and add nutritious meals!</p>
                </div>
              ) : (
                <>
                  <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <img 
                            src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'} 
                            alt={item.name}
                            className="w-14 h-14 rounded-lg object-cover"
                          />
                          <div>
                            <h5 className="font-bold text-slate-900 text-sm">{item.name}</h5>
                            <p className="text-xs text-emerald-700 font-semibold">₹{item.price}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center bg-white border border-slate-200 rounded-lg">
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1 hover:bg-slate-100 rounded-l-lg text-slate-600"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2.5 text-xs font-bold text-slate-800">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1 hover:bg-slate-100 rounded-r-lg text-slate-600"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button 
                            onClick={() => removeItem(item.id)}
                            className="text-slate-400 hover:text-red-500 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <div className="flex justify-between items-center text-sm text-slate-600 mb-2">
                      <span>Subtotal</span>
                      <span className="font-semibold text-slate-800">₹{totalAmount}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-slate-600 mb-4">
                      <span>Hyderabad Delivery Fee</span>
                      <span className="font-semibold text-emerald-700">FREE</span>
                    </div>
                    <div className="flex justify-between items-center text-base font-bold text-[#1C3822] mb-6 pt-2 border-t border-slate-100">
                      <span>Total Amount</span>
                      <span className="text-lg text-emerald-800">₹{totalAmount}</span>
                    </div>

                    <button 
                      onClick={() => {
                        if (!isAuthenticated) {
                          showToast('Please sign in or register to place your order', 'info');
                          onClose();
                          if (openAuth) openAuth('customer');
                        } else {
                          setStep('checkout');
                        }
                      }}
                      className="w-full bg-[#1C3822] hover:bg-[#2D5A37] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition"
                    >
                      <span>Proceed to Checkout</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 'checkout' && (
            !isAuthenticated ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-800 mx-auto">
                  <UserCheck className="w-8 h-8" />
                </div>
                <h4 className="font-serif font-bold text-xl text-slate-900">Sign In Required to Place Order</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Please sign in or create a customer account to enter delivery details and place your order.
                </p>
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      if (openAuth) openAuth('customer');
                    }}
                    className="w-full py-3 bg-[#1C3822] hover:bg-[#2D5A37] text-white font-bold text-xs rounded-xl shadow-lg transition"
                  >
                    Sign In / Register Customer Account
                  </button>
                  <button
                    onClick={() => setStep('cart')}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                  >
                    Back to Cart
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                {/* GPS Auto-Detect Button */}
                <div className="flex items-center justify-between bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-800" />
                    <div>
                      <span className="font-bold text-xs text-emerald-950 block">Hyderabad Delivery</span>
                      <span className="text-[10px] text-emerald-700">Detect GPS or pick saved address</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDetectCurrentLocation}
                    disabled={detectingLocation}
                    className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs"
                  >
                    {detectingLocation ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Detecting...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Use Current Location</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Saved Delivery Addresses Chips */}
                {savedAddresses && savedAddresses.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-600 block">Saved Addresses:</span>
                    <div className="grid grid-cols-2 gap-2">
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id || formData.delivery_address === addr.address;
                        const Icon = addr.label === 'Home' ? Home : addr.label === 'Work' ? Briefcase : MapPin;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => handleSelectSavedAddress(addr)}
                            className={`p-2 rounded-xl border text-left cursor-pointer transition flex items-center justify-between gap-1.5 ${
                              isSelected
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <Icon className="w-3.5 h-3.5 shrink-0 text-emerald-800" />
                              <span className="text-xs truncate">{addr.label}</span>
                              <span className="text-[9px] text-slate-400">({addr.area})</span>
                            </div>
                            {isSelected && <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hyderabad Zone</label>
                  <select 
                    value={formData.delivery_area}
                    onChange={(e) => setFormData({ ...formData, delivery_area: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="Hitech City">Hitech City</option>
                    <option value="Madhapur">Madhapur</option>
                    <option value="Kondapur">Kondapur</option>
                    <option value="Gachibowli">Gachibowli</option>
                    <option value="Financial District">Financial District</option>
                    <option value="Jubilee Hills">Jubilee Hills</option>
                    <option value="Banjara Hills">Banjara Hills</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Address</label>
                <textarea 
                  rows="2"
                  required
                  value={formData.delivery_address}
                  onChange={(e) => {
                    setFormData({ ...formData, delivery_address: e.target.value });
                    setSelectedAddressId(null);
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-600"
                  placeholder="House/Flat number, Building, Street..."
                />
              </div>

              {/* Tag address as Home, Work, Other */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Tag Address As:</span>
                  <div className="flex items-center gap-1.5">
                    {[
                      { label: 'Home', icon: Home },
                      { label: 'Work', icon: Briefcase },
                      { label: 'Other', icon: MapPin }
                    ].map(t => {
                      const Icon = t.icon;
                      const isTag = addressTag === t.label;
                      return (
                        <button
                          key={t.label}
                          type="button"
                          onClick={() => setAddressTag(t.label)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                            isTag ? 'bg-[#1C3822] text-white' : 'bg-white border border-slate-200 text-slate-600'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-slate-200">
                  <input
                    type="checkbox"
                    checked={saveAddressForFuture}
                    onChange={(e) => setSaveAddressForFuture(e.target.checked)}
                    className="rounded text-emerald-700 focus:ring-emerald-500 h-3.5 w-3.5"
                  />
                  <span className="text-slate-600 font-medium text-[11px]">
                    Save this address to my address book
                  </span>
                </label>
              </div>

              {/* Immutable Address Warning */}
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-start gap-2 text-amber-900">
                <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-tight">
                  <span className="font-bold block">Delivery Location is Locked Once Ordered</span>
                  <span className="text-amber-700">Address cannot be altered after placement to ensure kitchen prep & delivery scheduling.</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Delivery Slot</label>
                <select 
                  value={formData.delivery_slot}
                  onChange={(e) => setFormData({ ...formData, delivery_slot: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-600 bg-white"
                >
                  <option>Morning 7:30 AM - 8:30 AM (Breakfast)</option>
                  <option>Afternoon 12:30 PM - 1:30 PM (Lunch)</option>
                  <option>Evening 7:30 PM - 8:30 PM (Dinner)</option>
                </select>
              </div>

              {/* Payment Method selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Payment Option</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, payment_method: 'UPI' })}
                    className={`p-2 rounded-xl border text-center text-xs font-bold flex flex-col items-center gap-1 transition ${formData.payment_method === 'UPI' ? 'border-[#1C3822] bg-emerald-50 text-[#1C3822]' : 'border-slate-200 text-slate-600'}`}
                  >
                    <QrCode className="w-5 h-5 text-emerald-700" />
                    <span>UPI Instant</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, payment_method: 'Card' })}
                    className={`p-2 rounded-xl border text-center text-xs font-bold flex flex-col items-center gap-1 transition ${formData.payment_method === 'Card' ? 'border-[#1C3822] bg-emerald-50 text-[#1C3822]' : 'border-slate-200 text-slate-600'}`}
                  >
                    <CreditCard className="w-5 h-5 text-emerald-700" />
                    <span>Credit/Debit</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, payment_method: 'Netbanking' })}
                    className={`p-2 rounded-xl border text-center text-xs font-bold flex flex-col items-center gap-1 transition ${formData.payment_method === 'Netbanking' ? 'border-[#1C3822] bg-emerald-50 text-[#1C3822]' : 'border-slate-200 text-slate-600'}`}
                  >
                    <Building className="w-5 h-5 text-emerald-700" />
                    <span>Net Banking</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button 
                  type="button" 
                  onClick={() => setStep('cart')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
                >
                  Back to Cart
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#1C3822] hover:bg-[#2D5A37] text-white font-bold py-2.5 rounded-xl text-sm transition shadow-lg flex items-center justify-center gap-2"
                >
                  {loading ? 'Processing Order...' : `Pay ₹${totalAmount} & Place Order`}
                </button>
              </div>
            </form>
            )
          )}

          {step === 'success' && placedOrder && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="font-serif font-bold text-2xl text-[#1C3822]">Order Successfully Placed!</h4>
              <p className="text-xs text-slate-500 mt-1">Order Ref: <span className="font-mono font-bold text-slate-800">{placedOrder.order_number}</span></p>

              <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-100 my-6 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Customer:</span>
                  <span className="font-bold text-slate-900">{placedOrder.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Delivery Zone:</span>
                  <span className="font-bold text-emerald-800">{formData.delivery_area}, Hyderabad</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-slate-600 shrink-0">Address:</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[200px]">{placedOrder.delivery_address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Paid:</span>
                  <span className="font-bold text-slate-900">₹{placedOrder.total_amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Est. Delivery Slot:</span>
                  <span className="font-semibold text-slate-800">{formData.delivery_slot}</span>
                </div>

                {/* Locked Badge */}
                <div className="mt-2 pt-2 border-t border-emerald-200/80 flex items-center gap-1.5 text-amber-800">
                  <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span className="text-[11px] font-bold">Delivery address locked & cannot be changed post-order.</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button 
                  onClick={() => {
                    onClose();
                    if (onTrackOrder) onTrackOrder();
                  }}
                  className="flex-1 bg-[#1C3822] hover:bg-[#2D5A37] text-white font-bold py-3 rounded-xl shadow-lg transition text-xs flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Track Order Live</span>
                </button>
                <button 
                  onClick={onClose}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
