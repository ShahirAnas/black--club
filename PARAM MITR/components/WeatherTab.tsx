import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CloudRain, Sun, CloudLightning, Wind, Droplets, AlertTriangle, Cloud, 
  Search, MapPin, CloudSun, Navigation, ExternalLink, Calendar, 
  Umbrella, Clock, Star, Loader2, Snowflake, CloudFog, Thermometer,
  AlertCircle, RefreshCw, Info, CheckCircle2
} from 'lucide-react';
import { getFarmingAdvisory, getGeneratedWeather, clearGroundingBackoff, getStateFromCoordinates } from '../services/geminiService';
import { WeatherForecast } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const WeatherTab: React.FC = () => {
    const { t } = useLanguage();
    const [location, setLocation] = useState("");
    const [loading, setLoading] = useState(false);
    const [weatherData, setWeatherData] = useState<any>(null);
    const [advisory, setAdvisory] = useState("");
    const [isLocating, setIsLocating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [quotaExceeded, setQuotaExceeded] = useState(false);
    const [locationStatus, setLocationStatus] = useState<'loading' | 'found' | 'denied' | 'idle'>('idle');
    const [showInfo, setShowInfo] = useState(false);

    useEffect(() => {
        if (navigator.geolocation && !weatherData) {
            handleUseCurrentLocation();
        }
    }, []);

    const fetchWeather = async (query: string) => {
        setLoading(true);
        setError(null);
        setQuotaExceeded(false);
        try {
            const data = await getGeneratedWeather(query);
            if (data && data.current) {
                if (data.locationName) {
                    setLocation(data.locationName);
                }
                setWeatherData(data);
                const adv = await getFarmingAdvisory(data.current.condition || "Moderate", data.current.temp || 25);
                setAdvisory(adv);
            } else {
                setError("Could not retrieve forecast for this location.");
            }
        } catch (error: any) {
            if (error.message === "QUOTA_EXCEEDED") {
                setQuotaExceeded(true);
            } else {
                console.warn("Weather fetch issue:", error.message);
                setError("Network issue. Please try again.");
            }
        } finally {
            setLoading(false);
            setIsLocating(false);
            setLocationStatus('found');
        }
    };

    const handleClearBackoff = () => {
        clearGroundingBackoff();
        setQuotaExceeded(false);
        if (location) handleSearch();
    };

    const handleSearch = () => {
        if (!location.trim()) return;
        fetchWeather(location);
    };

    const handleUseCurrentLocation = () => {
        if (navigator.geolocation) {
            setIsLocating(true);
            setLocationStatus('loading');
            setError(null);
            setQuotaExceeded(false);
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const resolvedLocation = await getStateFromCoordinates(latitude, longitude);
                        fetchWeather(resolvedLocation || `${latitude}, ${longitude}`);
                    } catch (e) {
                        fetchWeather(`${latitude}, ${longitude}`);
                    }
                },
                (err) => {
                    let errorMessage = "Unable to retrieve location.";
                    if (err.code === 1) errorMessage = "Location permission denied.";
                    else if (err.code === 2) errorMessage = "Position unavailable.";
                    else if (err.code === 3) errorMessage = "Request timed out.";
                    
                    setError(errorMessage);
                    setIsLocating(false);
                    setLocationStatus('denied');
                },
                { timeout: 15000, enableHighAccuracy: true } 
            );
        } else {
            setError("Geolocation is not supported by your browser.");
        }
    };

    const renderIcon = (iconName: any, size = 24) => {
        if (!iconName || typeof iconName !== 'string') return <Sun size={size} className="text-amber-500" />;
        const lowerName = iconName.toLowerCase();
        if (lowerName.includes('rain') || lowerName.includes('drizzle')) return <CloudRain size={size} className="text-blue-500" />;
        if (lowerName.includes('lightning') || lowerName.includes('storm')) return <CloudLightning size={size} className="text-purple-600" />;
        if (lowerName.includes('snow')) return <Snowflake size={size} className="text-blue-200" />;
        if (lowerName.includes('fog') || lowerName.includes('mist')) return <CloudFog size={size} className="text-gray-300" />;
        if (lowerName.includes('cloud')) return <Cloud size={size} className="text-gray-400" />;
        return <Sun size={size} className="text-amber-500" />;
    };

    if (!weatherData) {
        return (
            <div className="p-6 pb-24 flex flex-col items-center justify-center min-h-[75vh] animate-fade-in">
                <div className="bg-blue-100 p-5 rounded-full mb-6 border-4 border-white shadow-sm">
                    <CloudSun size={48} className="text-blue-600 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('weather_title', 'Weather Forecast')}</h2>
                <p className="text-gray-500 text-center mb-8 max-w-xs leading-relaxed">Get accurate real-time weather and specialized farming advisories.</p>
                
                <div className="w-full relative space-y-4 max-w-sm">
                    {quotaExceeded && (
                         <div className="bg-amber-50 text-amber-700 p-4 rounded-2xl text-xs font-bold border border-amber-100 mb-2 flex flex-col gap-3 shadow-sm">
                            <div className="flex items-center gap-2">
                                <AlertCircle size={18} className="text-amber-600" /> 
                                <span>High Traffic: Search limit reached.</span>
                            </div>
                            <button onClick={handleClearBackoff} className="bg-white border border-amber-200 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-amber-100 transition-colors shadow-sm active:scale-95">
                                <RefreshCw size={14} /> Reset & Retry
                            </button>
                         </div>
                    )}

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-medium border border-red-100 mb-2 flex items-center gap-2">
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}
                    
                    <div className="relative group">
                        <input 
                            type="text" 
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="e.g. Nashik, Maharashtra"
                            className="w-full pl-11 pr-4 py-4 border border-gray-200 bg-white rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm group-hover:border-blue-300 font-bold"
                        />
                        <MapPin className="absolute left-4 top-4.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20}/>
                    </div>
                    
                    <button 
                        onClick={handleSearch}
                        disabled={loading || isLocating}
                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                        {loading ? 'Fetching...' : t('get_forecast', 'Get Forecast')}
                    </button>

                    <div className="flex items-center gap-4 py-2">
                        <div className="h-px bg-gray-200 flex-1"></div>
                        <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">OR</span>
                        <div className="h-px bg-gray-200 flex-1"></div>
                    </div>

                    <button 
                        onClick={handleUseCurrentLocation}
                        disabled={loading || isLocating}
                        className="w-full bg-white text-blue-600 border-2 border-blue-50 py-4 rounded-2xl font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-blue-50 transition-all disabled:opacity-70 active:scale-[0.98]"
                    >
                        {isLocating ? (
                            <><Loader2 className="animate-spin" size={18} /> Locating...</>
                        ) : (
                            <><Navigation size={18} /> {t('use_location', 'Use Accurate Location')}</>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    const { current, forecast, sources, hourly, localDate, date, isEstimated } = weatherData;
    const displayDate = localDate || (date && date.length > 5 && !date.includes('Current') ? date : new Date().toLocaleDateString('en-GB', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    }));

    return (
        <div className="p-4 space-y-6 pb-24 animate-fade-in bg-gray-50/30 min-h-screen">
            {/* Optimized Sticky Header: Aligned Location Icon & Text */}
            <div className="bg-white/90 backdrop-blur-lg px-5 py-4 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between sticky top-2 z-30">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shadow-inner">
                        <MapPin size={22} className={locationStatus === 'loading' ? 'animate-bounce' : ''} />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Your Region</p>
                        <h2 className="text-sm font-black text-gray-900 truncate max-w-[140px]">{location || "Detecting..."}</h2>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isEstimated ? (
                        <div className="bg-amber-50 px-3 py-2 rounded-xl flex items-center gap-2 border border-amber-100 shadow-sm group relative">
                             <AlertCircle size={14} className="text-amber-600" />
                             <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Seasonal</span>
                             <button onClick={() => setShowInfo(!showInfo)} className="p-1 hover:bg-amber-100 rounded-md transition-colors">
                                <Info size={12} className="text-amber-600" />
                             </button>
                        </div>
                    ) : (
                        <div className="bg-emerald-50 px-3 py-2 rounded-xl flex items-center gap-2 border border-emerald-100 shadow-sm group relative">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Live</span>
                            <button onClick={() => setShowInfo(!showInfo)} className="p-1 hover:bg-emerald-100 rounded-md transition-colors">
                                <Info size={12} className="text-emerald-500" />
                             </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Accuracy Info Popover */}
            {showInfo && (
                <div className="bg-indigo-900 text-white p-5 rounded-3xl shadow-2xl animate-scale-in border border-indigo-700/50 mx-2 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Sparkle size={60} />
                    </div>
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-2">
                            <ShieldCheck size={16} className="text-indigo-300" /> Data Source Accuracy
                        </h3>
                        <button onClick={() => setShowInfo(false)} className="bg-white/10 p-1.5 rounded-lg hover:bg-white/20">
                            <X size={14} />
                        </button>
                    </div>
                    <p className="text-sm font-bold text-indigo-100 leading-relaxed">
                        {isEstimated 
                          ? "Real-time search grounding is currently limited. We are providing seasonal averages based on historical regional data for this time of year." 
                          : "This report is grounded in real-time Google Search data for your exact coordinates, providing the most up-to-date regional metrics."}
                    </p>
                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                        <span className="text-[10px] font-black text-indigo-300 uppercase">Provider: Google Gemini v2.5</span>
                        <CheckCircle2 size={16} className="text-emerald-400" />
                    </div>
                </div>
            )}

            {/* Main Accurate Weather Card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 opacity-10 group-hover:scale-110 transition-transform duration-[4s] ease-out">
                    <Sun size={240} />
                </div>
                
                <div className="relative z-10">
                    <div className="mb-8 flex justify-between items-start">
                         <div>
                            <div className="bg-white/10 backdrop-blur-md inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-white/10 shadow-inner mb-4">
                                <Calendar size={14} className="text-blue-200"/> 
                                <p className="text-xs font-bold tracking-wide text-blue-50">{displayDate}</p>
                            </div>
                            <h2 className="text-4xl font-black leading-tight tracking-tight drop-shadow-md">{location}</h2>
                         </div>
                    </div>

                    <div className="flex justify-between items-end mb-12">
                        <div className="flex flex-col">
                            <div className="flex items-start">
                                <span className="text-8xl font-black tracking-tighter drop-shadow-md leading-none">{current.temp || 0}</span>
                                <span className="text-3xl font-bold mt-2 ml-1">°</span>
                                <span className="text-xl font-bold mt-4">C</span>
                            </div>
                            <div className="flex items-center gap-2 mt-4">
                                <div className="p-1.5 bg-white/20 rounded-lg">
                                    {renderIcon(current.condition, 18)}
                                </div>
                                <p className="text-2xl font-black text-blue-100 drop-shadow-sm">{current.condition || "Clear"}</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                            <div className="flex flex-col items-end px-4 py-3 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm">
                                <span className="text-[9px] font-black uppercase text-blue-200 mb-1">Max Temp</span>
                                <span className="text-2xl font-black">{current.tempMax || 0}°</span>
                            </div>
                            <div className="flex flex-col items-end px-4 py-3 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm">
                                <span className="text-[9px] font-black uppercase text-blue-200 mb-1">Min Temp</span>
                                <span className="text-2xl font-black">{current.tempMin || 0}°</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/10">
                        <div className="text-center group-hover:translate-y-[-2px] transition-transform">
                            <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                                <Wind size={22} className="text-blue-200" />
                            </div>
                            <span className="block text-[10px] text-blue-200 font-black uppercase tracking-widest">{t('wind', 'Wind')}</span>
                            <span className="font-black text-lg">{current.wind || 0}<span className="text-xs font-medium ml-1">km/h</span></span>
                        </div>
                        <div className="text-center group-hover:translate-y-[-2px] transition-transform">
                            <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                                <Droplets size={22} className="text-blue-200" />
                            </div>
                            <span className="block text-[10px] text-blue-200 font-black uppercase tracking-widest">{t('humidity', 'Humidity')}</span>
                            <span className="font-black text-lg">{current.humidity || 0}<span className="text-xs font-medium ml-1">%</span></span>
                        </div>
                        <div className="text-center group-hover:translate-y-[-2px] transition-transform">
                            <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                                <Umbrella size={22} className="text-blue-200" />
                            </div>
                            <span className="block text-[10px] text-blue-200 font-black uppercase tracking-widest">{t('rain', 'Rain')}</span>
                            <span className="font-black text-lg">{current.rainfall || 0}<span className="text-xs font-medium ml-1">mm</span></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Farming Advisory - Integrated Information */}
            <div className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                    <AlertTriangle size={100} className="text-amber-900"/>
                </div>
                <div className="flex gap-5">
                    <div className="p-4 bg-amber-50 rounded-3xl text-amber-600 h-fit border border-amber-100 shadow-inner group-hover:rotate-6 transition-transform">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-amber-800 font-black text-xs uppercase tracking-widest mb-3">{t('advisory_title', 'Farming Advisory')}</h3>
                        <p className="text-gray-700 text-base leading-relaxed font-bold italic">
                            "{advisory || "Stay alert for local environmental changes."}"
                        </p>
                    </div>
                </div>
            </div>

            {/* Hourly Timeline */}
            {hourly && hourly.length > 0 && (
                <div className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 border border-blue-100">
                            <Clock size={20} /> 
                        </div>
                        <div>
                            <h3 className="font-black text-gray-900 text-lg leading-tight">Hourly Timeline</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Today's Progression</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                        {hourly.map((hour: any, i: number) => (
                            <div key={i} className="snap-center flex-shrink-0 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 w-28 flex flex-col items-center justify-center group hover:bg-blue-50 hover:border-blue-200 transition-all duration-300">
                                <span className="text-[11px] font-black text-gray-400 mb-5 uppercase tracking-tighter">{hour.time}</span>
                                <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 mb-5 group-hover:scale-110 transition-transform duration-300">
                                    {renderIcon(hour.icon, 32)}
                                </div>
                                <span className="text-2xl font-black text-gray-900">{hour.temp}°</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 7 Day Forecast List */}
            {forecast && forecast.length > 0 && (
                <div className="space-y-5">
                    <h3 className="font-black text-gray-900 text-xl px-2 flex items-center gap-3">
                        <Calendar size={20} className="text-blue-600"/> {t('next_7_days', 'Next 7 Days')}
                    </h3>
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                        {forecast.map((day: WeatherForecast, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-6 hover:bg-gray-50/50 transition-colors group">
                                <div className="w-32 font-black text-gray-800 text-base">{day.day}</div>
                                <div className="flex items-center gap-4 flex-1 justify-center">
                                    <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-white transition-colors shadow-sm">
                                        {renderIcon(day.icon, 24)}
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter hidden sm:block">{day.condition}</span>
                                </div>
                                <div className="flex gap-6 w-32 justify-end items-baseline">
                                    <span className="font-black text-gray-900 text-xl">{day.tempMax}°</span>
                                    <span className="text-gray-400 font-bold text-sm">{day.tempMin}°</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Simple Data Attribution */}
            <div className="px-4 py-8 flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-px w-20 bg-gray-200"></div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">AgroAssist Intelligence</p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500">
                    <ShieldCheck size={14} className="text-emerald-500" /> High-Accuracy AI Grounding Active
                </div>
            </div>
        </div>
    );
};

// UI Components
const ShieldCheck = ({ size, className }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>
    </svg>
);

const Sparkle = ({ size, className }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    </svg>
);

const X = ({ size, className }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M18 6 6 18M6 6l12 12"/>
    </svg>
);

export default WeatherTab;