import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CATEGORIES as STATIC_CATEGORIES, BRANDS as STATIC_BRANDS } from "@/lib/types";

interface CategoriesBrandsContextType {
  categories: string[];
  brands: string[];
  addCategory: (category: string) => void;
  addBrand: (brand: string) => void;
  removeCategory: (category: string) => void;
  removeBrand: (brand: string) => void;
}

const CategoriesBrandsContext = createContext<CategoriesBrandsContextType | undefined>(undefined);

interface CategoriesBrandsProviderProps {
  children: ReactNode;
}

export function CategoriesBrandsProvider({ children }: CategoriesBrandsProviderProps) {
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [customBrands, setCustomBrands] = useState<string[]>([]);
  const [supplierCategories, setSupplierCategories] = useState<string[]>([]);
  const [supplierBrands, setSupplierBrands] = useState<string[]>([]);

  // Load from localStorage and fetch from suppliers on mount
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

    // Fetch categories and brands from supplier data
    fetchSupplierData();
  }, []);

  const fetchSupplierData = async () => {
    try {
      const [categoriesRes, brandsRes] = await Promise.all([
        fetch('/api/categories/from-suppliers'),
        fetch('/api/brands/from-suppliers')
      ]);
      
      if (categoriesRes.ok) {
        const categories = await categoriesRes.json();
        setSupplierCategories(categories);
      }
      
      if (brandsRes.ok) {
        const brands = await brandsRes.json();
        setSupplierBrands(brands);
      }
    } catch (error) {
      console.error('Failed to fetch supplier data:', error);
    }
  };

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

  const removeCategory = async (category: string) => {
    try {
      // Call API to delete from all suppliers in database
      const response = await fetch(`/api/categories/${encodeURIComponent(category)}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Remove from local state
        setCustomCategories(prev => prev.filter(c => c !== category));
        // Refresh supplier data to update the UI
        await fetchSupplierData();
      } else {
        console.error('Failed to delete category from database');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const removeBrand = async (brand: string) => {
    try {
      // Call API to delete from all suppliers in database
      const response = await fetch(`/api/brands/${encodeURIComponent(brand)}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Remove from local state
        setCustomBrands(prev => prev.filter(b => b !== brand));
        // Refresh supplier data to update the UI
        await fetchSupplierData();
      } else {
        console.error('Failed to delete brand from database');
      }
    } catch (error) {
      console.error('Error deleting brand:', error);
    }
  };

  // Combine static, custom, and supplier data lists
  const categories = [...STATIC_CATEGORIES, ...customCategories, ...supplierCategories].filter((item, index, arr) => arr.indexOf(item) === index).sort();
  const brands = [...STATIC_BRANDS, ...customBrands, ...supplierBrands].filter((item, index, arr) => arr.indexOf(item) === index).sort();

  return (
    <CategoriesBrandsContext.Provider value={{ categories, brands, addCategory, addBrand, removeCategory, removeBrand }}>
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