import React, { useState } from 'react';
import { Flame, Plus, Heart, Info, Filter, Search, CheckCircle, Leaf } from 'lucide-react';

export default function MenuPage({ foodItems, addToCart, inspectItem }) {
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'eggs', 'fruits', 'rice', 'veg', 'non_veg'
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const filteredItems = foodItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (activeTab === 'eggs') return item.category === 1 || item.name.toLowerCase().includes('egg') || item.name.toLowerCase().includes('toast');
    if (activeTab === 'fruits') return item.category === 2 || item.name.toLowerCase().includes('fruit');
    if (activeTab === 'rice') return item.category === 3 || item.name.toLowerCase().includes('rice');
    if (activeTab === 'veg') return item.diet_type === 'veg' || item.diet_type === 'vegan';
    if (activeTab === 'non_veg') return item.diet_type === 'non_veg';

    return true;
  });

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;
  const paginatedItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const eggItems = foodItems.filter(i => i.category === 1 || i.name.toLowerCase().includes('egg') || i.name.toLowerCase().includes('toast'));
  const fruitItems = foodItems.filter(i => i.category === 2 || i.name.toLowerCase().includes('fruit'));
  const riceItems = foodItems.filter(i => i.category === 3 || i.name.toLowerCase().includes('rice'));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Page Branding Header matching screenshot header "MY MORNING - A HEALTHY START" */}
      <div className="bg-[#FAF8F3] p-8 rounded-3xl border border-emerald-100/80 shadow-sm text-center relative overflow-hidden">
        <div className="w-16 h-16 rounded-full bg-[#1C3822] flex items-center justify-center mx-auto mb-3 text-emerald-300 font-serif font-bold text-3xl shadow-md">
          M
        </div>
        <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#1C3822] tracking-tight">MY MORNING</h1>
        <p className="text-xs tracking-widest text-emerald-800 uppercase font-semibold mt-0.5">A HEALTHY START</p>
        <p className="text-sm text-slate-600 max-w-xl mx-auto mt-3">
          Explore our chef-crafted daily diet menu. Portion controlled, zero refined sugar, prepared fresh every morning in Hyderabad.
        </p>

        {/* Search & Filter Bar */}
        <div className="mt-8 max-w-xl mx-auto flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input 
              type="text"
              placeholder="Search boiled eggs, fruit bowl, chicken rice, biryani..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 text-sm bg-white outline-none focus:border-emerald-700 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Items' },
              { id: 'eggs', label: 'Eggs & Toast' },
              { id: 'fruits', label: 'Fruit Bowls' },
              { id: 'rice', label: 'Rice Bowls' },
              { id: 'veg', label: 'Veg' },
              { id: 'non_veg', label: 'Non-Veg' },
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${activeTab === tab.id ? 'bg-[#1C3822] text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 1: EGGS & TOAST (Exact Layout from Screenshot 1) */}
      {(activeTab === 'all' || activeTab === 'eggs') && eggItems.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-emerald-200/80 pb-4">
            <div>
              <span className="text-[11px] font-bold tracking-widest text-emerald-800 uppercase bg-emerald-100/70 px-2.5 py-0.5 rounded">
                Menu Category 1
              </span>
              <h2 className="font-serif font-bold text-2xl text-[#1C3822] mt-1">1. EGGS & TOAST MENU</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">Simple, healthy & protein rich</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {eggItems.map((item, idx) => (
              <div 
                key={item.id} 
                className="bg-[#FAF8F3] rounded-2xl border border-emerald-100/90 overflow-hidden shadow-sm hover:shadow-xl transition flex flex-col justify-between"
              >
                <div>
                  {/* Image Container */}
                  <div className="relative h-52 w-full overflow-hidden cursor-pointer" onClick={() => inspectItem(item)}>
                    <img 
                      src={item.image_url || 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=80'} 
                      alt={item.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-800 flex items-center gap-1 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      {item.diet_type === 'non_veg' ? 'Non-Veg' : 'Veg'}
                    </div>

                    <button 
                      onClick={(e) => { e.stopPropagation(); inspectItem(item); }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 text-slate-700 hover:text-emerald-800 flex items-center justify-center shadow-md transition"
                      title="Nutrition Info"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 text-center">
                    <h3 
                      className="font-serif font-bold text-lg text-slate-900 hover:text-emerald-800 cursor-pointer transition"
                      onClick={() => inspectItem(item)}
                    >
                      {idx + 1}. {item.name.toUpperCase()}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 mb-4 h-9 line-clamp-2">
                      {item.description}
                    </p>

                    {/* Price Pill Tag matching screenshot */}
                    <div className="inline-block mb-3">
                      <span className="price-pill text-base py-1.5 px-6">
                        ₹{item.price} <span className="text-[10px] font-normal text-emerald-200 ml-1">{item.unit_info}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-4 text-xs text-slate-600 pt-2 border-t border-slate-200/60 font-medium">
                      <span>🔥 {item.calories} kcal</span>
                      <span>💪 {item.protein}g Protein</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <button 
                    onClick={() => addToCart(item)}
                    className="w-full bg-[#1C3822] hover:bg-[#2D5A37] text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 text-emerald-300" />
                    <span>Add to Cart</span>
                  </button>
                </div>

              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 2: FRUIT BOWLS (Exact Layout from Screenshot 2) */}
      {(activeTab === 'all' || activeTab === 'fruits') && (
        <section className="space-y-6">
          <div className="bg-gradient-to-r from-[#1C3822] to-[#2D5A37] text-white p-6 rounded-3xl text-center space-y-2 shadow-lg">
            <h2 className="font-serif font-bold text-3xl text-white tracking-wide">🌱 FRUIT BOWLS 🌱</h2>
            <p className="text-xs text-emerald-200">You can customize your fruits as well.</p>
            <div className="inline-block bg-emerald-900/80 text-emerald-100 text-[11px] font-bold uppercase tracking-wider px-4 py-1 rounded-full border border-emerald-700/50">
              BASED ON CUSTOMIZATION, PRICES MAY VARY
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                id: 7,
                tier: 'BASIC',
                subtitle: 'FRESH & WHOLESOME',
                desc: 'Our basic selection of everyday fruits.',
                fruits: 'Guava, Apple, Pineapple, Papaya, Watermelon',
                price: 50,
                calories: 180,
                img: 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=600&q=80'
              },
              {
                id: 8,
                tier: 'PREMIUM',
                subtitle: 'MORE VARIETY, MORE GOODNESS',
                desc: 'A wider range of fruits & seasonal picks.',
                fruits: 'Pineapple, Dragon Fruit, Papaya, Guava, Berries, Seasonal Fruit',
                price: 75,
                calories: 220,
                img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
              },
              {
                id: 9,
                tier: 'DELUXE',
                subtitle: 'THE BEST OF NATURE',
                desc: 'A premium mix of the finest fruits.',
                fruits: 'Strawberry, Blueberries, Kiwi, Papaya, Guava, Pineapple, Apple, Pears',
                price: 100,
                calories: 260,
                img: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=600&q=80'
              }
            ].map(tier => {
              const matchedItem = foodItems.find(i => i.id === tier.id) || {
                id: tier.id,
                name: `${tier.tier} Fruit Bowl`,
                price: tier.price,
                description: tier.desc,
                calories: tier.calories,
                protein: 4.0,
                carbs: 45.0,
                fat: 1.0,
                image_url: tier.img
              };

              return (
                <div key={tier.tier} className="bg-[#FAF8F3] rounded-3xl border border-emerald-100 p-6 text-center shadow-sm hover:shadow-xl transition flex flex-col justify-between">
                  <div>
                    <span className="inline-block bg-[#1C3822] text-emerald-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                      {tier.tier}
                    </span>
                    <h3 className="font-serif font-bold text-slate-900 text-sm">{tier.subtitle}</h3>
                    <p className="text-[11px] text-slate-500 mt-1 mb-4">{tier.desc}</p>

                    <div className="relative h-44 w-44 mx-auto rounded-full overflow-hidden mb-4 shadow-md border-4 border-white">
                      <img src={tier.img} alt={tier.tier} className="w-full h-full object-cover" />
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-slate-200/80 mb-4 text-xs text-slate-700 leading-relaxed font-medium">
                      {tier.fruits}
                    </div>
                  </div>

                  <div>
                    <div className="mb-4">
                      <span className="price-pill text-xl py-2 px-6">₹{tier.price}</span>
                    </div>

                    <button 
                      onClick={() => addToCart(matchedItem)}
                      className="w-full bg-[#1C3822] hover:bg-[#2D5A37] text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4 text-emerald-300" />
                      <span>Select {tier.tier} Bowl</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Fruit Bowl Feature Footer Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-emerald-100 text-center text-xs font-bold text-slate-700">
            <div className="flex items-center justify-center gap-1.5">
              <Leaf className="w-4 h-4 text-emerald-600" />
              <span>FRESH & HYGIENIC</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>CUSTOMIZE AS YOU LIKE</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <Flame className="w-4 h-4 text-emerald-600" />
              <span>HEALTHY & NUTRITIOUS</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <Heart className="w-4 h-4 text-emerald-600" />
              <span>NO ADDED SUGAR</span>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 3: RICE BOWLS (Exact Layout from Screenshot 3) */}
      {(activeTab === 'all' || activeTab === 'rice') && riceItems.length > 0 && (
        <section className="space-y-6">
          <div className="bg-[#FAF8F3] p-6 rounded-3xl border border-emerald-100 text-center space-y-2">
            <h2 className="font-serif font-bold text-3xl text-[#1C3822]">🌾 RICE BOWLS 🌾</h2>
            <p className="text-xs text-slate-600">We have rice bowls which can be customized as your wish.</p>
            
            <div className="pt-2 flex flex-wrap justify-center gap-2 text-[11px] font-bold text-emerald-900">
              {['Dal Rice', 'Curd Rice', 'Puliyogare', 'Veg Pulao', 'Paneer Fried Rice', 'Chicken Fried Rice', 'Mushroom Fried Rice'].map((item, idx) => (
                <span key={idx} className="bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-200/60">
                  ✔ {item}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {riceItems.map(item => (
              <div 
                key={item.id}
                className="bg-white rounded-3xl border border-emerald-100 overflow-hidden shadow-sm hover:shadow-xl transition flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-56 w-full overflow-hidden cursor-pointer" onClick={() => inspectItem(item)}>
                    <img 
                      src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'} 
                      alt={item.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />

                    {item.is_bestseller && (
                      <span className="absolute top-3 left-3 badge-bestseller shadow-md">
                        BESTSELLER
                      </span>
                    )}

                    <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-0.5 rounded-full text-xs font-bold text-slate-800">
                      {item.calories} kcal
                    </div>
                  </div>

                  <div className="p-5 text-center">
                    <h3 
                      className="font-serif font-bold text-base text-slate-900 hover:text-emerald-800 cursor-pointer transition uppercase"
                      onClick={() => inspectItem(item)}
                    >
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 mb-4 h-10 leading-snug">
                      {item.description}
                    </p>

                    <div className="mb-3">
                      <span className="price-pill text-lg py-1 px-5">₹{item.price}</span>
                    </div>

                    <div className="flex items-center justify-center gap-3 text-xs text-slate-600 pt-2 border-t border-slate-100 font-medium">
                      <span>💪 {item.protein}g Protein</span>
                      <span>🍚 {item.carbs}g Carbs</span>
                      <span>🥑 {item.fat}g Fat</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 flex gap-2">
                  <button 
                    onClick={() => inspectItem(item)}
                    className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
                  >
                    Macros
                  </button>
                  <button 
                    onClick={() => addToCart(item)}
                    className="flex-1 bg-[#1C3822] hover:bg-[#2D5A37] text-white font-bold py-2 rounded-xl text-xs transition shadow-md flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4 text-emerald-300" />
                    <span>Add Bowl</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PAGINATED GENERAL FOOD CATALOG */}
      <section className="space-y-6 pt-6 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif font-bold text-2xl text-[#1C3822]">ALL HEALTHY DISHES ({filteredItems.length})</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Explore our full menu catalog, newly added dishes & special dietary offerings.</p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        {paginatedItems.length === 0 ? (
          <div className="bg-[#FAF8F3] border border-emerald-100 rounded-3xl p-12 text-center text-slate-500 text-sm">
            No dishes found matching your search or filter options.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedItems.map(item => (
              <div 
                key={item.id}
                className="bg-[#FAF8F3] rounded-3xl border border-emerald-100/90 overflow-hidden shadow-sm hover:shadow-xl transition flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-48 w-full overflow-hidden cursor-pointer" onClick={() => inspectItem(item)}>
                    <img 
                      src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'} 
                      alt={item.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
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

                  <div className="p-5 text-center">
                    <h3 
                      className="font-serif font-bold text-base text-slate-900 hover:text-emerald-800 cursor-pointer transition uppercase"
                      onClick={() => inspectItem(item)}
                    >
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 mb-3 h-10 line-clamp-2">
                      {item.description}
                    </p>

                    <div className="mb-3">
                      <span className="price-pill text-lg py-1 px-5">₹{item.price}</span>
                    </div>

                    <div className="flex items-center justify-center gap-3 text-xs text-slate-600 pt-2 border-t border-slate-200/60 font-medium">
                      <span>🔥 {item.calories} kcal</span>
                      <span>💪 {item.protein}g Protein</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 flex gap-2">
                  <button 
                    onClick={() => inspectItem(item)}
                    className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition"
                  >
                    Macros
                  </button>
                  <button 
                    onClick={() => addToCart(item)}
                    className="flex-1 bg-[#1C3822] hover:bg-[#2D5A37] text-white font-bold py-2 rounded-xl text-xs transition shadow-md flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4 text-emerald-300" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Catalog Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 bg-[#FAF8F3] rounded-2xl border border-emerald-100 flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Showing Page {currentPage} of {totalPages} ({filteredItems.length} Total)</span>
            <div className="flex items-center space-x-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-50 transition"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`px-3.5 py-2 rounded-xl border transition ${p === currentPage ? 'bg-[#1C3822] text-white border-[#1C3822]' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-50 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

    </div>
  );
}
