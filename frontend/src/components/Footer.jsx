import React from 'react';
import { Leaf, Dumbbell, Heart, ShieldCheck, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer({ setActivePage }) {
  return (
    <footer className="bg-[#1C3822] text-slate-200 mt-20 pt-12 pb-8 border-t border-emerald-900">
      
      {/* Brand Value Highlights Footer Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-emerald-950/70 p-6 rounded-2xl border border-emerald-800/50">
          
          <div className="flex items-center gap-4 p-2">
            <div className="w-12 h-12 rounded-full bg-emerald-800/50 flex items-center justify-center text-emerald-400">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">CLEAN INGREDIENTS</h4>
              <p className="text-xs text-emerald-300">Real food. Real good. Zero preservatives.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-2 border-t sm:border-t-0 sm:border-l border-emerald-800/50">
            <div className="w-12 h-12 rounded-full bg-emerald-800/50 flex items-center justify-center text-emerald-400">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">HIGH IN NUTRITION</h4>
              <p className="text-xs text-emerald-300">Fuel your body right. Chef & dietitian crafted.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-2 border-t sm:border-t-0 sm:border-l border-emerald-800/50">
            <div className="w-12 h-12 rounded-full bg-emerald-800/50 flex items-center justify-center text-emerald-400">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">MADE WITH CARE</h4>
              <p className="text-xs text-emerald-300">Prepared fresh every morning in Hyderabad.</p>
            </div>
          </div>

        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-emerald-900/60">
        
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center text-white font-serif font-bold text-xl">
              M
            </div>
            <div>
              <h3 className="font-serif font-bold text-white text-lg">MY MORNING</h3>
              <p className="text-[10px] text-emerald-400 tracking-widest uppercase">A HEALTHY START</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            Your monthly healthy meal plan, delivered fresh to your doorstep across Hyderabad. Portion-controlled, nutritionist-approved meals.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm mb-4">Quick Navigation</h4>
          <ul className="space-y-2 text-xs text-slate-300">
            <li><button onClick={() => setActivePage('menu')} className="hover:text-emerald-400 transition">Diet Food Menu</button></li>
            <li><button onClick={() => setActivePage('plans')} className="hover:text-emerald-400 transition">Monthly Meal Subscriptions</button></li>
            <li><button onClick={() => setActivePage('calendar')} className="hover:text-emerald-400 transition">30-Day Rotating Menu</button></li>
            <li><button onClick={() => setActivePage('tracker')} className="hover:text-emerald-400 transition">Calorie & Macro Tracker</button></li>
            <li><button onClick={() => setActivePage('dashboard')} className="hover:text-emerald-400 transition">My Subscription Dashboard</button></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm mb-4">Hyderabad Delivery Zones</h4>
          <ul className="grid grid-cols-2 gap-2 text-xs text-slate-300">
            <li>• Hitech City</li>
            <li>• Madhapur</li>
            <li>• Kondapur</li>
            <li>• Gachibowli</li>
            <li>• Financial District</li>
            <li>• Jubilee Hills</li>
            <li>• Banjara Hills</li>
            <li>• Nanakramguda</li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm mb-4">Contact & Kitchen</h4>
          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Plot 42, Hitech City Main Rd, Madhapur, Hyderabad, Telangana 500081</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>+91 98765 43210 / +91 040 2345 6789</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>support@mymorningdiet.in</span>
            </div>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
        <p>© 2026 My Morning - Diet Food & Monthly Meal Plan. All rights reserved.</p>
        <p className="mt-2 sm:mt-0">Built with Django REST Framework & React JS</p>
      </div>

    </footer>
  );
}
