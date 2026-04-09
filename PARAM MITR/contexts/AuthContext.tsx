
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface SaleRecord {
  id: string;
  date: string;
  crop: string;
  quantity: number; 
  pricePerUnit: number;
  total: number;
  status: 'Completed' | 'Pending';
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  farmType: string;
  memberSince: string;
  rating: number;
  followingMandis: number;
  avatarUrl: string;
  sales: SaleRecord[];
}

const EMPTY_PROFILE: UserProfile = {
  name: "",
  email: "",
  phone: "",
  location: "",
  farmType: "Organic Mixed",
  memberSince: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
  rating: 4.8,
  followingMandis: 3,
  avatarUrl: "",
  sales: []
};

interface AuthContextType {
  isLoggedIn: boolean;
  profile: UserProfile;
  login: (phone: string) => void;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  addSale: (sale: Omit<SaleRecord, 'id' | 'total'>) => void;
  deleteSale: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);

  useEffect(() => {
    const savedProfile = localStorage.getItem('agro_profile');
    const savedLogin = localStorage.getItem('agro_isLoggedIn');
    if (savedLogin === 'true' && savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
        setIsLoggedIn(true);
      } catch (e) {
        // Silently reset on corrupt data
        localStorage.removeItem('agro_isLoggedIn');
        localStorage.removeItem('agro_profile');
      }
    }
  }, []);

  const login = (phone: string) => {
    const newProfile = { ...EMPTY_PROFILE, phone };
    setProfile(newProfile);
    setIsLoggedIn(true);
    localStorage.setItem('agro_isLoggedIn', 'true');
    localStorage.setItem('agro_profile', JSON.stringify(newProfile));
  };

  const logout = () => {
    // 1. Wipe React state for immediate feedback
    setIsLoggedIn(false);
    setProfile(EMPTY_PROFILE);

    // 2. Wipe Persistent Storage
    localStorage.removeItem('agro_isLoggedIn');
    localStorage.removeItem('agro_profile');
    
    // 3. Clear session storage (AI chat history, cached weather, etc)
    sessionStorage.clear();

    // 4. Force a hard reload of the page to reset all memory and navigation state
    // This is the most robust "Real Logout" mechanism for a web app
    window.location.reload();
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    setProfile(prev => {
      const updated = { ...prev, ...data };
      localStorage.setItem('agro_profile', JSON.stringify(updated));
      return updated;
    });
  };

  const addSale = (saleData: Omit<SaleRecord, 'id' | 'total'>) => {
    const newSale: SaleRecord = {
      ...saleData,
      id: Date.now().toString(),
      total: saleData.quantity * saleData.pricePerUnit
    };
    updateProfile({ sales: [newSale, ...profile.sales] });
  };

  const deleteSale = (id: string) => {
    updateProfile({ sales: profile.sales.filter(s => s.id !== id) });
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, profile, login, logout, updateProfile, addSale, deleteSale }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
