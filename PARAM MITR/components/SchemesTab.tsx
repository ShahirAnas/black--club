
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Landmark, FileText, Calculator, Phone, Globe, CheckCircle, Languages, ExternalLink, ChevronDown, ChevronUp, PieChart, Users, Search, X, ArrowRight, ShieldCheck, IndianRupee, MapPin, Navigation, Edit2, Info, AlertCircle } from 'lucide-react';
import { Scheme } from '../types';
import { checkSchemeEligibility, getStateFromCoordinates } from '../services/geminiService';

const MOCK_SCHEMES: Scheme[] = [
  {
    id: '1',
    title: 'PM-KISAN Samman Nidhi',
    type: 'Central',
    category: 'Financial',
    description: 'Income support of ₹6,000 per year in three equal installments to all landholding farmer families.',
    benefits: '₹6,000 per year direct bank transfer.',
    eligibility: ['Landholding farmer families', 'Names in land records', 'Not an institutional landholder'],
    documents: ['Aadhaar Card', 'Landholding Papers (Khatouni)', 'Bank Passbook'],
    deadline: 'Open all year',
    portalLink: 'https://pmkisan.gov.in',
    applicationMode: 'Online',
    subsidyPercent: 0
  },
  {
    id: '2',
    title: 'Pradhan Mantri Fasal Bima Yojana',
    type: 'Central',
    category: 'Insurance',
    description: 'Comprehensive crop insurance coverage against non-preventable natural risks from pre-sowing to post-harvest.',
    benefits: 'Full claim for crop loss due to natural calamities.',
    eligibility: ['All farmers growing notified crops in notified areas', 'Sharecroppers and tenant farmers eligible'],
    documents: ['Land Possession Certificate (LPC)', 'Aadhaar Card', 'Sowing Certificate'],
    deadline: 'July 31st (Kharif) / Dec 31st (Rabi)',
    portalLink: 'https://pmfby.gov.in',
    applicationMode: 'Online',
    subsidyPercent: 0
  },
  {
    id: '3',
    title: 'Agri Infrastructure Fund (AIF)',
    type: 'Central',
    category: 'Infra',
    description: 'Financing facility for investment in projects for post-harvest management infrastructure and community farming assets.',
    benefits: 'Interest subvention of 3% per annum up to ₹2 Crore loan.',
    eligibility: ['Farmers', 'FPOs', 'SHGs', 'Agri-entrepreneurs'],
    documents: ['DPR (Detailed Project Report)', 'KYC Documents', 'Land Documents'],
    portalLink: 'https://agriinfra.dac.gov.in',
    applicationMode: 'Online',
    subsidyPercent: 3 // Interest subvention
  },
  {
    id: '4',
    title: 'Sub-Mission on Agricultural Mechanization',
    type: 'Central',
    category: 'Subsidy',
    description: 'Subsidy for purchasing modern agricultural machinery to improve farm efficiency.',
    benefits: '40% to 50% subsidy on cost of machinery like tractors, rotavators, etc.',
    eligibility: ['Small and marginal farmers', 'Women farmers', 'SC/ST farmers'],
    documents: ['Aadhaar', 'Caste Certificate (if applicable)', 'Land Record'],
    portalLink: 'https://agrimachinery.nic.in',
    applicationMode: 'Online',
    subsidyPercent: 50 // Max
  },
  {
    id: '5',
    title: 'Kisan Credit Card (KCC)',
    type: 'Central',
    category: 'Financial',
    description: 'Adequate and timely credit support from the banking system for cultivation needs.',
    benefits: 'Loans at 4% interest rate (with prompt repayment).',
    eligibility: ['All farmers', 'Tenant farmers', 'Oral lessees', 'SHGs'],
    documents: ['Application Form', 'Identity Proof', 'Address Proof', 'Land Documents'],
    portalLink: 'https://sbi.co.in/web/agri-rural/agriculture-banking/crop-loan/kisan-credit-card',
    applicationMode: 'Offline',
    subsidyPercent: 0
  },
  // STATE SCHEMES
  {
    id: 's1',
    title: 'Mahatma Jyotirao Phule Shetkari Karjmukti Yojana',
    type: 'State',
    state: 'Maharashtra',
    category: 'Financial',
    description: 'Farm loan waiver scheme for farmers in Maharashtra.',
    benefits: 'Loan waiver up to ₹2 Lakhs.',
    eligibility: ['Permanent resident of Maharashtra', 'Aadhaar linked bank account'],
    documents: ['Aadhaar', 'Bank Passbook'],
    portalLink: 'https://mjpsky.maharashtra.gov.in',
    applicationMode: 'Online',
    subsidyPercent: 0
  },
  {
    id: 's2',
    title: 'Rythu Bandhu',
    type: 'State',
    state: 'Telangana',
    category: 'Financial',
    description: 'Agriculture investment support scheme for land owning farmers.',
    benefits: '₹5000 per acre per season.',
    eligibility: ['Resident of Telangana', 'Own farming land'],
    documents: ['Pattadar Passbook', 'Aadhaar', 'Bank Details'],
    portalLink: 'http://rythubandhu.telangana.gov.in',
    applicationMode: 'Online',
    subsidyPercent: 0
  },
  {
    id: 's3',
    title: 'KALIA Scheme',
    type: 'State',
    state: 'Odisha',
    category: 'Financial',
    description: 'Krushak Assistance for Livelihood and Income Augmentation.',
    benefits: 'Financial assistance to cultivators and landless agri laborers.',
    eligibility: ['Small and marginal farmers', 'Landless agri households'],
    documents: ['Aadhaar', 'Bank Account', 'Ration Card'],
    portalLink: 'https://kalia.odisha.gov.in',
    applicationMode: 'Online',
    subsidyPercent: 0
  },
  {
    id: 's4',
    title: 'Paani Bachao Paise Kamao',
    type: 'State',
    state: 'Punjab',
    category: 'Subsidy',
    description: 'Scheme to encourage farmers to save electricity and water.',
    benefits: 'Monetary incentive for saving power.',
    eligibility: ['Tubewell connection holders'],
    documents: ['Electricity Bill', 'Aadhaar', 'Bank Details'],
    portalLink: 'https://pspcl.in',
    applicationMode: 'Offline',
    subsidyPercent: 0
  }
];

const SUCCESS_STORIES = [
    { name: 'Ramesh Singh', scheme: 'PMFBY', story: 'Recovered ₹40,000 for crop loss due to heavy rains.' },
    { name: 'Anita Devi', scheme: 'SMAM', story: 'Bought a rotavator at 50% subsidy, increasing yield by 20%.' }
];

const HELPLINES = [
    { name: 'Kisan Call Center', number: '1800-180-1551' },
    { name: 'PM-KISAN Helpdesk', number: '011-24300606' }
];

const SchemesTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'All' | 'Central' | 'State'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  
  // Location State
  const [userState, setUserState] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // Tools State
  const [showStatus, setShowStatus] = useState(false);
  const [statusId, setStatusId] = useState('');
  const [calcCost, setCalcCost] = useState('');

  // Eligibility AI State
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState<string | null>(null);

  const handleDetectLocation = () => {
      if (!navigator.geolocation) {
          alert("Geolocation is not supported by your browser.");
          setIsEditingLocation(true);
          return;
      }

      setIsLocating(true);
      setLocationError(null);
      
      navigator.geolocation.getCurrentPosition(
          async (position) => {
              try {
                  const { latitude, longitude } = position.coords;
                  const stateRaw = await getStateFromCoordinates(latitude, longitude);
                  
                  if (!stateRaw) throw new Error("Could not detect state");

                  // Sanitize state string
                  const state = stateRaw
                    .replace(/\bstate\b/gi, '')
                    .replace(/\bthe\b/gi, '')
                    .replace(/\bis\b/gi, '')
                    .replace(/[.:]/g, '')
                    .trim();

                  // Check for broad region or empty response
                  if (state && state.length > 2 && state.toLowerCase() !== 'india') {
                      setUserState(state);
                      setIsEditingLocation(false);
                      if (activeTab === 'All') setActiveTab('State');
                  } else {
                      // Broad region detection (e.g. only "India" or a short string)
                      console.warn("Location service returned a broad region:", stateRaw);
                      setLocationError("Broad region detected. Please specify your State manually.");
                      setIsEditingLocation(true);
                  }
              } catch(e) {
                  console.error("Location detection error", e);
                  setLocationError("Could not resolve State. Please enter manually.");
                  setIsEditingLocation(true);
              } finally {
                  setIsLocating(false);
              }
          },
          (error) => {
              console.warn("Location error:", error);
              let msg = "Could not access location.";
              if (error.code === 1) msg = "Location permission denied.";
              if (error.code === 3) msg = "Location request timed out.";
              
              setLocationError(msg);
              setIsLocating(false);
              setIsEditingLocation(true);
          },
          { 
              timeout: 15000, 
              enableHighAccuracy: true,
              maximumAge: 0 
          }
      );
  };

  const filteredSchemes = MOCK_SCHEMES.filter(s => {
      const matchesTab = activeTab === 'All' || s.type === activeTab;
      
      const titleLower = (s.title || "").toLowerCase();
      const categoryLower = (s.category || "").toLowerCase();
      const searchLower = (searchTerm || "").toLowerCase();

      const matchesSearch = titleLower.includes(searchLower) || categoryLower.includes(searchLower);
      
      let matchesState = true;
      if (s.type === 'State' && userState && s.state) {
          const sStateLower = s.state.toLowerCase();
          const uStateLower = userState.toLowerCase();
          matchesState = sStateLower.includes(uStateLower) || uStateLower.includes(sStateLower);
      }
      
      return matchesTab && matchesSearch && matchesState;
  });

  const handleCheckEligibility = async () => {
      if (!selectedScheme) return;
      setCheckingEligibility(true);
      const result = await checkSchemeEligibility(selectedScheme.title, "Small Organic Farm", userState || "India");
      setEligibilityResult(result);
      setCheckingEligibility(false);
  };

  const calculateSubsidy = () => {
      if (!calcCost) return 0;
      const cost = parseFloat(calcCost);
      if (selectedScheme?.category === 'Subsidy') {
          return (cost * (selectedScheme.subsidyPercent || 0)) / 100;
      }
      return 0;
  };

  // --- DETAILS VIEW ---
  if (selectedScheme) {
      return (
          <div className="bg-white min-h-[90vh] pb-24 animate-slide-in relative">
              <div className="bg-indigo-700 p-6 text-white rounded-b-3xl shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Landmark size={120} />
                  </div>
                  <button onClick={() => { setSelectedScheme(null); setEligibilityResult(null); }} className="absolute top-4 left-4 bg-white/20 p-2 rounded-full hover:bg-white/30 transition">
                      <ArrowRight size={20} className="rotate-180" />
                  </button>
                  <div className="mt-8">
                      <div className="flex gap-2 mb-3">
                        <span className="bg-indigo-500/50 border border-indigo-400/30 text-indigo-100 text-xs px-3 py-1 rounded-full inline-block font-medium">
                            {selectedScheme.type} Govt
                        </span>
                        {selectedScheme.state && (
                            <span className="bg-white/20 border border-white/30 text-white text-xs px-3 py-1 rounded-full inline-flex items-center gap-1 font-medium">
                                <MapPin size={10}/> {selectedScheme.state}
                            </span>
                        )}
                      </div>
                      <h1 className="text-2xl font-bold leading-tight mb-2">{selectedScheme.title}</h1>
                      <div className="flex gap-4 text-sm text-indigo-100 font-medium">
                          <span className="flex items-center gap-1"><CheckCircle size={14}/> Verified</span>
                          {selectedScheme.deadline && <span className="flex items-center gap-1">Deadline: {selectedScheme.deadline}</span>}
                      </div>
                  </div>
              </div>

              <div className="p-5 space-y-6">
                  <div className="grid grid-cols-2 gap-3">
                      <a href={selectedScheme.portalLink} target="_blank" rel="noreferrer" className="bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-md flex items-center justify-center gap-2 hover:bg-indigo-700 transition">
                          Apply Now <ExternalLink size={16} />
                      </a>
                      <button onClick={() => setShowStatus(true)} className="bg-white text-indigo-600 border border-indigo-200 py-3 rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-indigo-50 transition">
                          Check Status
                      </button>
                  </div>

                  {selectedScheme.category === 'Subsidy' && (
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-4 rounded-xl">
                          <div className="flex justify-between items-center mb-3">
                              <h3 className="font-bold text-emerald-900 flex items-center gap-2">
                                  <Calculator size={18} className="text-emerald-600"/> Subsidy Calculator
                              </h3>
                              <span className="text-xs bg-white text-emerald-700 px-2 py-1 rounded border border-emerald-100 font-medium">
                                  {selectedScheme.subsidyPercent}% Off
                              </span>
                          </div>
                          <div className="flex gap-2">
                              <input type="number" value={calcCost} onChange={(e) => setCalcCost(e.target.value)} placeholder="Enter Equipment Cost (₹)" className="flex-1 border border-emerald-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"/>
                          </div>
                          {calcCost && (
                              <div className="mt-3 text-sm text-emerald-800 font-medium flex justify-between bg-white/60 p-2 rounded-lg">
                                  <span>Estimated Subsidy:</span>
                                  <span className="font-bold text-lg">₹{calculateSubsidy().toLocaleString()}</span>
                              </div>
                          )}
                      </div>
                  )}

                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                       <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                           <ShieldCheck size={18} /> Eligibility Check
                       </h3>
                       {!eligibilityResult ? (
                           <button onClick={handleCheckEligibility} disabled={checkingEligibility} className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
                               {checkingEligibility ? "Analyzing Profile..." : "Check if I am eligible (AI)"}
                           </button>
                       ) : (
                           <p className="text-sm text-blue-800 bg-white p-3 rounded-lg border border-blue-100 mt-2 whitespace-pre-wrap">
                               {eligibilityResult}
                           </p>
                       )}
                  </div>

                  <div className="space-y-4">
                      <div>
                          <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                              <FileText size={18} className="text-gray-400"/> Description & Benefits
                          </h3>
                          <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                              {selectedScheme.description}
                              <br/><br/>
                              <span className="font-semibold text-gray-700">Benefits:</span> {selectedScheme.benefits}
                          </p>
                      </div>

                      <div>
                           <h3 className="font-bold text-gray-800 mb-2">Required Documents</h3>
                           <ul className="grid grid-cols-2 gap-2">
                               {selectedScheme.documents.map((doc, idx) => (
                                   <li key={idx} className="text-xs bg-gray-50 text-gray-700 px-3 py-2 rounded-lg border border-gray-100 flex items-center gap-2">
                                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> {doc}
                                   </li>
                               ))}
                           </ul>
                      </div>
                  </div>
              </div>

               {showStatus && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-2xl w-full max-sm:w-full p-5 shadow-xl animate-fade-in max-w-sm">
                          <h3 className="font-bold text-lg mb-4">Track Application</h3>
                          <p className="text-sm text-gray-500 mb-4">Enter your Application ID to check status on the official portal.</p>
                          <input type="text" value={statusId} onChange={(e) => setStatusId(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 mb-4 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Application ID (e.g. PM123456)"/>
                          <div className="flex gap-3">
                              <button onClick={() => setShowStatus(false)} className="flex-1 py-2 text-gray-600 font-medium">Cancel</button>
                              <a href={selectedScheme.portalLink} target="_blank" rel="noreferrer" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold text-center">Track Now</a>
                          </div>
                      </div>
                  </div>
               )}
          </div>
      );
  }

  return (
    <div className="p-4 space-y-6 pb-24 min-h-[85vh]">
      <div className="flex justify-between items-start">
          <div>
              <h2 className="text-2xl font-bold text-gray-800">Govt. Schemes</h2>
              <p className="text-xs text-gray-500 mt-1">Access subsidies, loans & insurance</p>
          </div>
          <button className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
              <Languages size={14} /> English
          </button>
      </div>

      {/* Improved Location Bar */}
      <div className="space-y-3">
          <div className={`bg-white p-4 rounded-2xl border transition-all shadow-sm ${locationError ? 'border-red-200 bg-red-50' : isEditingLocation ? 'border-indigo-400 ring-2 ring-indigo-50' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                      <div className={`p-1.5 rounded-lg shrink-0 ${locationError ? 'text-red-600 bg-red-100' : 'text-indigo-600 bg-indigo-50'}`}>
                          <MapPin size={18} />
                      </div>
                      <div className="overflow-hidden">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Target Region for Local Schemes</p>
                          {isEditingLocation ? (
                              <p className="text-sm font-bold text-indigo-900">Entering Manually...</p>
                          ) : (
                              <p className="text-sm font-bold text-gray-800 truncate">{userState || "All of India"}</p>
                          )}
                      </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!isEditingLocation && (
                        <button 
                            onClick={() => setIsEditingLocation(true)} 
                            className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition"
                            title="Edit State"
                        >
                            <Edit2 size={16} />
                        </button>
                    )}
                    <button 
                        onClick={handleDetectLocation} 
                        disabled={isLocating} 
                        className={`flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-70 ${isLocating ? 'bg-indigo-100 text-indigo-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                    >
                        {isLocating ? 'Locating...' : <><Navigation size={12} /> Detect</>}
                    </button>
                  </div>
              </div>

              {isEditingLocation && (
                  <div className="mt-3 animate-fade-in">
                      {locationError && (
                          <div className="flex items-center gap-2 text-red-600 text-xs mb-3 bg-red-100/50 p-2 rounded-lg">
                              <AlertCircle size={14} />
                              <span>{locationError}</span>
                          </div>
                      )}
                      <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={userState} 
                            onChange={(e) => setUserState(e.target.value)} 
                            placeholder="Enter State Name (e.g. Punjab)" 
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition" 
                            onKeyDown={(e) => e.key === 'Enter' && setIsEditingLocation(false)}
                            autoFocus 
                          />
                          <button 
                            onClick={() => {setIsEditingLocation(false); setLocationError(null);}} 
                            className="bg-indigo-600 text-white px-4 py-3 rounded-xl font-bold text-sm shadow-md"
                          >
                              Save
                          </button>
                      </div>
                  </div>
              )}
          </div>
          
          {!isEditingLocation && !userState && (
              <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-xl border border-blue-100">
                  <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                      Detect your location or enter your State manually to see <strong>Local Subsidies</strong> and State Government schemes specific to your area.
                  </p>
              </div>
          )}
      </div>

      <div className="space-y-3">
          <div className="relative">
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search (e.g. Tractor, Loan)..." className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"/>
              <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
          </div>
          
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              {['All', 'Central', 'State'].map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${activeTab === tab ? 'bg-white text-indigo-900 shadow-sm' : 'text-gray-500'}`}>
                      {tab}
                  </button>
              ))}
          </div>
      </div>

      <div className="space-y-4">
          {filteredSchemes.map((scheme) => (
              <div key={scheme.id} onClick={() => setSelectedScheme(scheme)} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition active:scale-[0.98] cursor-pointer">
                  <div className="absolute top-0 right-0 bg-indigo-50 px-3 py-1 rounded-bl-xl text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                      {scheme.state ? scheme.state : scheme.category}
                  </div>
                  <div className="flex gap-4">
                      <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
                          <Landmark size={24} className="text-indigo-600"/>
                      </div>
                      <div>
                          <h3 className="font-bold text-gray-800 text-lg leading-tight mb-1 group-hover:text-indigo-600 transition">{scheme.title}</h3>
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{scheme.description}</p>
                          <div className="mt-3 flex items-center gap-3">
                              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded flex items-center gap-1">
                                  <CheckCircle size={10} /> {scheme.applicationMode}
                              </span>
                              {scheme.subsidyPercent ? (
                                  <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1">
                                      <PieChart size={10} /> {scheme.subsidyPercent}% Subsidy
                                  </span>
                              ) : null}
                          </div>
                      </div>
                  </div>
              </div>
          ))}
          {filteredSchemes.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                  <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Search size={24} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">No schemes found matching your filters.</p>
                  {activeTab === 'State' && !userState && (
                      <button onClick={() => setIsEditingLocation(true)} className="mt-2 text-xs text-indigo-600 font-bold hover:underline">
                          Select a State to see local results
                      </button>
                  )}
              </div>
          )}
      </div>

      <div className="pt-2">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Users size={18} className="text-emerald-600"/> Success Stories
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {SUCCESS_STORIES.map((story, idx) => (
                  <div key={idx} className="min-w-[240px] bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-100">
                      <p className="text-sm text-gray-700 italic mb-2">"{story.story}"</p>
                      <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-emerald-200 rounded-full flex items-center justify-center text-emerald-800 text-xs font-bold">
                              {story.name.charAt(0)}
                          </div>
                          <div>
                              <p className="text-xs font-bold text-gray-800">{story.name}</p>
                              <p className="text-[10px] text-emerald-600 font-medium">{story.scheme} Beneficiary</p>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </div>

      <div className="bg-gray-800 rounded-2xl p-5 text-white shadow-lg">
          <h3 className="font-bold mb-3 flex items-center gap-2">
              <Phone size={18} className="text-green-400"/> Agri Helplines
          </h3>
          <div className="grid grid-cols-2 gap-4">
              {HELPLINES.map((line, idx) => (
                  <a key={idx} href={`tel:${line.number.replace(/-/g, '')}`} className="bg-gray-700 p-3 rounded-xl hover:bg-gray-600 transition block">
                      <p className="text-xs text-gray-400 mb-1">{line.name}</p>
                      <p className="font-bold text-lg">{line.number}</p>
                  </a>
              ))}
          </div>
      </div>
    </div>
  );
};

export default SchemesTab;
