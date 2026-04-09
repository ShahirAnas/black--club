
import React, { useState } from 'react';
import { Sprout, CloudSun, Store, TrendingUp, User, Landmark, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Tab } from './types';
import SoilHealthTab from './components/SoilHealthTab';
import WeatherTab from './components/WeatherTab';
import VirtualMarketTab from './components/VirtualMarketTab';
import MarketTrendsTab from './components/MarketTrendsTab';
import ProfileTab from './components/ProfileTab';
import ParamMitraChat from './components/ParamMitraChat';
import SchemesTab from './components/SchemesTab';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Inner App Content to use the Hook
const AppContent: React.FC = () => {
  const { t, isTranslating } = useLanguage();
  const { isLoggedIn, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>(Tab.SOIL);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case Tab.SOIL:
        return <SoilHealthTab />;
      case Tab.WEATHER:
        return <WeatherTab />;
      case Tab.MARKET:
        return <VirtualMarketTab />;
      case Tab.PRICES:
        return <MarketTrendsTab />;
      case Tab.SCHEMES:
        return <SchemesTab />;
      case Tab.PROFILE:
        return <ProfileTab />;
      default:
        return <SoilHealthTab />;
    }
  };

  const navItems = [
    { id: Tab.SOIL, icon: Sprout, label: t('nav_soil', 'Soil'), color: 'text-emerald-600' },
    { id: Tab.WEATHER, icon: CloudSun, label: t('nav_weather', 'Weather'), color: 'text-blue-500' },
    { id: Tab.MARKET, icon: Store, label: t('nav_market', 'Market'), color: 'text-emerald-600', isCenter: true },
    { id: Tab.PRICES, icon: TrendingUp, label: t('nav_prices', 'Prices'), color: 'text-emerald-600' },
    { id: Tab.SCHEMES, icon: Landmark, label: t('nav_schemes', 'Schemes'), color: 'text-indigo-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row overflow-hidden">
      {/* Global Translation Overlay */}
      <AnimatePresence>
        {isTranslating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white"
          >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles size={40} className="mb-4 text-emerald-400" />
              </motion.div>
              <p className="font-bold text-lg">{t('translating', 'Translating App...')}</p>
              <p className="text-xs text-white/70 mt-2">Powered by Google Gemini</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 shadow-sm z-50">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-emerald-100 p-2 rounded-xl">
            <Sprout className="text-emerald-600" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">{t('app_name', 'AgroAssist')}</h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                ? 'bg-emerald-50 text-emerald-700 font-bold' 
                : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-50">
          <button 
            onClick={() => setActiveTab(Tab.PROFILE)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
              activeTab === Tab.PROFILE ? 'bg-gray-100' : 'hover:bg-gray-50'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
              {isLoggedIn && profile.avatarUrl ? (
                <img src={profile.avatarUrl} className="w-full h-full object-cover" alt="User" />
              ) : (
                <User size={20} className="text-gray-500" />
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-800 truncate">{isLoggedIn ? profile.name || 'Farmer' : 'Guest'}</p>
              <p className="text-xs text-gray-400">View Profile</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-white px-5 py-4 border-b border-gray-100 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-100 p-1.5 rounded-lg">
            <Sprout className="text-emerald-600" size={20} />
          </div>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">{t('app_name', 'AgroAssist')}</h1>
        </div>
        
        <button 
          onClick={() => setActiveTab(Tab.PROFILE)}
          className={`relative w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden transition hover:ring-2 hover:ring-emerald-100 ${activeTab === Tab.PROFILE ? 'ring-2 ring-emerald-500' : ''}`}
        >
           {isLoggedIn && profile.avatarUrl ? (
             <img src={profile.avatarUrl} className="w-full h-full object-cover" alt="User" />
           ) : (
             <User size={18} className="text-gray-500" />
           )}
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto scrollbar-hide bg-gray-50 md:max-w-4xl md:mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Fixed AI Button (Param Mitra) */}
      <AnimatePresence>
        {!isChatOpen && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsChatOpen(true)}
              className="fixed z-[60] bottom-24 right-4 md:bottom-8 md:right-8 w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 p-0.5 shadow-xl cursor-pointer flex items-center justify-center"
            >
               <div className="w-full h-full bg-black/10 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/20">
                  <Sparkles size={24} className="text-white animate-pulse" />
               </div>
            </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Overlay */}
      <AnimatePresence>
        {isChatOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed inset-0 z-[70] bg-white flex flex-col md:inset-auto md:bottom-8 md:right-8 md:w-96 md:h-[600px] md:rounded-3xl md:shadow-2xl md:overflow-hidden md:border md:border-gray-100"
            >
                <ParamMitraChat onClose={() => setIsChatOpen(false)} />
            </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 w-full z-50 pb-safe">
        <div className="flex justify-between items-center h-16 px-2">
          {navItems.map((item) => (
            item.isCenter ? (
              <div key={item.id} className="relative -top-5">
                <button 
                  onClick={() => setActiveTab(item.id)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transform transition active:scale-95 ${activeTab === item.id ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-gray-800 text-white'}`}
                >
                  <item.icon size={22} />
                </button>
              </div>
            ) : (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-0.5 ${activeTab === item.id ? item.color : 'text-gray-400 hover:text-gray-600'}`}
              >
                <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                <span className="text-[9px] font-medium">{item.label}</span>
              </button>
            )
          ))}
        </div>
      </nav>
    </div>
  );
};

const App: React.FC = () => {
    return (
        <LanguageProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </LanguageProvider>
    );
};

export default App;
