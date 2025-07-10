import React, { useState, useEffect } from 'react';
import { europeanCountries } from '../data/countries';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { getAdminHeaders } from '../utils/adminHeaders';
import { useLanguage } from '../contexts/LanguageContext';

interface Package {
  id: string;
  name: string;
  country_name: string;
  country_code?: string;
  data_amount: number;
  days: number;
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
  days?: string | number;
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
  base_price?: number;
  sale_price?: number;
  operator?: string;
  features?: any;
  isUnlimited?: boolean;
  [key: string]: any; // For any additional fields from Roamify API
}

interface DuplicateAnalysis {
  totalPackages: number;
  duplicateIds: { [id: string]: RoamifyPackage[] };
  duplicateCombinations: { [key: string]: RoamifyPackage[] };
  hasDuplicates: boolean;
}

const AdminPanel: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [myPackages, setMyPackages] = useState<Package[]>([]);
  const [roamifyPackages, setRoamifyPackages] = useState<RoamifyPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [roamifyLoading, setRoamifyLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  
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
  
  // Add missing state variables for Roamify operations
  const [deduplicating, setDeduplicating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  // Add duplicate analysis state
  const [duplicateAnalysis, setDuplicateAnalysis] = useState<DuplicateAnalysis>({
    totalPackages: 0,
    duplicateIds: {},
    duplicateCombinations: {},
    hasDuplicates: false
  });

  // Add separate search states for each panel
  const [myPackagesCountrySearch, setMyPackagesCountrySearch] = useState('');
  const [roamifyCountrySearch, setRoamifyCountrySearch] = useState('');

  // Add tab state
  const [activeTab, setActiveTab] = useState<'myPackages' | 'roamifyPackages'>('myPackages');

  // Handle logout
  const handleLogout = async () => {
    await fetch('/api/logout', {
      method: 'POST',
      credentials: 'include',
    });
    toast.success('Logged out successfully', { style: { color: 'black' } });
    navigate('/admin/login');
  };

  useEffect(() => {
    // Auth check for admin panel (cookie-based)
    const checkAdminAuth = async () => {
      try {
        const res = await fetch('/api/admin/admin-check', { credentials: 'include' });
        if (!res.ok) {
          navigate('/admin/login');
        }
      } catch (err) {
        navigate('/admin/login');
      }
    };
    checkAdminAuth();
  }, [navigate]);

  useEffect(() => {
    fetchAllCountries();
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [currentPage]);

  const fetchAllCountries = async () => {
    try {
      const response = await fetch('/api/admin/package-countries', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && Array.isArray(data.data)) {
          console.log(`Loaded ${data.data.length} countries from database`);
        } else {
          console.error('Invalid response format from package-countries endpoint');
        }
      } else {
        console.error('Failed to fetch countries from API');
      }
    } catch (err) {
      console.error('Error fetching countries:', err);
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchMyPackages(),
        fetchRoamifyPackages(1, 50000), // Fetch all packages in single request
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
      const headers = await getAdminHeaders('GET');
      const response = await fetch('/api/admin/my-packages', {
        headers,
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setMyPackages(data.data || data);
      } else {
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

  const fetchRoamifyPackages = async (page: number = 1, limit: number = 50000) => {
    try {
      console.log(`Fetching ALL Roamify packages (single request with limit ${limit})...`);
      setRoamifyLoading(true);
      
      const headers = await getAdminHeaders('GET');
      const fullUrl = `/api/admin/all-roamify-packages?page=1&limit=${limit}`;
      console.log('Fetching from URL:', fullUrl);
      
      const response = await fetch(fullUrl, {
        headers,
        credentials: 'include',
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
              days: p.days || p.day,
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
              days: p.days || p.day,
              price: p.price || p.base_price
            })));
          });
        }
        
        setRoamifyPackages(data);
      } else {
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
  const analyzePackagesForDuplicates = (packages: RoamifyPackage[]): DuplicateAnalysis => {
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
    
    // Check for duplicate combinations (country + data + days + price)
    const combinationCounts: { [key: string]: RoamifyPackage[] } = {};
    packages.forEach(pkg => {
      // Use the new mapped fields from backend
      const country = pkg.country || pkg.country_name || 'unknown';
      const data = pkg.data || pkg.dataAmount || 'unknown';
      const days = pkg.days || pkg.day || 'unknown';
      const price = pkg.price || pkg.base_price || 'unknown';
      
      const combinationKey = `${country}|${data}|${days}|${price}`;
      
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
      const packageData = {
        ...pkg,
        data_amount: pkg.data_amount
      };
      const headers = await getAdminHeaders('PUT');
      const response = await fetch(`/api/admin/update-package/${pkg.id}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(packageData)
      });

      if (response.ok) {
        await fetchMyPackages();
        setEditingMyPackage(null);
        setError(''); // Clear any previous errors
      } else {
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
      const headers = await getAdminHeaders('DELETE');
      const response = await fetch(`/api/admin/delete-package/${packageId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      if (response.ok) {
        await fetchMyPackages();
        setError(''); // Clear any previous errors
      } else {
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


  const handleSaveRoamifyPackage = async (pkg: RoamifyPackage) => {
    setUpdating(pkg.id || pkg.packageId || '');
    try {
      // Extract and map all required fields with fallbacks
      const name = pkg.description || pkg.packageName || pkg.name || pkg.package || 'Unknown Package';
      const country_name = pkg.country || pkg.country_name || '';
      const country_code = pkg.country_code || '';
      // Parse data_amount as a number in GB (backend now expects GB)
      let data_amount_raw = pkg.data || pkg.dataAmount || '';
      let data_amount = 0;
      if (typeof data_amount_raw === 'number') {
        // If it's from Roamify API and unit is MB, convert to GB
        if (pkg.dataUnit === 'MB') {
          data_amount = data_amount_raw / 1024; // Convert MB to GB
        } else {
          data_amount = data_amount_raw; // Assume already in GB
        }
      } else if (typeof data_amount_raw === 'string') {
        const match = data_amount_raw.match(/(\d+(?:\.\d+)?)(GB|MB|KB)?/i);
        if (match) {
          let value = parseFloat(match[1]);
          const unit = match[2]?.toUpperCase() || 'GB';
          if (unit === 'GB') {
            data_amount = value; // Keep as GB
          } else if (unit === 'MB') {
            data_amount = value / 1024; // Convert MB to GB
          } else if (unit === 'KB') {
            data_amount = value / 1024 / 1024; // Convert KB to GB
          } else {
            data_amount = value; // Assume GB
          }
        }
      }
      // ✅ FIXED: Correctly map Roamify's 'days' field to database 'days' field
              const days = pkg.days || pkg.day || 0;
      const base_price = pkg.price || pkg.base_price || 0;
      const salePriceStr = roamifySalePrices[pkg.id || pkg.packageId || ''] ?? base_price.toString();
      const sale_price = salePriceStr === '' ? base_price : parseFloat(salePriceStr);
      const reseller_id = pkg.id || pkg.packageId || '';
      const region = pkg.region || '';

      // Frontend validation
      if (!name || !country_name || !country_code || !data_amount || !days || !base_price) {
        toast.error('Cannot save: Missing required fields.', { style: { color: 'black' } });
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
        days, // ✅ This now correctly maps to the database 'days' field
        base_price,
        sale_price,
        profit: sale_price - base_price,
        reseller_id: null, // Set to null since it's now a UUID foreign key
        region,
        show_on_frontend: true,
        location_slug: country_name === "Europe & United States" ? "" : country_code.toLowerCase(),
        homepage_order: 0,
        features: {
          packageId: reseller_id, // Store the real Roamify package ID here
          dataAmount: data_amount,
          days: days,
          price: base_price,
          currency: 'EUR',
          plan: 'data-only',
          activation: 'first-use',
          realRoamifyPackageId: reseller_id
        }
      };

      const headers = await getAdminHeaders('POST');
      const response = await fetch('/api/admin/save-package', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(packageData)
      });

      if (response.ok) {
        await fetchMyPackages();
        setError(''); // Clear any previous errors
        toast.success('Package saved successfully! Use "Save as Most Popular" to show in Most Popular section.', { style: { color: 'black' } });
      } else {
        const errorData = await response.json();
        const errorMessage = `Failed to save package: ${errorData.error || 'Unknown error'}`;
        toast.error(errorMessage, { style: { color: 'black' } });
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Error saving Roamify package:', err);
      const errorMessage = 'Failed to save package';
      toast.error(errorMessage, { style: { color: 'black' } });
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
        toast.error('Only Europe & United States packages can be saved as Most Popular. This package will be saved to its country-specific page instead.', { style: { color: 'black' } });
        // Automatically save it as a country-specific package instead
        await handleSaveRoamifyPackage(pkg);
        return;
      }

      const base_price = pkg.price || pkg.base_price || 0;
      const salePriceStr = roamifySalePrices[pkg.id || pkg.packageId || ''] ?? base_price.toString();
      const sale_price = salePriceStr === '' ? base_price : parseFloat(salePriceStr);

      // Parse data_amount as number in GB (backend now expects GB)
      let data_amount_raw = pkg.data || pkg.dataAmount || '';
      let data_amount = 0;
      if (typeof data_amount_raw === 'number') {
        // If it's from Roamify API and unit is MB, convert to GB
        if (pkg.dataUnit === 'MB') {
          data_amount = data_amount_raw / 1024; // Convert MB to GB
        } else {
          data_amount = data_amount_raw; // Assume already in GB
        }
      } else if (typeof data_amount_raw === 'string') {
        const match = data_amount_raw.match(/(\d+(?:\.\d+)?)(GB|MB|KB)?/i);
        if (match) {
          let value = parseFloat(match[1]);
          const unit = match[2]?.toUpperCase() || 'GB';
          if (unit === 'GB') {
            data_amount = value; // Keep as GB
          } else if (unit === 'MB') {
            data_amount = value / 1024; // Convert MB to GB
          } else if (unit === 'KB') {
            data_amount = value / 1024 / 1024; // Convert KB to GB
          } else {
            data_amount = value; // Assume GB
          }
        }
      }

      const packageData = {
        name: pkg.description || pkg.packageName || pkg.name || pkg.package || 'Unknown Package',
        country_name: pkg.country || pkg.country_name || '',
        country_code: pkg.country_code || '',
        data_amount,
        days: pkg.days || pkg.day || 0,
        base_price: base_price,
        sale_price: sale_price,
        profit: sale_price - base_price,
        reseller_id: null, // Set to null since it's now a UUID foreign key
        region: pkg.region || '',
        show_on_frontend: true,
        location_slug: "most-popular",
        homepage_order: 1,
        features: {
          packageId: pkg.id || pkg.packageId || '', // Store the real Roamify package ID here
          dataAmount: data_amount,
          days: pkg.days || pkg.day || 0,
          price: base_price,
          currency: 'EUR',
          plan: 'data-only',
          activation: 'first-use',
          realRoamifyPackageId: pkg.id || pkg.packageId || ''
        }
      };

      const headers = await getAdminHeaders('POST');
      const response = await fetch('/api/admin/save-package', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(packageData)
      });

      if (response.ok) {
        await fetchMyPackages();
        setError(''); // Clear any previous errors
        toast.success('Package saved to Most Popular section successfully!', { style: { color: 'black' } });
      } else {
        const errorData = await response.json();
        const errorMessage = `Failed to save package: ${errorData.error || 'Unknown error'}`;
        toast.error(errorMessage, { style: { color: 'black' } });
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Error saving as most popular:', err);
      const errorMessage = 'Failed to save package';
      toast.error(errorMessage, { style: { color: 'black' } });
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



  // Generate page numbers for pagination

  const handleRemoveDuplicates = async () => {
    if (!duplicateAnalysis.hasDuplicates) {
      toast.info('No duplicates found to remove', { style: { color: 'black' } });
      return;
    }

    setDeduplicating(true);
    try {
      const headers = await getAdminHeaders('POST');
      const response = await fetch('/api/admin/deduplicate-packages', {
        method: 'POST',
        headers,
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Successfully removed ${result.removedCount} duplicate packages`, { style: { color: 'black' } });
        // Refresh the packages list
        await fetchRoamifyPackages();
      } else {
        const errorData = await response.json();
        toast.error(`Failed to remove duplicates: ${errorData.error || 'Unknown error'}`, { style: { color: 'black' } });
      }
    } catch (err) {
      console.error('Error removing duplicates:', err);
      toast.error('Failed to remove duplicates', { style: { color: 'black' } });
    } finally {
      setDeduplicating(false);
    }
  };

  const handleSyncRoamifyPackages = async () => {
    setSyncing(true);
    try {
      const headers = await getAdminHeaders('POST');
      const response = await fetch('/api/sync/roamify-packages', {
        method: 'POST',
        headers,
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Successfully synced ${result.syncedCount} packages from Roamify API (${result.countries} countries)`, { style: { color: 'black' } });
        // Refresh the packages list
        await fetchRoamifyPackages();
      } else {
        const errorData = await response.json();
        toast.error(`Failed to sync packages: ${errorData.message || 'Unknown error'}`, { style: { color: 'black' } });
      }
    } catch (err) {
      console.error('Error syncing packages:', err);
      toast.error('Failed to sync packages', { style: { color: 'black' } });
    } finally {
      setSyncing(false);
    }
  };


  // Helper to build canonical country URL

  return (
    <div className="min-h-screen bg-[#4B0082] text-white">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="glass-medium p-4 flex justify-between items-center rounded-b-2xl mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
            <p className="text-gray-200">eSIM Package Management</p>
          </div>
          <button
            onClick={handleLogout}
            className="btn-glass bg-accent text-black px-4 py-2 rounded-xl"
          >
            Logout
          </button>
        </header>

        {error && (
          <div className="modal-glass p-4 rounded-2xl max-w-lg mx-auto mb-4 text-red-600 border border-red-400 bg-white">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="glass-light p-1 rounded-2xl mb-6 inline-flex">
          <button
            onClick={() => setActiveTab('myPackages')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'myPackages'
                ? 'bg-white/20 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            My eSIM Packages ({myPackages.length})
          </button>
          <button
            onClick={() => setActiveTab('roamifyPackages')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'roamifyPackages'
                ? 'bg-white/20 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            Roamify Packages ({roamifyPackages.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="w-full">
          {/* My Packages Only Panel */}
          {activeTab === 'myPackages' && (
          <div className="w-full">
          <div className="glass-light p-6 rounded-2xl shadow-none mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">My eSIM Packages Only ({myPackages.length})</h2>
            <p className="text-gray-200 mb-4">Manage your eSIM packages with edit and delete functionality</p>
            
            {/* Country Search */}
            <div className="mb-4">
              <label htmlFor="my-packages-country-search" className="block text-sm font-medium text-white">Search by Country:</label>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  id="my-packages-country-search"
                  placeholder="Search country..."
                  value={myPackagesCountrySearch}
                  onChange={e => setMyPackagesCountrySearch(e.target.value)}
                  className="input-glass w-full text-white placeholder-gray-300"
                />
                {myPackagesCountrySearch && (
                  <button
                    onClick={() => setMyPackagesCountrySearch('')}
                    className="btn-glass bg-white/20 text-white px-4 py-2 rounded-xl"
                  >
                    Clear
                  </button>
                )}
              </div>
              {myPackagesCountrySearch && (
                <p className="mt-1 text-sm text-gray-200">
                  Showing {myPackages.filter(pkg => pkg.country_name.toLowerCase().includes(myPackagesCountrySearch.toLowerCase())).length} of {myPackages.length} packages
                </p>
              )}
            </div>
            
            {loading ? (
              <div className="text-center text-xl">Loading packages...</div>
            ) : (
              <div className="glass p-4 rounded-2xl bg-black/20 w-full">
                <div className="overflow-auto max-h-[70vh]">
                  <table className="w-full text-left text-white bg-transparent table-auto">
                    <thead className="sticky top-0 bg-black/30">
                      <tr>
                        <th className="border-b border-white/20 px-3 py-3 text-xs font-medium uppercase tracking-wider min-w-[200px]">Package</th>
                        <th className="border-b border-white/20 px-3 py-3 text-xs font-medium uppercase tracking-wider min-w-[120px]">Country</th>
                        <th className="border-b border-white/20 px-3 py-3 text-xs font-medium uppercase tracking-wider min-w-[80px]">Code</th>
                        <th className="border-b border-white/20 px-3 py-3 text-xs font-medium uppercase tracking-wider min-w-[80px]">Data</th>
                        <th className="border-b border-white/20 px-3 py-3 text-xs font-medium uppercase tracking-wider min-w-[60px]">Days</th>
                        <th className="border-b border-white/20 px-3 py-3 text-xs font-medium uppercase tracking-wider min-w-[80px]">Base Price</th>
                        <th className="border-b border-white/20 px-3 py-3 text-xs font-medium uppercase tracking-wider min-w-[80px]">Sale Price</th>
                        <th className="border-b border-white/20 px-3 py-3 text-xs font-medium uppercase tracking-wider min-w-[70px]">Profit</th>
                        <th className="border-b border-white/20 px-3 py-3 text-xs font-medium uppercase tracking-wider min-w-[120px]">Actions</th>
                      </tr>
                    </thead>
                  <tbody>
                    {myPackages
                      .filter(pkg => 
                        !myPackagesCountrySearch || 
                        pkg.country_name.toLowerCase().includes(myPackagesCountrySearch.toLowerCase())
                      )
                      .map((pkg) => (
                      <tr key={pkg.id} className="hover:bg-white/5 border-b border-white/10 text-white">
                        <td className="px-3 py-4 whitespace-nowrap">
                          {editingMyPackage?.id === pkg.id ? (
                            <input
                              type="text"
                              value={editingMyPackage.name}
                              onChange={(e) => setEditingMyPackage({...editingMyPackage, name: e.target.value})}
                              className="w-48 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                            />
                          ) : (
                            <div className="text-sm font-medium text-white">
                              {pkg.name}
                            </div>
                          )}
                          <div className="text-sm text-gray-300">
                            ID: {pkg.id}
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          {editingMyPackage?.id === pkg.id ? (
                            <input
                              type="text"
                              value={editingMyPackage.country_name}
                              onChange={(e) => setEditingMyPackage({...editingMyPackage, country_name: e.target.value})}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                            />
                          ) : (
                            <span className="text-sm text-white">{pkg.country_name}</span>
                          )}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          {editingMyPackage?.id === pkg.id ? (
                            <input
                              type="text"
                              value={(editingMyPackage as any).country_code || ''}
                              onChange={(e) => setEditingMyPackage({...editingMyPackage, country_code: e.target.value} as any)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                              placeholder="e.g., DE"
                            />
                          ) : (
                            <span className="text-sm text-white">{(pkg as any).country_code || 'N/A'}</span>
                          )}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          {editingMyPackage?.id === pkg.id ? (
                            <input
                              type="number"
                              step="0.1"
                              value={editingMyPackage.data_amount.toFixed(1)}
                              onChange={(e) => setEditingMyPackage({...editingMyPackage, data_amount: Number(e.target.value)})}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                              placeholder="GB"
                            />
                          ) : (
                            <span className="text-sm text-white">{typeof (pkg.data_amount) === 'number' && !isNaN(pkg.data_amount) ? pkg.data_amount.toFixed(1) : '0.0'} GB</span>
                          )}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          {editingMyPackage?.id === pkg.id ? (
                            <input
                              type="number"
                              value={editingMyPackage.days}
                              onChange={(e) => setEditingMyPackage({...editingMyPackage, days: Number(e.target.value)})}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-black bg-white"
                            />
                          ) : (
                            <span className="text-sm text-white">{pkg.days}</span>
                          )}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          {editingMyPackage?.id === pkg.id ? (
                            <input
                              type="number"
                              step="0.01"
                              value={editingMyPackage.base_price}
                              onChange={(e) => setEditingMyPackage({...editingMyPackage, base_price: Number(e.target.value)})}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-black bg-white"
                            />
                          ) : (
                            <span className="text-sm text-white">${pkg.base_price}</span>
                          )}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          {editingMyPackage?.id === pkg.id ? (
                            <input
                              type="number"
                              step="0.01"
                              value={editingMyPackage.sale_price}
                              onChange={(e) => setEditingMyPackage({...editingMyPackage, sale_price: Number(e.target.value)})}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-bold text-black bg-white"
                            />
                          ) : (
                            <input
                              type="number"
                              step="0.01"
                              value={pkg.sale_price}
                              onChange={(e) => handlePriceChange(pkg.id, e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-bold text-black bg-white"
                            />
                          )}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          {editingMyPackage?.id === pkg.id ? (
                            <input
                              type="number"
                              step="0.01"
                              value={editingMyPackage.profit}
                              readOnly
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-100 text-black"
                            />
                          ) : (
                            <span className={`text-sm ${pkg.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>${typeof pkg.profit === 'number' && !isNaN(pkg.profit) ? pkg.profit.toFixed(2) : '0.00'}</span>
                          )}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                          {editingMyPackage?.id === pkg.id ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleSavePackage(editingMyPackage)}
                                disabled={saving}
                                className="text-blue-400 hover:text-blue-300 disabled:opacity-50"
                              >
                                {saving ? t('saving') : t('save')}
                              </button>
                              <button
                                onClick={() => setEditingMyPackage(null)}
                                className="text-gray-400 hover:text-gray-300"
                              >
                                {t('cancel')}
                              </button>
                            </div>
                          ) : (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditMyPackage(pkg)}
                                className="text-blue-400 hover:text-blue-300"
                              >
                                {t('edit')}
                              </button>
                              <button
                                onClick={() => handleDeleteMyPackage(pkg.id)}
                                disabled={deletingPackage === pkg.id}
                                className="text-red-400 hover:text-red-300 disabled:opacity-50"
                              >
                                {deletingPackage === pkg.id ? t('deleting') : t('delete')}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )}
            </div>
          </div>
          )}

          {/* Roamify Packages Panel */}
          {activeTab === 'roamifyPackages' && (
          <div className="w-full">
          <div className="glass-light p-6 rounded-2xl shadow-none mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Roamify Packages ({roamifyPackages.length})</h2>
            <p className="text-gray-200 mb-4">Available packages from Roamify API - Edit sale price and save to your inventory</p>
            
            {/* Duplicate Analysis Display */}
            {!roamifyLoading && (
              <div className="mb-4 p-4 bg-white/10 rounded-lg border border-white/20">
                <h3 className="text-lg font-semibold text-black mb-2">Package Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white p-3 rounded border">
                    <div className="font-medium text-gray-700">Total Packages</div>
                    <div className="text-2xl font-bold text-blue-600">{duplicateAnalysis.totalPackages}</div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="font-medium text-gray-700">Duplicate IDs</div>
                    <div className={`text-2xl font-bold ${duplicateAnalysis.hasDuplicates ? 'text-red-600' : 'text-green-600'}`}>{Object.keys(duplicateAnalysis.duplicateIds).length}</div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="font-medium text-gray-700">Duplicate Combinations</div>
                    <div className={`text-2xl font-bold ${duplicateAnalysis.hasDuplicates ? 'text-red-600' : 'text-green-600'}`}>{Object.keys(duplicateAnalysis.duplicateCombinations).length}</div>
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
                                  {packages.map((pkg: RoamifyPackage, index: number) => (
                                    <div key={index} className="text-sm text-red-700 ml-4">
                                      {index + 1}. {pkg.description || pkg.packageName || pkg.name || pkg.package} - {pkg.country || pkg.country_name} - {pkg.data_amount || pkg.dataAmount || pkg.data} - {pkg.days || pkg.day} days - ${pkg.base_price || pkg.price}
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
                                  {packages.map((pkg: RoamifyPackage, index: number) => (
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
              <label htmlFor="country-filter" className="block text-sm font-medium text-white">
                Filter by Country:
              </label>
              <input
                type="text"
                placeholder="Search country..."
                value={roamifyCountrySearch}
                onChange={e => setRoamifyCountrySearch(e.target.value)}
                className="mt-1 mb-2 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-gray-900 bg-white"
              />
              <select
                id="country-filter"
                value={selectedRoamifyCountry}
                onChange={(e) => setSelectedRoamifyCountry(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-gray-900 bg-white"
              >
                <option value="">All Countries ({roamifyCountries.length})</option>
                {roamifyCountries.filter(c => !!c && c.toLowerCase().includes(roamifyCountrySearch.toLowerCase())).map(country => (
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
                <p className="mt-1 text-sm text-gray-300">
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
              <p className="mt-1 text-sm text-gray-300">
                This will fetch fresh data directly from Roamify API and sync to database
              </p>
            </div>

            {/* Roamify Packages Table */}
            {roamifyLoading ? (
              <div className="text-center text-xl text-white mt-8">Loading Roamify packages...</div>
            ) : roamifyPackages.length === 0 ? (
              <div className="text-center text-xl text-white mt-8">
                <p>No packages loaded from database.</p>
                <p className="text-sm text-gray-300 mt-2">Click "Sync from Roamify API" to fetch packages.</p>
              </div>
            ) : filteredRoamifyPackages.length === 0 ? (
              <div className="text-center text-xl text-white mt-8">
                <p>No packages found for country: "{selectedRoamifyCountry}"</p>
                <p className="text-sm text-gray-300 mt-2">Try selecting "All Countries" or a different country.</p>
              </div>
            ) : (
              <div className="glass p-4 rounded-2xl bg-black/20 mt-6 w-full">
                <div className="overflow-auto max-h-[70vh]">
                  <table className="w-full text-left text-white bg-transparent table-auto">
                    <thead className="sticky top-0 bg-black/30">
                      <tr>
                        <th className="border-b border-white/20 px-3 py-3 text-xs font-medium uppercase tracking-wider min-w-[200px]">Package</th>
                        <th className="border-b border-white/20 px-3 py-3 text-xs font-medium uppercase tracking-wider min-w-[120px]">Country</th>
                        <th className="border-b border-white/20 px-3 py-3 text-xs font-medium uppercase tracking-wider min-w-[80px]">Code</th>
                        <th className="border-b border-white/20 px-3 py-3 text-xs font-medium uppercase tracking-wider min-w-[80px]">Data</th>
                        <th className="border-b border-white/20 px-3 py-3 text-xs font-medium uppercase tracking-wider min-w-[60px]">Days</th>
                        <th className="border-b border-white/20 px-3 py-3 text-xs font-medium uppercase tracking-wider min-w-[80px]">Base Price</th>
                        <th className="border-b border-white/20 px-3 py-3 text-xs font-medium uppercase tracking-wider min-w-[80px]">Sale Price</th>
                        <th className="border-b border-white/20 px-3 py-3 text-xs font-medium uppercase tracking-wider min-w-[70px]">Profit</th>
                        <th className="border-b border-white/20 px-3 py-3 text-xs font-medium uppercase tracking-wider min-w-[150px]">Actions</th>
                      </tr>
                    </thead>
                  <tbody>
                    {filteredRoamifyPackages.map((pkg) => {
                      const packageId = pkg.id || pkg.packageId || '';
                      const isDuplicateId = packageId ? duplicateAnalysis.duplicateIds[packageId] : undefined;
                      const combinationKey = `${pkg.country || pkg.country_name || 'unknown'}|${pkg.data || pkg.dataAmount || 'unknown'}|${pkg.days || pkg.day || 'unknown'}|${pkg.price || pkg.base_price || 'unknown'}`;
                      const isDuplicateCombo = combinationKey ? duplicateAnalysis.duplicateCombinations[combinationKey] : undefined;
                      
                      return (
                        <tr 
                          key={pkg.id || pkg.packageId} 
                          className={`hover:bg-white/5 border-b border-white/10 text-white ${
                            isDuplicateId || isDuplicateCombo ? 'bg-red-900/20' : ''
                          }`}
                        >
                          <td className="px-3 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">
                              {pkg.description || pkg.packageName || pkg.name || pkg.package || 'Unknown Package'}
                            </div>
                            <div className="text-sm text-gray-300">
                              ID: {pkg.id || pkg.packageId || 'N/A'}
                            </div>
                            {isDuplicateId && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1">
                                Duplicate ID
                              </span>
                            )}
                            {isDuplicateCombo && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 mt-1">
                                Duplicate Combo
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <span className="text-sm text-white">{pkg.country || pkg.country_name || 'N/A'}</span>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <span className="text-sm text-white">{pkg.country_code || 'N/A'}</span>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <span className="text-sm text-white">
                              {pkg.data || (typeof pkg.dataAmount === 'number' ? pkg.dataAmount.toFixed(1) : 'N/A')} GB
                            </span>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <span className="text-sm text-white">
                              {pkg.days || pkg.day || 'N/A'}
                            </span>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <span className="text-sm text-white">
                              ${pkg.price || pkg.base_price || '0.00'}
                            </span>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              step="0.01"
                              value={roamifySalePrices[pkg.id || pkg.packageId || ''] || ''}
                              onChange={(e) => setRoamifySalePrices(prev => ({
                                ...prev,
                                [pkg.id || pkg.packageId || '']: e.target.value
                              }))}
                              placeholder={(pkg.price || pkg.base_price || 0).toString()}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-bold text-black bg-white"
                            />
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <span className={`text-sm ${
                              (parseFloat(roamifySalePrices[pkg.id || pkg.packageId || ''] || '0') - (pkg.price || pkg.base_price || 0)) > 0 
                                ? 'text-green-400' 
                                : 'text-red-400'
                            }`}>
                              ${((parseFloat(roamifySalePrices[pkg.id || pkg.packageId || ''] || '0') || (pkg.price || pkg.base_price || 0)) - (pkg.price || pkg.base_price || 0)).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleSaveRoamifyPackage(pkg)}
                                disabled={updating === (pkg.id || pkg.packageId)}
                                className="text-blue-400 hover:text-blue-300 disabled:opacity-50"
                              >
                                {updating === (pkg.id || pkg.packageId) ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={() => handleSaveAsMostPopular(pkg)}
                                disabled={updating === (pkg.id || pkg.packageId)}
                                className="text-green-400 hover:text-green-300 disabled:opacity-50"
                              >
                                Save as Most Popular
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </div>
            )}
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel; 