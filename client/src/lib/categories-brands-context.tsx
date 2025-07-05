import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CATEGORIES as STATIC_CATEGORIES, BRANDS as STATIC_BRANDS } from "@/lib/types";

interface CategoriesBrandsContextType {
  categories: string[];
  brands: string[];
  addCategory: (category: string) => void;
  addBrand: (brand: string) => void;
}

const CategoriesBrandsContext = createContext<CategoriesBrandsContextType | undefined>(undefined);

interface CategoriesBrandsProviderProps {
  children: ReactNode;
}

export function CategoriesBrandsProvider({ children }: CategoriesBrandsProviderProps) {
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [customBrands, setCustomBrands] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedCategories = localStorage.getItem('customCategories');
    const savedBrands = localStorage.getItem('customBrands');
    
    if (savedCategories) {
      try {
        setCustomCategories(JSON.parse(savedCategories));
      } catch (e) {
        console.error('Failed to parse saved categories:', e);
      }
    }
    
    if (savedBrands) {
      try {
        setCustomBrands(JSON.parse(savedBrands));
      } catch (e) {
        console.error('Failed to parse saved brands:', e);
      }
    }
  }, []);

  // Save to localStorage whenever custom items change
  useEffect(() => {
    localStorage.setItem('customCategories', JSON.stringify(customCategories));
  }, [customCategories]);

  useEffect(() => {
    localStorage.setItem('customBrands', JSON.stringify(customBrands));
  }, [customBrands]);

  const addCategory = (category: string) => {
    const trimmedCategory = category.trim();
    if (trimmedCategory && !categories.includes(trimmedCategory)) {
      setCustomCategories(prev => [...prev, trimmedCategory]);
    }
  };

  const addBrand = (brand: string) => {
    const trimmedBrand = brand.trim();
    if (trimmedBrand && !brands.includes(trimmedBrand)) {
      setCustomBrands(prev => [...prev, trimmedBrand]);
    }
  };

  // Combine static and custom lists
  const categories = [...STATIC_CATEGORIES, ...customCategories].sort();
  const brands = [...STATIC_BRANDS, ...customBrands].sort();

  return (
    <CategoriesBrandsContext.Provider value={{ categories, brands, addCategory, addBrand }}>
      {children}
    </CategoriesBrandsContext.Provider>
  );
}

export function useCategoriesBrands() {
  const context = useContext(CategoriesBrandsContext);
  if (context === undefined) {
    throw new Error('useCategoriesBrands must be used within a CategoriesBrandsProvider');
  }
  return context;
}