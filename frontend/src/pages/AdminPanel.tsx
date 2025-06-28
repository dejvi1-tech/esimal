import React, { useState, useEffect } from 'react';
import { europeanCountries } from '../data/countries';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Package {
  id: string;
  name: string;
  country_name: string;
  country_code?: string;
  data_amount: number;
  validity_days: number;
  base_price: number;
  sale_price: number;
  profit: number;
  created_at: string;
  updated_at: string;
}

interface MainPackage {
  id: string;
  name: string;
  country_name?: string;
  country?: string;
  country_code?: string;
  data_amount?: number;
  data?: string;
  validity_days?: number;
  days?: number;
  base_price?: number;
  price?: number;
  sale_price?: number;
  created_at?: string;
  updated_at?: string;
}

interface RoamifyPackage {
  // New mapped fields from backend
  id?: string;
  country?: string;
  region?: string;
  description?: string;
  data?: string | number;
  validity?: string | number;
  price?: number;
  
  // Original fields for backward compatibility
  packageId?: string;
  package?: string;
  packageName?: string;
  name?: string;
  country_name?: string;
  country_code?: string;
  dataAmount?: number;
  dataUnit?: string;
  day?: number;
  days?: number;
  validity_days?: number;
  base_price?: number;
  sale_price?: number;
  operator?: string;
  features?: any;
  isUnlimited?: boolean;
  [key: string]: any; // For any additional fields from Roamify API
}

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [myPackages, setMyPackages] = useState<Package[]>([]);
  const [mainPackages, setMainPackages] = useState<MainPackage[]>([]);
  const [roamifyPackages, setRoamifyPackages] = useState<RoamifyPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainLoading, setMainLoading] = useState(false);
  const [roamifyLoading, setRoamifyLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [country, setCountry] = useState<string>('');
  const [allCountries, setAllCountries] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'my-packages-only' | 'my-packages' | 'roamify-packages'>('roamify-packages');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(50); // Packages per page
  
  const [selectedRoamifyCountry, setSelectedRoamifyCountry] = useState('');
  const roamifyCountries = Array.from(new Set(roamifyPackages.map(pkg => pkg.country || pkg.country_name).filter(Boolean))).sort();
  
  // Remove the Europe & United States filter and just filter by selected country
  const filteredRoamifyPackages = selectedRoamifyCountry
    ? roamifyPackages.filter(pkg => (pkg.country || pkg.country_name) === selectedRoamifyCountry)
    : roamifyPackages;
  
  const [editingMyPackage, setEditingMyPackage] = useState<Package | null>(null);
  const [deletingPackage, setDeletingPackage] = useState<string | null>(null);

  // Add state to track sale prices for Roamify packages
  const [roamifySalePrices, setRoamifySalePrices] = useState<{ [id: string]: string }>({});

  const [countrySearch, setCountrySearch] = useState('');

  const [roamifyVisibleCount, setRoamifyVisibleCount] = useState(50000); // Show all packages by default (enough for 50k+ packages)

  // Add state for duplicate analysis
  const [duplicateAnalysis, setDuplicateAnalysis] = useState<{
    totalPackages: number;
    duplicateIds: { [id: string]: RoamifyPackage[] };
    duplicateCombinations: { [key: string]: RoamifyPackage[] };
    hasDuplicates: boolean;
  }>({
    totalPackages: 0,
    duplicateIds: {},
    duplicateCombinations: {},
    hasDuplicates: false
  });

  // Add state for deduplication process
  const [deduplicating, setDeduplicating] = useState(false);

  // Add state for sync process
  const [syncing, setSyncing] = useState(false);

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('admin_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  // Handle authentication errors
  const handleAuthError = (response: Response) => {
    if (response.status === 401) {
      localStorage.removeItem('admin_token');
      toast.error('Session expired. Please login again.');
      navigate('/admin/login');
      return true;
    }
    return false;
  };

  useEffect(() => {
    fetchAllCountries();
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [country, currentPage]);

  const fetchAllCountries = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/package-countries`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && Array.isArray(data.data)) {
          setAllCountries(data.data);
          console.log(`Loaded ${data.data.length} countries from database`);
        } else {
          console.error('Invalid response format from package-countries endpoint');
          // Fallback to static list
          const countryNames = europeanCountries.map(country => country.name.en);
          setAllCountries(countryNames);
        }
      } else {
        if (handleAuthError(response)) return;
        console.error('Failed to fetch countries from API');
        // Fallback to static list
        const countryNames = europeanCountries.map(country => country.name.en);
        setAllCountries(countryNames);
      }
    } catch (err) {
      console.error('Error fetching countries:', err);
      // Fallback to static list
      const countryNames = europeanCountries.map(country => country.name.en);
      setAllCountries(countryNames);
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchMyPackages(),
        fetchMainPackages(),
        fetchRoamifyPackages(1, pageSize), // Use pagination
        fetchAllCountries()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyPackages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/my-packages`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setMyPackages(data.data || data);
        setTotalPages(1);
      } else {
        if (handleAuthError(response)) return;
        const text = await response.text();
        console.error('Failed to fetch my packages:', response.status, text);
        setError('Failed to fetch my packages');
      }
    } catch (err) {
      console.error('Error fetching my packages:', err);
      setError('Failed to fetch my packages');
    } finally {
      setLoading(false);
    }
  };

  const fetchMainPackages = async () => {
    try {
      setMainLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/packages`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setMainPackages(data.data || data);
        setTotalPages(1);
      } else {
        if (handleAuthError(response)) return;
        const text = await response.text();
        console.error('Failed to fetch main packages:', response.status, text);
        setError('Failed to fetch main packages');
      }
    } catch (err) {
      console.error('Error fetching main packages:', err);
      setError('Failed to fetch main packages');
    } finally {
      setMainLoading(false);
    }
  };

  const fetchRoamifyPackages = async (page: number = 1, limit: number = 50) => {
    try {
      console.log(`Fetching Roamify packages (page ${page}, limit ${limit})...`);
      setRoamifyLoading(true);
      
      const fullUrl = `${import.meta.env.VITE_API_URL}/api/admin/all-roamify-packages?page=${page}&limit=${limit}`;
      console.log('Fetching from URL:', fullUrl);
      
      const response = await fetch(fullUrl, {
        headers: getAuthHeaders(),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const responseData = await response.json();
        console.log('Raw Roamify response:', responseData);
        
        // Extract the actual packages array from the response
        let data: RoamifyPackage[] = [];
        let paginationInfo = null;
        
        if (responseData && typeof responseData === 'object') {
          if (Array.isArray(responseData)) {
            data = responseData;
          } else if (responseData.data && Array.isArray(responseData.data)) {
            data = responseData.data;
            paginationInfo = responseData.pagination;
          } else {
            console.error('Unexpected response structure:', responseData);
            setError('Invalid response format from server');
            return;
          }
        }
        
        console.log('Roamify packages received:', data.length);
        console.log('First package sample:', data[0]);
        console.log('Pagination info:', paginationInfo);
        console.log('Pagination info type:', typeof paginationInfo);
        console.log('Pagination info keys:', paginationInfo ? Object.keys(paginationInfo) : 'null');
        console.log('Total count from pagination:', paginationInfo?.totalCount);
        console.log('Total pages from pagination:', paginationInfo?.totalPages);
        console.log('Current page from pagination:', paginationInfo?.page);
        
        // Update pagination state if available
        if (paginationInfo) {
          console.log('Setting pagination state...');
          console.log('Setting totalCount to:', paginationInfo.totalCount);
          console.log('Setting totalPages to:', paginationInfo.totalPages);
          console.log('Setting currentPage to:', paginationInfo.page);
          setCurrentPage(paginationInfo.page);
          setTotalPages(paginationInfo.totalPages);
          setTotalCount(paginationInfo.totalCount);
        } else {
          console.log('No pagination info available');
        }
        
        // Analyze packages for duplicates
        const analysis = analyzePackagesForDuplicates(data);
        setDuplicateAnalysis(analysis);
        
        // Log duplicate analysis to console
        console.log('=== DUPLICATE ANALYSIS ===');
        console.log(`Total packages: ${analysis.totalPackages}`);
        console.log(`Has duplicates: ${analysis.hasDuplicates}`);
        
        if (analysis.hasDuplicates) {
          console.log('=== DUPLICATE IDS ===');
          Object.entries(analysis.duplicateIds).forEach(([id, packages]) => {
            console.log(`ID "${id}" appears ${packages.length} times:`, packages.map(p => ({
              name: p.description || p.packageName || p.name || p.package,
              country: p.country || p.country_name,
              data: p.data || p.dataAmount,
              validity: p.validity || p.validity_days || p.days || p.day,
              price: p.price || p.base_price
            })));
          });
          
          console.log('=== DUPLICATE COMBINATIONS ===');
          Object.entries(analysis.duplicateCombinations).forEach(([key, packages]) => {
            console.log(`Combination "${key}" appears ${packages.length} times:`, packages.map(p => ({
              id: p.id || p.packageId,
              name: p.description || p.packageName || p.name || p.package,
              country: p.country || p.country_name,
              data: p.data || p.dataAmount,
              validity: p.validity || p.validity_days || p.days || p.day,
              price: p.price || p.base_price
            })));
          });
        }
        
        setRoamifyPackages(data);
      } else {
        if (handleAuthError(response)) return;
        const text = await response.text();
        console.error('Failed to fetch Roamify packages:', response.status, response.statusText);
        console.error('Response text:', text);
        setError(`Failed to fetch Roamify packages: ${response.status} - ${text.substring(0, 200)}`);
      }
    } catch (err) {
      console.error('Error fetching Roamify packages:', err);
      setError('Failed to fetch Roamify packages');
    } finally {
      setRoamifyLoading(false);
    }
  };

  // Function to analyze packages for duplicates
  const analyzePackagesForDuplicates = (packages: RoamifyPackage[]) => {
    // Defensive check to ensure packages is an array
    if (!Array.isArray(packages)) {
      console.error('analyzePackagesForDuplicates received non-array:', packages);
      return {
        totalPackages: 0,
        duplicateIds: {},
        duplicateCombinations: {},
        hasDuplicates: false
      };
    }
    
    const totalPackages = packages.length;
    const duplicateIds: { [id: string]: RoamifyPackage[] } = {};
    const duplicateCombinations: { [key: string]: RoamifyPackage[] } = {};
    
    // Check for duplicate IDs
    const idCounts: { [id: string]: RoamifyPackage[] } = {};
    packages.forEach(pkg => {
      const id = pkg.id || pkg.packageId || 'unknown';
      if (!idCounts[id]) {
        idCounts[id] = [];
      }
      idCounts[id].push(pkg);
    });
    
    // Find IDs with duplicates
    Object.entries(idCounts).forEach(([id, pkgs]) => {
      if (pkgs.length > 1) {
        duplicateIds[id] = pkgs;
      }
    });
    
    // Check for duplicate combinations (country + data + validity + price)
    const combinationCounts: { [key: string]: RoamifyPackage[] } = {};
    packages.forEach(pkg => {
      // Use the new mapped fields from backend
      const country = pkg.country || pkg.country_name || 'unknown';
      const data = pkg.data || pkg.dataAmount || 'unknown';
      const validity = pkg.validity || pkg.validity_days || pkg.days || pkg.day || 'unknown';
      const price = pkg.price || pkg.base_price || 'unknown';
      
      const combinationKey = `${country}|${data}|${validity}|${price}`;
      
      if (!combinationCounts[combinationKey]) {
        combinationCounts[combinationKey] = [];
      }
      combinationCounts[combinationKey].push(pkg);
    });
    
    // Find combinations with duplicates
    Object.entries(combinationCounts).forEach(([key, pkgs]) => {
      if (pkgs.length > 1) {
        duplicateCombinations[key] = pkgs;
      }
    });
    
    const hasDuplicates = Object.keys(duplicateIds).length > 0 || Object.keys(duplicateCombinations).length > 0;
    
    return {
      totalPackages,
      duplicateIds,
      duplicateCombinations,
      hasDuplicates
    };
  };

  const handleSavePackage = async (pkg: Package) => {
    setSaving(true);
    try {
      // Convert data_amount from MB to GB for the API (since the database stores it in MB)
      const packageData = {
        ...pkg,
        data_amount: pkg.data_amount / 1024 // Convert MB to GB for API
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/update-package/${pkg.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(packageData)
      });

      if (response.ok) {
        await fetchMyPackages();
        setEditingMyPackage(null);
        setError(''); // Clear any previous errors
      } else {
        if (handleAuthError(response)) return;
        const errorData = await response.json();
        setError(`Failed to save package: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error saving package:', err);
      setError('Failed to save package');
    } finally {
      setSaving(false);
    }
  };

  const handleEditMyPackage = async (pkg: Package) => {
    setEditingMyPackage(pkg);
  };

  const handleDeleteMyPackage = async (packageId: string) => {
    if (!window.confirm('Are you sure you want to delete this package?')) {
      return;
    }

    setDeletingPackage(packageId);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/delete-package/${packageId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        await fetchMyPackages();
        setError(''); // Clear any previous errors
      } else {
        if (handleAuthError(response)) return;
        const text = await response.text();
        console.error('Failed to delete package:', response.status, text);
        setError('Failed to delete package');
      }
    } catch (err) {
      console.error('Error deleting package:', err);
      setError('Failed to delete package');
    } finally {
      setDeletingPackage(null);
    }
  };

  const handleSaveToMyPackages = async (pkg: MainPackage) => {
    setUpdating(pkg.id);
    try {
      const packageData = {
        name: pkg.name,
        country_name: pkg.country_name || pkg.country || '',
        country_code: pkg.country_code || '',
        data_amount: pkg.data_amount || 0,
        validity_days: pkg.validity_days || pkg.days || 0,
        base_price: pkg.base_price || pkg.price || 0,
        sale_price: pkg.base_price || pkg.price || 0,
        profit: 0
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/save-package`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(packageData)
      });

      if (response.ok) {
        await fetchMyPackages();
        setError(''); // Clear any previous errors
      } else {
        if (handleAuthError(response)) return;
        const errorData = await response.json();
        setError(`Failed to save package: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error saving to my packages:', err);
      setError('Failed to save package');
    } finally {
      setUpdating(null);
    }
  };

  const handleSaveRoamifyPackage = async (pkg: RoamifyPackage) => {
    setUpdating(pkg.id || pkg.packageId || '');
    try {
      // Extract and map all required fields with fallbacks
      const name = pkg.description || pkg.packageName || pkg.name || pkg.package || 'Unknown Package';
      const country_name = pkg.country || pkg.country_name || '';
      const country_code = pkg.country_code || '';
      // Parse data_amount as a number in GB
      let data_amount_raw = pkg.data || pkg.dataAmount || '';
      let data_amount = 0;
      if (typeof data_amount_raw === 'number') {
        data_amount = data_amount_raw;
      } else if (typeof data_amount_raw === 'string') {
        const match = data_amount_raw.match(/(\d+(?:\.\d+)?)(GB|MB|KB)?/i);
        if (match) {
          let value = parseFloat(match[1]);
          const unit = match[2]?.toUpperCase() || 'GB';
          if (unit === 'MB') value = value / 1024;
          if (unit === 'KB') value = value / (1024 * 1024);
          data_amount = value;
        }
      }
      const validity_days = pkg.validity || pkg.validity_days || pkg.days || pkg.day || 0;
      const base_price = pkg.price || pkg.base_price || 0;
      const salePriceStr = roamifySalePrices[pkg.id || pkg.packageId || ''] ?? base_price.toString();
      const sale_price = salePriceStr === '' ? base_price : parseFloat(salePriceStr);
      const reseller_id = pkg.id || pkg.packageId || '';
      const region = pkg.region || '';

      // Frontend validation
      if (!name || !country_name || !country_code || !data_amount || !validity_days || !base_price) {
        toast.error('Cannot save: Missing required fields.');
        setError('Cannot save: Missing required fields.');
        setUpdating(null);
        return;
      }

      // For Europe & United States packages, save without location_slug
      // For all other countries, save with country-specific location_slug
      const packageData = {
        name,
        country_name,
        country_code,
        data_amount,
        validity_days,
        base_price,
        sale_price,
        profit: sale_price - base_price,
        reseller_id,
        region,
        show_on_frontend: true,
        location_slug: country_name === "Europe & United States" ? "" : country_code.toLowerCase(),
        homepage_order: 0
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/save-package`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(packageData)
      });

      if (response.ok) {
        await fetchMyPackages();
        setError(''); // Clear any previous errors
        toast.success(country_name === "Europe & United States" 
          ? 'Package saved successfully! Use "Save as Most Popular" to show in Most Popular section.'
          : `Package saved successfully! It will appear on the ${country_name} page.`);
      } else {
        if (handleAuthError(response)) return;
        const errorData = await response.json();
        const errorMessage = `Failed to save package: ${errorData.error || 'Unknown error'}`;
        toast.error(errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Error saving Roamify package:', err);
      const errorMessage = 'Failed to save package';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setUpdating(null);
    }
  };

  const handleSaveAsMostPopular = async (pkg: RoamifyPackage) => {
    setUpdating(pkg.id || pkg.packageId || '');
    try {
      // Check if the package is for Europe & United States
      if (pkg.country !== "Europe & United States") {
        toast.error('Only Europe & United States packages can be saved as Most Popular. This package will be saved to its country-specific page instead.');
        // Automatically save it as a country-specific package instead
        await handleSaveRoamifyPackage(pkg);
        return;
      }

      const base_price = pkg.price || pkg.base_price || 0;
      const salePriceStr = roamifySalePrices[pkg.id || pkg.packageId || ''] ?? base_price.toString();
      const sale_price = salePriceStr === '' ? base_price : parseFloat(salePriceStr);

      const packageData = {
        id: pkg.id || pkg.packageId || '',
        country: pkg.country || pkg.country_name || '',
        country_code: pkg.country_code || '',
        data: pkg.data || pkg.dataAmount || '',
        days: pkg.validity || pkg.validity_days || pkg.days || pkg.day || 0,
        base_price: base_price,
        sale_price: sale_price,
        profit: sale_price - base_price,
        show_on_frontend: true,
        location_slug: "most-popular",
        homepage_order: 1
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/save-package`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(packageData)
      });

      if (response.ok) {
        await fetchMyPackages();
        setError(''); // Clear any previous errors
        toast.success('Package saved to Most Popular section successfully!');
      } else {
        if (handleAuthError(response)) return;
        const errorData = await response.json();
        const errorMessage = `Failed to save package: ${errorData.error || 'Unknown error'}`;
        toast.error(errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Error saving as most popular:', err);
      const errorMessage = 'Failed to save package';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setUpdating(null);
    }
  };

  const handlePriceChange = (packageId: string, value: string) => {
    const newPrice = parseFloat(value) || 0;
    setMyPackages(prev => 
      prev.map(pkg => 
        pkg.id === packageId 
          ? { ...pkg, sale_price: newPrice, profit: newPrice - pkg.base_price }
          : pkg
      )
    );
  };

  const handleCountrySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCountry(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchRoamifyPackages(page, pageSize);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current page
      let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      if (end - start + 1 < maxVisiblePages) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  const handleRemoveDuplicates = async () => {
    if (!duplicateAnalysis.hasDuplicates) {
      toast.info('No duplicates found to remove');
      return;
    }

    setDeduplicating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/deduplicate-packages`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Successfully removed ${result.removedCount} duplicate packages`);
        // Refresh the packages list
        await fetchRoamifyPackages();
      } else {
        if (handleAuthError(response)) return;
        const errorData = await response.json();
        toast.error(`Failed to remove duplicates: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error removing duplicates:', err);
      toast.error('Failed to remove duplicates');
    } finally {
      setDeduplicating(false);
    }
  };

  const handleSyncRoamifyPackages = async () => {
    setSyncing(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/sync-roamify-packages`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Successfully synced ${result.syncedCount} packages from Roamify API`);
        // Refresh the packages list
        await fetchRoamifyPackages();
      } else {
        if (handleAuthError(response)) return;
        const errorData = await response.json();
        toast.error(`Failed to sync packages: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error syncing packages:', err);
      toast.error('Failed to sync packages');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600">eSIM Package Management</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('my-packages-only')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my-packages-only'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Packages Only ({myPackages.length})
            </button>
            <button
              onClick={() => setActiveTab('roamify-packages')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'roamify-packages'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Roamify Packages ({totalCount ? totalCount.toLocaleString() : roamifyPackages.length.toLocaleString()})
            </button>
          </nav>
        </div>

        {/* My Packages Only Tab */}
        {activeTab === 'my-packages-only' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                My eSIM Packages Only ({myPackages.length})
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Manage your eSIM packages with edit and delete functionality
              </p>
              
              {/* Country Search */}
              <div className="mt-4">
                <label htmlFor="my-packages-country-search" className="block text-sm font-medium text-gray-700">
                  Search by Country:
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    id="my-packages-country-search"
                    placeholder="Search country..."
                    value={countrySearch}
                    onChange={e => setCountrySearch(e.target.value)}
                    className="flex-1 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  />
                  {countrySearch && (
                    <button
                      onClick={() => setCountrySearch('')}
                      className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {countrySearch && (
                  <p className="mt-1 text-sm text-gray-600">
                    Showing {myPackages.filter(pkg => pkg.country_name.toLowerCase().includes(countrySearch.toLowerCase())).length} of {myPackages.length} packages
                  </p>
                )}
              </div>
            </div>
            
            {loading ? (
              <div className="px-6 py-8 text-center text-xl">Loading packages...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Package
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Country
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Country Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data (GB)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Days
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Base Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sale Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Profit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {myPackages
                      .filter(pkg => 
                        !countrySearch || 
                        pkg.country_name.toLowerCase().includes(countrySearch.toLowerCase())
                      )
                      .map((pkg) => (
                      <tr key={pkg.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingMyPackage?.id === pkg.id ? (
                            <input
                              type="text"
                              value={editingMyPackage.name}
                              onChange={(e) => setEditingMyPackage({...editingMyPackage, name: e.target.value})}
                              className="w-48 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <div className="text-sm font-medium text-gray-900">
                              {pkg.name}
                            </div>
                          )}
                          <div className="text-sm text-gray-500">
                            ID: {pkg.id}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingMyPackage?.id === pkg.id ? (
                            <input
                              type="text"
                              value={editingMyPackage.country_name}
                              onChange={(e) => setEditingMyPackage({...editingMyPackage, country_name: e.target.value})}
                              className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <span className="text-sm text-gray-900">{pkg.country_name}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingMyPackage?.id === pkg.id ? (
                            <input
                              type="text"
                              value={(editingMyPackage as any).country_code || ''}
                              onChange={(e) => setEditingMyPackage({...editingMyPackage, country_code: e.target.value} as any)}
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="e.g., DE"
                            />
                          ) : (
                            <span className="text-sm text-gray-900">{(pkg as any).country_code || 'N/A'}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingMyPackage?.id === pkg.id ? (
                            <input
                              type="number"
                              step="0.1"
                              value={(editingMyPackage.data_amount / 1024).toFixed(1)}
                              onChange={(e) => setEditingMyPackage({...editingMyPackage, data_amount: Number(e.target.value) * 1024})}
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="GB"
                            />
                          ) : (
                            <span className="text-sm text-gray-900">{(pkg.data_amount / 1024).toFixed(1)} GB</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingMyPackage?.id === pkg.id ? (
                            <input
                              type="number"
                              value={editingMyPackage.validity_days}
                              onChange={(e) => setEditingMyPackage({...editingMyPackage, validity_days: Number(e.target.value)})}
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <span className="text-sm text-gray-900">{pkg.validity_days}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingMyPackage?.id === pkg.id ? (
                            <input
                              type="number"
                              step="0.01"
                              value={editingMyPackage.base_price}
                              onChange={(e) => setEditingMyPackage({...editingMyPackage, base_price: Number(e.target.value)})}
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <span className="text-sm text-gray-900">${pkg.base_price}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingMyPackage?.id === pkg.id ? (
                            <input
                              type="number"
                              step="0.01"
                              value={editingMyPackage.sale_price}
                              onChange={(e) => setEditingMyPackage({...editingMyPackage, sale_price: Number(e.target.value)})}
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <input
                              type="number"
                              step="0.01"
                              value={pkg.sale_price}
                              onChange={(e) => handlePriceChange(pkg.id, e.target.value)}
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingMyPackage?.id === pkg.id ? (
                            <input
                              type="number"
                              step="0.01"
                              value={editingMyPackage.profit}
                              readOnly
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm bg-gray-100"
                            />
                          ) : (
                            <span className={`text-sm ${pkg.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ${pkg.profit.toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {editingMyPackage?.id === pkg.id ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleSavePackage(editingMyPackage)}
                                disabled={saving}
                                className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                              >
                                {saving ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={() => setEditingMyPackage(null)}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditMyPackage(pkg)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteMyPackage(pkg.id)}
                                disabled={deletingPackage === pkg.id}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              >
                                {deletingPackage === pkg.id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Roamify Packages Tab */}
        {activeTab === 'roamify-packages' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Roamify Packages ({roamifyPackages.length})
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Available packages from Roamify API - Edit sale price and save to your inventory
              </p>
              
              {/* Duplicate Analysis Display */}
              {!roamifyLoading && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Package Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium text-gray-700">Total Packages</div>
                      <div className="text-2xl font-bold text-blue-600">{duplicateAnalysis.totalPackages}</div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium text-gray-700">Duplicate IDs</div>
                      <div className={`text-2xl font-bold ${duplicateAnalysis.hasDuplicates ? 'text-red-600' : 'text-green-600'}`}>
                        {Object.keys(duplicateAnalysis.duplicateIds).length}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium text-gray-700">Duplicate Combinations</div>
                      <div className={`text-2xl font-bold ${duplicateAnalysis.hasDuplicates ? 'text-red-600' : 'text-green-600'}`}>
                        {Object.keys(duplicateAnalysis.duplicateCombinations).length}
                      </div>
                    </div>
                  </div>
                  
                  {duplicateAnalysis.hasDuplicates && (
                    <div className="mt-4">
                      <details className="bg-white p-3 rounded border">
                        <summary className="cursor-pointer font-medium text-red-700 hover:text-red-800">
                          🔍 View Duplicate Details (Click to expand)
                        </summary>
                        <div className="mt-3 space-y-4">
                          {Object.keys(duplicateAnalysis.duplicateIds).length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-800 mb-2">Duplicate IDs:</h4>
                              <div className="space-y-2">
                                {Object.entries(duplicateAnalysis.duplicateIds).map(([id, packages]) => (
                                  <div key={id} className="bg-red-50 p-2 rounded border-l-4 border-red-400">
                                    <div className="font-medium text-red-800">ID: {id} (appears {packages.length} times)</div>
                                    {packages.map((pkg, index) => (
                                      <div key={index} className="text-sm text-red-700 ml-4">
                                        {index + 1}. {pkg.description || pkg.packageName || pkg.name || pkg.package} - {pkg.country || pkg.country_name} - {pkg.data_amount || pkg.dataAmount || pkg.data} - {pkg.validity_days || pkg.days || pkg.day} days - ${pkg.base_price || pkg.price}
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {Object.keys(duplicateAnalysis.duplicateCombinations).length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-800 mb-2">Duplicate Combinations (Country + Data + Days + Price):</h4>
                              <div className="space-y-2">
                                {Object.entries(duplicateAnalysis.duplicateCombinations).map(([key, packages]) => (
                                  <div key={key} className="bg-orange-50 p-2 rounded border-l-4 border-orange-400">
                                    <div className="font-medium text-orange-800">Combination: {key} (appears {packages.length} times)</div>
                                    {packages.map((pkg, index) => (
                                      <div key={index} className="text-sm text-orange-700 ml-4">
                                        {index + 1}. ID: {pkg.id || pkg.packageId} - {pkg.description || pkg.packageName || pkg.name || pkg.package}
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              )}
              
              {/* Legend for duplicate indicators */}
              {!roamifyLoading && duplicateAnalysis.hasDuplicates && (
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">📋 Duplicate Indicators Legend:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-50 border-l-4 border-red-400 mr-2"></div>
                      <span className="text-yellow-700">Red background = Duplicate package</span>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mr-2">Duplicate ID</span>
                      <span className="text-yellow-700">Same package ID appears multiple times</span>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mr-2">Duplicate Combo</span>
                      <span className="text-yellow-700">Same country + data + days + price combination</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Country Filter */}
              <div className="mt-4">
                <label htmlFor="country-filter" className="block text-sm font-medium text-gray-700">
                  Filter by Country:
                </label>
                <input
                  type="text"
                  placeholder="Search country..."
                  value={countrySearch}
                  onChange={e => setCountrySearch(e.target.value)}
                  className="mt-1 mb-2 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                />
                <select
                  id="country-filter"
                  value={selectedRoamifyCountry}
                  onChange={(e) => setSelectedRoamifyCountry(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="">All Countries ({roamifyCountries.length})</option>
                  {roamifyCountries.filter(c => !!c && c.toLowerCase().includes(countrySearch.toLowerCase())).map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              {/* Remove Duplicates Button */}
              {!roamifyLoading && duplicateAnalysis.hasDuplicates && (
                <div className="mt-4">
                  <button
                    onClick={handleRemoveDuplicates}
                    disabled={deduplicating}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {deduplicating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Removing Duplicates...
                      </>
                    ) : (
                      <>
                        🗑️ Remove Duplicates
                        <span className="text-xs bg-red-700 px-2 py-1 rounded">
                          {Object.keys(duplicateAnalysis.duplicateIds).length + Object.keys(duplicateAnalysis.duplicateCombinations).length} groups
                        </span>
                      </>
                    )}
                  </button>
                  <p className="mt-1 text-sm text-gray-600">
                    This will remove duplicate packages based on ID and combination matches
                  </p>
                </div>
              )}

              {/* Sync Roamify Packages Button */}
              <div className="mt-4">
                <button
                  onClick={handleSyncRoamifyPackages}
                  disabled={syncing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {syncing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Syncing from Roamify API...
                    </>
                  ) : (
                    <>
                      🔄 Sync from Roamify API
                    </>
                  )}
                </button>
                <p className="mt-1 text-sm text-gray-600">
                  This will fetch fresh data directly from Roamify API and sync to database
                </p>
              </div>
            </div>
            
            {roamifyLoading ? (
              <div className="px-6 py-8 text-center text-xl">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                Loading Roamify packages... This may take a moment for 22,000+ packages.
              </div>
            ) : (
              <div className="overflow-x-auto" style={{ maxHeight: 600, overflowY: 'auto' }}>
                {/* Package Summary */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Total Packages:</span> {totalCount ? totalCount.toLocaleString() : roamifyPackages.length.toLocaleString()}
                      {selectedRoamifyCountry && (
                        <span className="ml-4">
                          <span className="font-medium">Filtered:</span> {filteredRoamifyPackages.length.toLocaleString()} for {selectedRoamifyCountry}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      Showing {Math.min(roamifyVisibleCount, filteredRoamifyPackages.length).toLocaleString()} packages
                      {totalCount && totalCount > roamifyPackages.length && (
                        <span className="ml-2 text-blue-600">
                          (Page {currentPage} of {totalPages})
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Debug information */}
                  <div className="mt-2 text-xs text-gray-500">
                    Debug: totalCount={totalCount}, totalPages={totalPages}, currentPage={currentPage}, roamifyPackages.length={roamifyPackages.length}
                  </div>
                </div>
                
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data (GB)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRoamifyPackages.slice(0, roamifyVisibleCount).map((pkg) => {
                      const basePrice = pkg.price || pkg.base_price || 0;
                      const salePrice = parseFloat(roamifySalePrices[pkg.id || pkg.packageId || ''] ?? basePrice.toString());
                      const profit = salePrice - basePrice;
                      
                      // Check if this package is a duplicate using new mapped fields
                      const packageId = pkg.id || pkg.packageId || 'unknown';
                      const country = pkg.country || pkg.country_name || 'unknown';
                      const data = pkg.data || pkg.dataAmount || 'unknown';
                      const validity = pkg.validity || pkg.validity_days || pkg.days || pkg.day || 'unknown';
                      const price = pkg.price || pkg.base_price || 'unknown';
                      const combinationKey = `${country}|${data}|${validity}|${price}`;
                      
                      const isDuplicateId = duplicateAnalysis.duplicateIds[packageId] && duplicateAnalysis.duplicateIds[packageId].length > 1;
                      const isDuplicateCombination = duplicateAnalysis.duplicateCombinations[combinationKey] && duplicateAnalysis.duplicateCombinations[combinationKey].length > 1;
                      const isDuplicate = isDuplicateId || isDuplicateCombination;
                      
                      return (
                        <tr 
                          key={pkg.id || pkg.packageId} 
                          className={`hover:bg-gray-50 ${isDuplicate ? 'bg-red-50 border-l-4 border-red-400' : ''}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {pkg.description || pkg.packageName || pkg.name || pkg.package || 'Unknown Package'}
                              {isDuplicate && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  {isDuplicateId && isDuplicateCombination ? 'Duplicate ID & Combo' : 
                                   isDuplicateId ? 'Duplicate ID' : 'Duplicate Combo'}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">ID: {pkg.id || pkg.packageId}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{pkg.country || pkg.country_name}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{pkg.country_code || 'N/A'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{pkg.data || pkg.dataAmount || 'N/A'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{pkg.validity || pkg.validity_days || pkg.days || pkg.day || 'N/A'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">${basePrice.toFixed(2)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={
                                roamifySalePrices[pkg.id || pkg.packageId || ''] !== undefined
                                  ? roamifySalePrices[pkg.id || pkg.packageId || '']
                                  : basePrice.toString()
                              }
                              onChange={e => {
                                // Only allow numbers and decimal point
                                const val = e.target.value;
                                if (/^\d*\.?\d*$/.test(val)) {
                                  setRoamifySalePrices({ ...roamifySalePrices, [pkg.id || pkg.packageId || '']: val });
                                }
                              }}
                              className="w-32 px-4 py-2 border-2 border-indigo-500 rounded-lg text-lg font-semibold text-center focus:ring-2 focus:ring-indigo-400 focus:border-indigo-600 transition-all"
                              placeholder="Sale Price"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>${profit.toFixed(2)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleSaveAsMostPopular(pkg)}
                              disabled={updating === (pkg.id || pkg.packageId)}
                              className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                            >
                              {updating === (pkg.id || pkg.packageId) ? 'Saving...' : 'Save'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredRoamifyPackages.length > roamifyVisibleCount && (
                  <div className="text-center my-4">
                    <button
                      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      onClick={() => setRoamifyVisibleCount(c => c + 5000)}
                    >
                      Show More ({roamifyVisibleCount} of {filteredRoamifyPackages.length} packages)
                    </button>
                  </div>
                )}
                {filteredRoamifyPackages.length > 0 && roamifyVisibleCount >= filteredRoamifyPackages.length && (
                  <div className="text-center my-4 text-sm text-gray-600">
                    Showing all {filteredRoamifyPackages.length} packages
                  </div>
                )}
                
                {/* Pagination Controls for Roamify Packages */}
                <div className="mt-6 flex justify-center items-center space-x-2">
                  <div className="text-xs text-gray-500 mb-2">
                    Pagination Debug: totalCount={totalCount}, totalPages={totalPages}, currentPage={currentPage}, roamifyPackages.length={roamifyPackages.length}
                    <br />
                    Condition check: totalCount &gt; roamifyPackages.length = {totalCount} &gt; {roamifyPackages.length} = {totalCount > roamifyPackages.length ? 'true' : 'false'}
                    <br />
                    totalCount type: {typeof totalCount}, roamifyPackages.length type: {typeof roamifyPackages.length}
                  </div>
                  
                  {totalCount && totalCount > roamifyPackages.length ? (
                    <>
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      <div className="flex space-x-1">
                        {getPageNumbers().map((pageNum, index) => (
                          <button
                            key={index}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-2 rounded ${
                              pageNum === currentPage
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {pageNum === '...' ? '...' : pageNum}
                          </button>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                      
                      <div className="ml-4 text-sm text-gray-600">
                        Page {currentPage} of {totalPages} ({totalCount.toLocaleString()} total packages)
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-gray-500">
                      {!totalCount ? 'No totalCount available' : 
                       totalCount <= roamifyPackages.length ? 'All packages loaded (no pagination needed)' : 
                       'Pagination condition not met'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel; 