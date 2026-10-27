import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Plus, Minus, Trash2, ArrowLeft, ArrowRight, CheckCircle2, 
  ShieldCheck, CreditCard, QrCode, MapPin, Clock, Truck, Sparkles, ChevronRight,
  Home, Briefcase, Navigation, Lock, Loader2, BookmarkPlus
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

export default function CartPage({ 
  cart, 
  updateQuantity, 
  removeItem, 
  clearCart, 
  selectedZone, 
  setSelectedZone,
  subPackage, 
  clearSubPackage, 
  setActivePage,
  openAuth 
}) {
  const { showToast } = useToast();
  const { user, isAuthenticated } = useAuth();

  const [step, setStep] = useState('cart'); // 'cart' | 'address' | 'payment' | 'success'
  const [loading, setLoading] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  // Payment form mock state
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [upiId, setUpiId] = useState('user@okaxis');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('789');

  // Location & Saved Addresses state
  const [savedAddresses, setSavedAddresses] = useState(() => {
    try {
      const stored = localStorage.getItem('fresh_saved_addresses');
      return stored ? JSON.parse(stored) : DEFAULT_SAVED_ADDRESSES;
    } catch {
      return DEFAULT_SAVED_ADDRESSES;
    }
  });
  const [selectedAddressId, setSelectedAddressId] = useState('addr-home');
  const [addressTag, setAddressTag] = useState('Home'); // 'Home' | 'Work' | 'Other'
  const [saveAddressForFuture, setSaveAddressForFuture] = useState(true);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    delivery_address: user?.address || DEFAULT_SAVED_ADDRESSES[0].address,
    landmark: DEFAULT_SAVED_ADDRESSES[0].landmark,
    delivery_area: selectedZone || DEFAULT_SAVED_ADDRESSES[0].area,
    delivery_slot: 'Morning 7:30 AM - 8:30 AM',
    delivery_notes: ''
  });

  useEffect(() => {
    if (subPackage) {
      setStep('address');
    }
  }, [subPackage]);

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

  const handleSelectSavedAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setAddressTag(addr.label || 'Home');
    setFormData(prev => ({
      ...prev,
      delivery_address: addr.address,
      landmark: addr.landmark || '',
      delivery_area: addr.area || prev.delivery_area
    }));
    if (addr.area && setSelectedZone) setSelectedZone(addr.area);
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
          // Attempt reverse geocoding via OpenStreetMap Nominatim
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            const displayName = data.display_name || '';
            const addrDetails = data.address || {};
            
            const street = addrDetails.road || addrDetails.suburb || addrDetails.neighbourhood || '';
            const city = addrDetails.city || addrDetails.state_district || 'Hyderabad';
            const postcode = addrDetails.postcode || '';
            const formatted = street ? `${street}, ${city} ${postcode}`.trim() : displayName;

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
              delivery_address: formatted || displayName || `GPS Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
              delivery_area: matchedZone
            }));
            if (setSelectedZone) setSelectedZone(matchedZone);
            setSelectedAddressId(null);
            showToast('Current GPS location detected! Please verify door/flat number.', 'success');
          } else {
            throw new Error('Geocoding response failed');
          }
        } catch {
          setFormData(prev => ({
            ...prev,
            delivery_address: `GPS Pin: ${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E, Hyderabad`
          }));
          showToast('GPS coordinates obtained. Please add your house/flat number.', 'info');
        } finally {
          setDetectingLocation(false);
        }
      },
      (err) => {
        setDetectingLocation(false);
        showToast(err.message || 'Unable to access your location. Please check browser permissions.', 'error');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const totalAmount = subPackage 
    ? subPackage.price 
    : cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const totalCalories = cart.reduce((sum, item) => sum + ((item.calories || 0) * item.quantity), 0);
  const totalProtein = cart.reduce((sum, item) => sum + ((item.protein || 0) * item.quantity), 0);

  const handlePlaceOrder = async (e) => {
    if (e) e.preventDefault();

    if (!isAuthenticated) {
      showToast('Please sign in to confirm and place your order', 'warning');
      if (openAuth) openAuth('customer');
      return;
    }

    setLoading(true);

    // Simulate payment processing
    setTimeout(async () => {
      try {
        const payload = {
          customer_name: formData.customer_name || user.name || 'Valued Customer',
          email: formData.email || user.email || 'customer@mymorning.in',
          phone: formData.phone || user.phone || '9876543210',
          delivery_address: formData.delivery_address,
          landmark: formData.landmark || '',
          delivery_area: formData.delivery_area,
          payment_method: paymentMethod,
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
                  landmark: formData.landmark || '',
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
          showToast(`Order #${response.order_number || 'MYM-101'} placed successfully!`, 'success');
        }
      } catch (err) {
        setLoading(false);
        showToast('Failed to place order. Please try again.', 'error');
      }
    }, 1200);
  };

  // STEP 4: ORDER SUCCESS VIEW
  if (step === 'success' && placedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-8 animate-fade-in">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-emerald-100 shadow-xl space-y-6">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Payment Confirmed
            </span>
            <h1 className="font-serif font-bold text-3xl sm:text-4xl text-slate-900 mt-3">
              Thank You for Ordering!
            </h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto mt-2">
              Your wholesome meal is being prepared fresh. You can track preparation and delivery updates in real-time.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 max-w-md mx-auto text-left space-y-3 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">Order Number:</span>
              <span className="font-bold text-slate-900 text-sm font-mono">#{placedOrder.order_number}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">Total Paid:</span>
              <span className="font-bold text-emerald-800 text-sm">₹{placedOrder.total_amount}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">Delivery Zone:</span>
              <span className="font-bold text-slate-800">{placedOrder.delivery_area}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">Delivery Slot:</span>
              <span className="font-bold text-slate-800">{formData.delivery_slot}</span>
            </div>
            <div className="flex justify-between items-start pt-1">
              <span className="text-slate-500 font-medium shrink-0">Address:</span>
              <span className="font-medium text-slate-800 text-right max-w-[200px]">{placedOrder.delivery_address}</span>
            </div>

            {/* Locked Address Alert */}
            <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[11px] block text-amber-950">Delivery Location Locked</span>
                <span className="text-[10px] text-amber-700 leading-tight block mt-0.5">
                  This location is permanently fixed for kitchen dispatch and rider routing. It cannot be altered once ordered.
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <button
              onClick={() => setActivePage('customer')}
              className="bg-[#1C3822] hover:bg-[#2A5232] text-white font-bold px-6 py-3.5 rounded-2xl text-xs transition shadow-md flex items-center justify-center gap-2"
            >
              <Truck className="w-4 h-4 text-emerald-300" />
              <span>Track in My Orders</span>
            </button>
            <button
              onClick={() => setActivePage('menu')}
              className="bg-white hover:bg-slate-100 text-slate-800 font-bold px-6 py-3.5 rounded-2xl text-xs transition border border-slate-300 flex items-center justify-center gap-2"
            >
              <span>Order More Food</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header & Breadcrumb Nav */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <button onClick={() => setActivePage('home')} className="hover:text-slate-800">Home</button>
            <span>/</span>
            <button onClick={() => setActivePage('menu')} className="hover:text-slate-800">Menu</button>
            <span>/</span>
            <span className="font-bold text-[#1C3822]">Full Page Cart</span>
          </div>
          <h1 className="font-serif font-bold text-3xl text-slate-900">
            {subPackage ? `Subscription Checkout (${subPackage.name})` : 'Your Shopping Cart'}
          </h1>
        </div>

        {/* Step Tabs */}
        <div className="flex items-center bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm text-xs font-bold">
          <button
            onClick={() => setStep('cart')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              step === 'cart' ? 'bg-[#1C3822] text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>1. Review Cart</span>
          </button>
          <ChevronRight className="w-4 h-4 text-slate-300 mx-0.5" />
          <button
            onClick={() => {
              if (cart.length > 0 || subPackage) setStep('address');
            }}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              step === 'address' ? 'bg-[#1C3822] text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>2. Delivery Address</span>
          </button>
          <ChevronRight className="w-4 h-4 text-slate-300 mx-0.5" />
          <button
            onClick={() => {
              if (cart.length > 0 || subPackage) setStep('payment');
            }}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              step === 'payment' ? 'bg-[#1C3822] text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>3. Payment</span>
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 8 Columns: Active Step Content */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* STEP 1: CART REVIEW */}
          {step === 'cart' && (
            <div className="space-y-6">
              {cart.length === 0 && !subPackage ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-800 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <ShoppingBag className="w-10 h-10" />
                  </div>
                  <h3 className="font-serif font-bold text-2xl text-slate-900">Your Cart is Currently Empty</h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">
                    You haven't added any healthy diet items yet. Explore our chef-crafted breakfast, protein toasts, and fresh bowls!
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setActivePage('menu')}
                      className="bg-[#1C3822] hover:bg-[#2A5232] text-white font-bold px-6 py-3 rounded-xl text-xs transition shadow-md inline-flex items-center gap-2"
                    >
                      <span>Explore Healthy Menu</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Cart Nutrition Highlights Bar */}
                  <div className="bg-emerald-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-300" />
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">Total Nutrition in Cart:</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold">
                      <span className="bg-emerald-800/80 px-3 py-1 rounded-full border border-emerald-700/60">
                        🔥 {totalCalories} Total kcal
                      </span>
                      <span className="bg-emerald-800/80 px-3 py-1 rounded-full border border-emerald-700/60">
                        💪 {totalProtein.toFixed(1)}g Total Protein
                      </span>
                    </div>
                  </div>

                  {/* Sub Package Banner if selected */}
                  {subPackage && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-amber-800 uppercase bg-amber-200 px-2 py-0.5 rounded">Monthly Package</span>
                        <h4 className="font-serif font-bold text-slate-900 text-base mt-1">{subPackage.name}</h4>
                        <p className="text-xs text-slate-600">{subPackage.total_meals} Meals • {subPackage.duration_days} Days Validity</p>
                      </div>
                      <div className="text-right">
                        <span className="font-serif font-bold text-xl text-slate-900">₹{subPackage.price}</span>
                        <button
                          onClick={clearSubPackage}
                          className="block text-[11px] text-red-600 hover:underline font-bold mt-1"
                        >
                          Remove Package
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
                    {cart.map((item) => (
                      <div key={item.id} className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                        <div className="flex items-center gap-4">
                          <img
                            src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80'}
                            alt={item.name}
                            className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                                item.diet_type === 'non_veg' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {item.diet_type?.replace('_', '-')}
                              </span>
                              {item.unit_info && (
                                <span className="text-[11px] text-slate-500 font-medium">({item.unit_info})</span>
                              )}
                            </div>
                            <h4 className="font-serif font-bold text-slate-900 text-base">{item.name}</h4>
                            <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>
                            <div className="flex items-center gap-3 text-[11px] text-slate-600 font-semibold mt-1">
                              <span>🔥 {item.calories} kcal</span>
                              <span>•</span>
                              <span>💪 {item.protein}g protein</span>
                            </div>
                          </div>
                        </div>

                        {/* Controls & Price */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <span className="font-serif font-bold text-lg text-emerald-800">
                            ₹{item.price * item.quantity}
                          </span>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center border border-slate-300 rounded-xl bg-slate-50 p-1">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition shadow-xs"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-8 text-center text-xs font-bold text-slate-800">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition shadow-xs"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cart Footer Actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <button
                      onClick={clearCart}
                      className="text-xs text-slate-500 hover:text-red-600 font-bold underline transition"
                    >
                      Clear All Items
                    </button>
                    <div className="flex gap-3 w-full sm:w-auto">
                      <button
                        onClick={() => setActivePage('menu')}
                        className="flex-1 sm:flex-none px-5 py-3 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 font-bold text-xs text-slate-700 transition"
                      >
                        + Add More Items
                      </button>
                      <button
                        onClick={() => setStep('address')}
                        className="flex-1 sm:flex-none px-6 py-3 rounded-2xl bg-[#1C3822] hover:bg-[#2A5232] text-white font-bold text-xs transition shadow flex items-center justify-center gap-1.5"
                      >
                        <span>Proceed to Delivery</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 2: DELIVERY ADDRESS & TIME */}
          {step === 'address' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-serif font-bold text-xl text-slate-900">Delivery Information</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Enter your Hyderabad location and preferred delivery slot.</p>
                </div>

                {/* GPS Auto-Detect Button */}
                <button
                  type="button"
                  onClick={handleDetectCurrentLocation}
                  disabled={detectingLocation}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs transition shadow-xs"
                >
                  {detectingLocation ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                      <span>Detecting Location...</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4 text-emerald-700" />
                      <span>Use Current Location (GPS)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Saved Locations Selector */}
              {savedAddresses && savedAddresses.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Saved Delivery Locations</span>
                    </label>
                    <span className="text-[11px] text-slate-400">Click to auto-fill</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {savedAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id || formData.delivery_address === addr.address;
                      const IconComponent = addr.label === 'Home' ? Home : addr.label === 'Work' ? Briefcase : MapPin;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => handleSelectSavedAddress(addr)}
                          className={`p-3.5 rounded-2xl border text-left cursor-pointer transition flex items-start justify-between gap-3 ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-xl mt-0.5 ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-900">{addr.label}</span>
                                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                  {addr.area}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">{addr.address}</p>
                              {addr.landmark && (
                                <p className="text-[10px] text-slate-400">Landmark: {addr.landmark}</p>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-3 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-3 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="10-digit mobile number"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-3 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="receipts@example.com"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Delivery Address *</label>
                    <span className="text-[11px] text-slate-400">Door / Flat, Building, Street</span>
                  </div>
                  <textarea
                    rows="2"
                    required
                    value={formData.delivery_address}
                    onChange={(e) => {
                      setFormData({ ...formData, delivery_address: e.target.value });
                      setSelectedAddressId(null);
                    }}
                    className="w-full border border-slate-300 rounded-xl p-3 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Flat No, Building Name, Street..."
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Landmark (Optional)</label>
                  <input
                    type="text"
                    value={formData.landmark}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-3 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Near Metro Station, Mindspace..."
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hyderabad Delivery Zone</label>
                  <select
                    value={formData.delivery_area}
                    onChange={(e) => {
                      setFormData({ ...formData, delivery_area: e.target.value });
                      if (setSelectedZone) setSelectedZone(e.target.value);
                    }}
                    className="w-full border border-slate-300 rounded-xl p-3 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium bg-white"
                  >
                    <option value="Hitech City">Hitech City</option>
                    <option value="Madhapur">Madhapur</option>
                    <option value="Gachibowli">Gachibowli</option>
                    <option value="Kondapur">Kondapur</option>
                    <option value="Financial District">Financial District</option>
                    <option value="Jubilee Hills">Jubilee Hills</option>
                    <option value="Banjara Hills">Banjara Hills</option>
                  </select>
                </div>

                {/* Location Type / Tag Selector (Home, Work, Other) */}
                <div className="sm:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">Save / Tag Location As</span>
                      <span className="text-[11px] text-slate-500">Categorize this address for quick 1-click checkout</span>
                    </div>

                    <div className="flex items-center gap-2">
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
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                              isTag 
                                ? 'bg-[#1C3822] text-white shadow-xs' 
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-slate-200/70">
                    <input
                      type="checkbox"
                      checked={saveAddressForFuture}
                      onChange={(e) => setSaveAddressForFuture(e.target.checked)}
                      className="rounded text-emerald-700 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span className="text-slate-700 font-medium text-xs">
                      Save this delivery address to my address book for future orders
                    </span>
                  </label>
                </div>

                {/* Strict Location Lock Warning Notice */}
                <div className="sm:col-span-2 bg-amber-50/90 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                  <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-xs text-amber-950 block">
                      Delivery Location Policy (Immutable Once Ordered)
                    </span>
                    <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                      Once this order is confirmed, the delivery address and zone are strictly <strong>locked and cannot be changed</strong>. This ensures fresh meal scheduling, temperature-controlled transit, and dedicated rider dispatch.
                    </p>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Delivery Slot</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      'Morning 7:30 AM - 8:30 AM',
                      'Noon 12:30 PM - 1:30 PM',
                      'Evening 7:30 PM - 8:30 PM'
                    ].map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setFormData({ ...formData, delivery_slot: slot })}
                        className={`p-3 rounded-xl border text-left font-bold transition flex items-center justify-between ${
                          formData.delivery_slot === slot
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{slot}</span>
                        {formData.delivery_slot === slot && <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="px-5 py-3 rounded-2xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Cart</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!formData.customer_name || !formData.phone || !formData.delivery_address) {
                      showToast('Please fill in required delivery fields', 'warning');
                      return;
                    }
                    setStep('payment');
                  }}
                  className="px-6 py-3 rounded-2xl bg-[#1C3822] hover:bg-[#2A5232] text-white font-bold text-xs transition shadow flex items-center gap-1.5"
                >
                  <span>Continue to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT METHOD */}
          {step === 'payment' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="font-serif font-bold text-xl text-slate-900">Choose Payment Method</h3>
                <p className="text-xs text-slate-500 mt-0.5">100% Safe & Secure Dummy Payment Environment.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                  { id: 'Card', label: 'Credit/Debit Card', icon: CreditCard },
                  { id: 'NetBanking', label: 'Net Banking', icon: ShieldCheck },
                  { id: 'COD', label: 'Pay on Delivery', icon: Truck },
                ].map((pm) => {
                  const Icon = pm.icon;
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id)}
                      className={`p-4 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-2 ${
                        paymentMethod === pm.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-5 h-5 text-emerald-700" />
                      <span className="text-xs font-bold">{pm.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Payment Details Form */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs space-y-3">
                {paymentMethod === 'UPI' && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Enter UPI ID or Mobile Number</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl p-2.5 bg-white text-slate-800"
                      placeholder="e.g. 9876543210@paytm or user@okhdfcbank"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Dummy payment mode is active. Instant approval without OTP.
                    </span>
                  </div>
                )}

                {paymentMethod === 'Card' && (
                  <div className="space-y-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl p-2.5 bg-white text-slate-800 font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full border border-slate-300 rounded-xl p-2.5 bg-white text-slate-800 font-mono"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">CVV</label>
                        <input
                          type="password"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full border border-slate-300 rounded-xl p-2.5 bg-white text-slate-800 font-mono"
                          maxLength={3}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'NetBanking' && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Select Bank</label>
                    <select className="w-full border border-slate-300 rounded-xl p-2.5 bg-white text-slate-800 font-medium">
                      <option>HDFC Bank</option>
                      <option>ICICI Bank</option>
                      <option>State Bank of India (SBI)</option>
                      <option>Axis Bank</option>
                    </select>
                  </div>
                )}

                {paymentMethod === 'COD' && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                    Please keep cash or UPI QR scanner ready upon delivery partner arrival.
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('address')}
                  className="px-5 py-3 rounded-2xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Address</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handlePlaceOrder}
                  className="px-8 py-3.5 rounded-2xl bg-[#1C3822] hover:bg-[#2A5232] text-white font-bold text-xs transition shadow-lg flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span>Processing Payment...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-300" />
                      <span>Pay ₹{totalAmount} & Place Order</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right 4 Columns: Sticky Order Summary */}
        <div className="lg:col-span-4 space-y-6 sticky top-24">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <h3 className="font-serif font-bold text-lg text-slate-900 border-b border-slate-100 pb-3">
              Order Bill Summary
            </h3>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-800">₹{totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charges ({formData.delivery_area})</span>
                <span className="font-bold text-emerald-700">FREE</span>
              </div>
              <div className="flex justify-between">
                <span>Diet Packaging & Eco Box</span>
                <span className="font-bold text-emerald-700">FREE</span>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-base">
                <span className="font-serif font-bold text-slate-900">Total Payable</span>
                <span className="font-serif font-bold text-2xl text-emerald-800">₹{totalAmount}</span>
              </div>
            </div>

            {/* Quick Details Pill */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-bold">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                <span>Zone: {formData.delivery_area}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Slot: {formData.delivery_slot}</span>
              </div>
            </div>

            {!isAuthenticated && (
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-xs space-y-2">
                <span className="font-bold text-amber-900 block">Sign In Notice</span>
                <p className="text-amber-800 text-[11px]">
                  You can browse and adjust your cart freely. You'll be asked to sign in before final payment.
                </p>
                <button
                  onClick={() => openAuth && openAuth('customer')}
                  className="text-amber-900 font-extrabold underline hover:text-amber-950 block text-[11px]"
                >
                  Sign In Now →
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
