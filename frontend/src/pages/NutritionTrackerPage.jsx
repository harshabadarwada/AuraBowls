import React, { useState } from 'react';
import { Activity, Flame, Plus, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function NutritionTrackerPage({ foodItems, addToCart }) {
  const [selectedMealList, setSelectedMealList] = useState([
    foodItems[0] || { id: 1, name: 'Boiled Eggs', calories: 210, protein: 18, carbs: 2, fat: 14, price: 50 },
    foodItems[9] || { id: 10, name: 'Chicken & Dal Rice Bowl', calories: 480, protein: 38, carbs: 52, fat: 12, price: 179 }
  ]);

  const [selectedFoodId, setSelectedFoodId] = useState('');

  const handleAddFood = () => {
    if (!selectedFoodId) return;
    const item = foodItems.find(f => f.id === parseInt(selectedFoodId));
    if (item) {
      setSelectedMealList([...selectedMealList, item]);
    }
  };

  const handleRemove = (index) => {
    setSelectedMealList(selectedMealList.filter((_, i) => i !== index));
  };

  const totalCalories = selectedMealList.reduce((sum, item) => sum + item.calories, 0);
  const totalProtein = selectedMealList.reduce((sum, item) => sum + parseFloat(item.protein || 0), 0);
  const totalCarbs = selectedMealList.reduce((sum, item) => sum + parseFloat(item.carbs || 0), 0);
  const totalFat = selectedMealList.reduce((sum, item) => sum + parseFloat(item.fat || 0), 0);

  const targetCalories = 1800;
  const calPercent = Math.min(100, Math.round((totalCalories / targetCalories) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="bg-[#1C3822] text-emerald-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          Nutrition & Macro Dashboard
        </span>
        <h1 className="font-serif font-bold text-3xl text-[#1C3822]">Daily Nutrition Counter</h1>
        <p className="text-xs text-slate-600">
          Calculate precise calories, protein, carbohydrates, and healthy fat totals for your custom daily meals.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Select Meals */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-700" />
              <span>Build Your Daily Meal Combination</span>
            </h3>

            <div className="flex gap-2">
              <select 
                value={selectedFoodId}
                onChange={(e) => setSelectedFoodId(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-emerald-700 bg-white"
              >
                <option value="">-- Select a food item to add --</option>
                {foodItems.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.calories} kcal | {f.protein}g Protein) - ₹{f.price}
                  </option>
                ))}
              </select>

              <button 
                onClick={handleAddFood}
                className="bg-[#1C3822] hover:bg-[#2D5A37] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </div>

            {/* Selected Meals List */}
            <div className="space-y-2 pt-2">
              {selectedMealList.map((item, index) => (
                <div key={index} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">{item.name}</span>
                    <span className="text-slate-500 font-medium">
                      {item.calories} kcal • {item.protein}g Protein • {item.carbs}g Carbs • {item.fat}g Fat
                    </span>
                  </div>

                  <button 
                    onClick={() => handleRemove(index)}
                    className="text-slate-400 hover:text-red-500 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Macro Breakdown Gauge & Summary */}
        <div className="space-y-6">
          <div className="bg-[#1C3822] text-white p-6 rounded-3xl shadow-xl space-y-6">
            <h3 className="font-serif font-bold text-lg text-emerald-200">Daily Intake Summary</h3>

            {/* Calorie Gauge */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>Calories Target</span>
                <span className="text-emerald-300">{totalCalories} / {targetCalories} kcal</span>
              </div>
              <div className="w-full bg-emerald-950 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-400 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${calPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Macro Cards */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-emerald-900/60 p-3 rounded-xl border border-emerald-800">
                <span className="text-[10px] text-emerald-300 font-bold block uppercase">Protein</span>
                <span className="font-bold text-white text-lg">{totalProtein.toFixed(0)}g</span>
              </div>
              <div className="bg-emerald-900/60 p-3 rounded-xl border border-emerald-800">
                <span className="text-[10px] text-emerald-300 font-bold block uppercase">Carbs</span>
                <span className="font-bold text-white text-lg">{totalCarbs.toFixed(0)}g</span>
              </div>
              <div className="bg-emerald-900/60 p-3 rounded-xl border border-emerald-800">
                <span className="text-[10px] text-emerald-300 font-bold block uppercase">Fat</span>
                <span className="font-bold text-white text-lg">{totalFat.toFixed(0)}g</span>
              </div>
            </div>

            <button 
              onClick={() => {
                selectedMealList.forEach(item => addToCart(item));
                alert(`Added ${selectedMealList.length} calculated meals to your cart!`);
              }}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add All To Cart</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
