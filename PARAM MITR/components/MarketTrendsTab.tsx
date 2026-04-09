import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Search, Newspaper, MapPin, Sparkles, Wheat, Leaf, Apple, Carrot, Calendar, ChevronRight, Phone, Navigation, ArrowLeft, Share2, AlertCircle, ArrowUpRight, ArrowDownRight, Info, Truck, Layers, Loader2, Store, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import { getGeneratedMarketPrices, getPriceTrendAnalysis, getMarketNewsAnalysis, clearGroundingBackoff } from '../services/geminiService';
import { MarketPrice, MarketNewsData } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const CATEGORIES = [
  { 
      name: 'Vegetables', 
      icon: <Carrot size={16} />, 
      items: ['Tomato', 'Onion', 'Potato', 'Okra', 'Cabbage', 'Spinach', 'Bottle Gourd', 'Green Chilli', 'Garlic', 'Peas'] 
  },
  { 
      name: 'Fruits', 
      icon: <Apple size={16} />, 
      items: ['Banana', 'Mango', 'Pomegranate', 'Papaya', 'Apple', 'Guava', 'Orange', 'Watermelon', 'Pineapple', 'Lemon'] 
  },
  { 
      name: 'Grains', 
      icon: <Wheat size={16} />, 
      items: ['Wheat', 'Rice', 'Maize', 'Jowar', 'Ragi', 'Barley', 'Bengal Gram', 'Green Gram'] 
  },
  { 
      name: 'Commercial', 
      icon: <Leaf size={16} />, 
      items: ['Soybean', 'Cumin', 'Mustard', 'Groundnut', 'Coffee', 'Tea'] 
  },
];

const MarketTrendsTab: React.FC = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [userLocation, setUserLocation] = useState<string>("");
  const [locationName, setLocationName] = useState<string>("India");
  const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'found' | 'error'>('idle');
  const [activeCategory, setActiveCategory] = useState<string>('Vegetables');
  const [selectedMandi, setSelectedMandi] = useState<MarketPrice | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  
  // News State
  const [showNews, setShowNews] = useState(false);
  const [newsData, setNewsData] = useState<MarketNewsData | null>(null);
  const [newsLoading, setNewsLoading] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
        setLocationStatus('locating');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation(`${latitude}, ${longitude}`);
                setLocationStatus('found');
            },
            (err) => {
                console.warn("Location access denied for market trends", err);
                setLocationStatus('error');
            },
            { timeout: 10000, enableHighAccuracy: false }
        );
    }
  }, []);

  const handleSearch = async (term: string = searchTerm) => {
      if (!term) return;
      setLoading(true);
      setSearchTerm(term);
      setSelectedMandi(null);
      setQuotaExceeded(false);
      
      try {
        const prices = await getGeneratedMarketPrices(term, userLocation);
        const aiAnalysis = await getPriceTrendAnalysis(term, userLocation);
        
        setMarketPrices(prices);
        setAnalysis(aiAnalysis);
        setHasSearched(true);
      } catch (e: any) {
          console.error("Search failed", e);
          if (e.message === "QUOTA_EXCEEDED") {
              setQuotaExceeded(true);
          }
      } finally {
          setLoading(false);
      }
  };

  const handleClearBackoff = () => {
    clearGroundingBackoff();
    setQuotaExceeded(false);
    if (searchTerm) handleSearch();
  };

  const handleOpenNews = async () => {
    setShowNews(true);
    if (!newsData) {
        setNewsLoading(true);
        try {
            const data = await getMarketNewsAnalysis(userLocation);
            setNewsData(data);
        } catch (e: any) {
            if (e.message === "QUOTA_EXCEEDED") setQuotaExceeded(true);
        }
        setNewsLoading(false);
    }
  };

  const openMaps = (address: string) => {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
  };
  
  const getPhoneLink = (phone: string | undefined) => {
    if (!phone || phone.toLowerCase().includes('not')) return null;
    return `tel:${phone.replace(/[^\d+]/g, '')}`;
  };

  const handleShare = async (mandi: MarketPrice) => {
    if (navigator.share) {
        try {
            await navigator.share({
                title: `${mandi.market} Price Update`,
                text: `${mandi.crop} is trading at ₹${mandi.price}/${mandi.unit} at ${mandi.market}. Check details on AgroAssist.`,
                url: window.location.href
            });
        } catch (error) {
            console.log('Error sharing:', error);
        }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN').format(price);
  };

  if (selectedMandi) {
      const phoneLink = getPhoneLink(selectedMandi.phoneNumber);

      return (
          <div className="p-4 space-y-6 pb-24 min-h-[80vh] bg-gray-50 animate-slide-in">
              <div className="flex items-center gap-3 sticky top-0 bg-gray-50 pt-2 pb-2 z-10">
                  <button onClick={() => setSelectedMandi(null)} className="p-2.5 bg-white rounded-2xl shadow-sm hover:bg-gray-100 transition active:scale-90">
                      <ArrowLeft size={20} className="text-gray-700"/>
                  </button>
                  <h1 className="text-xl font-black text-gray-900 flex-1 truncate">{selectedMandi.market}</h1>
                  <button onClick={() => handleShare(selectedMandi)} className="p-2.5 bg-white rounded-2xl shadow-sm hover:bg-gray-100 transition text-emerald-600 active:scale-90">
                      <Share2 size={20} />
                  </button>
              </div>

              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-6">
                      <div>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Mandi Rate</p>
                          <h2 className="text-3xl font-black text-gray-900 leading-tight">{t(selectedMandi.crop)}</h2>
                      </div>
                      <div className="text-right">
                         <div className="text-3xl font-black text-emerald-600 leading-none">₹{formatPrice(selectedMandi.price)}</div>
                         <div className="text-[10px] text-gray-400 font-bold uppercase mt-1">per {selectedMandi.unit}</div>
                      </div>
                  </div>
                  
                  <div className="flex gap-4 mb-8">
                      <div className="bg-emerald-50 px-4 py-3 rounded-2xl border border-emerald-100 flex-1 text-center shadow-sm">
                          <span className="block text-[10px] text-emerald-600 font-black uppercase mb-1">Per Kg</span>
                          <span className="block text-xl font-black text-emerald-800">₹{selectedMandi.pricePerKg || (selectedMandi.price / 100).toFixed(1)}</span>
                      </div>
                       <div className={`px-4 py-3 rounded-2xl border flex-1 text-center shadow-sm ${selectedMandi.trend === 'up' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                          <span className="block text-[10px] font-black uppercase mb-1">Daily Change</span>
                          <span className="flex items-center justify-center gap-1 font-black text-xl">
                             {selectedMandi.trend === 'up' ? <TrendingUp size={18}/> : <TrendingDown size={18}/>}
                             {selectedMandi.change}%
                          </span>
                      </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-gray-100">
                      <div className="flex items-start gap-4">
                          <div className="p-2.5 bg-gray-50 rounded-xl text-gray-400 shrink-0 border border-gray-100">
                            <MapPin size={20} />
                          </div>
                          <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mandi Address</p>
                              <p className="text-sm text-gray-900 font-bold leading-relaxed">{selectedMandi.address || "Address details currently loading..."}</p>
                          </div>
                      </div>
                      <div className="flex items-start gap-4">
                          <div className="p-2.5 bg-gray-50 rounded-xl text-gray-400 shrink-0 border border-gray-100">
                            <Phone size={20} />
                          </div>
                          <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Official Contact</p>
                              <p className="text-sm text-gray-900 font-black tracking-tight">{selectedMandi.phoneNumber || "Verified number pending..."}</p>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <a 
                    href={phoneLink || '#'}
                    className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-black shadow-lg transition active:scale-95 ${
                        phoneLink
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                    }`}
                    onClick={(e) => !phoneLink && e.preventDefault()}
                  >
                      <Phone size={20} /> Call Mandi
                  </a>
                  <button 
                    onClick={() => openMaps(selectedMandi.address || selectedMandi.market)}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-blue-700 transition active:scale-95"
                  >
                      <Navigation size={20} /> View Map
                  </button>
              </div>

              <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-gray-100">
                  <h3 className="font-black text-gray-900 text-lg mb-6 flex items-center gap-3">
                      <Store size={22} className="text-blue-500"/> Market Intelligence
                  </h3>
                  
                  <div className="space-y-6">
                       <div>
                           <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                               <Truck size={16} className="text-blue-500"/> Daily Arrival Load
                           </div>
                           <div className="bg-blue-50 px-4 py-3 rounded-2xl text-sm text-blue-900 border border-blue-100 font-black">
                               {selectedMandi.capacity || "Processing volume data..."}
                           </div>
                       </div>
                       
                       <div>
                           <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                               <Layers size={16} className="text-amber-500"/> Key Commodities Today
                           </div>
                           <div className="flex flex-wrap gap-2.5">
                               {selectedMandi.commodities && selectedMandi.commodities.length > 0 ? (
                                   selectedMandi.commodities.map((comm, idx) => (
                                       <span key={idx} className="text-[11px] bg-amber-50 text-amber-800 px-3.5 py-1.5 rounded-xl border border-amber-100 font-black uppercase tracking-tighter">
                                           {t(comm)}
                                       </span>
                                   ))
                               ) : (
                                   <span className="text-xs text-gray-400 font-bold italic">No extra commodities reported</span>
                               )}
                           </div>
                       </div>
                  </div>
              </div>
          </div>
      );
  }

  if (showNews) {
    return (
        <div className="p-4 space-y-6 pb-24 min-h-[80vh] bg-gray-50 animate-slide-in">
             <div className="flex items-center gap-3 sticky top-0 bg-gray-50 pt-2 pb-2 z-10">
                  <button onClick={() => setShowNews(false)} className="p-2.5 bg-white rounded-2xl shadow-sm hover:bg-gray-100 transition active:scale-90">
                      <ArrowLeft size={20} className="text-gray-700"/>
                  </button>
                  <h1 className="text-xl font-black text-gray-900">Today's Market Pulse</h1>
              </div>

              {newsLoading ? (
                  <div className="flex flex-col items-center justify-center h-80 text-gray-400 space-y-4">
                      <Loader2 size={48} className="animate-spin text-emerald-600" />
                      <p className="text-sm font-black uppercase tracking-widest">Aggregating Agri-Intelligence...</p>
                  </div>
              ) : newsData ? (
                <>
                    <div className="space-y-4">
                        <h3 className="font-black text-gray-900 flex items-center gap-3 text-lg">
                            <TrendingUp className="text-red-500" size={24} />
                            Price Surge Alerts
                        </h3>
                        {newsData.highs.map((item, idx) => (
                            <div key={idx} className="bg-white p-5 rounded-[1.5rem] border-l-[6px] border-red-500 shadow-sm flex justify-between items-start">
                                <div className="flex-1 pr-4">
                                    <h4 className="font-black text-gray-900 text-lg leading-tight">{t(item.crop)}</h4>
                                    <div className="text-[10px] text-gray-400 font-bold mt-1 flex items-center gap-1.5 uppercase tracking-widest">
                                        <MapPin size={10} /> {item.market}
                                    </div>
                                    <div className="text-[11px] text-red-700 mt-3 font-black bg-red-50 px-3 py-1.5 rounded-xl border border-red-100">
                                        {item.reason}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-black text-red-600 text-xl flex items-center justify-end gap-1">
                                         {item.price} <ArrowUpRight size={20}/>
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest">{item.date}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                     <div className="space-y-4 pt-4">
                        <h3 className="font-black text-gray-900 flex items-center gap-3 text-lg">
                            <TrendingDown className="text-emerald-500" size={24} />
                            Best Buying Opportunities
                        </h3>
                        {newsData.lows.map((item, idx) => (
                            <div key={idx} className="bg-white p-5 rounded-[1.5rem] border-l-[6px] border-emerald-500 shadow-sm flex justify-between items-start">
                                <div className="flex-1 pr-4">
                                    <h4 className="font-black text-gray-900 text-lg leading-tight">{t(item.crop)}</h4>
                                    <div className="text-[10px] text-gray-400 font-bold mt-1 flex items-center gap-1.5 uppercase tracking-widest">
                                        <MapPin size={10} /> {item.market}
                                    </div>
                                    <div className="text-[11px] text-emerald-800 mt-3 font-black bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                                        {item.reason}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-black text-emerald-600 text-xl flex items-center justify-end gap-1">
                                         {item.price} <ArrowDownRight size={20}/>
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest">{item.date}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-6">
                        <h3 className="font-black text-gray-900 mb-5 flex items-center gap-3 text-lg">
                            <Newspaper size={24} className="text-blue-600" /> Agriculture Headlines
                        </h3>
                        <div className="space-y-4">
                            {newsData.generalNews.map((news, idx) => (
                                <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                                    <h4 className="font-black text-gray-900 text-base mb-3 leading-snug">{news.headline}</h4>
                                    <p className="text-sm text-gray-500 leading-relaxed mb-5 font-medium">{news.summary}</p>
                                    <div className="flex justify-between items-center text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black border-t border-gray-50 pt-4">
                                        <span>{news.source}</span>
                                        <span>{news.date}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
              ) : (
                <div className="text-center py-20 text-gray-400 font-bold">Intelligence feed currently empty.</div>
              )}
        </div>
    )
  }

  return (
    <div className="p-4 space-y-6 pb-24 min-h-[85vh] bg-gray-50/30">
      {/* Polished Status Bar Header for Consistency */}
      <div className="bg-white/90 backdrop-blur-lg px-5 py-4 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between sticky top-2 z-30">
          <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 shadow-inner">
                  <Navigation size={20} className={locationStatus === 'locating' ? 'animate-spin' : 'animate-pulse'} />
              </div>
              <div className="overflow-hidden max-w-[150px]">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Mandi Search Area</p>
                  <p className="text-sm font-black text-gray-800 truncate">{locationStatus === 'found' ? 'Current Location' : 'All India'}</p>
              </div>
          </div>
          <div className="flex gap-1">
             <div className="bg-emerald-50 px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-emerald-100">
                <CheckCircle size={12} className="text-emerald-600" />
                <span className="text-[9px] font-black text-emerald-600 uppercase">Live Rates</span>
             </div>
          </div>
      </div>

      <div className="flex justify-between items-center px-1">
        <h2 className="text-2xl font-black text-gray-900 leading-tight">Mandi Price Pulse</h2>
        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
           <MapPin size={12} className="text-red-500" /> Real-time
        </div>
      </div>

      {quotaExceeded && (
          <div className="bg-amber-50 p-5 rounded-[2rem] border border-amber-100 shadow-sm flex flex-col gap-4 animate-fade-in">
              <div className="flex items-start gap-3">
                  <div className="bg-white p-2.5 rounded-xl text-amber-600 shadow-sm border border-amber-100">
                    <AlertCircle size={24} />
                  </div>
                  <div className="flex-1">
                      <p className="text-sm font-black text-amber-800 leading-tight">Daily Mandi Search Limit Reached</p>
                      <p className="text-[11px] text-amber-600 mt-1 font-bold leading-relaxed">Search grounding quota reached. Showing seasonal knowledge or cached data.</p>
                  </div>
              </div>
              <button 
                onClick={handleClearBackoff}
                className="w-full bg-white border border-amber-200 py-3.5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest text-amber-700 flex items-center justify-center gap-2 hover:bg-amber-100 transition-all shadow-sm active:scale-95"
              >
                  <RefreshCw size={14} /> Clear Backoff & Retry
              </button>
          </div>
      )}

      {/* Modern Search with Perfectly Aligned Icon */}
      <div className="relative group">
          <input 
            type="text" 
            placeholder={t('search_placeholder', "Find current rates for any crop...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4.5 rounded-3xl border border-gray-200 bg-white outline-none focus:ring-4 focus:ring-emerald-500/10 shadow-sm group-hover:shadow-md transition-all text-gray-800 font-black placeholder:font-bold"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={22} />
          </div>
          <button 
            onClick={() => handleSearch()}
            disabled={loading || !searchTerm}
            className="absolute right-2.5 top-2 bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 disabled:opacity-30 shadow-lg flex items-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="text-emerald-400" />}
            {loading ? 'Finding...' : 'Verify'}
          </button>
      </div>

      {/* Dynamic Categories */}
      <div className="space-y-4">
         <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
            {CATEGORIES.map((cat) => (
                <button
                    key={cat.name}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black whitespace-nowrap transition-all border shadow-sm ${
                        activeCategory === cat.name 
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xl shadow-emerald-100 scale-105' 
                        : 'bg-white border-gray-100 text-gray-500 hover:border-emerald-300'
                    }`}
                >
                    {cat.icon} {t(cat.name)}
                </button>
            ))}
         </div>
         <div className="flex flex-wrap gap-2 px-1">
             {CATEGORIES.find(c => c.name === activeCategory)?.items.map(item => (
                 <button 
                    key={item}
                    onClick={() => handleSearch(item)}
                    className="bg-white border border-gray-200 text-gray-700 text-[11px] font-black px-4 py-3 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 active:scale-90 transition-all uppercase tracking-tight shadow-sm"
                 >
                    {t(item)}
                 </button>
             ))}
         </div>
      </div>

      {!hasSearched && (
          <div className="text-center py-24 flex flex-col items-center justify-center opacity-30">
              <TrendingUp size={80} className="mb-6 text-emerald-900" />
              <p className="font-black text-gray-900 uppercase tracking-[0.25em]">Live Mandi Hub</p>
              <p className="text-xs font-bold mt-2">Search any crop to see real-time pricing from nearest markets.</p>
          </div>
      )}

      {hasSearched && (
        <>
            {/* AI Insight Section */}
            <div className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                    <Sparkles size={100} className="text-emerald-900"/>
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600 border border-emerald-200 shadow-inner">
                          <Sparkles size={20} />
                        </div>
                        <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Agro-AI Insight</h3>
                    </div>
                    <p className="text-base text-gray-700 leading-relaxed font-bold italic">
                        "{analysis}"
                    </p>
                </div>
            </div>

            {/* Price Table / Mandis - FIXED LAYOUT */}
            <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between px-2">
                    <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                        <Store size={20} className="text-emerald-500" /> Market Records
                    </h3>
                    <span className="text-[9px] text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 font-black uppercase tracking-widest shadow-sm">Verified Grounding</span>
                </div>
                {marketPrices.length === 0 ? (
                    <div className="bg-white p-12 rounded-[2rem] text-center text-gray-400 font-black uppercase tracking-widest border border-dashed border-gray-200 shadow-inner">
                        No active records found.
                    </div>
                ) : (
                    marketPrices.map((item, idx) => (
                        <div 
                            key={idx} 
                            onClick={() => setSelectedMandi(item)}
                            className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col gap-4 hover:shadow-xl hover:border-emerald-200 transition-all cursor-pointer active:scale-[0.98] group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform">
                                <Store size={80} />
                            </div>

                            <div className="flex justify-between items-start relative z-10">
                                <div className="flex-1 overflow-hidden pr-4">
                                    <h4 className="font-black text-gray-900 text-xl leading-tight truncate group-hover:text-emerald-600 transition-colors">
                                        {item.market}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-2 mt-2.5">
                                        <div className="bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 text-[10px] font-black text-emerald-700 uppercase tracking-tighter">
                                            {t(item.crop)}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-lg">
                                            <Calendar size={12} className="text-indigo-400" /> {item.date}
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-3 py-1.5 rounded-2xl border flex items-center gap-1.5 shadow-sm shrink-0 ${item.trend === 'up' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                    {item.trend === 'up' ? <TrendingUp size={12} strokeWidth={3} /> : <TrendingDown size={12} strokeWidth={3} />}
                                    <span className="text-[10px] font-black">{item.change}%</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-1 relative z-10">
                                <div className="flex flex-col">
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">Mandi Rate</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black text-gray-900 tracking-tighter">₹{formatPrice(item.price)}</span>
                                        <span className="text-xs font-black text-gray-400">/{item.unit || 'Qtl'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-end">
                                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Est. per kg</p>
                                        <div className="bg-gray-900 text-white px-3 py-1.5 rounded-xl font-black text-sm shadow-md group-hover:bg-emerald-600 transition-colors">
                                            ₹{item.pricePerKg || (item.price / 100).toFixed(1)}
                                        </div>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-emerald-50 transition-colors border border-gray-100">
                                        <ChevronRight size={22} className="text-gray-300 group-hover:text-emerald-600 transition-colors" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
      )}

      {/* Sticky Intelligence Feed */}
      <div 
        onClick={handleOpenNews}
        className="bg-slate-900 p-7 rounded-[2.5rem] border border-slate-800 flex gap-5 items-center cursor-pointer hover:bg-black transition-all active:scale-[0.98] shadow-2xl group overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-700">
           <Newspaper size={90} className="text-white" />
        </div>
        <div className="p-4 bg-emerald-500 rounded-3xl text-white shadow-lg group-hover:scale-110 transition-transform border border-emerald-400/30">
           <Newspaper size={26} />
        </div>
        <div className="flex-1 relative z-10">
            <h4 className="font-black text-white text-lg flex items-center justify-between">
                Market Intel Hub <ChevronRight size={20} className="text-emerald-400 group-hover:translate-x-1 transition-transform"/>
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 font-bold leading-relaxed uppercase tracking-widest">
                Trends • Surges • Price Drops • Global News
            </p>
        </div>
      </div>
    </div>
  );
};

export default MarketTrendsTab;