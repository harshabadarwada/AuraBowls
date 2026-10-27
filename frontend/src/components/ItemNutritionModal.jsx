import React from 'react';
import { X, Flame, ShieldCheck, Plus } from 'lucide-react';

export default function ItemNutritionModal({ item, onClose, addToCart }) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto glass-modal flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-emerald-100 animate-fade-in my-8">
        
        {/* Item Image Header */}
        <div className="relative h-56 w-full">
          <img 
            src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'} 
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-900/60 text-white flex items-center justify-center hover:bg-slate-900 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-4 right-4 text-white">
            {item.is_bestseller && (
              <span className="badge-bestseller mb-1">BESTSELLER</span>
            )}
            <h3 className="font-serif font-bold text-2xl drop-shadow-md">{item.name}</h3>
            <p className="text-xs text-emerald-300 font-medium">{item.unit_info || '1 Serving'}</p>
          </div>
        </div>

        {/* Nutrition Info Body */}
        <div className="p-6">
          <p className="text-xs text-slate-600 leading-relaxed mb-4">{item.description}</p>

          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Nutritional Breakdown</span>
          </h4>

          {/* Macros Grid */}
          <div className="grid grid-cols-5 gap-1.5 text-center mb-5">
            <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-emerald-800 font-bold block uppercase">Calories</span>
              <span className="font-bold text-slate-900 text-sm">{item.calories}</span>
              <span className="text-[9px] text-slate-500 block">kcal</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Protein</span>
              <span className="font-bold text-slate-900 text-sm">{item.protein}g</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Carbs</span>
              <span className="font-bold text-slate-900 text-sm">{item.carbs}g</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Fat</span>
              <span className="font-bold text-slate-900 text-sm">{item.fat}g</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Fiber</span>
              <span className="font-bold text-slate-900 text-sm">{item.fiber || '4.0'}g</span>
            </div>
          </div>

          {/* Clean Ingredients */}
          <div className="mb-6">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Clean Ingredients</span>
            </h4>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
              {item.ingredients}
            </div>
          </div>

          {/* Footer Price & Add */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Price</span>
              <span className="price-pill text-base py-1 px-4">₹{item.price}</span>
            </div>

            <button 
              onClick={() => {
                addToCart(item);
                onClose();
              }}
              className="bg-[#1C3822] hover:bg-[#2D5A37] text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-lg flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Cart</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
