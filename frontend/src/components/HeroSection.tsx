import React, { useState, useEffect, useCallback } from 'react';
import { DownloadCloud } from "lucide-react";
import CountrySearch from "./CountrySearch";
import { Country } from "@/data/countries";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { countrySlug } from '../lib/utils';

// Custom 5G chip SVG
const FiveGChipIcon = () => {
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="white"/>
        <path d="M19 15L19.5 17L22 17.5L19.5 18L19 20L18.5 18L16 17.5L18.5 17L19 15Z" fill="white"/>
        <path d="M5 15L5.5 17L8 17.5L5.5 18L5 20L4.5 18L2 17.5L4.5 17L5 15Z" fill="white"/>
      </svg>
    </span>
  );
};

// Custom World Globe Icon
const GlobeNetworkIcon = () => {
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg shadow-lg">
      <svg width="20" height="20" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Ocean background */}
        <circle cx="22" cy="22" r="20" fill="url(#oceanGradient)" />
        
        {/* Land masses */}
        <g fill="url(#landGradient)">
          {/* North America */}
          <path d="M8 12c2-1 4-1 6 0 1 1 2 2 2 4 0 1-1 2-2 3-1 1-3 1-4 0-1-1-2-2-2-4 0-2 1-3 2-3z" />
          
          {/* South America */}
          <path d="M16 26c1-2 3-3 5-2 1 1 2 2 2 4 0 1-1 2-2 3-2 1-4 1-5-1-1-2-1-4 0-4z" />
          
          {/* Europe */}
          <path d="M24 12c1 0 2 1 2 2 0 1-1 2-2 2-1 0-2-1-2-2 0-1 1-2 2-2z" />
          
          {/* Africa */}
          <path d="M26 18c1-1 3-1 4 0 1 1 1 3 0 4-1 1-3 1-4 0-1-1-1-3 0-4z" />
          
          {/* Asia */}
          <path d="M28 14c2 0 4 1 4 3 0 2-2 3-4 3-2 0-4-1-4-3 0-2 2-3 4-3z" />
          
          {/* Australia */}
          <path d="M32 24c1 0 2 1 2 2 0 1-1 2-2 2-1 0-2-1-2-2 0-1 1-2 2-2z" />
        </g>
        
        {/* Grid lines */}
        <g stroke="#fff" strokeWidth="0.5" strokeOpacity="0.2">
          {/* Latitude lines */}
          <path d="M8 22h28" />
          <path d="M12 16h20" />
          <path d="M14 28h16" />
          
          {/* Longitude lines */}
          <path d="M22 8v28" />
          <path d="M16 12v20" />
          <path d="M28 12v20" />
        </g>
        
        {/* Globe highlights */}
        <ellipse cx="22" cy="22" rx="14" ry="7" fill="#fff" fillOpacity="0.1" />
        <ellipse cx="22" cy="22" rx="10" ry="18" fill="#fff" fillOpacity="0.05" />
        
        <defs>
          {/* Ocean gradient - deep blue to lighter blue */}
          <linearGradient id="oceanGradient" x1="2" y1="2" x2="42" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1B4B8C" />
            <stop offset="0.5" stopColor="#2B6CB0" />
            <stop offset="1" stopColor="#4299E1" />
          </linearGradient>
          
          {/* Land gradient - forest green to lighter green */}
          <linearGradient id="landGradient" x1="2" y1="2" x2="42" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2F855A" />
            <stop offset="0.5" stopColor="#38A169" />
            <stop offset="1" stopColor="#48BB78" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
};

const HeroSection = () => {
  const { t } = useLanguage();
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  // Slideshow images
  const slides = [
    "/images/slide1.jpg",
    "/images/slide2.jpg", 
    "/images/slide3.jpg"
  ];

  // Preload images for smoother transitions - OPTIMIZED
  useEffect(() => {
    // Use requestIdleCallback for better performance
    const preloadImages = () => {
      slides.forEach((slide) => {
        const img = new Image();
        img.src = slide;
      });
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(preloadImages);
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      setTimeout(preloadImages, 100);
    }
  }, []);

  // Auto-advance slideshow - OPTIMIZED with longer interval and better cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Increased from 3000ms to 5000ms for better performance

    return () => {
      clearInterval(interval);
    };
  }, [slides.length]);

  const handleCountrySelect = useCallback((country: Country) => {
    setSelectedCountry(country);
    // Navigate to country page instead of packages page
    navigate(`/country/${countrySlug(country.name.en)}`);
  }, [navigate]);

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {t('hero_title_1')}
              </span>
              <br />
              <span className="text-white">
                {t('hero_title_2')}
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto lg:mx-0">
              {t('hero_subtitle')}
            </p>

            {/* Country Search */}
            <div className="mb-8">
              <CountrySearch
                countries={countries}
                onCountrySelect={handleCountrySelect}
                placeholder={t('search_countries')}
              />
            </div>

            {/* Features */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                {t('hero_feature_1')}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                {t('hero_feature_2')}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                {t('hero_feature_3')}
              </div>
            </div>
          </div>

          {/* Right Column - Phone Mockup */}
          <div className="relative flex flex-col items-center justify-center flex-1 sm:mt-0">
            {/* Professional iPhone X-style SVG mockup with phone2.jpg inside the screen, no animation */}
            <svg
              viewBox="0 0 340 660"
              className="block w-48 h-96 sm:w-64 sm:h-[28rem] md:w-[270px] md:h-[540px]"
              style={{ maxWidth: '90vw' }}
            >
              <defs>
                {/* Gradient for phone body */}
                <linearGradient id="phoneBodyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#b39ddb" />
                  <stop offset="100%" stop-color="#7c3aed" />
                </linearGradient>
                {/* Inner shadow for screen */}
                <filter id="innerShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feOffset dx="0" dy="2" />
                  <feGaussianBlur stdDeviation="6" result="offset-blur" />
                  <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
                  <feFlood flood-color="#000" flood-opacity="0.10" result="color" />
                  <feComposite operator="in" in="color" in2="inverse" result="shadow" />
                  <feComposite operator="over" in="shadow" in2="SourceGraphic" />
                </filter>
                {/* Clip for screen */}
                <clipPath id="phoneScreenClip">
                  <rect x="40" y="60" width="260" height="540" rx="32" />
                </clipPath>
              </defs>
              {/* Phone drop shadow */}
              <ellipse cx="170" cy="630" rx="90" ry="18" fill="#000" opacity="0.10" />
              {/* iPhone body with gradient */}
              <rect x="20" y="20" width="300" height="600" rx="56" fill="url(#phoneBodyGradient)" stroke="#4b0082" strokeWidth="7" />
              {/* Notch */}
              <rect x="120" y="32" width="100" height="18" rx="9" fill="#4b0082" />
              {/* Screen area with inner shadow */}
              <rect x="40" y="60" width="260" height="540" rx="32" fill="#ede9fe" filter="url(#innerShadow)" />
              {/* Image inside screen */}
              <image
                href="/images/phone2.jpg"
                x="40" y="60" width="260" height="540"
                style={{ objectFit: 'cover' }}
                clipPath="url(#phoneScreenClip)"
                preserveAspectRatio="xMidYMid slice"
              />
              {/* Home indicator */}
              <rect x="120" y="610" width="100" height="10" rx="5" fill="#4b0082" opacity="0.25" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;