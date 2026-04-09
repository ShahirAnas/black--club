import { GoogleGenAI } from "@google/genai";
import { MarketNewsData, MarketPrice, TranslationDictionary } from "../types";

// Feature-Specific Model Selection following @google/genai guidelines
const MODELS = {
  TEXT_FAST: 'gemini-flash-lite-latest',
  TEXT_SEARCH: 'gemini-3-flash-preview',
  COMPLEX: 'gemini-3-pro-preview',
  MAPS: 'gemini-2.5-flash',
  IMAGE: 'gemini-3-pro-image-preview'
};

const CACHE_EXPIRY = 1000 * 60 * 60; // 1 hour
const DEFAULT_BACKOFF = 1000 * 60 * 60 * 6; // 6 hours default backoff

/**
 * Global cache handler for Search Grounding calls to prevent 429 Quota Exceeded.
 * Supports a fallback fetcher to allow the app to function even when grounding is blocked.
 */
const withGroundingCache = async <T>(
    key: string, 
    fetcher: () => Promise<T>, 
    fallback?: () => Promise<T & { isEstimated?: boolean }>
): Promise<T | null> => {
    const now = Date.now();
    
    // Check if we are in a backoff period
    const backoffUntil = localStorage.getItem('grounding_backoff_until');
    const isBackoffActive = backoffUntil && parseInt(backoffUntil) > now;

    if (isBackoffActive) {
        const cached = localStorage.getItem(`cache_${key}`);
        if (cached) return JSON.parse(cached).data;
        
        // No cache but in backoff? Use fallback if available
        if (fallback) {
            try {
                const data = await fallback();
                return data;
            } catch (e) { return null; }
        }
        return null;
    }

    // Check regular cache for non-expired data
    const cached = localStorage.getItem(`cache_${key}`);
    if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (now - timestamp < CACHE_EXPIRY) {
            return data;
        }
    }

    try {
        const data = await fetcher();
        localStorage.setItem(`cache_${key}`, JSON.stringify({ data, timestamp: now }));
        return data;
    } catch (error: any) {
        const errorStr = JSON.stringify(error);
        const isQuotaError = errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED') || error?.message?.includes('limit');
        
        if (isQuotaError) {
            let backoffDuration = DEFAULT_BACKOFF;
            const message = error?.message || error?.error?.message || "";
            const match = message.match(/retry in (\d+h)?(\d+m)?(\d+s)?/);
            if (match) {
                const hours = parseInt(match[1]) || 0;
                const minutes = parseInt(match[2]) || 0;
                const seconds = parseInt(match[3]) || 0;
                backoffDuration = (hours * 3600 + minutes * 60 + seconds) * 1000 + 60000;
            }
            localStorage.setItem('grounding_backoff_until', (now + backoffDuration).toString());
            
            // On quota error, try fallback immediately
            if (fallback) {
                console.warn(`Grounding quota reached for ${key}. Falling back to standard AI.`);
                try {
                    return await fallback();
                } catch (e) { throw error; }
            }
            
            if (cached) return JSON.parse(cached).data;
            throw new Error("QUOTA_EXCEEDED");
        }
        throw error;
    }
};

export const clearGroundingBackoff = () => {
    localStorage.removeItem('grounding_backoff_until');
};

const extractJSON = (text: string): string => {
  try {
    const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) return jsonBlockMatch[1].trim();
    let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const arrayStart = cleanText.indexOf('[');
    const objectStart = cleanText.indexOf('{');
    let startIndex = arrayStart !== -1 && (objectStart === -1 || arrayStart < objectStart) ? arrayStart : objectStart;
    if (startIndex === -1) return cleanText;
    let balance = 0, inString = false, escape = false;
    for (let i = startIndex; i < cleanText.length; i++) {
      if (escape) { escape = false; continue; }
      if (cleanText[i] === '\\') { escape = true; continue; }
      if (cleanText[i] === '"') { inString = !inString; continue; }
      if (!inString) {
        if (cleanText[i] === '{' || cleanText[i] === '[') balance++;
        else if (cleanText[i] === '}' || cleanText[i] === ']') {
          balance--;
          if (balance === 0) return cleanText.substring(startIndex, i + 1);
        }
      }
    }
    return cleanText.substring(startIndex);
  } catch (e) { return text; }
};

export const getSoilRecommendations = async (data: any, language: string): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: MODELS.TEXT_SEARCH,
            contents: `As an agronomist, give specific soil treatment and crop advice for: ${JSON.stringify(data)}. Language: ${language}. Max 100 words.`,
        });
        return response.text || "Add organic compost.";
    } catch (error) { return "Check soil moisture and pH regularly."; }
};

export const chatWithParamMitra = async (history: {role: 'user' | 'model', text: string}[], message: string, language: string = 'English'): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const systemInstruction = `You are 'Param Mitra', an expert agronomist. Language: ${language}. Be concise. Use current context if available.`;
        const response = await ai.models.generateContent({
            model: MODELS.TEXT_SEARCH,
            contents: [...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })), { role: 'user', parts: [{ text: message }] }],
            config: { systemInstruction }
        });
        return response.text || "I'm here to help.";
    } catch (error: any) {
        return "Connection issue. Please try again later. 🙏";
    }
};

export const generateCropImage = async (prompt: string, size: '1K' | '2K' | '4K' = '1K'): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const lower = prompt.toLowerCase();
    let cropDetail = `freshly harvested ${prompt}`;
    
    if (lower.includes('bajra')) cropDetail = `vibrant green Bajra (pearl millet) seed heads growing in a field under morning sun`;
    if (lower.includes('cotton')) cropDetail = `fluffy white cotton bolls on a natural branch, high detail, professional agricultural photo`;
    if (lower.includes('sugarcane')) cropDetail = `freshly cut sugarcane stalks with visible joints and lush green leaves, stacked in a bundle`;
    if (lower.includes('turmeric')) cropDetail = `raw whole turmeric rhizomes, some sliced to show bright orange interior, realistic textures`;
    if (lower.includes('ginger')) cropDetail = `whole fresh ginger roots on a rustic surface, crisp detail, realistic organic skin`;
    if (lower.includes('brinjal')) cropDetail = `glossy deep purple eggplants (brinjals) with fresh green stems, arranged in a basket`;
    if (lower.includes('cauliflower')) cropDetail = `pristine white cauliflower head surrounded by fresh green leaves, organic quality`;

    const enhancedPrompt = `A high-end, commercial-quality, hyper-realistic agricultural photography of ${cropDetail}. 
    Focus on the raw, freshly harvested texture. Vivid natural colors, 8k resolution, macro detail, soft sunlight, professional studio or farm lighting, no text, no logos, no watermarks.`;

    const response = await ai.models.generateContent({
      model: MODELS.IMAGE,
      contents: { parts: [{ text: enhancedPrompt }] },
      config: {
        imageConfig: {
          aspectRatio: "4:3",
          imageSize: size
        }
      }
    });
    
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Image Gen Error", error);
    throw error;
  }
};

export const getAppTranslations = async (targetLanguage: string, baseStrings: TranslationDictionary): Promise<TranslationDictionary> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        if (targetLanguage === 'English') return baseStrings;
        const response = await ai.models.generateContent({
            model: MODELS.TEXT_FAST,
            contents: `Translate JSON values to ${targetLanguage}. Return ONLY JSON: ${JSON.stringify(baseStrings)}`,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(extractJSON(response.text || "{}"));
    } catch (error) { return baseStrings; }
};

export const findNearestLabs = async (lat: number, lng: number): Promise<any[]> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: MODELS.MAPS,
            contents: `Find 3 nearest Soil Testing Labs near current location.`,
            config: {
                tools: [{googleMaps: {}}],
                toolConfig: { retrievalConfig: { latLng: { latitude: lat, longitude: lng } } }
            }
        });
        
        const labs: any[] = [];
        const metadata = response.candidates?.[0]?.groundingMetadata;
        if (metadata?.groundingChunks) {
            for (const chunk of metadata.groundingChunks) {
                if (chunk.maps) {
                    labs.push({
                        name: chunk.maps.title || "Soil Testing Lab",
                        address: chunk.maps.uri || "Nearby Location",
                        distance: "Nearby"
                    });
                }
            }
        }
        return labs;
    } catch (error) { return []; }
};

export const getFarmingAdvisory = async (weatherCondition: string, temp: number): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: MODELS.TEXT_FAST,
      contents: `Weather: ${weatherCondition}, ${temp}°C. Give 1 sentence advice for Indian farmers.`,
    });
    return response.text?.trim() || "Monitor soil moisture.";
  } catch (error) { return "Check irrigation levels."; }
};

export const getGeneratedWeather = async (location: string): Promise<any> => {
    const fetcher = async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: MODELS.TEXT_SEARCH,
            contents: `Provide real-time weather and 7-day forecast for ${location}. Output strictly JSON: 
            {
              "locationName": "City, State",
              "localDate": "Date string",
              "current": {"temp": number, "condition": "Sunny", "wind": number, "humidity": number, "tempMin": number, "tempMax": number, "rainfall": number},
              "hourly": [{"time": "10 AM", "temp": 24, "icon": "sun"}],
              "forecast": [{"day": "Mon", "tempMin": 20, "tempMax": 28, "condition": "Sunny", "icon": "sun"}]
            }`,
            config: { tools: [{ googleSearch: {} }] }
        });
        return JSON.parse(extractJSON(response.text || "{}"));
    };

    const fallback = async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const month = new Date().toLocaleString('default', { month: 'long' });
        const response = await ai.models.generateContent({
            model: MODELS.TEXT_FAST,
            contents: `Provide TYPICAL seasonal weather and 7-day forecast for ${location} in ${month} based on historical knowledge. No search available. Output strictly JSON: 
            {
              "locationName": "${location}",
              "localDate": "${new Date().toDateString()}",
              "current": {"temp": 25, "condition": "Partly Cloudy", "wind": 10, "humidity": 60, "tempMin": 22, "tempMax": 28, "rainfall": 0},
              "hourly": [{"time": "Now", "temp": 25, "icon": "cloud"}],
              "forecast": [{"day": "Day 1", "tempMin": 20, "tempMax": 30, "condition": "Sunny", "icon": "sun"}]
            }`,
        });
        return { ...JSON.parse(extractJSON(response.text || "{}")), isEstimated: true };
    };

    return withGroundingCache(`weather_${location}`, fetcher, fallback);
};

export const getGeneratedMarketPrices = async (crop: string, location?: string): Promise<MarketPrice[]> => {
    const fetcher = async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: MODELS.TEXT_SEARCH,
            contents: `Get real-time mandi prices for ${crop} near ${location || 'India'}. Return JSON array of objects: "market", "price" (number), "unit", "pricePerKg", "date", "trend", "change", "address", "phoneNumber", "capacity", "commodities". Use Google Search for accuracy.`,
            config: { tools: [{ googleSearch: {} }] }
        });
        return JSON.parse(extractJSON(response.text || "[]"));
    };

    const fallback = async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: MODELS.TEXT_FAST,
            contents: `Provide typical average mandi prices for ${crop} in ${location || 'India'} based on seasonal knowledge. Output JSON array of objects with 'isEstimated: true'.`,
        });
        const items = JSON.parse(extractJSON(response.text || "[]"));
        return items.map((i: any) => ({ ...i, isEstimated: true }));
    };

    return await withGroundingCache(`prices_${crop}_${location}`, fetcher, fallback) || [];
};

export const getBatchMarketPrices = async (crops: string[], location: string): Promise<Record<string, number>> => {
    const cropsKey = crops.sort().join('_');
    const fetcher = async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: MODELS.TEXT_SEARCH,
            contents: `Get latest average mandi price per kg for: ${crops.join(', ')} in ${location}. Return strictly JSON object {crop: price}.`,
            config: { tools: [{ googleSearch: {} }] }
        });
        return JSON.parse(extractJSON(response.text || "{}"));
    };

    const fallback = async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: MODELS.TEXT_FAST,
            contents: `Give typical average market price per kg for: ${crops.join(', ')} in ${location}. Return JSON object {crop: price}.`,
        });
        return JSON.parse(extractJSON(response.text || "{}"));
    };

    const result = await withGroundingCache(`batch_prices_${cropsKey}_${location}`, fetcher, fallback);
    return result || {};
};

export const getPriceTrendAnalysis = async (crop: string, location?: string): Promise<string> => {
    const fetcher = async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: MODELS.TEXT_SEARCH,
            contents: `Analyze current market trends for ${crop} in ${location || 'India'}. rising or falling? Advice for farmers. 2 sentences.`,
            config: { tools: [{ googleSearch: {} }] }
        });
        return response.text || "Prices stable.";
    };

    const fallback = async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: MODELS.TEXT_FAST,
            contents: `Analyze general seasonal price trends for ${crop} in ${location || 'India'} for this time of year. 2 sentences.`,
        });
        return response.text || "Market data stable.";
    };

    const result = await withGroundingCache(`analysis_${crop}_${location}`, fetcher, fallback);
    return result || "Market data stable.";
};

export const getMarketNewsAnalysis = async (location?: string): Promise<MarketNewsData | null> => {
    const fetcher = async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: MODELS.TEXT_SEARCH,
            contents: `Find today's top agriculture news alerts near ${location || 'India'}. Output JSON: {"highs": [], "lows": [], "generalNews": []}`,
            config: { tools: [{ googleSearch: {} }] }
        });
        return JSON.parse(extractJSON(response.text || "{}"));
    };

    const fallback = async () => {
        return { highs: [], lows: [], generalNews: [], isEstimated: true } as any;
    };

    return withGroundingCache(`market_news_${location}`, fetcher, fallback);
};

export const checkSchemeEligibility = async (schemeName: string, farmType: string, location: string): Promise<string> => {
    const fetcher = async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: MODELS.TEXT_SEARCH,
            contents: `Check if farmer with ${farmType} in ${location} is eligible for ${schemeName}. 20 words concise.`,
            config: { tools: [{ googleSearch: {} }] }
        });
        return response.text?.trim() || "Check guidelines.";
    };

    const result = await withGroundingCache(`eligible_${schemeName}_${farmType}_${location}`, fetcher);
    return result || "Check official eligibility.";
};

export const getStateFromCoordinates = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=5&addressdetails=1`);
    if (response.ok) {
        const data = await response.json();
        return data?.address?.state || data?.address?.city || "your region";
    }
    return "your region";
  } catch (err) { return "your region"; }
}

export const analyzeSoilImage = async (base64String: string): Promise<any> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const base64Data = base64String.includes('base64,') ? base64String.split('base64,')[1] : base64String;
    const response = await ai.models.generateContent({
      model: MODELS.COMPLEX,
      contents: {
        parts: [{ inlineData: { mimeType: 'image/jpeg', data: base64Data } }, { text: "Analyze the soil in this image. Detect soil type, estimate pH, NPK levels, moisture and provide a brief assessment. Output JSON: {type, ph, nitrogen, phosphorus, potassium, moisture, organicMatter, assessment}" }]
      },
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(extractJSON(response.text || "{}"));
  } catch (error) { return null; }
}

export const getListingPriceRecommendation = async (crop: string, qty: number): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: MODELS.TEXT_SEARCH,
            contents: `Suggest a fair selling price for ${qty}kg of ${crop} in the current Indian market. Max 10 words.`,
        });
        return response.text || "Market rates vary.";
    } catch (error) { return "Check local rates."; }
};