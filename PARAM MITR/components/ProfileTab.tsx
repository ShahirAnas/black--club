import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Phone, MapPin, Sprout, Star, Heart, History, Edit2, Save, Camera, ShoppingBag, TrendingUp, Calendar, LogOut, Award, ShieldCheck, Lock, Globe, ChevronRight, CheckCircle, Plus, Trash2, X, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth, SaleRecord } from '../contexts/AuthContext';
import { AppLanguage } from '../types';

const LANGUAGES: { name: AppLanguage, native: string }[] = [
    { name: 'English', native: 'English' },
    { name: 'Hindi', native: 'हिन्दी' },
    { name: 'Marathi', native: 'मराठी' },
    { name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
    { name: 'Gujarati', native: 'ગુજરાતી' },
    { name: 'Tamil', native: 'தமிழ்' },
    { name: 'Telugu', native: 'తెలుగు' },
    { name: 'Kannada', native: 'ಕನ್ನಡ' },
    { name: 'Bengali', native: 'বাংলা' },
    { name: 'Malayalam', native: 'മലയാളം' },
];

const ProfileTab: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { isLoggedIn, profile, login, logout, updateProfile, addSale, deleteSale } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showAddSale, setShowAddSale] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local state for editing profile fields
  const [tempProfile, setTempProfile] = useState(profile);
  
  // Local state for new sale form
  const [newSale, setNewSale] = useState({
    crop: '',
    quantity: '',
    pricePerUnit: '',
    status: 'Completed' as const
  });

  useEffect(() => {
    if (!isEditing) {
      setTempProfile(profile);
    }
  }, [profile, isEditing]);

  const totalRevenue = profile.sales.reduce((sum, item) => sum + item.total, 0);
  const totalOrders = profile.sales.length;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTempProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleImageClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempProfile(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      updateProfile(tempProfile);
    }
    setIsEditing(!isEditing);
  };

  const handleAddSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSale.crop || !newSale.quantity || !newSale.pricePerUnit) return;
    
    addSale({
      date: new Date().toLocaleDateString('en-GB'),
      crop: newSale.crop,
      quantity: parseFloat(newSale.quantity),
      pricePerUnit: parseFloat(newSale.pricePerUnit),
      status: newSale.status
    });
    
    setNewSale({ crop: '', quantity: '', pricePerUnit: '', status: 'Completed' });
    setShowAddSale(false);
  };

  const [loginPhone, setLoginPhone] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showLangSelector, setShowLangSelector] = useState(false);

  const handleLogoutClick = () => {
    if (window.confirm("Are you sure you want to log out? Any unsaved changes in other tabs might be lost.")) {
      setIsLoggingOut(true);
      // Small delay for visual feedback before hard reload
      setTimeout(() => {
        logout();
      }, 500);
    }
  };

  // --- LOGIN VIEW ---
  if (!isLoggedIn) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[75vh] p-6 text-center space-y-6 animate-fade-in">
            <div className="bg-emerald-50 p-6 rounded-full shadow-sm mb-2 border border-emerald-100">
                <User size={48} className="text-emerald-600" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Welcome Farmer</h2>
                <p className="text-gray-600 mt-2 text-sm max-w-xs mx-auto font-medium">Log in to manage your profile, track your sales history, and connect with mandis.</p>
            </div>
            <form className="w-full max-w-sm space-y-4" onSubmit={(e) => { e.preventDefault(); login(loginPhone); }}>
                <div>
                    <label className="block text-left text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Phone Number</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-3.5 text-gray-500" size={18} />
                        <input 
                            type="tel" 
                            value={loginPhone}
                            onChange={(e) => setLoginPhone(e.target.value)}
                            placeholder="+91 98765 43210" 
                            className="w-full border border-gray-300 bg-white rounded-xl py-3.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-sm text-gray-900 font-semibold placeholder-gray-400" 
                            required 
                        />
                    </div>
                </div>
                <div>
                     <label className="block text-left text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Password</label>
                     <div className="relative">
                        <Lock className="absolute left-3 top-3.5 text-gray-500" size={18} />
                        <input 
                            type="password" 
                            value={loginPass}
                            onChange={(e) => setLoginPass(e.target.value)}
                            placeholder="••••••" 
                            className="w-full border border-gray-300 bg-white rounded-xl py-3.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-sm text-gray-900 font-semibold placeholder-gray-400" 
                            required 
                        />
                    </div>
                </div>
                <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition active:scale-[0.98]">
                    {t('login', 'Log In')}
                </button>
            </form>
        </div>
      );
  }

  return (
    <div className="p-4 space-y-6 pb-24 animate-fade-in bg-gray-50/50">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">{t('profile_title', 'My Profile')}</h2>
            <button 
                onClick={handleToggleEdit}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition shadow-sm ${isEditing ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
                {isEditing ? <><Save size={16} /> {t('save_profile', 'Save')}</> : <><Edit2 size={16} /> {t('edit_profile', 'Edit')}</>}
            </button>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-r from-emerald-500 to-teal-600 opacity-20"></div>
            
            <div className="relative mb-4 group" onClick={handleImageClick}>
                <div className={`w-24 h-24 rounded-full overflow-hidden border-4 transition-all ${isEditing ? 'border-emerald-500 shadow-xl cursor-pointer' : 'border-white shadow-md'}`}>
                    {tempProfile.avatarUrl ? (
                        <img src={tempProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                            <User size={40} className="text-gray-400" />
                        </div>
                    )}
                </div>
                {isEditing && (
                    <div className="absolute bottom-0 right-0 bg-emerald-600 text-white p-2 rounded-full shadow-lg border-2 border-white">
                        <Camera size={14} />
                    </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>
            
            {isEditing ? (
                <div className="w-full max-w-xs space-y-2">
                    <input 
                        name="name"
                        value={tempProfile.name}
                        onChange={handleInputChange}
                        placeholder="Farmer Name"
                        className="text-lg font-bold text-center border-b-2 border-emerald-500 outline-none w-full bg-transparent px-2 text-gray-900 placeholder-gray-400"
                    />
                </div>
            ) : (
                <h3 className="text-xl font-bold text-gray-900">{profile.name || 'Agro Farmer'}</h3>
            )}
            <p className="text-xs text-gray-600 mt-1 uppercase tracking-widest font-bold">{t('member_since', 'Member since')} {profile.memberSince}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100"><Star size={20} className="fill-amber-500" /></div>
                <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">{t('rating', 'Rating')}</p>
                    <p className="font-bold text-gray-900">{profile.rating}</p>
                </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100"><ShoppingBag size={20} /></div>
                <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">{t('sales', 'Orders')}</p>
                    <p className="font-bold text-gray-900">{totalOrders}</p>
                </div>
            </div>
        </div>

        {/* Details Sections */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100 overflow-hidden">
            {/* Phone */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg text-gray-500 border border-gray-100"><Phone size={18} /></div>
                    <div className="text-left">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Contact Number</p>
                        {isEditing ? (
                            <input 
                                name="phone"
                                value={tempProfile.phone}
                                onChange={handleInputChange}
                                className="text-sm font-bold text-gray-900 border-b border-emerald-500 outline-none bg-transparent w-full"
                            />
                        ) : (
                            <p className="text-sm font-bold text-gray-900">{profile.phone || 'Not provided'}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Email */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg text-gray-500 border border-gray-100"><Mail size={18} /></div>
                    <div className="text-left">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Email Address</p>
                        {isEditing ? (
                            <input 
                                name="email"
                                value={tempProfile.email}
                                onChange={handleInputChange}
                                placeholder="farmer@example.com"
                                className="text-sm font-bold text-gray-900 border-b border-emerald-500 outline-none bg-transparent w-full placeholder-gray-400"
                            />
                        ) : (
                            <p className="text-sm font-bold text-gray-900">{profile.email || 'No email added'}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Location */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg text-gray-500 border border-gray-100"><MapPin size={18} /></div>
                    <div className="text-left">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Farm Location</p>
                        {isEditing ? (
                            <input 
                                name="location"
                                value={tempProfile.location}
                                onChange={handleInputChange}
                                placeholder="District, State"
                                className="text-sm font-bold text-gray-900 border-b border-emerald-500 outline-none bg-transparent w-full placeholder-gray-400"
                            />
                        ) : (
                            <p className="text-sm font-bold text-gray-900">{profile.location || 'Location not set'}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Farm Type */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg text-gray-500 border border-gray-100"><Sprout size={18} /></div>
                    <div className="text-left">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Farm Category</p>
                        {isEditing ? (
                            <select 
                                name="farmType"
                                value={tempProfile.farmType}
                                onChange={handleInputChange}
                                className="text-sm font-bold text-gray-900 border-b border-emerald-500 outline-none bg-transparent w-full py-1"
                            >
                                <option value="Organic Mixed">Organic Mixed</option>
                                <option value="Conventional">Conventional</option>
                                <option value="Hydroponic">Hydroponic</option>
                                <option value="Dairy Focused">Dairy Focused</option>
                            </select>
                        ) : (
                            <p className="text-sm font-bold text-gray-900">{profile.farmType}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Sales History Section */}
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <History size={18} className="text-emerald-600" /> Sales Log
                </h3>
                <button 
                    onClick={() => setShowAddSale(true)}
                    className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition shadow-sm"
                    title="Add manual sale record"
                >
                    <Plus size={20} />
                </button>
            </div>

            {/* Total Revenue Summary */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl flex justify-between items-center shadow-lg border border-slate-800">
                <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Earned</p>
                    <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md border border-white/5">
                    <TrendingUp size={24} className="text-emerald-400" />
                </div>
            </div>

            {/* Add Sale Form */}
            {showAddSale && (
                <form onSubmit={handleAddSaleSubmit} className="bg-white p-5 rounded-2xl shadow-xl border-2 border-emerald-100 space-y-4 animate-slide-in relative z-20">
                    <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-gray-900">Record New Sale</h4>
                        <button type="button" onClick={() => setShowAddSale(false)} className="text-gray-500 hover:text-gray-800"><X size={20}/></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                            <input 
                                placeholder="Crop Name (e.g. Wheat)" 
                                value={newSale.crop}
                                onChange={(e) => setNewSale({...newSale, crop: e.target.value})}
                                className="w-full border border-gray-300 rounded-xl p-3 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                                required
                            />
                        </div>
                        <input 
                            type="number"
                            placeholder="Qty (kg)" 
                            value={newSale.quantity}
                            onChange={(e) => setNewSale({...newSale, quantity: e.target.value})}
                            className="w-full border border-gray-300 rounded-xl p-3 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                            required
                        />
                        <input 
                            type="number"
                            placeholder="Price (₹/kg)" 
                            value={newSale.pricePerUnit}
                            onChange={(e) => setNewSale({...newSale, pricePerUnit: e.target.value})}
                            className="w-full border border-gray-300 rounded-xl p-3 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition shadow-md">
                        Confirm Record
                    </button>
                </form>
            )}

            {/* Sales List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                {profile.sales.length === 0 ? (
                    <div className="p-10 text-center flex flex-col items-center justify-center text-gray-500">
                        <History size={32} className="mb-2 opacity-30 text-gray-400" />
                        <p className="text-sm font-bold">No sales recorded yet.</p>
                        <button onClick={() => setShowAddSale(true)} className="text-xs text-emerald-600 font-bold mt-2 hover:underline">Add your first record</button>
                    </div>
                ) : (
                    profile.sales.map((sale) => (
                        <div key={sale.id} className="p-4 flex items-center justify-between group hover:bg-gray-50 transition">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100"><Award size={18} /></div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">{sale.crop}</h4>
                                    <p className="text-[10px] text-gray-600 font-bold">{sale.date} • {sale.quantity}kg @ ₹{sale.pricePerUnit}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-900">₹{sale.total.toLocaleString()}</p>
                                    <span className="text-[9px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase border border-green-100">{sale.status}</span>
                                </div>
                                <button 
                                    onClick={() => deleteSale(sale.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* App Settings Card */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <button 
                onClick={() => setShowLangSelector(!showLangSelector)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition border-b border-gray-100"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100"><Globe size={18} /></div>
                    <div className="text-left">
                        <p className="text-sm font-bold text-gray-900">{t('language_settings', 'App Language')}</p>
                        <p className="text-xs text-blue-700 font-bold">{language}</p>
                    </div>
                </div>
                <ChevronRight size={18} className={`text-gray-400 transition-transform ${showLangSelector ? 'rotate-90' : ''}`} />
            </button>
            
            {showLangSelector && (
                <div className="bg-gray-50 p-2 grid grid-cols-2 gap-2 animate-fade-in border-b border-gray-100">
                    {LANGUAGES.map(lang => (
                        <button 
                            key={lang.name}
                            onClick={async () => { await setLanguage(lang.name); setShowLangSelector(false); }}
                            className={`px-3 py-2.5 rounded-lg text-sm font-bold transition flex items-center justify-between border ${language === lang.name ? 'bg-blue-600 text-white border-blue-700 shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                        >
                            <span>{lang.native}</span>
                            {language === lang.name && <CheckCircle size={14} />}
                        </button>
                    ))}
                </div>
            )}

            <button 
                onClick={handleLogoutClick}
                disabled={isLoggingOut}
                className={`w-full px-5 py-4 flex items-center gap-3 transition ${isLoggingOut ? 'bg-gray-100 text-gray-400' : 'hover:bg-red-50 text-red-600'}`}
            >
                <div className={`p-2 rounded-lg border ${isLoggingOut ? 'bg-gray-200 border-gray-300' : 'bg-red-50 border-red-100'}`}>
                  {isLoggingOut ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
                </div>
                <span className="text-sm font-bold">{isLoggingOut ? 'Logging Out...' : t('logout', 'Sign Out')}</span>
            </button>
        </div>
    </div>
  );
};

export default ProfileTab;