import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Users, TrendingUp, ShoppingBag, Truck, Plus, Edit, Trash2, 
  CheckCircle2, RefreshCw, UserCheck, Search, Filter, Layers, Check, X,
  Calendar, Utensils, Sparkles
} from 'lucide-react';
import { apiService } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function AdminDashboardPage({ foodItems, setFoodItems }) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'products' | 'packages' | 'partners' | 'users' | 'monthly_menu' | 'analytics'
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [mealPlans, setMealPlans] = useState([]);
  const [monthlyMenus, setMonthlyMenus] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search States for Every Tab
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [planSearchQuery, setPlanSearchQuery] = useState('');
  const [partnerSearchQuery, setPartnerSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');

  // 30-Day Menu State
  const [dayMenuSearchQuery, setDayMenuSearchQuery] = useState('');
  const [showDayMenuModal, setShowDayMenuModal] = useState(false);
  const [editingDayMenu, setEditingDayMenu] = useState(null);
  const [dayMenuForm, setDayMenuForm] = useState({
    day_number: 1,
    breakfast: '',
    lunch: '',
    dinner: '',
    total_calories: 1450,
    item_ids: []
  });
  const [catalogItemSearchInModal, setCatalogItemSearchInModal] = useState('');

  // Delivery Partner Modal State
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [newPartner, setNewPartner] = useState({
    name: '',
    phone: '',
    email: '',
    vehicle_number: 'TS 09 AB 1234',
    assigned_area: 'Hitech City'
  });

  // User Accounts Modal State
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'User@123',
    role: 'customer',
    assigned_area: 'Hitech City',
    vehicle_number: 'TS 09 AB 1234'
  });

  // Filters & Pagination State
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [orderPage, setOrderPage] = useState(1);
  const ORDERS_PER_PAGE = 8;

  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');
  const [productDietFilter, setProductDietFilter] = useState('');
  const [productPage, setProductPage] = useState(1);
  const PRODUCTS_PER_PAGE = 6;

  // Modals State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [imageFileBase64, setImageFileBase64] = useState('');

  // Manual Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');

  // Package Modal State
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [newPlan, setNewPlan] = useState({
    name: '',
    tag: '1 Meal per Day',
    price: 4999,
    meals_per_day: 1,
    total_meals: 26,
    duration_days: 30,
    description: '',
    features: '1 Fresh Meal Daily, Calorie & Macro Tracked, Free Delivery',
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
  });

  // New Food Item Form State
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: 179,
    unit_info: '450g bowl',
    calories: 450,
    protein: 35,
    carbs: 42,
    fat: 12,
    fiber: 6,
    category: 3,
    diet_type: 'veg',
    ingredients: 'Broccoli, Carrot, Rice, Pink Salt',
    is_bestseller: false,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
  });

  useEffect(() => {
    loadAllData();
    const interval = setInterval(() => {
      loadAllData();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [analyticsData, ordersData, partnersData, catData, itemsData, plansData, monthlyMenuData, usersData] = await Promise.all([
        apiService.getAdminAnalytics(),
        apiService.getOrders(),
        apiService.getDeliveryPartners(),
        apiService.getCategories(),
        apiService.getAllFoodItems(),
        apiService.getMealPlans(),
        apiService.getMonthlyMenu(),
        apiService.getUsers()
      ]);
      setAnalytics(analyticsData);
      setOrders(ordersData);
      setDeliveryPartners(partnersData);
      setCategories(catData);
      setMealPlans(plansData || []);
      setMonthlyMenus(monthlyMenuData || []);
      setUsers(usersData || []);
      if (setFoodItems) setFoodItems(itemsData);
    } catch (e) {
      console.error('Failed loading admin data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleImageFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageFileBase64(reader.result);
        showToast('Image file loaded successfully!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const res = await apiService.createCategory({
        name: newCategoryName.trim(),
        description: newCategoryDesc.trim()
      });
      showToast(`Category "${res.name}" active!`, 'success');
      setShowCategoryModal(false);
      setNewCategoryName('');
      setNewCategoryDesc('');
      const updatedCats = await apiService.getCategories();
      setCategories(updatedCats);
      if (res && res.id) {
        setNewItem(prev => ({ ...prev, category: res.id }));
      }
    } catch (err) {
      showToast('Error creating category', 'error');
    }
  };

  const handleCreateOrUpdateFood = async (e) => {
    e.preventDefault();
    try {
      const finalImage = newItem.image_url.trim() || imageFileBase64 || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';

      const payload = {
        name: newItem.name,
        description: newItem.description || 'Nutritional diet bowl',
        price: parseFloat(newItem.price),
        unit_info: newItem.unit_info || '1 Plate',
        calories: parseInt(newItem.calories) || 350,
        protein: parseFloat(newItem.protein) || 20,
        carbs: parseFloat(newItem.carbs) || 30,
        fat: parseFloat(newItem.fat) || 10,
        fiber: parseFloat(newItem.fiber) || 5,
        category: parseInt(newItem.category) || 1,
        diet_type: newItem.diet_type || 'veg',
        ingredients: newItem.ingredients || 'Fresh healthy ingredients',
        is_bestseller: newItem.is_bestseller,
        is_available: newItem.is_available,
        image_url: finalImage
      };

      if (editingItem) {
        await apiService.updateFoodItem(editingItem.id, payload);
        showToast(`Successfully updated "${payload.name}"!`, 'success');
      } else {
        await apiService.createFoodItem(payload);
        showToast(`Successfully added "${payload.name}" to database catalog!`, 'success');
      }

      setShowAddModal(false);
      setEditingItem(null);
      setImageFileBase64('');
      resetForm();
      const updatedItems = await apiService.getAllFoodItems();
      if (setFoodItems) setFoodItems(updatedItems);
    } catch (err) {
      showToast('Error saving product to database', 'error');
    }
  };

  const resetForm = () => {
    setNewItem({
      name: '',
      description: '',
      price: 179,
      unit_info: '450g bowl',
      calories: 450,
      protein: 35,
      carbs: 42,
      fat: 12,
      fiber: 6,
      category: 3,
      diet_type: 'veg',
      ingredients: 'Broccoli, Carrot, Rice, Pink Salt',
      is_bestseller: false,
      is_available: true,
      image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
    });
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      description: item.description,
      price: item.price,
      unit_info: item.unit_info || '450g bowl',
      calories: item.calories || 350,
      protein: item.protein || 20,
      carbs: item.carbs || 30,
      fat: item.fat || 10,
      fiber: item.fiber || 5,
      category: item.category || 1,
      diet_type: item.diet_type || 'veg',
      ingredients: item.ingredients || '',
      is_bestseller: item.is_bestseller || false,
      is_available: item.is_available !== false,
      image_url: item.image_url || ''
    });
    setShowAddModal(true);
  };

  const handleDeleteFood = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from database?`)) {
      try {
        await apiService.deleteFoodItem(id);
        const updatedItems = await apiService.getAllFoodItems();
        if (setFoodItems) setFoodItems(updatedItems);
        showToast(`Product "${name}" deleted successfully`, 'info');
      } catch (err) {
        showToast('Failed to delete product', 'error');
      }
    }
  };

  const resetPlanForm = () => {
    setNewPlan({
      name: '',
      tag: '1 Meal per Day',
      price: 4999,
      meals_per_day: 1,
      total_meals: 26,
      duration_days: 30,
      description: '',
      features: '1 Fresh Meal Daily, Calorie & Macro Tracked, Free Delivery',
      image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
    });
  };

  const openPlanEditModal = (plan) => {
    setEditingPlan(plan);
    setNewPlan({
      name: plan.name,
      tag: plan.tag || 'Monthly Plan',
      price: plan.price,
      meals_per_day: plan.meals_per_day || 1,
      total_meals: plan.total_meals || 26,
      duration_days: plan.duration_days || 30,
      description: plan.description || '',
      features: plan.features || (plan.features_list ? plan.features_list.join(', ') : ''),
      image_url: plan.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
    });
    setShowPlanModal(true);
  };

  const handleCreateOrUpdateMealPlan = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: newPlan.name,
        tag: newPlan.tag,
        price: parseFloat(newPlan.price),
        meals_per_day: parseInt(newPlan.meals_per_day),
        total_meals: parseInt(newPlan.total_meals),
        duration_days: parseInt(newPlan.duration_days),
        description: newPlan.description || 'Monthly food package plan',
        features: newPlan.features || 'Daily fresh delivery, Macro tracked',
        image_url: newPlan.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
      };

      if (editingPlan) {
        await apiService.updateMealPlan(editingPlan.id, payload);
        showToast(`Successfully updated subscription package "${payload.name}"!`, 'success');
      } else {
        await apiService.createMealPlan(payload);
        showToast(`Successfully created subscription package "${payload.name}"!`, 'success');
      }

      setShowPlanModal(false);
      setEditingPlan(null);
      resetPlanForm();
      await loadAllData();
    } catch (err) {
      showToast('Error saving subscription package', 'error');
    }
  };

  const handleDeleteMealPlan = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete subscription package "${name}"?`)) {
      try {
        await apiService.deleteMealPlan(id);
        await loadAllData();
        showToast(`Package "${name}" deleted successfully`, 'info');
      } catch (err) {
        showToast('Failed to delete package', 'error');
      }
    }
  };

  // 30-Day Menu Handlers
  const openDayMenuModal = (dayMenu, dayNumber) => {
    setEditingDayMenu(dayMenu || null);
    const existingItemIds = dayMenu?.items ? dayMenu.items.map(it => typeof it === 'object' ? it.id : it) : [];
    setDayMenuForm({
      day_number: dayMenu?.day_number || dayNumber || 1,
      breakfast: dayMenu?.breakfast || '',
      lunch: dayMenu?.lunch || '',
      dinner: dayMenu?.dinner || '',
      total_calories: dayMenu?.total_calories || 1450,
      item_ids: existingItemIds
    });
    setCatalogItemSearchInModal('');
    setShowDayMenuModal(true);
  };

  const handleToggleItemInDayMenu = (itemId) => {
    setDayMenuForm(prev => {
      const exists = prev.item_ids.includes(itemId);
      const nextItemIds = exists 
        ? prev.item_ids.filter(id => id !== itemId)
        : [...prev.item_ids, itemId];
      return { ...prev, item_ids: nextItemIds };
    });
  };

  const handleSaveDayMenu = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        day_number: Number(dayMenuForm.day_number),
        breakfast: dayMenuForm.breakfast,
        lunch: dayMenuForm.lunch,
        dinner: dayMenuForm.dinner,
        total_calories: Number(dayMenuForm.total_calories),
        item_ids: dayMenuForm.item_ids
      };

      if (editingDayMenu && editingDayMenu.id) {
        await apiService.updateMonthlyMenu(editingDayMenu.id, payload);
        showToast(`Day ${payload.day_number} menu updated successfully!`, 'success');
      } else {
        const existing = monthlyMenus.find(m => m.day_number === payload.day_number);
        if (existing && existing.id) {
          await apiService.updateMonthlyMenu(existing.id, payload);
        } else {
          await apiService.createMonthlyMenu(payload);
        }
        showToast(`Day ${payload.day_number} menu saved successfully!`, 'success');
      }
      setShowDayMenuModal(false);
      await loadAllData();
    } catch (err) {
      console.error('Failed to save day menu', err);
      showToast('Error saving 30-day menu item', 'error');
    }
  };

  // Delivery Partner Handlers
  const handleCreatePartner = async (e) => {
    e.preventDefault();
    if (!newPartner.name.trim() || !newPartner.phone.trim()) {
      showToast('Name and phone are required', 'error');
      return;
    }
    try {
      await apiService.createDeliveryPartner(newPartner);
      showToast(`Delivery partner "${newPartner.name}" registered successfully!`, 'success');
      setShowPartnerModal(false);
      setNewPartner({ name: '', phone: '', email: '', vehicle_number: 'TS 09 AB 1234', assigned_area: 'Hitech City' });
      await loadAllData();
    } catch (err) {
      showToast('Failed to register delivery partner', 'error');
    }
  };

  const handleDeletePartner = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove delivery partner "${name}"?`)) {
      try {
        await apiService.deleteDeliveryPartner(id);
        showToast(`Delivery partner "${name}" removed`, 'info');
        await loadAllData();
      } catch (err) {
        showToast('Failed to delete delivery partner', 'error');
      }
    }
  };

  // User Accounts Handlers
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.email.trim()) {
      showToast('Email is required', 'error');
      return;
    }
    try {
      await apiService.createUser(newUser);
      showToast(`User account for "${newUser.email}" created successfully!`, 'success');
      setShowUserModal(false);
      setNewUser({ name: '', email: '', phone: '', password: 'User@123', role: 'customer', assigned_area: 'Hitech City', vehicle_number: 'TS 09 AB 1234' });
      await loadAllData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create user account', 'error');
    }
  };

  const handleDeleteUser = async (id, email) => {
    if (window.confirm(`Are you sure you want to delete user account "${email}"?`)) {
      try {
        await apiService.deleteUser(id);
        showToast(`User "${email}" deleted`, 'info');
        await loadAllData();
      } catch (err) {
        showToast('Failed to delete user', 'error');
      }
    }
  };

  const handleAssignDeliveryPartner = async (orderId, partnerId) => {
    try {
      await apiService.assignDeliveryPartner(orderId, partnerId);
      await loadAllData();
      showToast('Delivery Partner assigned successfully!', 'success');
    } catch (err) {
      showToast('Failed to assign delivery partner', 'error');
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await apiService.updateOrderStatus(orderId, status);
      await loadAllData();
      showToast(`Order status updated to "${status}"`, 'info');
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  // Filter & Paginate Orders with Status + Full Text Search
  const filteredOrders = orders.filter(o => {
    const matchesStatus = !orderStatusFilter || o.status === orderStatusFilter;
    const matchesSearch = !orderSearchQuery ||
      o.order_number?.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      o.phone?.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      o.email?.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      o.delivery_area?.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      o.delivery_address?.toLowerCase().includes(orderSearchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalOrderPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));
  const paginatedOrders = filteredOrders.slice((orderPage - 1) * ORDERS_PER_PAGE, orderPage * ORDERS_PER_PAGE);

  // Filter & Paginate Products
  const filteredProducts = (foodItems || []).filter(item => {
    const matchesSearch = !productSearchQuery || 
      item.name.toLowerCase().includes(productSearchQuery.toLowerCase()) || 
      item.description.toLowerCase().includes(productSearchQuery.toLowerCase());
    
    const matchesCategory = !productCategoryFilter || item.category === Number(productCategoryFilter);
    const matchesDiet = !productDietFilter || item.diet_type === productDietFilter;

    return matchesSearch && matchesCategory && matchesDiet;
  });

  const totalProductPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const paginatedProducts = filteredProducts.slice((productPage - 1) * PRODUCTS_PER_PAGE, productPage * PRODUCTS_PER_PAGE);

  // Filter Packages
  const filteredPlans = (mealPlans || []).filter(plan => {
    if (!planSearchQuery) return true;
    const q = planSearchQuery.toLowerCase();
    return (
      plan.name?.toLowerCase().includes(q) ||
      plan.tag?.toLowerCase().includes(q) ||
      plan.description?.toLowerCase().includes(q) ||
      plan.features?.toLowerCase().includes(q)
    );
  });

  // Filter Delivery Partners
  const filteredPartners = (deliveryPartners || []).filter(partner => {
    if (!partnerSearchQuery) return true;
    const q = partnerSearchQuery.toLowerCase();
    return (
      partner.name?.toLowerCase().includes(q) ||
      partner.phone?.toLowerCase().includes(q) ||
      partner.email?.toLowerCase().includes(q) ||
      partner.vehicle_number?.toLowerCase().includes(q) ||
      partner.assigned_area?.toLowerCase().includes(q)
    );
  });

  // Filter Users
  const filteredUsers = (users || []).filter(u => {
    const matchesRole = !userRoleFilter || u.role === userRoleFilter;
    const matchesSearch = !userSearchQuery ||
      u.first_name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.username?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.role?.toLowerCase().includes(userSearchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/60 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300 flex items-center gap-1.5 w-fit">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Operations Admin Panel</span>
          </span>
          <h1 className="font-serif font-bold text-3xl text-slate-900 mt-2">
            Kitchen, Orders & Delivery Control
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadAllData}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-slate-700 transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setEditingItem(null);
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-[#1C3822] hover:bg-[#2D5A37] text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-md"
          >
            <Plus className="w-4 h-4 text-emerald-300" />
            <span>Feed New Product</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-slate-500 font-bold uppercase">Total Orders</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <span className="font-serif font-bold text-2xl sm:text-3xl text-slate-900">{orders.length}</span>
          <span className="text-[11px] text-emerald-700 font-semibold block mt-1">Live Records</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-slate-500 font-bold uppercase">Food Items</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <span className="font-serif font-bold text-2xl sm:text-3xl text-slate-900">{foodItems?.length || 0}</span>
          <span className="text-[11px] text-blue-700 font-semibold block mt-1">Menu Items</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-slate-500 font-bold uppercase">Delivery Fleet</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <span className="font-serif font-bold text-2xl sm:text-3xl text-slate-900">{deliveryPartners.length}</span>
          <span className="text-[11px] text-amber-700 font-semibold block mt-1">Active Partners</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-slate-500 font-bold uppercase">Users & Clients</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <span className="font-serif font-bold text-2xl sm:text-3xl text-slate-900">{users.length}</span>
          <span className="text-[11px] text-indigo-700 font-semibold block mt-1">Accounts Registered</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-slate-500 font-bold uppercase">Monthly Revenue</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="font-serif font-bold text-2xl sm:text-3xl text-slate-900">{analytics?.metrics?.monthly_revenue || '₹28,500'}</span>
          <span className="text-[11px] text-purple-700 font-semibold block mt-1">Gross Revenue</span>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 space-x-3 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 font-bold text-sm border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'orders'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 font-bold text-sm border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'products'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Food Items ({foodItems?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('packages')}
          className={`pb-3 font-bold text-sm border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'packages'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Monthly Packages ({mealPlans?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('partners')}
          className={`pb-3 font-bold text-sm border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'partners'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Delivery Partners ({deliveryPartners.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 font-bold text-sm border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users & Accounts ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('monthly_menu')}
          className={`pb-3 font-bold text-sm border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'monthly_menu'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>30-Day Menu Schedule ({monthlyMenus.length || 30})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 font-bold text-sm border-b-2 transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Analytics & Routes</span>
        </button>
      </div>

      {/* TAB 1: ORDERS & DELIVERY ASSIGNMENT */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search orders by ID, name, phone, area..."
                  value={orderSearchQuery}
                  onChange={(e) => {
                    setOrderSearchQuery(e.target.value);
                    setOrderPage(1);
                  }}
                  className="pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none w-64 sm:w-80"
                />
              </div>

              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Status:</span>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => {
                    setOrderStatusFilter(e.target.value);
                    setOrderPage(1);
                  }}
                  className="bg-slate-50 border border-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Orders ({orders.length})</option>
                  <option value="Placed">Placed</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Ready">Ready for Delivery</option>
                  <option value="Collected">Collected at Restaurant</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Showing {paginatedOrders.length} of {filteredOrders.length} orders (Page {orderPage} of {totalOrderPages})
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Customer Details</th>
                    <th className="p-4">Delivery Address</th>
                    <th className="p-4">Items Summary</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Order Status</th>
                    <th className="p-4">Location-based Partner Assignment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedOrders.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-400 text-sm">
                        No orders matching criteria found.
                      </td>
                    </tr>
                  ) : (
                    paginatedOrders.map((order) => {
                      const orderArea = (order.delivery_area || '').toLowerCase();

                      return (
                        <tr key={order.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-4 font-bold text-slate-900">
                            #{order.order_number}
                            <span className="block text-[10px] text-slate-400 font-normal">
                              {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-slate-800 text-sm block">{order.customer_name}</span>
                            <span className="text-[11px] text-slate-500 block">{order.phone}</span>
                            <span className="text-[11px] text-slate-400 block">{order.email}</span>
                          </td>
                          <td className="p-4 max-w-xs">
                            <p className="text-slate-800 font-medium line-clamp-2">{order.delivery_address}</p>
                            {order.landmark && (
                              <span className="text-[11px] text-amber-700 font-semibold block mt-0.5">
                                Landmark: {order.landmark}
                              </span>
                            )}
                            <span className="text-[11px] font-bold text-emerald-800 block mt-0.5">
                              Zone: {order.delivery_area}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1.5 min-w-[150px]">
                              {order.items?.map((item, idx) => {
                                const imgSrc = item.food_image || item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80';
                                return (
                                  <div key={idx} className="flex items-center gap-2 text-[11px] bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                                    <img 
                                      src={imgSrc} 
                                      alt={item.food_name || 'Item'} 
                                      className="w-9 h-9 rounded-md object-cover border border-slate-200 shrink-0"
                                    />
                                    <div>
                                      <span className="font-bold text-slate-800 block line-clamp-1">{item.food_name}</span>
                                      <span className="text-[10px] text-slate-500 font-semibold">{item.quantity}x • ₹{item.price}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                          <td className="p-4 font-bold text-slate-900 text-sm">
                            ₹{order.total_amount}
                            <span className="block text-[10px] text-emerald-600 font-semibold">{order.payment_method}</span>
                          </td>
                          <td className="p-4">
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              className="bg-slate-100 border border-slate-300 font-semibold text-xs rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none"
                            >
                              <option value="Placed">Placed</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Preparing">Preparing</option>
                              <option value="Ready">Ready for Delivery</option>
                              <option value="Collected">Collected at Restaurant</option>
                              <option value="Out for Delivery">Out for Delivery</option>
                              <option value="Delivered">Delivered</option>
                            </select>
                          </td>
                          <td className="p-4">
                            <select
                              value={order.delivery_partner || ''}
                              onChange={(e) => handleAssignDeliveryPartner(order.id, Number(e.target.value))}
                              className={`border text-xs rounded-xl px-3 py-1.5 font-bold focus:outline-none transition ${
                                order.delivery_partner_details
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                  : 'bg-amber-50 border-amber-300 text-amber-900 animate-pulse'
                              }`}
                            >
                              <option value="">-- Assign Partner --</option>
                              {deliveryPartners.map((p) => {
                                const isMatch = p.assigned_area.toLowerCase().includes(orderArea);
                                return (
                                  <option key={p.id} value={p.id}>
                                    {isMatch ? '📍 MATCH: ' : ''}{p.name} ({p.assigned_area})
                                  </option>
                                );
                              })}
                            </select>
                            {order.delivery_partner_details && (
                              <div className="text-[10px] text-slate-500 mt-1 font-medium flex items-center space-x-1">
                                <Truck className="w-3 h-3 text-emerald-600" />
                                <span>Assigned: {order.delivery_partner_details.name}</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Orders Pagination Controls */}
            {totalOrderPages > 1 && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Page {orderPage} of {totalOrderPages}</span>
                <div className="flex items-center space-x-2">
                  <button
                    disabled={orderPage <= 1}
                    onClick={() => setOrderPage(prev => Math.max(1, prev - 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-50 transition"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalOrderPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setOrderPage(p)}
                      className={`px-3 py-1.5 rounded-lg border transition ${p === orderPage ? 'bg-[#1C3822] text-white border-[#1C3822]' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    disabled={orderPage >= totalOrderPages}
                    onClick={() => setOrderPage(prev => Math.min(totalOrderPages, prev + 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-50 transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCT FEED / CATALOG CRUD */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-serif font-bold text-lg text-slate-900">Database Menu Catalog ({filteredProducts.length})</h3>
              <p className="text-xs text-slate-500">Search, filter, or feed new dishes with custom categories and uploaded images.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCategoryModal(true)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 transition border border-slate-300"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category</span>
              </button>
              <button
                onClick={() => {
                  setEditingItem(null);
                  resetForm();
                  setShowAddModal(true);
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Add Food Item</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-slate-200 text-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search food item name..."
                value={productSearchQuery}
                onChange={(e) => {
                  setProductSearchQuery(e.target.value);
                  setProductPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={productCategoryFilter}
              onChange={(e) => {
                setProductCategoryFilter(e.target.value);
                setProductPage(1);
              }}
              className="px-3 py-2 border border-slate-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700"
            >
              <option value="">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={productDietFilter}
              onChange={(e) => {
                setProductDietFilter(e.target.value);
                setProductPage(1);
              }}
              className="px-3 py-2 border border-slate-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700"
            >
              <option value="">All Diet Types</option>
              <option value="veg">Vegetarian</option>
              <option value="non_veg">Non-Vegetarian</option>
              <option value="vegan">Vegan</option>
            </select>
          </div>

          {paginatedProducts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 text-sm">
              No products found matching your search and filter criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedProducts.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition"
                >
                  <div>
                    <div className="relative h-44 rounded-2xl overflow-hidden mb-4 bg-slate-100">
                      <img
                        src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      <span className={`absolute top-3 left-3 text-[10px] font-black px-2.5 py-1 rounded-full uppercase text-white shadow ${
                        item.diet_type === 'non_veg' ? 'bg-red-600' : 'bg-emerald-600'
                      }`}>
                        {item.diet_type?.replace('_', '-')}
                      </span>
                      {item.is_bestseller && (
                        <span className="absolute top-3 right-3 text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-400 text-amber-950 uppercase shadow">
                          Bestseller
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-slate-900 text-base">{item.name}</h4>
                      <span className="font-serif font-bold text-lg text-emerald-800">₹{item.price}</span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{item.description}</p>

                    <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl text-center text-[10px] font-bold text-slate-600 mb-4">
                      <div>
                        <span className="block text-slate-400 font-medium">Cal</span>
                        {item.calories} kcal
                      </div>
                      <div>
                        <span className="block text-slate-400 font-medium">Prot</span>
                        {item.protein}g
                      </div>
                      <div>
                        <span className="block text-slate-400 font-medium">Carb</span>
                        {item.carbs}g
                      </div>
                      <div>
                        <span className="block text-slate-400 font-medium">Fat</span>
                        {item.fat}g
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2 border-t border-slate-100 pt-3">
                    <button
                      onClick={() => openEditModal(item)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteFood(item.id, item.name)}
                      className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Products Catalog Pagination Controls */}
          {totalProductPages > 1 && (
            <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Showing Page {productPage} of {totalProductPages}</span>
              <div className="flex items-center space-x-2">
                <button
                  disabled={productPage <= 1}
                  onClick={() => setProductPage(prev => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-50 transition"
                >
                  Previous
                </button>
                {Array.from({ length: totalProductPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setProductPage(p)}
                    className={`px-3 py-1.5 rounded-lg border transition ${p === productPage ? 'bg-[#1C3822] text-white border-[#1C3822]' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={productPage >= totalProductPages}
                  onClick={() => setProductPage(prev => Math.min(totalProductPages, prev + 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-50 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MONTHLY SUBSCRIPTION PACKAGES CRUD */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-serif font-bold text-lg text-slate-900">Monthly Subscription Food Packages ({mealPlans?.length})</h3>
              <p className="text-xs text-slate-500">Create, update, or remove monthly meal plans and pricing for customers.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search packages by name, tag, features..."
                  value={planSearchQuery}
                  onChange={(e) => setPlanSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none w-64"
                />
              </div>

              <button
                onClick={() => {
                  setEditingPlan(null);
                  resetPlanForm();
                  setShowPlanModal(true);
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Package</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => (
              <div key={plan.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="relative h-40 rounded-2xl overflow-hidden mb-4 bg-slate-100">
                    <img 
                      src={plan.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'} 
                      alt={plan.name} 
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase bg-[#1C3822] text-emerald-300 shadow">
                      {plan.tag}
                    </span>
                  </div>

                  <h4 className="font-serif font-bold text-xl text-slate-900 mb-1">{plan.name}</h4>
                  <span className="text-2xl font-serif font-bold text-emerald-800 block mb-2">₹{plan.price}</span>
                  <p className="text-xs text-slate-500 mb-4 line-clamp-2">{plan.description}</p>

                  <div className="space-y-1 text-xs text-slate-600 mb-4">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Meals per Day:</span>
                      <span className="font-bold text-slate-800">{plan.meals_per_day} Meal(s)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Monthly Meals:</span>
                      <span className="font-bold text-slate-800">{plan.total_meals} Meals</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => openPlanEditModal(plan)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Package</span>
                  </button>
                  <button
                    onClick={() => handleDeleteMealPlan(plan.id, plan.name)}
                    className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DELIVERY PARTNERS */}
      {activeTab === 'partners' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-serif font-bold text-lg text-slate-900">Delivery Fleet & Drivers ({deliveryPartners?.length})</h3>
              <p className="text-xs text-slate-500">Register new delivery partners, manage routes and vehicle details.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search partners by name, phone, area..."
                  value={partnerSearchQuery}
                  onChange={(e) => setPartnerSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none w-64"
                />
              </div>

              <button
                onClick={() => setShowPartnerModal(true)}
                className="bg-[#1C3822] hover:bg-[#2D5A37] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow"
              >
                <Plus className="w-4 h-4 text-emerald-300" />
                <span>+ Add Delivery Partner</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredPartners.map((partner) => (
              <div key={partner.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-800 font-black text-xl flex items-center justify-center">
                        {partner.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">{partner.name}</h4>
                        <p className="text-xs text-slate-500">{partner.phone}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeletePartner(partner.id, partner.name)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                      title="Remove Partner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Vehicle No:</span>
                      <span className="font-bold text-slate-800">{partner.vehicle_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Assigned Area:</span>
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">{partner.assigned_area}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Active Deliveries:</span>
                      <span className="font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        {partner.active_orders_count || 0} Orders
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Rating:</span>
                      <span className="font-bold text-yellow-600">★ {partner.rating || 4.9}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: USERS & CLIENT ACCOUNTS */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-serif font-bold text-lg text-slate-900">User & Client Accounts ({users.length})</h3>
              <p className="text-xs text-slate-500">Manage registered customers, admins, and delivery partner accounts.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by name, email, role..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none w-56"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-xl bg-slate-50 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Roles</option>
                <option value="customer">Customer</option>
                <option value="delivery">Delivery</option>
                <option value="admin">Admin</option>
              </select>

              <button
                onClick={() => setShowUserModal(true)}
                className="bg-[#1C3822] hover:bg-[#2D5A37] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow"
              >
                <Plus className="w-4 h-4 text-emerald-300" />
                <span>+ Add New User</span>
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Joined Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 font-bold flex items-center justify-center border border-slate-200 shrink-0">
                            {(u.first_name || u.username || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-900">{u.first_name || u.username}</span>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-slate-700">{u.email || u.username}</td>
                      <td className="p-4">{u.phone || '—'}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          u.role === 'admin'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : u.role === 'delivery'
                            ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}>
                          {u.role || 'Customer'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">{u.date_joined ? u.date_joined.slice(0, 10) : 'Recent'}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(u.id, u.email || u.username)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete User Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-400 font-medium">
                        No users match the search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-lg text-slate-900">Hyderabad Delivery Routes</h3>
            <div className="space-y-3">
              {analytics?.hyderabad_routes?.map((route, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{route.name}</h4>
                    <p className="text-xs text-slate-500">{route.path}</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
                    {route.deliveries} Meals
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-lg text-slate-900">Top Bestselling Dishes</h3>
            <div className="space-y-3">
              {analytics?.popular_meals?.map((meal, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center text-sm font-semibold text-slate-800">
                  <span>{meal.name}</span>
                  <span className="text-emerald-700 font-bold">₹{meal.price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: 30-DAY MENU SCHEDULE MANAGEMENT */}
      {activeTab === 'monthly_menu' && (
        <div className="space-y-6">
          {/* Header & Controls */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-700" />
                <h3 className="font-serif font-bold text-xl text-slate-900">
                  30-Day Rotating Menu Schedule & Food Items
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Configure Breakfast, Lunch, and Dinner for each of the 30 days and assign items from your food catalog.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Filter by day or meal name..."
                  value={dayMenuSearchQuery}
                  onChange={(e) => setDayMenuSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none w-64"
                />
              </div>

              <button
                onClick={() => openDayMenuModal(null, 1)}
                className="bg-[#1C3822] hover:bg-[#2D5A37] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow"
              >
                <Plus className="w-4 h-4 text-emerald-300" />
                <span>+ Add / Configure Day Menu</span>
              </button>
            </div>
          </div>

          {/* 30 Days Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 30 }, (_, i) => i + 1)
              .filter(dayNum => {
                if (!dayMenuSearchQuery) return true;
                const q = dayMenuSearchQuery.toLowerCase();
                const dm = monthlyMenus.find(m => m.day_number === dayNum);
                return (
                  `day ${dayNum}`.includes(q) ||
                  dayNum.toString() === q ||
                  (dm && (
                    dm.breakfast?.toLowerCase().includes(q) ||
                    dm.lunch?.toLowerCase().includes(q) ||
                    dm.dinner?.toLowerCase().includes(q)
                  ))
                );
              })
              .map(dayNum => {
                const dayMenu = monthlyMenus.find(m => m.day_number === dayNum) || {
                  day_number: dayNum,
                  breakfast: 'Oats & Berry Bowl',
                  lunch: 'Chicken & Dal Rice Bowl',
                  dinner: 'Vegetable Clear Soup & Salad',
                  total_calories: 1450,
                  items: []
                };

                const assignedItems = (dayMenu.items && dayMenu.items.length > 0)
                  ? dayMenu.items
                  : [];

                return (
                  <div 
                    key={dayNum}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition p-6 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between">
                        <span className="bg-[#1C3822] text-emerald-300 font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Day {dayNum}</span>
                        </span>

                        <span className="bg-amber-50 text-amber-900 border border-amber-200 font-bold text-xs px-2.5 py-1 rounded-xl">
                          {dayMenu.total_calories || 1450} kcal
                        </span>
                      </div>

                      {/* Meals list */}
                      <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-amber-700 block">Breakfast (7:30 AM)</span>
                          <span className="font-semibold text-slate-800">{dayMenu.breakfast || 'Custom Breakfast Bowl'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-emerald-700 block">Lunch (12:30 PM)</span>
                          <span className="font-semibold text-slate-800">{dayMenu.lunch || 'Protein Rice Bowl'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-indigo-700 block">Dinner (7:30 PM)</span>
                          <span className="font-semibold text-slate-800">{dayMenu.dinner || 'Light Salad & Soup'}</span>
                        </div>
                      </div>

                      {/* Assigned Catalog Items */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 flex items-center gap-1">
                            <Utensils className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Catalog Items ({assignedItems.length})</span>
                          </span>
                          <button
                            onClick={() => openDayMenuModal(dayMenu, dayNum)}
                            className="text-[11px] font-bold text-emerald-700 hover:underline"
                          >
                            + Manage Items
                          </button>
                        </div>

                        {assignedItems.length === 0 ? (
                          <div className="p-3 bg-amber-50/60 border border-dashed border-amber-200 rounded-xl text-center text-xs text-amber-800">
                            No catalog items linked yet. Click Edit to assign items.
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {assignedItems.map((item, idx) => (
                              <div 
                                key={item.id || idx}
                                className="flex items-center justify-between bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 rounded-xl text-xs"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  {item.image_url && (
                                    <img src={item.image_url} alt="" className="w-6 h-6 rounded-md object-cover shrink-0" />
                                  )}
                                  <span className="font-semibold text-slate-800 truncate">{item.name}</span>
                                </div>
                                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0 ml-2">
                                  {item.calories} kcal
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">Scheduled for subscribers</span>
                      <button
                        onClick={() => openDayMenuModal(dayMenu, dayNum)}
                        className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit Day & Items</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-serif font-bold text-xl text-slate-900">
                  {editingItem ? 'Edit Food Item' : 'Feed New Product to Catalog'}
                </h3>
                <p className="text-xs text-slate-500">Provide dish pricing, nutrition info and uploaded food image.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition shadow-xs border border-slate-200 shrink-0"
                title="Close Form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleCreateOrUpdateFood} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Dish Name *</label>
                  <input
                    type="text"
                    required
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. High Protein Chicken Bowl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows="2"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Detailed meal breakdown..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700 block">Category</label>
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      className="text-[10px] font-bold text-emerald-700 hover:underline"
                    >
                      + New
                    </button>
                  </div>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Diet Type</label>
                  <select
                    value={newItem.diet_type}
                    onChange={(e) => setNewItem({ ...newItem, diet_type: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="veg">Vegetarian</option>
                    <option value="non_veg">Non-Vegetarian</option>
                    <option value="vegan">Vegan</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit Info</label>
                  <input
                    type="text"
                    value={newItem.unit_info}
                    onChange={(e) => setNewItem({ ...newItem, unit_info: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. 450g bowl"
                  />
                </div>
              </div>

              {/* Macros Breakdown */}
              <div className="grid grid-cols-5 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Calories</label>
                  <input
                    type="number"
                    value={newItem.calories}
                    onChange={(e) => setNewItem({ ...newItem, calories: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-1.5 text-center text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Protein(g)</label>
                  <input
                    type="number"
                    value={newItem.protein}
                    onChange={(e) => setNewItem({ ...newItem, protein: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-1.5 text-center text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Carbs(g)</label>
                  <input
                    type="number"
                    value={newItem.carbs}
                    onChange={(e) => setNewItem({ ...newItem, carbs: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-1.5 text-center text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Fat(g)</label>
                  <input
                    type="number"
                    value={newItem.fat}
                    onChange={(e) => setNewItem({ ...newItem, fat: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-1.5 text-center text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Fiber(g)</label>
                  <input
                    type="number"
                    value={newItem.fiber}
                    onChange={(e) => setNewItem({ ...newItem, fiber: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-1.5 text-center text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Image URL (or Upload File Below)</label>
                <input
                  type="url"
                  value={newItem.image_url}
                  onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none mb-2"
                  placeholder="https://images.unsplash.com/..."
                />
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">OR Upload Local File:</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="text-xs text-slate-600 border border-slate-300 rounded-lg p-1 bg-white w-full"
                  />
                </div>
                {imageFileBase64 && (
                  <div className="mt-2 flex items-center gap-2 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                    <img src={imageFileBase64} alt="Upload Preview" className="w-10 h-10 rounded-lg object-cover border border-emerald-300" />
                    <span className="text-[11px] text-emerald-800 font-bold">Local file loaded & ready to save!</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-6 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={newItem.is_bestseller}
                    onChange={(e) => setNewItem({ ...newItem, is_bestseller: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Bestseller Badge</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={newItem.is_available}
                    onChange={(e) => setNewItem({ ...newItem, is_available: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Is Available for Ordering</span>
                </label>
              </div>

              {/* Pinned Action Buttons */}
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs pt-4 border-t border-slate-200 flex justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition shadow"
                >
                  Save Food Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT SUBSCRIPTION PACKAGE MODAL */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="relative bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
              <h3 className="font-serif font-bold text-xl text-slate-900">
                {editingPlan ? 'Edit Monthly Subscription Package' : 'Create New Monthly Food Package'}
              </h3>
              <button
                type="button"
                onClick={() => setShowPlanModal(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition shadow-xs border border-slate-200 shrink-0"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateMealPlan} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Package Name *</label>
                  <input
                    type="text"
                    required
                    value={newPlan.name}
                    onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. Standard Executive Plan"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tag / Badge</label>
                  <input
                    type="text"
                    value={newPlan.tag}
                    onChange={(e) => setNewPlan({ ...newPlan, tag: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. Breakfast + Lunch"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Monthly Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newPlan.price}
                    onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Meals / Day</label>
                  <input
                    type="number"
                    required
                    value={newPlan.meals_per_day}
                    onChange={(e) => setNewPlan({ ...newPlan, meals_per_day: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Meals</label>
                  <input
                    type="number"
                    required
                    value={newPlan.total_meals}
                    onChange={(e) => setNewPlan({ ...newPlan, total_meals: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Package Description</label>
                <textarea
                  rows="2"
                  value={newPlan.description}
                  onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Summary of target audience and meal benefits..."
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Features (Comma separated)</label>
                <input
                  type="text"
                  value={newPlan.features}
                  onChange={(e) => setNewPlan({ ...newPlan, features: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="2 Fresh Meals Daily, 52 Meals/Month, Priority Morning Delivery"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Package Image URL</label>
                <input
                  type="url"
                  value={newPlan.image_url}
                  onChange={(e) => setNewPlan({ ...newPlan, image_url: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              {/* Pinned Action Buttons */}
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs pt-4 border-t border-slate-200 flex justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition shadow"
                >
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD NEW CATEGORY MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="relative bg-white rounded-3xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
              <h3 className="font-serif font-bold text-xl text-slate-900">Add New Category</h3>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition shadow-xs border border-slate-200 shrink-0"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. Biryani, Desserts, Starters..."
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Duplicates like "biryani", "BIRYANI", "Biryani" will be automatically recognized as the same category.
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description (Optional)</label>
                <textarea
                  rows="2"
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Short description of items in this category..."
                />
              </div>

              {/* Pinned Action Buttons */}
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs pt-4 border-t border-slate-200 flex justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition shadow"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT / CONFIGURE 30-DAY MENU MODAL */}
      {showDayMenuModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-serif font-bold text-xl text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-700" />
                  <span>Configure Day {dayMenuForm.day_number} Menu & Items</span>
                </h3>
                <p className="text-xs text-slate-500">Update scheduled dishes and select food items from the catalog.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDayMenuModal(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition shadow-xs border border-slate-200 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveDayMenu} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              
              {/* Day Number and Total Calories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Day of the Month (1 to 30) *</label>
                  <select
                    value={dayMenuForm.day_number}
                    onChange={(e) => {
                      const dayNum = Number(e.target.value);
                      const existing = monthlyMenus.find(m => m.day_number === dayNum);
                      if (existing) {
                        openDayMenuModal(existing, dayNum);
                      } else {
                        setDayMenuForm({ ...dayMenuForm, day_number: dayNum });
                      }
                    }}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {Array.from({ length: 30 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>Day {d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Estimated Intake (kcal) *</label>
                  <input
                    type="number"
                    required
                    value={dayMenuForm.total_calories}
                    onChange={(e) => setDayMenuForm({ ...dayMenuForm, total_calories: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="1450"
                  />
                </div>
              </div>

              {/* Breakfast, Lunch, Dinner Titles */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Scheduled Meal Titles</h4>
                
                <div>
                  <label className="font-bold text-amber-700 block mb-1">Breakfast Slot (7:30 AM)</label>
                  <input
                    type="text"
                    required
                    value={dayMenuForm.breakfast}
                    onChange={(e) => setDayMenuForm({ ...dayMenuForm, breakfast: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. Oats & Berry Bowl"
                  />
                </div>

                <div>
                  <label className="font-bold text-emerald-700 block mb-1">Lunch Slot (12:30 PM)</label>
                  <input
                    type="text"
                    required
                    value={dayMenuForm.lunch}
                    onChange={(e) => setDayMenuForm({ ...dayMenuForm, lunch: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. Chicken & Dal Rice Bowl"
                  />
                </div>

                <div>
                  <label className="font-bold text-indigo-700 block mb-1">Dinner Slot (7:30 PM)</label>
                  <input
                    type="text"
                    required
                    value={dayMenuForm.dinner}
                    onChange={(e) => setDayMenuForm({ ...dayMenuForm, dinner: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. Vegetable Clear Soup & Salad"
                  />
                </div>
              </div>

              {/* Assign Food Items from Catalog */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-slate-800 block text-xs">
                      Assign Food Items from Catalog
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Selected items will be shown to customers viewing Day {dayMenuForm.day_number}.
                    </span>
                  </div>

                  <span className="bg-emerald-100 text-emerald-900 font-bold text-xs px-2.5 py-1 rounded-full">
                    {dayMenuForm.item_ids.length} selected
                  </span>
                </div>

                {/* Search in modal */}
                <input
                  type="text"
                  placeholder="Filter catalog items by name..."
                  value={catalogItemSearchInModal}
                  onChange={(e) => setCatalogItemSearchInModal(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />

                {/* Items Checklist */}
                <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
                  {(foodItems || [])
                    .filter(item => {
                      if (!catalogItemSearchInModal) return true;
                      return item.name.toLowerCase().includes(catalogItemSearchInModal.toLowerCase());
                    })
                    .map(item => {
                      const isSelected = dayMenuForm.item_ids.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleToggleItemInDayMenu(item.id)}
                          className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition border ${
                            isSelected 
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold shadow-xs' 
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // handled by parent onClick
                              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 pointer-events-none"
                            />
                            {item.image_url && (
                              <img src={item.image_url} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                            )}
                            <div className="truncate">
                              <span className="block truncate text-xs">{item.name}</span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                {item.calories} kcal • {item.diet_type || 'Healthy'} • ₹{item.price}
                              </span>
                            </div>
                          </div>

                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold shrink-0 ml-2 ${
                            isSelected ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {isSelected ? 'Included' : 'Click to Add'}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Pinned Submit Button */}
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs pt-4 border-t border-slate-200 flex justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDayMenuModal(false)}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#1C3822] hover:bg-[#2D5A37] text-white font-bold rounded-xl transition shadow"
                >
                  Save Day {dayMenuForm.day_number} Menu
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* REGISTER DELIVERY PARTNER MODAL */}
      {showPartnerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="relative bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-serif font-bold text-xl text-slate-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-indigo-700" />
                  <span>Register Delivery Partner</span>
                </h3>
                <p className="text-xs text-slate-500">Add a delivery driver and assign their Hyderabad delivery zone.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPartnerModal(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition shadow-xs border border-slate-200 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreatePartner} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Partner Full Name *</label>
                <input
                  type="text"
                  required
                  value={newPartner.name}
                  onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. Ramesh Babu"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={newPartner.phone}
                    onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newPartner.email}
                    onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="ramesh@delivery.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vehicle Number *</label>
                  <input
                    type="text"
                    required
                    value={newPartner.vehicle_number}
                    onChange={(e) => setNewPartner({ ...newPartner, vehicle_number: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="TS 09 EQ 4521"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Route Area</label>
                  <select
                    value={newPartner.assigned_area}
                    onChange={(e) => setNewPartner({ ...newPartner, assigned_area: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  >
                    <option value="Hitech City & Madhapur">Hitech City & Madhapur</option>
                    <option value="Kondapur & Gachibowli">Kondapur & Gachibowli</option>
                    <option value="Financial District">Financial District</option>
                    <option value="Jubilee & Banjara Hills">Jubilee & Banjara Hills</option>
                    <option value="All Hyderabad Zones">All Hyderabad Zones</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs pt-4 border-t border-slate-200 flex justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPartnerModal(false)}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#1C3822] hover:bg-[#2D5A37] text-white font-bold rounded-xl transition shadow"
                >
                  Register Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW USER MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="relative bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-serif font-bold text-xl text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-700" />
                  <span>Create New User Account</span>
                </h3>
                <p className="text-xs text-slate-500">Register a new customer, admin operator, or delivery driver.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowUserModal(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition shadow-xs border border-slate-200 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateUser} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. Priya Sharma"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="priya@example.com"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="+91 98765 12345"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Password *</label>
                  <input
                    type="text"
                    required
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="User@123"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Account Role *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
                  >
                    <option value="customer">Customer / Subscriber</option>
                    <option value="delivery">Delivery Partner</option>
                    <option value="admin">Operations Admin</option>
                  </select>
                </div>
              </div>

              {newUser.role === 'delivery' && (
                <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3 animate-fade-in">
                  <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-xs">
                    <Truck className="w-4 h-4" />
                    <span>Delivery Fleet Details (Auto-created)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Vehicle Number</label>
                      <input
                        type="text"
                        value={newUser.vehicle_number}
                        onChange={(e) => setNewUser({ ...newUser, vehicle_number: e.target.value })}
                        className="w-full border border-slate-300 rounded-xl p-2 bg-white text-slate-800 text-xs"
                        placeholder="TS 09 AB 1234"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Assigned Route Area</label>
                      <select
                        value={newUser.assigned_area}
                        onChange={(e) => setNewUser({ ...newUser, assigned_area: e.target.value })}
                        className="w-full border border-slate-300 rounded-xl p-2 bg-white text-slate-800 text-xs"
                      >
                        <option value="Hitech City & Madhapur">Hitech City & Madhapur</option>
                        <option value="Kondapur & Gachibowli">Kondapur & Gachibowli</option>
                        <option value="Financial District">Financial District</option>
                        <option value="Jubilee & Banjara Hills">Jubilee & Banjara Hills</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs pt-4 border-t border-slate-200 flex justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#1C3822] hover:bg-[#2D5A37] text-white font-bold rounded-xl transition shadow"
                >
                  Create User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
