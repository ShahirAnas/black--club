
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppLanguage, TranslationDictionary } from '../types';
import { getAppTranslations } from '../services/geminiService';

// Base English strings that cover the main UI elements AND specific data terms
const BASE_STRINGS: TranslationDictionary = {
    // Navigation
    "nav_soil": "Soil",
    "nav_weather": "Weather",
    "nav_market": "Market",
    "nav_prices": "Prices",
    "nav_schemes": "Schemes",
    
    // Common
    "loading": "Loading...",
    "processing": "Processing...",
    "app_name": "AgroAssist",
    "search_placeholder": "Search...",
    
    // Soil Tab
    "soil_title": "Soil Health Analysis",
    "soil_desc": "Scan soil or enter test results for AI insights.",
    "scan_btn": "Take Photo / Upload",
    "get_report": "Get Detailed Report",
    "find_lab": "Find Lab",
    "nitrogen": "Nitrogen",
    "phosphorus": "Phosphorus",
    "potassium": "Potassium",
    "ph_level": "pH Level",
    "moisture": "Moisture",
    "organic_matter": "Organic Matter",
    "soil_type": "Soil Type",
    "optimal": "Optimal",
    "needs_correction": "Needs Correction",
    "nutrient_levels": "Nutrient Levels",
    "ai_advice": "AI Agronomist Advice",
    
    // Soil Types
    "Clay": "Clay",
    "Loam": "Loam",
    "Sandy": "Sandy",
    "Silt": "Silt",
    
    // Weather Tab
    "weather_title": "Weather Forecast",
    "get_forecast": "Get Forecast",
    "use_location": "Use Current Location",
    "advisory_title": "Farming Advisory",
    "wind": "Wind",
    "humidity": "Humidity",
    "rain": "Rain",
    "max": "Max",
    "min": "Min",
    "next_7_days": "Next 7 Days",
    "extreme_alert": "Extreme Weather Alert",
    
    // Market Tab
    "buy_mode": "Buy",
    "sell_mode": "Sell",
    "list_crop": "List New Crop",
    "sales_dash": "Your Sales Dashboard",
    "total_earnings": "Total Earnings",
    "location_active": "Location Active",
    "location_required": "Location Required",
    "enable_location": "Enable Location to List",
    "active_listings": "Your Active Listings",
    "no_products": "No products match your filter.",
    "clear_filters": "Clear Filters",
    "buy_now": "Buy Now",
    "add_to_cart": "Add to Cart",
    "shopping_cart": "Shopping Cart",
    "checkout": "Checkout",
    "total": "Total",
    "delivery_free": "Free",
    
    // Market Categories
    "Vegetables": "Vegetables",
    "Fruits": "Fruits",
    "Grains": "Grains",
    "Commercial": "Commercial",
    "Organic": "Organic",
    "Conventional": "Conventional",
    
    // Crops (Common Indian Crops)
    "Tomato": "Tomato",
    "Potato": "Potato",
    "Onion": "Onion",
    "Red Onion": "Red Onion",
    "Cauliflower": "Cauliflower",
    "Brinjal": "Brinjal",
    "Okra": "Okra",
    "Cabbage": "Cabbage",
    "Spinach": "Spinach",
    "Bottle Gourd": "Bottle Gourd",
    "Green Chilli": "Green Chilli",
    "Ginger": "Ginger",
    "Garlic": "Garlic",
    "Peas": "Peas",
    "Carrot": "Carrot",
    
    "Banana": "Banana",
    "Mango": "Mango",
    "Pomegranate": "Pomegranate",
    "Papaya": "Papaya",
    "Apple": "Apple",
    "Guava": "Guava",
    "Orange": "Orange",
    "Grapes": "Grapes",
    "Watermelon": "Watermelon",
    "Pineapple": "Pineapple",
    "Lemon": "Lemon",
    "Coconut": "Coconut",
    
    "Wheat": "Wheat",
    "Rice": "Rice",
    "Basmati Rice": "Basmati Rice",
    "Maize": "Maize",
    "Maize (Corn)": "Maize (Corn)",
    "Bajra": "Bajra",
    "Jowar": "Jowar",
    "Ragi": "Ragi",
    "Barley": "Barley",
    "Bengal Gram": "Bengal Gram",
    "Green Gram": "Green Gram",
    
    "Cotton": "Cotton",
    "Sugarcane": "Sugarcane",
    "Soybean": "Soybean",
    "Turmeric": "Turmeric",
    "Cumin": "Cumin",
    "Mustard": "Mustard",
    "Groundnut": "Groundnut",
    "Coffee": "Coffee",
    "Tea": "Tea",
    
    // Profile Tab
    "profile_title": "My Profile",
    "edit_profile": "Edit",
    "save_profile": "Save",
    "member_since": "Member since",
    "rating": "Rating",
    "sales": "Sales",
    "logout": "Log Out",
    "language_settings": "Language Settings",
    "change_lang": "Change Language",
    "translating": "Translating App...",
    
    // Chat
    "chat_placeholder": "Ask anything...",
    "chat_title": "Param Mitra",
    "chat_subtitle": "AI Assistant"
};

interface LanguageContextType {
    language: AppLanguage;
    setLanguage: (lang: AppLanguage) => Promise<void>;
    t: (key: string, defaultText?: string) => string;
    isTranslating: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<AppLanguage>('English');
    const [translations, setTranslations] = useState<TranslationDictionary>(BASE_STRINGS);
    const [isTranslating, setIsTranslating] = useState(false);

    // Load from storage on mount
    useEffect(() => {
        const storedLang = localStorage.getItem('app_language') as AppLanguage;
        const storedTrans = localStorage.getItem('app_translations');
        
        if (storedLang && storedLang !== 'English' && storedTrans) {
            setLanguageState(storedLang);
            setTranslations(JSON.parse(storedTrans));
        }
    }, []);

    const setLanguage = async (newLang: AppLanguage) => {
        if (newLang === language) return;
        
        if (newLang === 'English') {
            setLanguageState('English');
            setTranslations(BASE_STRINGS);
            localStorage.setItem('app_language', 'English');
            return;
        }

        setIsTranslating(true);
        try {
            // Check if we have cached translations for this specific language in storage
            const cacheKey = `trans_${newLang}_v2`; // Updated version key to force refresh with new strings
            const cached = localStorage.getItem(cacheKey);
            
            let newTranslations: TranslationDictionary;
            
            if (cached) {
                newTranslations = JSON.parse(cached);
            } else {
                // Call Gemini to translate
                newTranslations = await getAppTranslations(newLang, BASE_STRINGS);
                localStorage.setItem(cacheKey, JSON.stringify(newTranslations));
            }
            
            setLanguageState(newLang);
            setTranslations(newTranslations);
            
            localStorage.setItem('app_language', newLang);
            localStorage.setItem('app_translations', JSON.stringify(newTranslations));
        } catch (error) {
            console.error("Failed to change language", error);
        } finally {
            setIsTranslating(false);
        }
    };

    const t = (key: string, defaultText: string = ""): string => {
        // If the key exists in translations, return it
        if (translations[key]) return translations[key];
        
        // If not found, check if the key itself might be a value we have (case insensitive fallback?)
        // For now, return key or default
        return defaultText || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, isTranslating }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
};
