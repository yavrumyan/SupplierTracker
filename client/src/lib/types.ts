export const COUNTRIES = [
  "UAE", "USA", "Germany", "China", "Taiwan", "Japan", "South Korea", "Singapore", "Hong Kong", "Malaysia"
] as const;

export const CATEGORIES = [
  "CPU", "GPU", "Motherboards", "SSD", "RAM", "Storage", "Cooling", "Power Supply", "Cases", "Peripherals"
] as const;

export const BRANDS = [
  "ASUS", "Intel", "AMD", "NVIDIA", "Samsung", "MSI", "Gigabyte", "Corsair", "G.Skill", "Western Digital", "Seagate", "Crucial"
] as const;

export const WORKING_STYLES = [
  "B2B", "PRICE-LISTS", "INQUIRIES"
] as const;

export type Country = typeof COUNTRIES[number];
export type Category = typeof CATEGORIES[number];
export type Brand = typeof BRANDS[number];
export type WorkingStyle = typeof WORKING_STYLES[number];

export interface SearchFilters {
  query?: string;
  country?: string;
  category?: string;
  brand?: string;
  minReputation?: number;
  workingStyle?: string;
}

export interface SupplierWithMatches {
  id: number;
  name: string;
  country: string;
  reputation: number;
  categories: string[];
  brands: string[];
  workingStyle: string[];
  matches?: string[];
}
