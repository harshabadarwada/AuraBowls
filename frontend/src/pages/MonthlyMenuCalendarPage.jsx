import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Flame, Coffee, Sun, Moon, ArrowRight, ShoppingBag, Eye, Settings, Sparkles, Utensils } from 'lucide-react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MonthlyMenuCalendarPage({ setActivePage, foodItems = [], addToCart, inspectItem }) {
  const [monthlyMenu, setMonthlyMenu] = useState([]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [loading, setLoading] = useState(true);
  const { role } = useAuth();

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const res = await apiService.getMonthlyMenu();
      setMonthlyMenu(res || []);
    } catch (e) {
      console.error('Error fetching monthly menu', e);
    } finally {
      setLoading(false);
    }
  };

  const currentDayMenu = monthlyMenu.find(m => m.day_number === selectedDay) || {
    day_number: selectedDay,
    breakfast: 'Oats & Berry Bowl',
    lunch: 'Chicken & Dal Rice Bowl',
    dinner: 'Vegetable Clear Soup & Salad',
    total_calories: 1450,
    items: []
  };

  // Get items for the selected day: use direct items or match from foodItems catalog
  const dayItems = (currentDayMenu.items && currentDayMenu.items.length > 0)
    ? currentDayMenu.items
    : (foodItems && foodItems.length > 0)
    ? [
        foodItems[(selectedDay - 1) % foodItems.length],
        foodItems[(selectedDay + 1) % foodItems.length],
        foodItems[(selectedDay + 3) % foodItems.length]
      ].filter(Boolean)
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="bg-[#1C3822] text-emerald-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          30-Day Rotating Menu
        </span>
        <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#1C3822]">Monthly Meal Variety Schedule</h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Our culinary team creates a rotating 30-day schedule so subscribers never get bored of eating healthy.
        </p>

        {role === 'admin' && (
          <div className="pt-2">
            <button
              onClick={() => setActivePage('admin')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-xl text-xs font-bold shadow transition"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Admin: Manage 30-Day Menu & Assign Items</span>
            </button>
          </div>
        )}
      </div>

      {/* Days 1 to 30 Selector Grid */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-emerald-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif font-bold text-sm text-slate-800 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-emerald-700" />
            <span>Select Day of the Month (1 to 30):</span>
          </h3>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Selected: Day {selectedDay}
          </span>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-15 gap-2">
          {Array.from({ length: 30 }, (_, i) => i + 1).map(day => (
            <button 
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`py-2.5 rounded-xl font-bold text-xs transition border ${
                selectedDay === day 
                  ? 'bg-[#1C3822] text-white border-[#1C3822] shadow-md scale-105 ring-2 ring-emerald-500/30' 
                  : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 border-slate-200'
              }`}
            >
              Day {day}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Day Meals Overview */}
      <div className="bg-[#FAF8F3] p-6 sm:p-8 rounded-3xl border border-emerald-100 shadow-sm space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-emerald-200/80 pb-4 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#1C3822]">DAY {selectedDay} MEAL SCHEDULE</h2>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">Fresh Daily</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Curated portion-controlled recipes and items scheduled for Day {selectedDay}</p>
          </div>

          <div className="bg-white px-4 py-2.5 rounded-2xl border border-emerald-200 text-xs font-bold text-slate-800 flex items-center gap-2 shadow-sm shrink-0">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Estimated Intake: <strong className="text-amber-700">{currentDayMenu.total_calories || 1450} kcal</strong></span>
          </div>
        </div>

        {/* 3 Meal Slot Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Breakfast */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3 hover:shadow-md transition">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider">
              <Coffee className="w-4 h-4" />
              <span>Breakfast (7:30 AM Slot)</span>
            </div>
            <h3 className="font-serif font-bold text-lg text-slate-900">{currentDayMenu.breakfast}</h3>
            <p className="text-xs text-slate-500">High-protein morning energy boost prepared fresh with whole foods.</p>
            <div className="pt-2 text-[11px] font-semibold text-emerald-800 flex items-center gap-2">
              <span className="bg-emerald-50 px-2 py-0.5 rounded">~ 350 kcal</span>
              <span className="bg-emerald-50 px-2 py-0.5 rounded">20g Protein</span>
            </div>
          </div>

          {/* Lunch */}
          <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-md ring-2 ring-emerald-500/10 space-y-3 hover:shadow-lg transition">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
              <Sun className="w-4 h-4" />
              <span>Lunch (12:30 PM Slot)</span>
            </div>
            <h3 className="font-serif font-bold text-lg text-slate-900">{currentDayMenu.lunch}</h3>
            <p className="text-xs text-slate-500">Balanced high-protein meal bowl served with fresh steamed greens.</p>
            <div className="pt-2 text-[11px] font-semibold text-emerald-800 flex items-center gap-2">
              <span className="bg-emerald-50 px-2 py-0.5 rounded">~ 550 kcal</span>
              <span className="bg-emerald-50 px-2 py-0.5 rounded">36g Protein</span>
            </div>
          </div>

          {/* Dinner */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3 hover:shadow-md transition">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
              <Moon className="w-4 h-4" />
              <span>Dinner (7:30 PM Slot)</span>
            </div>
            <h3 className="font-serif font-bold text-lg text-slate-900">{currentDayMenu.dinner}</h3>
            <p className="text-xs text-slate-500">Light, nutrient-dense digestive dinner supporting healthy recovery.</p>
            <div className="pt-2 text-[11px] font-semibold text-emerald-800 flex items-center gap-2">
              <span className="bg-emerald-50 px-2 py-0.5 rounded">~ 400 kcal</span>
              <span className="bg-emerald-50 px-2 py-0.5 rounded">24g Protein</span>
            </div>
          </div>

        </div>

        {/* Day's Food Items Section */}
        <div className="pt-6 border-t border-emerald-200/80 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-emerald-700" />
              <h3 className="font-serif font-bold text-xl text-[#1C3822]">
                Day {selectedDay} Included Items & Recipes
              </h3>
              <span className="bg-emerald-100 text-emerald-900 font-bold text-xs px-2.5 py-0.5 rounded-full">
                {dayItems.length} items scheduled
              </span>
            </div>
            <span className="text-xs text-slate-500 hidden sm:inline">Individual items can also be ordered à la carte</span>
          </div>

          {dayItems.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
              <p className="text-sm font-bold text-slate-700">No specific catalog items assigned yet for Day {selectedDay}.</p>
              <p className="text-xs text-slate-400">The kitchen prepares custom daily recipes according to the scheduled meal plan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {dayItems.map((item, idx) => (
                <div 
                  key={item.id || idx}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between group"
                >
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                    <img 
                      src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                        item.diet_type === 'veg' ? 'bg-emerald-500 text-white' : item.diet_type === 'vegan' ? 'bg-green-600 text-white' : 'bg-rose-500 text-white'
                      }`}>
                        {item.diet_type || 'Healthy'}
                      </span>
                      {item.is_bestseller && (
                        <span className="bg-amber-400 text-amber-950 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> Popular
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-2.5 right-2.5 bg-slate-950/75 backdrop-blur-md text-white px-2 py-1 rounded-lg text-[11px] font-bold">
                      {item.calories} kcal
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-serif font-bold text-base text-slate-900 group-hover:text-emerald-800 transition line-clamp-1">
                        {item.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {item.description || 'Delicious diet meal cooked fresh with premium ingredients.'}
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                        <span className="bg-slate-100 px-2 py-0.5 rounded">P: {item.protein || 20}g</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded">C: {item.carbs || 30}g</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded">F: {item.fat || 10}g</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-base font-bold text-[#1C3822]">
                          ₹{item.price || 199}
                        </span>

                        <div className="flex items-center gap-2">
                          {inspectItem && (
                            <button
                              onClick={() => inspectItem(item)}
                              className="p-2 text-slate-500 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 rounded-xl transition"
                              title="View Nutrition Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          {addToCart && (
                            <button
                              onClick={() => addToCart(item)}
                              className="px-3 py-2 bg-[#1C3822] hover:bg-[#2D5A37] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
                            >
                              <ShoppingBag className="w-3.5 h-3.5 text-emerald-300" />
                              <span>Add</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subscribe Footer CTA */}
        <div className="pt-6 text-center">
          <button 
            onClick={() => setActivePage('plans')}
            className="bg-[#1C3822] hover:bg-[#2D5A37] text-white font-bold px-8 py-3.5 rounded-2xl text-xs sm:text-sm transition shadow-lg inline-flex items-center gap-2 group"
          >
            <span>Subscribe to 30-Day Meal Plan & Get All 30 Days Delivered</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-emerald-300" />
          </button>
        </div>

      </div>

    </div>
  );
}
