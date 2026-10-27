import React from 'react';
import { ArrowRight, Leaf, ShieldCheck, Flame, Calendar, Award, Star, CheckCircle, Sparkles } from 'lucide-react';

export default function HomePage({ setActivePage, openQuiz, foodItems, addToCart, inspectItem }) {
  const popularCategories = [
    { title: 'Eggs & Toast', tag: 'High Protein Morning', desc: 'Boiled, scrambled & avocado toast', icon: '🥚', page: 'menu' },
    { title: 'Fruit Bowls', tag: 'Fresh & Wholesome', desc: 'No added sugar fruit selections', icon: '🍎', page: 'menu' },
    { title: 'Rice Bowls', tag: 'Balanced Meal', desc: 'Chicken, fish, paneer & brown rice', icon: '🥗', page: 'menu' },
    { title: 'Monthly Plans', tag: 'Save up to 30%', desc: 'Structured 30-day diet subscriptions', icon: '📅', page: 'plans' },
  ];

  const featuredItems = foodItems.slice(0, 6);

  return (
    <div className="space-y-16 pb-12">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#EBF1E5] via-[#F5F7F2] to-[#F5F7F2] pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-emerald-100/60">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-[#1C3822] text-emerald-200 text-xs font-semibold px-4 py-1.5 rounded-full shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Hyderabad's #1 Diet Meal Subscription</span>
            </div>

            <h1 className="font-serif font-bold text-4xl sm:text-5xl lg:text-6xl text-[#1C3822] leading-tight">
              Healthy Food. <br />
              <span className="text-emerald-700 italic">Simple Plans.</span> <br />
              Better Living.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Fresh, nutritious, and portion-controlled meals delivered daily to your doorstep in Hyderabad. Individual food orders or monthly subscription plans.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button 
                onClick={() => setActivePage('menu')}
                className="w-full sm:w-auto bg-[#1C3822] hover:bg-[#2D5A37] text-white font-bold px-8 py-3.5 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition hover:scale-[1.02]"
              >
                <span>Order Now</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button 
                onClick={() => setActivePage('plans')}
                className="w-full sm:w-auto bg-white hover:bg-slate-50 text-[#1C3822] font-bold px-8 py-3.5 rounded-2xl border-2 border-[#1C3822] shadow-sm flex items-center justify-center gap-2 transition"
              >
                <Calendar className="w-5 h-5 text-emerald-700" />
                <span>View Monthly Plans</span>
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-emerald-200/80 max-w-md mx-auto lg:mx-0">
              <div>
                <span className="font-serif font-bold text-2xl text-[#1C3822]">100%</span>
                <p className="text-xs text-slate-500 font-medium">Clean Ingredients</p>
              </div>
              <div>
                <span className="font-serif font-bold text-2xl text-[#1C3822]">30 Days</span>
                <p className="text-xs text-slate-500 font-medium">Rotating Menu</p>
              </div>
              <div>
                <span className="font-serif font-bold text-2xl text-[#1C3822]">4.9 ★</span>
                <p className="text-xs text-slate-500 font-medium">Customer Rating</p>
              </div>
            </div>

          </div>

          {/* Hero Image Card Showcase */}
          <div className="relative">
            <div className="relative z-10 bg-white p-4 rounded-3xl shadow-2xl border border-emerald-100/80 max-w-md mx-auto">
              <div className="relative h-72 rounded-2xl overflow-hidden mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80" 
                  alt="My Morning Rice Bowl"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 bg-[#1C3822] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  BESTSELLER ₹179
                </div>
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  480 kcal | 38g Protein
                </div>
              </div>

              <div className="px-2">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-slate-900">Chicken & Dal Rice Bowl</h3>
                    <p className="text-xs text-slate-500">Grilled Chicken Breast + Dal Rice + Steamed Salad</p>
                  </div>
                  <span className="price-pill-sm">₹179</span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> Chef & Dietitian Approved
                  </span>
                  <button 
                    onClick={() => setActivePage('menu')}
                    className="bg-[#1C3822] hover:bg-[#2D5A37] text-white font-bold px-4 py-1.5 rounded-xl text-xs transition"
                  >
                    View Menu →
                  </button>
                </div>
              </div>
            </div>

            {/* Background Floating Decorative leaf element */}
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-emerald-200/40 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-emerald-300/30 rounded-full blur-3xl pointer-events-none"></div>
          </div>

        </div>
      </section>

      {/* Popular Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="font-serif font-bold text-3xl text-[#1C3822]">Popular Diet Categories</h2>
          <p className="text-sm text-slate-600 mt-2">Explore healthy meal options categorized according to your lifestyle & fitness goals.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularCategories.map((cat, idx) => (
            <div 
              key={idx}
              onClick={() => setActivePage(cat.page)}
              className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-xl transition cursor-pointer group hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#EBF1E5] flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                {cat.icon}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                {cat.tag}
              </span>
              <h3 className="font-serif font-bold text-xl text-slate-900 mt-2 group-hover:text-emerald-800 transition">{cat.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{cat.desc}</p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#1C3822]">
                <span>Explore Category</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Custom Quiz Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#1C3822] to-[#2D5A37] text-white p-8 sm:p-12 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="space-y-4 max-w-xl text-center md:text-left z-10">
            <span className="bg-emerald-700 text-emerald-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Interactive Diet Calculator
            </span>
            <h2 className="font-serif font-bold text-3xl sm:text-4xl text-white">Not sure which diet plan fits your goals?</h2>
            <p className="text-sm text-emerald-100 leading-relaxed">
              Answer 5 quick questions about your age, fitness goal, dietary preference, and Hyderabad delivery zone to get an instant tailored meal plan & calorie recommendation.
            </p>
            <button 
              onClick={openQuiz}
              className="bg-white hover:bg-emerald-50 text-[#1C3822] font-bold px-8 py-3 rounded-xl text-sm shadow-lg transition hover:scale-105 inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>Take 1-Minute Diet Quiz</span>
            </button>
          </div>

          <div className="w-full md:w-auto z-10">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-center text-emerald-50 space-y-3">
              <div className="font-bold text-3xl text-white">1,450 kcal</div>
              <p className="text-xs">Average Recommended Daily Target</p>
              <div className="flex justify-center gap-4 text-xs font-medium pt-2 border-t border-white/20">
                <span>💪 30% Protein</span>
                <span>🍚 45% Carbs</span>
                <span>🥑 25% Fat</span>
              </div>
            </div>
          </div>

          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        </div>
      </section>

      {/* Featured Menu Items Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="font-serif font-bold text-3xl text-[#1C3822]">Today's Featured Meals</h2>
            <p className="text-sm text-slate-600 mt-1">Freshly prepared, portion-controlled meals available for immediate delivery.</p>
          </div>
          <button 
            onClick={() => setActivePage('menu')}
            className="text-emerald-800 font-bold text-sm hover:underline flex items-center gap-1"
          >
            <span>View Full Menu</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredItems.map(item => (
            <div 
              key={item.id}
              className="bg-white rounded-2xl border border-emerald-100 overflow-hidden shadow-sm hover:shadow-lg transition flex flex-col justify-between"
            >
              <div>
                <div className="relative h-48 w-full overflow-hidden cursor-pointer" onClick={() => inspectItem(item)}>
                  <img 
                    src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'} 
                    alt={item.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  {item.is_bestseller && (
                    <span className="absolute top-3 left-3 badge-bestseller">BESTSELLER</span>
                  )}
                  <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-0.5 rounded-full text-xs font-bold text-slate-800">
                    {item.calories} kcal
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 
                      className="font-serif font-bold text-lg text-slate-900 hover:text-emerald-800 transition cursor-pointer"
                      onClick={() => inspectItem(item)}
                    >
                      {item.name}
                    </h3>
                    <span className="price-pill-sm">₹{item.price}</span>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">{item.description}</p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 font-medium">
                    <span>💪 {item.protein}g Protein</span>
                    <span>🍚 {item.carbs}g Carbs</span>
                    <span>🥑 {item.fat}g Fat</span>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 flex items-center gap-2">
                <button 
                  onClick={() => inspectItem(item)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
                >
                  Nutrition Info
                </button>
                <button 
                  onClick={() => addToCart(item)}
                  className="flex-1 bg-[#1C3822] hover:bg-[#2D5A37] text-white font-bold py-2 rounded-xl text-xs transition shadow-md"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-[#EBF1E5]/60 py-16 px-4 sm:px-6 lg:px-8 border-y border-emerald-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-serif font-bold text-3xl text-[#1C3822]">Why Choose My Morning?</h2>
            <p className="text-sm text-slate-600 mt-2">Combining chef-crafted taste with rigorous nutritional science for your daily wellness.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-[#1C3822] text-emerald-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Leaf className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-900 mb-2">Fresh Local Ingredients</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Farm-fresh vegetables, organic brown rice, cold-pressed oils, and premium lean proteins sourced daily in Hyderabad.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-[#1C3822] text-emerald-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-900 mb-2">Portion Controlled</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Every meal is pre-measured for exact calories, protein, carbohydrates, and healthy fats to eliminate guesswork.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-[#1C3822] text-emerald-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-900 mb-2">Flexible Monthly Plans</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pause your subscription anytime, skip selected days, or change your delivery address with 1-click in your customer portal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews & Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="font-serif font-bold text-3xl text-[#1C3822]">Loved by Health Enthusiasts in Hyderabad</h2>
          <p className="text-sm text-slate-600 mt-2">See what our monthly subscribers say about their transformation journey.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: 'Dr. Ananya Reddy',
              role: 'Working Professional, Hitech City',
              review: 'Fresh food and convenient monthly plan. The variety of meals helped me stay consistent with my calorie targets without cooking hassle!',
              rating: 5
            },
            {
              name: 'Rahul Varma',
              role: 'Fitness Enthusiast, Gachibowli',
              review: 'The Chicken & Dal Rice bowl and Avocado Scrambled Egg Toast are absolute game-changers for my protein intake after morning workouts.',
              rating: 5
            },
            {
              name: 'Priya Nambiar',
              role: 'Corporate Executive, Madhapur',
              review: 'Super clean ingredients and on-time doorstep delivery every morning. The flexible pause feature is great when I travel for work.',
              rating: 5
            }
          ].map((t, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-600 italic leading-relaxed mb-4">"{t.review}"</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-800 text-white font-bold text-sm flex items-center justify-center">
                  {t.name[0]}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">{t.name}</h4>
                  <p className="text-[10px] text-slate-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
