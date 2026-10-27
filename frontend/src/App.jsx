import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import SubscriptionPlansPage from './pages/SubscriptionPlansPage';
import MonthlyMenuCalendarPage from './pages/MonthlyMenuCalendarPage';
import NutritionTrackerPage from './pages/NutritionTrackerPage';
import CustomerDashboardPage from './pages/CustomerDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import DeliveryPartnerDashboardPage from './pages/DeliveryPartnerDashboardPage';
import CartPage from './pages/CartPage';

import CustomPlanQuizModal from './components/CustomPlanQuizModal';
import ItemNutritionModal from './components/ItemNutritionModal';
import AuthModal from './components/AuthModal';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { apiService } from './services/api';

function AppContent() {
  const { isAuthenticated, role } = useAuth();
  const { showToast } = useToast();
  const [activePage, setActivePage] = useState('home');
  const [foodItems, setFoodItems] = useState([]);
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('fresh_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [selectedZone, setSelectedZone] = useState('Hitech City');

  // Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedSubPackage, setSelectedSubPackage] = useState(null);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authTargetRole, setAuthTargetRole] = useState('customer');
  const [inspectedItem, setInspectedItem] = useState(null);

  useEffect(() => {
    apiService.getFoodItems().then(data => {
      if (data && data.length > 0) setFoodItems(data);
    });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('fresh_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Error storing cart in localStorage', e);
    }
  }, [cart]);

  const openAuthModal = (targetRole = 'customer') => {
    setAuthTargetRole(targetRole);
    setIsAuthOpen(true);
  };

  const handleAuthSuccess = (loggedRole) => {
    showToast(`Signed in successfully as ${loggedRole.toUpperCase()}`, 'success');
    if (loggedRole === 'admin') setActivePage('admin');
    else if (loggedRole === 'delivery') setActivePage('delivery');
    else setActivePage('customer');
  };

  // Cart operations
  const addToCart = (item) => {
    setCart(prevCart => {
      const existing = prevCart.find(i => i.id === item.id);
      if (existing) {
        return prevCart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
    showToast(`Added "${item.name}" to cart!`, 'success');
  };

  const updateQuantity = (id, newQty) => {
    if (newQty <= 0) {
      removeItem(id);
      return;
    }
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: newQty } : item));
  };

  const removeItem = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
    showToast('Item removed from cart', 'info');
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('fresh_cart');
  };

  return (
    <div className="app-container bg-[#F5F7F2] text-slate-900 min-h-screen font-sans flex flex-col justify-between">
      
      <div>
        <Navbar 
          activePage={activePage}
          setActivePage={setActivePage}
          cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)}
          openCart={() => setActivePage('cart')}
          openQuiz={() => setIsQuizOpen(true)}
          openAuth={openAuthModal}
          selectedZone={selectedZone}
          setSelectedZone={setSelectedZone}
        />

        <main className="transition-all duration-300">
          {activePage === 'home' && (
            <HomePage 
              setActivePage={setActivePage}
              openQuiz={() => setIsQuizOpen(true)}
              foodItems={foodItems}
              addToCart={addToCart}
              inspectItem={(item) => setInspectedItem(item)}
            />
          )}

          {activePage === 'menu' && (
            <MenuPage 
              foodItems={foodItems}
              addToCart={addToCart}
              inspectItem={(item) => setInspectedItem(item)}
            />
          )}

          {activePage === 'cart' && (
            <CartPage 
              cart={cart}
              updateQuantity={updateQuantity}
              removeItem={removeItem}
              clearCart={clearCart}
              selectedZone={selectedZone}
              setSelectedZone={setSelectedZone}
              subPackage={selectedSubPackage}
              clearSubPackage={() => setSelectedSubPackage(null)}
              setActivePage={setActivePage}
              openAuth={openAuthModal}
            />
          )}

          {activePage === 'plans' && (
            <SubscriptionPlansPage 
              openQuiz={() => setIsQuizOpen(true)}
              selectedZone={selectedZone}
              openCart={() => setActivePage('cart')}
              onSubscribePlan={(plan) => {
                setSelectedSubPackage(plan);
                setActivePage('cart');
              }}
            />
          )}

          {activePage === 'calendar' && (
            <MonthlyMenuCalendarPage 
              setActivePage={setActivePage}
              foodItems={foodItems}
              addToCart={addToCart}
              inspectItem={(item) => setInspectedItem(item)}
            />
          )}

          {activePage === 'tracker' && (
            <NutritionTrackerPage 
              foodItems={foodItems}
              addToCart={addToCart}
            />
          )}

          {/* Protected Customer Dashboard */}
          {(activePage === 'customer' || activePage === 'dashboard') && (
            isAuthenticated ? (
              <CustomerDashboardPage selectedZone={selectedZone} />
            ) : (
              <div className="max-w-md mx-auto my-16 p-8 bg-white border border-slate-200 rounded-3xl shadow-xl text-center space-y-4">
                <h3 className="font-serif font-bold text-xl text-slate-900">Customer Sign In Required</h3>
                <p className="text-xs text-slate-500">Please sign in or create an account to view your subscriptions and order history.</p>
                <button
                  onClick={() => openAuthModal('customer')}
                  className="w-full py-3 bg-[#1C3822] text-white font-bold text-xs rounded-xl shadow hover:bg-[#2D5A37] transition"
                >
                  Sign In / Register
                </button>
              </div>
            )
          )}

          {/* Protected Admin Dashboard */}
          {activePage === 'admin' && (
            isAuthenticated && role === 'admin' ? (
              <AdminDashboardPage foodItems={foodItems} setFoodItems={setFoodItems} />
            ) : (
              <div className="max-w-md mx-auto my-16 p-8 bg-white border border-slate-200 rounded-3xl shadow-xl text-center space-y-4">
                <h3 className="font-serif font-bold text-xl text-slate-900">Admin Sign In Required</h3>
                <p className="text-xs text-slate-500">Authorized personnel only. Please sign in with your admin credentials.</p>
                <button
                  onClick={() => openAuthModal('admin')}
                  className="w-full py-3 bg-amber-500 text-amber-950 font-bold text-xs rounded-xl shadow hover:bg-amber-400 transition"
                >
                  Sign In as Admin
                </button>
              </div>
            )
          )}

          {/* Protected Delivery Dashboard */}
          {activePage === 'delivery' && (
            isAuthenticated && role === 'delivery' ? (
              <DeliveryPartnerDashboardPage />
            ) : (
              <div className="max-w-md mx-auto my-16 p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-center text-slate-200 space-y-4">
                <h3 className="font-serif font-bold text-xl text-white">Delivery Partner Sign In Required</h3>
                <p className="text-xs text-slate-400">Log in with your delivery partner phone number or email to view assigned orders.</p>
                <button
                  onClick={() => openAuthModal('delivery')}
                  className="w-full py-3 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow hover:bg-indigo-500 transition"
                >
                  Sign In as Delivery Partner
                </button>
              </div>
            )
          )}
        </main>
      </div>

      <Footer setActivePage={setActivePage} />

      {/* Global Interactive Modals */}
      <CustomPlanQuizModal 
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        selectedZone={selectedZone}
        setActivePage={setActivePage}
      />

      <ItemNutritionModal 
        item={inspectedItem}
        onClose={() => setInspectedItem(null)}
        addToCart={addToCart}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        defaultRole={authTargetRole}
        onSuccessRedirect={handleAuthSuccess}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}



