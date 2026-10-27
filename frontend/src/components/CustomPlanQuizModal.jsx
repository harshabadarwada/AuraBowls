import React, { useState } from 'react';
import { X, Sparkles, Target, Flame, Dumbbell, MapPin, CheckCircle, ArrowRight } from 'lucide-react';
import { apiService } from '../services/api';

export default function CustomPlanQuizModal({ isOpen, onClose, selectedZone, setActivePage }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [formData, setFormData] = useState({
    age: 26,
    goal: 'Weight Management',
    preference: 'non_veg',
    meals_per_day: 2,
    allergies: 'None',
    location: selectedZone || 'Hitech City'
  });

  if (!isOpen) return null;

  const handleCalculate = async () => {
    setLoading(true);
    const res = await apiService.getCustomPlanRecommendation(formData);
    setLoading(false);
    setResult(res);
    setStep(3);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto glass-modal flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-emerald-100 animate-fade-in my-8">
        
        {/* Header */}
        <div className="bg-[#1C3822] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif font-bold text-lg">Customized Diet Plan Generator</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-emerald-900/60 hover:bg-emerald-800 flex items-center justify-center text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          
          {step === 1 && (
            <div className="space-y-5">
              <div className="text-center max-w-md mx-auto">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Step 1 of 2
                </span>
                <h4 className="font-serif font-bold text-slate-900 text-xl mt-2">What is your primary health goal?</h4>
                <p className="text-xs text-slate-500 mt-1">We will customize daily calories and portion sizes accordingly.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'Weight Management', title: 'Weight Loss', desc: 'Calorie deficit & portion control', icon: Target },
                  { id: 'Muscle Gain', title: 'Fitness & Protein', desc: 'High-protein lean muscle boost', icon: Dumbbell },
                  { id: 'Healthy Lifestyle', title: 'Balanced Health', desc: 'Clean nutritious eating daily', icon: Flame },
                ].map(item => {
                  const Icon = item.icon;
                  const selected = formData.goal === item.id;
                  return (
                    <div 
                      key={item.id}
                      onClick={() => setFormData({ ...formData, goal: item.id })}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition text-center ${selected ? 'border-[#1C3822] bg-emerald-50/60 shadow-md' : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${selected ? 'bg-[#1C3822] text-emerald-300' : 'bg-slate-200 text-slate-600'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h5 className="font-bold text-slate-900 text-sm">{item.title}</h5>
                      <p className="text-[11px] text-slate-500 mt-1">{item.desc}</p>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Food Preference</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'non_veg', label: 'Non-Vegetarian' },
                    { id: 'veg', label: 'Vegetarian' },
                    { id: 'vegan', label: 'Vegan' },
                  ].map(p => (
                    <button 
                      key={p.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, preference: p.id })}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${formData.preference === p.id ? 'bg-[#1C3822] text-white border-[#1C3822]' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setStep(2)}
                className="w-full bg-[#1C3822] hover:bg-[#2D5A37] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition mt-4"
              >
                <span>Continue to Preferences</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Step 2 of 2
                </span>
                <h4 className="font-serif font-bold text-slate-900 text-xl mt-2">Meals & Schedule Preference</h4>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Age</label>
                  <input 
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 25 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Meals Required / Day</label>
                  <select 
                    value={formData.meals_per_day}
                    onChange={(e) => setFormData({ ...formData, meals_per_day: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value={1}>1 Meal / Day (Lunch)</option>
                    <option value={2}>2 Meals / Day (Breakfast + Lunch)</option>
                    <option value={3}>3 Meals / Day (Full Day Plan)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Food Allergies / Dislikes</label>
                <input 
                  type="text"
                  placeholder="e.g., Mushrooms, Peanuts, Dairy (Optional)"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hyderabad Delivery Area</label>
                <div className="flex items-center gap-2 border border-slate-200 px-3 py-2 rounded-xl text-sm">
                  <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                  <select 
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-transparent outline-none cursor-pointer text-slate-800 font-medium"
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

              <div className="flex items-center gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
                >
                  Back
                </button>
                <button 
                  onClick={handleCalculate}
                  disabled={loading}
                  className="flex-1 bg-[#1C3822] hover:bg-[#2D5A37] text-white font-bold py-3 rounded-xl text-sm transition shadow-lg flex items-center justify-center gap-2"
                >
                  {loading ? 'Analyzing Diet Requirements...' : 'Generate Recommended Plan'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && result && (
            <div className="space-y-4 text-slate-800">
              <div className="bg-[#EBF1E5] p-4 rounded-2xl border border-emerald-200 text-center">
                <div className="inline-flex items-center gap-1 bg-[#1C3822] text-emerald-300 text-xs font-bold px-3 py-1 rounded-full mb-2">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Optimal Match Found
                </div>
                <h4 className="font-serif font-bold text-slate-900 text-xl">{result.recommended_plan}</h4>
                <p className="text-xs text-emerald-900 mt-1">
                  Target Daily Calorie Intake: <span className="font-bold text-[#1C3822] text-sm">{result.daily_calories} kcal/day</span>
                </p>
              </div>

              {/* Macro target breakdown */}
              <div>
                <h5 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-2">Target Daily Macro Distribution</h5>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Protein</span>
                    <p className="font-bold text-emerald-800 text-base">{result.macros.protein}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Carbohydrates</span>
                    <p className="font-bold text-emerald-800 text-base">{result.macros.carbs}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Healthy Fat</span>
                    <p className="font-bold text-emerald-800 text-base">{result.macros.fat}</p>
                  </div>
                </div>
              </div>

              {/* Recommended Meals */}
              <div>
                <h5 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-2">Recommended Meals Sample</h5>
                <ul className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {result.recommended_meals.map((m, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div>
                  <span className="text-xs text-slate-500">Monthly Plan Price</span>
                  <p className="font-bold text-xl text-[#1C3822]">₹{result.monthly_cost_estimate} <span className="text-xs text-slate-500 font-normal">/ month</span></p>
                </div>
                <button 
                  onClick={() => {
                    onClose();
                    setActivePage('plans');
                  }}
                  className="bg-[#1C3822] hover:bg-[#2D5A37] text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md transition"
                >
                  Subscribe Now
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
