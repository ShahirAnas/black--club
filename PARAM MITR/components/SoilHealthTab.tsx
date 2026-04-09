
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, ReferenceLine, Legend } from 'recharts';
import { Layers, Activity, FlaskConical, Sparkles, MapPin, Check, ChevronRight, RotateCcw, Camera, Upload, ExternalLink, Search, Info, Droplets, Navigation, Star } from 'lucide-react';
import { SoilData } from '../types';
import { getSoilRecommendations, analyzeSoilImage, findNearestLabs } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';

const SoilHealthTab: React.FC = () => {
  const { t, language } = useLanguage();
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<string>("");
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'locating' | 'found'>('idle');
  const [nearestLabs, setNearestLabs] = useState<any[]>([]);
  
  // Scanning State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [soilImage, setSoilImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);

  // User Input State
  const [formData, setFormData] = useState<SoilData>({
      ph: 7.0,
      nitrogen: 100,
      phosphorus: 30,
      potassium: 150,
      moisture: 40,
      organicMatter: 2.5,
      type: 'Loam',
      lastTested: new Date().toISOString().split('T')[0]
  });

  // Save to session storage for AI context whenever data changes
  useEffect(() => {
      try {
        sessionStorage.setItem('lastSoilAnalysis', JSON.stringify(formData));
      } catch (e) {
          console.error("Failed to save soil context", e);
      }
  }, [formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({
          ...prev,
          [name]: name === 'type' ? value : (value === '' ? 0 : parseFloat(value))
      }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setIsScanning(true);
        setScanMessage(null);
        setScanResult(null);
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            setSoilImage(base64);
            
            // Call AI Service
            const analysis = await analyzeSoilImage(base64);
            
            if (analysis) {
                setScanResult(analysis);
                setFormData(prev => ({
                    ...prev,
                    type: analysis.type || 'Loam',
                    ph: analysis.ph || 7.0,
                    nitrogen: analysis.nitrogen || 100,
                    phosphorus: analysis.phosphorus || 30,
                    potassium: analysis.potassium || 150,
                    moisture: analysis.moisture || 40,
                    organicMatter: analysis.organicMatter || 2.5
                }));
                setScanMessage(analysis.assessment || "Analysis Complete. Data pre-filled below.");
            } else {
                setScanMessage("Could not analyze image. Please try again.");
            }
            setIsScanning(false);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
      setLoading(true);
      const advice = await getSoilRecommendations(formData, language);
      setRecommendation(advice);
      setIsAnalyzed(true);
      setLoading(false);
  };

  const handleReset = () => {
      setIsAnalyzed(false);
      setRecommendation("");
      setSoilImage(null);
      setScanMessage(null);
      setScanResult(null);
      setBookingStatus('idle');
      setNearestLabs([]);
  };

  const handleFindLabs = () => {
    setBookingStatus('locating');
    setNearestLabs([]);
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            try {
                const labs = await findNearestLabs(latitude, longitude);
                if (labs && labs.length > 0) {
                    setNearestLabs(labs);
                    setBookingStatus('found');
                } else {
                    // If AI returns empty, fallback to map
                    fallbackToMap(latitude, longitude);
                }
            } catch (e) {
                fallbackToMap(latitude, longitude);
            }
        }, (err) => {
             console.warn("Location error for booking", err);
             setBookingStatus('idle');
             window.open('https://soilhealth.dac.gov.in/', '_blank');
        });
    } else {
        setBookingStatus('idle');
        window.open('https://soilhealth.dac.gov.in/', '_blank');
    }
  };
  
  const fallbackToMap = (lat: number, lng: number) => {
      setBookingStatus('idle');
      const mapUrl = `https://www.google.com/maps/search/Soil+Testing+Laboratory/@${lat},${lng},12z`;
      window.open(mapUrl, '_blank');
  };
  
  const openMapsSearch = (query: string) => {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
  };

  const openOfficialPortal = () => {
       window.open('https://soilhealth.dac.gov.in/', '_blank');
  };

  const historyData = [
    { date: 'Previous', nitrogen: formData.nitrogen * 0.9, phosphorus: formData.phosphorus * 0.9, potassium: formData.potassium * 0.95 },
    { date: 'Current', nitrogen: formData.nitrogen, phosphorus: formData.phosphorus, potassium: formData.potassium },
  ];
  
  // Data for Scan Comparison Chart
  const comparisonData = scanResult ? [
      { name: 'N', value: scanResult.nitrogen, optimal: 140, fullMark: 200 },
      { name: 'P', value: scanResult.phosphorus, optimal: 50, fullMark: 100 },
      { name: 'K', value: scanResult.potassium, optimal: 200, fullMark: 300 },
  ] : [];

  const getStatusColor = (val: number, type: 'N' | 'P' | 'K') => {
    if (type === 'N') return val < 150 ? 'text-red-500' : 'text-green-500';
    if (type === 'P') return val < 30 ? 'text-red-500' : 'text-green-500';
    return val < 150 ? 'text-yellow-500' : 'text-green-500';
  };

  if (!isAnalyzed) {
      return (
          <div className="p-6 space-y-6 pb-24 flex flex-col items-center min-h-[75vh]">
              <div className="text-center space-y-2 mb-2">
                  <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FlaskConical size={32} className="text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">{t('soil_title', 'Soil Health Analysis')}</h2>
                  <p className="text-gray-500 text-sm">{t('soil_desc', 'Scan soil or enter test results for AI insights.')}</p>
              </div>

              {/* AI Scanner Section */}
              <div className="w-full bg-gradient-to-br from-emerald-600 to-teal-700 p-5 rounded-2xl shadow-lg text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Camera size={100} />
                  </div>
                  
                  <div className="relative z-10">
                      <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                          <Sparkles size={18} className="text-yellow-300"/> AI Soil Scanner
                      </h3>
                      <p className="text-emerald-100 text-xs mb-4">Upload a photo to detect soil type, pH & nutrients.</p>
                      
                      {soilImage ? (
                          <div className="space-y-4">
                            <div className="flex gap-4 items-center bg-black/20 p-3 rounded-xl backdrop-blur-sm">
                                <img src={soilImage} alt="Soil" className="w-16 h-16 rounded-lg object-cover border-2 border-white/50" />
                                <div className="flex-1">
                                    {isScanning ? (
                                        <p className="text-sm font-medium animate-pulse">Analyzing soil texture & color...</p>
                                    ) : (
                                        <>
                                            <p className="text-sm font-bold text-white mb-1 flex items-center gap-1"><Check size={14}/> Scan Successful</p>
                                            <button onClick={() => fileInputRef.current?.click()} className="text-xs text-yellow-300 underline mt-1">Retake Photo</button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Brief Scan Results Visualization */}
                            {!isScanning && scanResult && (
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 animate-fade-in">
                                    <h4 className="text-xs font-bold text-emerald-100 uppercase tracking-wide mb-3 flex items-center gap-1">
                                        <Activity size={12}/> Rapid Assessment
                                    </h4>
                                    
                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                        <div className="bg-black/20 rounded-lg p-2 text-center">
                                            <span className="block text-[10px] text-emerald-200">{t('soil_type', 'Type')}</span>
                                            <span className="font-bold text-sm">{t(scanResult.type)}</span>
                                        </div>
                                        <div className="bg-black/20 rounded-lg p-2 text-center">
                                            <span className="block text-[10px] text-emerald-200">pH</span>
                                            <span className={`font-bold text-sm ${scanResult.ph < 6 || scanResult.ph > 7.5 ? 'text-red-300' : 'text-green-300'}`}>{scanResult.ph}</span>
                                        </div>
                                        <div className="bg-black/20 rounded-lg p-2 text-center">
                                            <span className="block text-[10px] text-emerald-200">{t('moisture', 'Moisture')}</span>
                                            <span className="font-bold text-sm">{scanResult.moisture}%</span>
                                        </div>
                                    </div>
                                    
                                    {/* Mini Comparison Chart */}
                                    <div className="h-24 w-full bg-white/5 rounded-lg p-1">
                                         <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={comparisonData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="name" type="category" width={10} tick={{fill: 'white', fontSize: 10}} axisLine={false} tickLine={false} />
                                                <Tooltip 
                                                    cursor={{fill: 'rgba(255,255,255,0.1)'}}
                                                    contentStyle={{ backgroundColor: '#064e3b', borderColor: '#059669', color: 'white', fontSize: '10px' }}
                                                />
                                                <Bar dataKey="value" name="Detected" barSize={8} fill="#34d399" radius={[0, 4, 4, 0]} />
                                                <Bar dataKey="optimal" name="Optimal" barSize={8} fill="#fcd34d" radius={[0, 4, 4, 0]} opacity={0.7} />
                                            </BarChart>
                                         </ResponsiveContainer>
                                    </div>
                                    <div className="flex justify-center gap-4 mt-1">
                                        <div className="flex items-center gap-1 text-[10px] text-emerald-200"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> Detected</div>
                                        <div className="flex items-center gap-1 text-[10px] text-emerald-200"><div className="w-2 h-2 rounded-full bg-yellow-400"></div> Optimal</div>
                                    </div>

                                    <p className="text-xs text-emerald-100 mt-2 italic border-t border-white/10 pt-2">
                                        "{scanMessage}"
                                    </p>
                                </div>
                            )}
                          </div>
                      ) : (
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full bg-white text-emerald-700 py-3 rounded-xl font-bold shadow-md flex items-center justify-center gap-2 hover:bg-emerald-50 transition"
                          >
                              <Camera size={18} /> {t('scan_btn', 'Take Photo / Upload')}
                          </button>
                      )}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileChange}
                      />
                  </div>
              </div>

              {/* Manual Input Form */}
              <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Detailed Inputs</h3>
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-medium">Auto-filled</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      {/* Row 1: pH and Type */}
                      <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">{t('ph_level', 'pH Level')}</label>
                          <input 
                            type="number" 
                            step="0.1" 
                            name="ph" 
                            value={formData.ph || ''} 
                            onChange={handleInputChange} 
                            className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900" 
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">{t('soil_type', 'Soil Type')}</label>
                          <div className="relative">
                            <select 
                                name="type" 
                                value={formData.type} 
                                onChange={handleInputChange} 
                                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900 appearance-none pr-8 cursor-pointer"
                            >
                                <option value="Clay">{t('Clay', 'Clay')}</option>
                                <option value="Loam">{t('Loam', 'Loam')}</option>
                                <option value="Sandy">{t('Sandy', 'Sandy')}</option>
                                <option value="Silt">{t('Silt', 'Silt')}</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </div>
                          </div>
                      </div>

                      {/* Row 2: N and P */}
                      <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">{t('nitrogen', 'Nitrogen')} (N-ppm)</label>
                          <input 
                            type="number" 
                            name="nitrogen" 
                            value={formData.nitrogen || ''} 
                            onChange={handleInputChange} 
                            className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900" 
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">{t('phosphorus', 'Phosphorus')} (P-ppm)</label>
                          <input 
                            type="number" 
                            name="phosphorus" 
                            value={formData.phosphorus || ''} 
                            onChange={handleInputChange} 
                            className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900" 
                          />
                      </div>

                      {/* Row 3: K and Moisture */}
                      <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">{t('potassium', 'Potassium')} (K-ppm)</label>
                          <input 
                            type="number" 
                            name="potassium" 
                            value={formData.potassium || ''} 
                            onChange={handleInputChange} 
                            className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900" 
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">{t('moisture', 'Moisture')} (%)</label>
                          <input 
                              type="number" 
                              name="moisture" 
                              value={formData.moisture || ''} 
                              onChange={handleInputChange} 
                              className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900" 
                          />
                      </div>
                  </div>

                  <button 
                    onClick={handleAnalyze} 
                    disabled={loading}
                    className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 hover:bg-emerald-700 transition"
                  >
                      {loading ? 'Generating Report...' : <>{t('get_report', 'Get Detailed Report')} <ChevronRight size={18} /></>}
                  </button>
                  
                  {/* Find Lab Section */}
                  <div className="pt-3 border-t border-gray-100">
                       <button 
                            onClick={handleFindLabs}
                            disabled={bookingStatus === 'locating'}
                            className="w-full bg-blue-50 text-blue-700 border border-blue-100 py-3 rounded-xl font-semibold shadow-sm flex items-center justify-center gap-1 hover:bg-blue-100 transition text-sm mb-3"
                        >
                            {bookingStatus === 'locating' ? (
                                <><Sparkles size={16} className="animate-spin"/> Finding Nearest Labs via AI...</>
                            ) : (
                                <><MapPin size={16} /> {t('find_lab', 'Find Labs Nearby')}</>
                            )}
                        </button>

                        {/* Lab Results */}
                        {bookingStatus === 'found' && nearestLabs.length > 0 && (
                            <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-4 animate-fade-in mb-3">
                                <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <MapPin size={14} className="text-red-500"/> Nearest Labs Found
                                </h4>
                                <div className="space-y-3">
                                    {nearestLabs.map((lab, idx) => (
                                        <div key={idx} className="flex justify-between items-start pb-2 border-b border-gray-50 last:border-0 last:pb-0">
                                            <div>
                                                <p className="font-semibold text-sm text-gray-900">{lab.name}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{lab.address}</p>
                                                {lab.distance && <p className="text-[10px] text-blue-600 font-medium mt-1">{lab.distance} away</p>}
                                            </div>
                                            <button 
                                                onClick={() => openMapsSearch(lab.name + " " + lab.address)}
                                                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                                                title="Navigate"
                                            >
                                                <Navigation size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={openOfficialPortal}
                            className="w-full bg-gray-50 text-gray-700 border border-gray-200 py-3 rounded-xl font-semibold shadow-sm flex items-center justify-center gap-1 hover:bg-gray-100 transition text-sm"
                        >
                            <ExternalLink size={16} /> Official Portal
                        </button>
                  </div>
              </div>
          </div>
      )
  }

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
           <button onClick={handleReset} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><RotateCcw size={16}/></button>
           <div>
              <h2 className="text-lg font-bold text-gray-800">{t('soil_title', 'Your Soil Report')}</h2>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin size={12} /> Based on your input
              </p>
           </div>
        </div>
        <button 
            onClick={handleFindLabs}
            className="px-3 py-1.5 rounded-lg text-xs font-medium shadow-md transition flex items-center gap-1 bg-blue-600 text-white hover:bg-blue-700"
        >
          <Search size={12}/> {t('find_lab', 'Find Lab')}
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2 text-gray-500 text-sm">
            <FlaskConical size={16} /> {t('ph_level', 'pH Level')}
          </div>
          <div className="text-2xl font-bold text-gray-800">{formData.ph}</div>
          <div className="text-xs text-green-600 font-medium">{formData.ph >= 6 && formData.ph <= 7.5 ? t('optimal', 'Optimal') : t('needs_correction', 'Needs Correction')}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2 text-gray-500 text-sm">
            <Layers size={16} /> {t('soil_type', 'Type')}
          </div>
          <div className="text-2xl font-bold text-gray-800">{t(formData.type)}</div>
          <div className="text-xs text-blue-600 font-medium">Structure</div>
        </div>
      </div>

      {/* NPK Breakdown */}
      <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity size={18} className="text-emerald-500"/> {t('nutrient_levels', 'Nutrient Levels')}
        </h3>
        <div className="space-y-4">
            {/* Nitrogen */}
            <div>
                <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{t('nitrogen', 'Nitrogen')} (N)</span>
                    <span className={`text-sm font-bold ${getStatusColor(formData.nitrogen, 'N')}`}>
                        {formData.nitrogen} ppm
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full ${formData.nitrogen < 150 ? 'bg-red-400' : 'bg-green-500'}`} style={{ width: `${Math.min(formData.nitrogen / 3, 100)}%` }}></div>
                </div>
            </div>
            
            {/* Phosphorus */}
             <div>
                <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{t('phosphorus', 'Phosphorus')} (P)</span>
                    <span className={`text-sm font-bold ${getStatusColor(formData.phosphorus, 'P')}`}>
                        {formData.phosphorus} ppm
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full ${formData.phosphorus < 30 ? 'bg-red-400' : 'bg-green-500'}`} style={{ width: `${Math.min(formData.phosphorus * 2, 100)}%` }}></div>
                </div>
            </div>

            {/* Potassium */}
             <div>
                <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{t('potassium', 'Potassium')} (K)</span>
                    <span className={`text-sm font-bold ${getStatusColor(formData.potassium, 'K')}`}>
                        {formData.potassium} ppm
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full ${formData.potassium < 150 ? 'bg-red-400' : 'bg-green-500'}`} style={{ width: `${Math.min(formData.potassium / 2, 100)}%` }}></div>
                </div>
            </div>
        </div>
      </div>

      {/* AI Recommendation */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-5 rounded-xl border border-emerald-100">
         <div className="flex items-center gap-2 mb-3">
             <Sparkles size={18} className="text-emerald-600" />
             <h3 className="text-md font-semibold text-emerald-900">{t('ai_advice', 'AI Agronomist Advice')}</h3>
         </div>
         <div className="text-sm text-emerald-800 leading-relaxed whitespace-pre-wrap">
             {recommendation}
         </div>
      </div>

       {/* Trends Chart */}
       <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 h-80">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Comparison</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{fontSize: 12}} />
              <YAxis tick={{fontSize: 12}} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Bar dataKey="nitrogen" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Nitrogen" />
              <Bar dataKey="phosphorus" fill="#f97316" radius={[4, 4, 0, 0]} name="Phosphorus" />
            </BarChart>
          </ResponsiveContainer>
       </div>
    </div>
  );
};

export default SoilHealthTab;
