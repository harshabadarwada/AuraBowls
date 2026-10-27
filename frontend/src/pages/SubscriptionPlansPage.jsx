import React, { useState, useEffect } from 'react';
import { Check, Sparkles, Calendar, ShieldCheck, ArrowRight, Clock, MapPin, Repeat } from 'lucide-react';
import { apiService } from '../services/api';

export default function SubscriptionPlansPage({ openQuiz, selectedZone, openCart, onSubscribePlan }) {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    apiService.getMealPlans().then(res => setPlans(res));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="bg-[#1C3822] text-emerald-300 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
          Monthly Diet Subscriptions
        </span>
        <h1 className="font-serif font-bold text-4xl text-[#1C3822]">Structured Monthly Meal Packages</h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Say goodbye to meal prep, calorie counting, and repetitive cooking. Subscribe to a monthly plan and get chef-crafted diet meals delivered fresh to your doorstep in Hyderabad.
        </p>
      </div>

      {/* Subscription Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, idx) => {
          const isPopular = plan.name.includes('Standard') || idx === 1;

          return (
            <div 
              key={plan.id || idx}
              className={`relative bg-white rounded-3xl p-8 border-2 transition shadow-sm hover:shadow-2xl flex flex-col justify-between ${isPopular ? 'border-[#1C3822] ring-4 ring-emerald-500/10' : 'border-slate-100 hover:border-emerald-200'}`}
            >
              {isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#1C3822] text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-md">
                  MOST POPULAR PLAN
                </div>
              )}

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  {plan.tag}
                </span>

                <h3 className="font-serif font-bold text-2xl text-slate-900 mt-3">{plan.name}</h3>
                <p className="text-xs text-slate-500 mt-1 mb-6 leading-relaxed">{plan.description}</p>

                <div className="mb-6 pt-4 border-t border-slate-100">
                  <span className="text-3xl font-serif font-bold text-[#1C3822]">₹{plan.price.toLocaleString()}</span>
                  <span className="text-xs text-slate-500 ml-1">/ month (30 Days)</span>
                  <p className="text-[11px] text-emerald-800 font-semibold mt-1">
                    Includes {plan.total_meals || (plan.meals_per_day * 26)} total meals ({plan.meals_per_day} meal/day)
                  </p>
                </div>

                <div className="space-y-3 mb-8">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">What's included:</h4>
                  {(plan.features_list || (typeof plan.features === 'string' ? plan.features.split(',') : []) || []).map((feat, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-600">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>{typeof feat === 'string' ? feat.strip ? feat.strip() : feat.trim() : feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => {
                  setSelectedPlan(plan);
                  if (onSubscribePlan) {
                    onSubscribePlan(plan);
                  } else if (openCart) {
                    openCart();
                  }
                }}
                className={`w-full font-bold py-3.5 rounded-2xl transition shadow-md flex items-center justify-center gap-2 ${isPopular ? 'bg-[#1C3822] hover:bg-[#2D5A37] text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
              >
                <span>Subscribe to {plan.name}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>
          );
        })}
      </div>

      {/* Custom Plan Banner */}
      <div className="bg-[#FAF8F3] p-8 sm:p-10 rounded-3xl border border-emerald-100 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2 text-center md:text-left">
          <span className="badge-bestseller">CUSTOM DIET SOLUTION</span>
          <h3 className="font-serif font-bold text-2xl text-[#1C3822]">Need a Tailored Macro Plan?</h3>
          <p className="text-xs text-slate-600 max-w-lg">
            Have specific food allergies, custom meal timings, or unique calorie targets? Take our 1-minute questionnaire to generate a personalized diet program.
          </p>
        </div>

        <button 
          onClick={openQuiz}
          className="bg-[#1C3822] hover:bg-[#2D5A37] text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg transition flex items-center gap-2 whitespace-nowrap"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Generate Custom Plan</span>
        </button>
      </div>

      {/* Subscription Features & Guarantees */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
        <div className="bg-white p-5 rounded-2xl border border-emerald-100">
          <Repeat className="w-6 h-6 text-emerald-700 mx-auto mb-2" />
          <h4 className="font-bold text-slate-900 text-xs">Flexible Pause & Resume</h4>
          <p className="text-[11px] text-slate-500 mt-1">Going out of town? Pause your subscription anytime in 1 click.</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100">
          <Clock className="w-6 h-6 text-emerald-700 mx-auto mb-2" />
          <h4 className="font-bold text-slate-900 text-xs">Punctual Morning Slots</h4>
          <p className="text-[11px] text-slate-500 mt-1">Freshly cooked meals delivered at your preferred slot daily.</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100">
          <Calendar className="w-6 h-6 text-emerald-700 mx-auto mb-2" />
          <h4 className="font-bold text-slate-900 text-xs">30-Day Rotating Menu</h4>
          <p className="text-[11px] text-slate-500 mt-1">Enjoy high culinary variety every day of the month.</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100">
          <MapPin className="w-6 h-6 text-emerald-700 mx-auto mb-2" />
          <h4 className="font-bold text-slate-900 text-xs">Hyderabad Coverage</h4>
          <p className="text-[11px] text-slate-500 mt-1">Delivering across Hitech City, Madhapur, Gachibowli & nearby.</p>
        </div>
      </div>

    </div>
  );
}
