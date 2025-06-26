import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Translations {
  [key: string]: {
    al: string;
    en: string;
  };
}

const translations: Translations = {
  // Hero Section
  hero_badge: { al: "🌍 I besuar nga 5M+ udhëtarë në botë", en: "🌍 Trusted by 5M+ travelers worldwide" },
  hero_title_1: { al: "Qëndro i Lidhur", en: "Stay Connected" },
  hero_title_2: { al: "Kudo", en: "Anywhere" },
  hero_description: { al: "Merr lidhjen e të dhënave menjëherë në 200+ vende me planet tona premium eSIM. Pa karta SIM fizike, pa tarifa roaming, pa telashe. Vetëm lidhje e qetë.", en: "Get instant data connectivity in 200+ countries with our premium eSIM plans. No physical SIM cards, no roaming fees, no hassle. Just seamless connection." },
  hero_cta_main: { al: "SHIKO PAKETAT", en: "VIEW PACKAGES" },
  hero_cta_secondary: { al: "Si Funksionon", en: "How It Works" },
  hero_main_title: { al: "Lidhu menjëherë me 4G/5G, pa kartë – vetëm me e-SimFly!", en: "Connect instantly with 4G/5G, no card needed – only with e-SimFly!" },
  hero_activate_package: { al: "Aktivizo Paketën", en: "Activate Package" },

  // Navigation
  back_to_english: { al: "English", en: "Shqip" },
  packages: { al: "Paketat", en: "Packages" },
  how_it_works: { al: "Si Funksionon", en: "How It Works" },
  about_us: { al: "Rreth Nesh", en: "About Us" },
  support: { al: "Mbështetja", en: "Support" },
  check_balance: { al: "Kontrollo Balancin", en: "Check Balance" },

  // Features Section
  why_choose_esim: { al: "Pse të Zgjidhni eSIM-in Tonë", en: "Why Choose Our eSIM" },
  instant_activation: { al: "Aktivizim i Menjëhershëm", en: "Instant Activation" },
  global_coverage: { al: "Mbulim Global", en: "Global Coverage" },
  cost_effective: { al: "Kosto Efektive", en: "Cost Effective" },
  secure_reliable: { al: "I Sigurt & i Besueshëm", en: "Secure & Reliable" },

  // Coverage Section
  coverage_title: { al: "Mbulim Global i Rrjetit", en: "Global Network Coverage" },
  coverage_description: { al: "Qëndroni të lidhur në më shumë se 200 vende me partneritetin tonë të rrjetit premium.", en: "Stay connected across 200+ countries with our premium network partnerships." },
  
  // Package Selection
  select_destination: { al: "Zgjidhni Destinacionin", en: "Select Destination" },
  choose_plan: { al: "Zgjidhni Planin", en: "Choose Plan" },
  most_popular: { al: "Më i Popullarizuar", en: "Most Popular" },
  buy_now: { al: "BLEJ TANI", en: "BUY NOW" },

  // Support
  need_help: { al: "Ju Nevojitet Ndihmë?", en: "Need Help?" },
  contact_support: { al: "Kontaktoni Mbështetjen", en: "Contact Support" },
  faq_title: { al: "Pyetje të Shpeshta", en: "Frequently Asked Questions" },

  // Checkout
  checkout: { al: "Blerja", en: "Checkout" },
  payment_details: { al: "Detajet e Pagesës", en: "Payment Details" },
  complete_purchase: { al: "Përfundo Blerjen", en: "Complete Purchase" },
  card_number: { al: "Numri i Kartës *", en: "Card Number *" },
  expiry_date: { al: "Data e Skadimit *", en: "Expiry Date *" },
  cvv: { al: "CVV *", en: "CVV *" },
  cardholder_name: { al: "Emri i Mbajtësit të Kartës *", en: "Cardholder Name *" },

  // About Us
  about_title: { al: "Rreth Nesh", en: "About Us" },
  our_mission: { al: "Misioni Ynë", en: "Our Mission" },
  our_values: { al: "Vlerat Tona", en: "Our Values" },
  our_team: { al: "Ekipi Ynë", en: "Our Team" },

  // WhatsApp
  contact_whatsapp: { al: "Na Kontaktoni në WhatsApp", en: "Contact us on WhatsApp" },
  whatsapp_message: { al: "Përshëndetje! Kam nevojë për ndihmë me eSIM.", en: "Hello! I need help with eSIM." },

  // Packages Section
  packages_section_title: { al: "Paketat eSIM për Çdo Destinacion", en: "eSIM Packages for Every Destination" },
  packages_section_desc: { al: "Zgjidhni nga paketat tona të ndryshme të lidhjes për çdo vend që vizitoni", en: "Choose from our various connectivity packages for every country you visit" },
  esim_plans_for: { al: "Planet eSIM për", en: "eSIM Plans for" },

  // About Us Page
  about_hero_title: { al: "Rreth Nesh", en: "About Us" },
  about_hero_desc: { al: "Ne jemi liderë në teknologjinë eSIM, duke ofruar lidhje të shpejtë dhe të besueshme në mbarë botën", en: "We are leaders in eSIM technology, providing fast and reliable connectivity worldwide" },
  about_global_impact_title: { al: "Ndikimi Ynë Global", en: "Our Global Impact" },
  about_global_impact_desc: { al: "Ne kemi ndihmuar miliona udhëtarë të qëndrojnë të lidhur në mbarë botën", en: "We have helped millions of travelers stay connected worldwide" },
  about_global_impact_coverage: { al: "200+ Vende të Mbuluara", en: "200+ Countries Covered" },

  // Features Section
  features_desc: { al: "Zgjidhni eSIM-in tonë për një përvojë udhëtimi pa telashe me lidhje të shpejtë dhe të besueshme", en: "Choose our eSIM for a hassle-free travel experience with fast and reliable connectivity" },
  features_cta_title: { al: "Gati për të Filluar?", en: "Ready to Get Started?" },
  features_cta_desc: { al: "Zgjidhni planin tuaj eSIM tani dhe filloni të gëzoni internetin e shpejtë në çdo destinacion", en: "Choose your eSIM plan now and start enjoying high-speed internet at every destination" },
  features_cta_button: { al: "SHIKO PAKETAT", en: "VIEW PACKAGES" },
  feature_lightning_fast: { al: "Shpejtësi e Lartë", en: "Lightning Fast" },
  feature_high_speed_networks: { al: "Rrjetet më të shpejta 4G/5G", en: "Fastest 4G/5G networks" },
  feature_get_connected: { al: "Lidhuni menjëherë pas blerjes", en: "Get connected instantly after purchase" },
  feature_works_in_countries: { al: "Funksionon në 200+ vende", en: "Works in 200+ countries" },

  // FAQ Section
  faq_desc: { al: "Përgjigjet për pyetjet më të shpeshta rreth eSIM-it tonë", en: "Answers to the most common questions about our eSIM" },
  faq_still_questions: { al: "Ende keni pyetje?", en: "Still have questions?" },
  faq_still_questions_desc: { al: "Ekipi ynë i mbështetjes është gjithmonë këtu për të ndihmuar", en: "Our support team is always here to help" },
  faq_live_chat: { al: "Bisedë Live", en: "Live Chat" },
  faq_email_support: { al: "Email Mbështetje", en: "Email Support" },

  // About Us - Innovation Section
  about_innovation_title: { al: "Inovacioni", en: "Innovation" },
  about_innovation_desc: { al: "Ne jemi të përkushtuar ndaj inovacionit të vazhdueshëm për të sjellë zgjidhje të reja për udhëtarët.", en: "We are committed to continuous innovation to bring new solutions for travelers." },

  // About Us - Technology Section
  about_tech_title: { al: "Teknologjia", en: "Technology" },
  about_tech_desc: { al: "Teknologjia jonë eSIM është ndërtuar për shpejtësi, siguri dhe lehtësi përdorimi.", en: "Our eSIM technology is built for speed, security, and ease of use." },
  about_tech_launched: { al: "Lançuar në 2025", en: "Launched in 2025" },

  // About Us - Vision Section
  about_vision_title: { al: "Vizioni Ynë", en: "Our Vision" },
  about_vision_desc: { al: "Të mundësojmë lidhje të pakufizuar për çdo udhëtar, kudo në botë.", en: "To enable unlimited connectivity for every traveler, anywhere in the world." },
  about_vision_quote: { al: "Lidhja është liria për të eksploruar botën pa kufij.", en: "Connectivity is the freedom to explore the world without limits." },

  // Packages Section
  select_destination_desc: { al: "Zgjidhni destinacionin tuaj për të parë paketat e disponueshme.", en: "Select your destination to see available packages." },

  // eSIM Compatibility
  esim_compatibility_section_title: { al: "Shiko këtu nëse pajisja jote e suporton eSIM-in!", en: "Check here if your device supports eSIM!" },
  esim_compat_subtitle: { al: "A është telefoni juaj gati për eSIM?", en: "Is your phone ready for eSIM?" },
  esim_compat_instructions: { al: "📱 Shtypni *#06# në telefonin tuaj. Nëse shfaqet një numër EID, pajisja juaj e suporton eSIM-in.", en: "📱 Dial *#06# on your phone. If an EID number appears, your device supports eSIM." },
  esim_compatibility_title_1: { al: "Kontrolloni pajtueshmërinë e pajisjes suaj me eSIM duke shtypur *#06#", en: "Check your device's eSIM compatibility by dialing *#06#" },
  esim_compatibility_title_2: { al: "Shikoni për EID ose eSIM në listën e rezultateve", en: "Look for EID or eSIM in the results list" },
  esim_compatibility_desc_1: { al: "Nëse shfaqet një [EID], pajisja juaj mbështet eSIM.", en: "If an [EID] appears, your device supports eSIM." },
  esim_compatibility_desc_2: { al: "Nëse nuk shfaqet, pajisja juaj mund të mos mbështesë eSIM.", en: "If not, your device may not support eSIM." },
  esim_compatibility_aria: { al: "Kontrolloni pajtueshmërinë e eSIM", en: "Check eSIM compatibility" },
  esim_compatibility_alt: { al: "Kontrolli i pajtueshmërisë së eSIM", en: "eSIM compatibility check" },

  // Buttons
  learn_more: { al: "Mëso më shumë", en: "Learn More" },
  see_packages: { al: "Shiko Paketat", en: "See Packages" },
  learn_more_aria: { al: "Mëso më shumë rreth eSIM", en: "Learn more about eSIM" },
  see_packages_aria: { al: "Shiko paketat eSIM", en: "See eSIM packages" },

  // About Us Stats
  about_stat_customers: { al: "Klientë të Kënaqur", en: "Happy Customers" },
  about_stat_activation: { al: "Aktivizim", en: "Activation" },
  about_stat_support: { al: "Mbështetje", en: "Support" },
  about_stat_uptime: { al: "Kohë Pune", en: "Uptime" },

  // Stat Values
  stat_0_1s: { al: "0.1s", en: "0.1s" },
  stat_24_7: { al: "24/7", en: "24/7" },
  stat_99_9: { al: "99.9%", en: "99.9%" },

  // Checkout Form Fields
  email_address: { al: "Adresa e Emailit *", en: "Email Address *" },
  email_placeholder: { al: "shkruani adresën tuaj të emailit", en: "enter your email address" },
  card_number_placeholder: { al: "1234 5678 9012 3456", en: "1234 5678 9012 3456" },
  expiry_date_placeholder: { al: "MM/YY", en: "MM/YY" },
  cvv_placeholder: { al: "123", en: "123" },
  cardholder_name_placeholder: { al: "Emri i plotë siç shfaqet në kartë", en: "Full name as shown on card" },
  first_name: { al: "Emri *", en: "First Name *" },
  first_name_placeholder: { al: "Emri juaj", en: "Your first name" },
  last_name: { al: "Mbiemri *", en: "Last Name *" },
  last_name_placeholder: { al: "Mbiemri juaj", en: "Your last name" },
  secure_encryption: { al: "Enkriptim i Sigurt", en: "Secure Encryption" },
  pci_compliant: { al: "Në Pajtim me PCI", en: "PCI Compliant" },

  // Post-purchase Signup
  create_account_title: { al: "Krijo Llogarinë Tuaj", en: "Create Your Account" },
  create_account_description: { al: "Krijo një llogari për të menaxhuar eSIM-in tuaj dhe për të gjurmuar porositë", en: "Create an account to manage your eSIM and track orders" },
  password: { al: "Fjalëkalimi", en: "Password" },
  password_placeholder: { al: "Zgjidhni një fjalëkalim të sigurt", en: "Choose a secure password" },
  confirm_password: { al: "Konfirmo Fjalëkalimin", en: "Confirm Password" },
  confirm_password_placeholder: { al: "Përsëritni fjalëkalimin", en: "Repeat your password" },
  passwords_dont_match: { al: "Fjalëkalimet nuk përputhen", en: "Passwords don't match" },
  password_too_short: { al: "Fjalëkalimi duhet të ketë të paktën 8 karaktere", en: "Password must be at least 8 characters" },
  create_account: { al: "Krijo Llogarinë", en: "Create Account" },
  skip_for_now: { al: "Anashkalo për Tani", en: "Skip for Now" },

  // Checkout Messages
  payment_integration_coming_soon: {
    al: "Integrimi i pagesës do të jetë i disponueshëm së shpejti",
    en: "Payment integration coming soon"
  },
  order_successful: {
    al: "Porosia juaj u krye me sukses!",
    en: "Your order has been placed successfully!"
  },
  order_failed: {
    al: "Ka ndodhur një gabim gjatë procesimit të porosisë. Ju lutemi provoni përsëri.",
    en: "An error occurred while processing your order. Please try again."
  },
  signup_failed: {
    al: "Ka ndodhur një gabim gjatë krijimit të llogarisë. Ju lutemi provoni përsëri.",
    en: "An error occurred while creating your account. Please try again."
  },

  // About Us Page - Additional translations
  about_platform_description: {
    al: "e-SIM Fly është një platformë moderne, e krijuar në vitin 2025, që sjell teknologjinë më të fundit të eSIM për përdoruesit e telefonisë mobile anembanë botës. Me ne, nuk ke më nevojë për karta fizike SIM – aktivizo internetin direkt në pajisjen tënde, në vetëm pak klikime.",
    en: "e-SIM Fly is a modern platform, created in 2025, bringing the latest eSIM technology to mobile phone users worldwide. With us, you no longer need physical SIM cards – activate the internet directly on your device in just a few clicks."
  },
  about_platform_services: {
    al: "Ne ofrojmë internet të shpejtë, të sigurt dhe të besueshëm, kudo që të ndodhesh – për udhëtarët, aventurierët, profesionistët apo këdo që ka nevojë për lidhje të menjëhershme dhe pa komplikime.",
    en: "We provide fast, secure, and reliable internet, wherever you are – for travelers, adventurers, professionals, or anyone who needs instant and hassle-free connectivity."
  },
  about_platform_vision: {
    al: "Me e-SIM Fly, ti udhëton lirshëm dhe qëndron gjithmonë i lidhur. Teknologji e zgjuar për një botë pa kufij.",
    en: "With e-SIM Fly, you travel freely and stay always connected. Smart technology for a borderless world."
  },

  // Features Section - Additional translations
  feature_global_coverage_title: { al: "Mbulim Global", en: "Global Coverage" },
  feature_global_coverage_desc: {
    al: "Qëndroni të lidhur në 200+ vende dhe territore në mbarë botën me partneritetet tona të gjera të rrjetit.",
    en: "Stay connected in 200+ countries and territories worldwide with our extensive network partnerships."
  },
  feature_instant_activation_title: { al: "Aktivizim i Menjëhershëm", en: "Instant Activation" },
  feature_instant_activation_desc: {
    al: "Lidhuni online menjëherë pas blerjes. Pa pritje, pa dërgim fizik të kërkuar.",
    en: "Get online instantly after purchase. No waiting, no physical shipping required."
  },
  feature_no_hidden_fees_title: { al: "Pa Tarifa të Fshehura", en: "No Hidden Fees" },
  feature_no_hidden_fees_desc: {
    al: "Çmim transparent pa taksa surprizë, tarifa roaming, ose angazhime mujore.",
    en: "Transparent pricing with no surprise taxes, roaming fees, or monthly commitments."
  },
  feature_secure_reliable_title: { al: "E Sigurt & e Besueshme", en: "Secure & Reliable" },
  feature_secure_reliable_desc: {
    al: "Siguri në nivel ndërmarrjesh me garanci 99.9% kohe pune rrjeti për qetësi mendore.",
    en: "Enterprise-level security with 99.9% network uptime guarantee for peace of mind."
  },
  feature_multiple_profiles_title: { al: "Profile të Shumta", en: "Multiple Profiles" },
  feature_multiple_profiles_desc: {
    al: "Ruani profile të shumta eSIM në pajisjen tuaj dhe ndërroni mes tyre lehtësisht.",
    en: "Store multiple eSIM profiles on your device and switch between them easily."
  },
  feature_support_title: { al: "Mbështetje 24/7", en: "24/7 Support" },
  feature_support_desc: {
    al: "Ekipi ynë ekspert i mbështetjes është i disponueshëm 24 orë për t'ju mbajtur të lidhur.",
    en: "Our expert support team is available 24/7 to keep you connected."
  },

  // Country Search - Additional translations
  european_packages_info: {
    al: "Nëse planifikoni të vizitoni disa vende të Europës, rekomandojmë blerjen e paketës për gjithë Europën; ndërsa nëse do të udhëtoni vetëm në një shtet, mund të kërkoni emrin e tij dhe të blini paketën përkatëse.",
    en: "If you plan to visit several European countries, we recommend purchasing the Europe-wide package; while if you're only traveling to one country, you can search for its name and buy the corresponding package."
  },

  // Most Popular Packages Section
  most_popular_title: { al: "Paketa Më e Popullarizuar e Europës", en: "Most Popular Package Europe" },
  most_popular_description: { al: "Thjesht kliko mbi një paketë dhe shijo internetin 4G/5G kudo në Europë dhe Amerike!", en: "Simply click on a package and enjoy 4G/5G internet anywhere in Europe and America!" },
  europe: { al: "Europa", en: "Europe" },
  unlimited_data: { al: "TË DHËNA TË PAKUFSHUARA", en: "UNLIMITED DATA" },
  gb_internet: { al: "GB Internet", en: "GB Internet" },
  days: { al: "Ditë", en: "Days" },
  coverage_39_countries: { al: "Mbulim 39 Vende", en: "Coverage 39 Countries" },
  albania_usa_included: { al: "Shqipëria dhe SHBA përfshirë!", en: "Albania and USA included!" },
  activate: { al: "Aktivizo", en: "Activate" },
  no_packages_available: { al: "Nuk ka paketa të disponueshme për momentin.", en: "No packages available at the moment." },

  // Loading
  loading: { al: "Duke ngarkuar...", en: "Loading..." },

  // Network and Technology
  network_5g: { al: "Rrjeti 5G", en: "5G Network" },
  global_world: { al: "Bota Globale", en: "Global World" },
  slide: { al: "Slide", en: "Slide" },

  // Testimonials Section
  testimonials_title: { al: "Çfarë Thonë Klientët Tanë", en: "What Our Customers Say" },

  // Trust Section
  payment_protected: { al: "Pagesa juaj është e mbrojtur dhe e enkriptuar.", en: "Your payment is protected and encrypted." },
  trusted_partners: { al: "Ne bashkëpunojmë me ofrues të besueshëm pagesash.", en: "We partner with trusted payment providers." },

  // KudoSim Section
  kudosim_title: { al: "Rrini të lidhur kudo që të shkoni me eSimFly: eSIM me shpejtësi 4G/5G", en: "Stay connected wherever you go with eSimFly: eSIM with 4G/5G speed" },
  kudosim_feature_1_title: { al: "Lidhje Globale", en: "Global Connectivity" },
  kudosim_feature_1_desc: { al: "Me eSimFly, eksploroni çdo kontinent pa u ndalur. Qofshin udhëtimet në Europë, Amerikën e Veriut, Azinë, apo Afrikën, jini gjithmonë të lidhur me internet.", en: "With eSimFly, explore every continent without stopping. Whether traveling in Europe, North America, Asia, or Africa, always stay connected to the internet." },
  kudosim_feature_2_title: { al: "Pa Tarifa Roaming", en: "No Roaming Fees" },
  kudosim_feature_2_desc: { al: "Udhëtoni pa shqetësime me eSimFly. Harroni faturat e papritura të roamingut dhe shijoni lirinë e vërtetë të udhëtimit.", en: "Travel worry-free with eSimFly. Forget unexpected roaming bills and enjoy true travel freedom." },
  kudosim_feature_3_title: { al: "SIM Kartela Aktive", en: "Active SIM Card" },
  kudosim_feature_3_desc: { al: "Përdorni eSimFly dhe mbajeni kartën tuaj fizike aktive. Pranoni thirrje dhe SMS ndërkohë që shijoni shërbimet e internetit nga eSIM.", en: "Use eSimFly and keep your physical SIM card active. Receive calls and SMS while enjoying internet services from eSIM." },
  kudosim_feature_4_title: { al: "Aktivizim i Menjëhershëm", en: "Instant Activation" },
  kudosim_feature_4_desc: { al: "Hapni botën tuaj me një klikim. Aktivizimi i eSimFly është i thjeshtë dhe i menjëhershëm pas pagesës, pa procedura të mërzitshme.", en: "Open your world with one click. eSimFly activation is simple and instant after payment, with no tedious procedures." },

  // Payment Cards Section
  payment_cards_title: { al: "Paguaj sigurtë me kartelë", en: "Pay securely by card" },

  // Logo Slider Section
  logo_slider_title: { al: "eSimFly.al është i vetmi operator eSIM në Ballkan me marrëveshje direkte me partnerët ndërkombëtarë.", en: "eSimFly.al is the only eSIM operator in the Balkans with direct agreements with international partners." },

  // New translations
  search_esim_packages: { al: 'Kërko Paketat eSIM', en: 'Search eSIM Packages' },
  find_the_perfect_package: { al: 'Gjeni paketën perfekte eSIM për destinacionin tuaj', en: 'Find the perfect eSIM package for your destination' },
  enter_country_name_placeholder: { al: 'Shkruani emrin e vendit (p.sh., Gjermani, Francë, Spanjë)', en: 'Enter country name (e.g., Germany, France, Spain)' },
  search: { al: 'Kërko', en: 'Search' },
  searching_packages: { al: 'Duke kërkuar paketa...', en: 'Searching packages...' },
  error: { al: 'Gabim', en: 'Error' },
  packages_for: { al: 'Paketat për', en: 'Packages for' },
  package: { al: 'paketë', en: 'package' },
  found: { al: 'gjetur', en: 'found' },
  no_packages_found_for: { al: 'Nuk u gjetën paketa për', en: 'No packages found for' },
  try_different_country: { al: 'Provoni një emër tjetër vendi.', en: 'Try a different country name.' },
  failed_to_search_packages: { al: 'Dështoi kërkimi i paketave', en: 'Failed to search packages' },
  failed_to_fetch_packages: { al: 'Dështoi marrja e paketave', en: 'Failed to fetch packages' },
  local: { al: 'Lokale', en: 'Local' },
  regional: { al: 'Rajonale', en: 'Regional' },
  global: { al: 'Globale', en: 'Global' },
  bundle_albania: { al: 'Shqipëri', en: 'Albania' },
  bundle_turkey: { al: 'Turqi', en: 'Turkey' },
  bundle_dubai: { al: 'Dubai', en: 'Dubai' },
  bundle_france: { al: 'Francë', en: 'France' },
  bundle_germany: { al: 'Gjermani', en: 'Germany' },
  bundle_switzerland: { al: 'Zvicër', en: 'Switzerland' },
  bundle_new_york: { al: 'New York', en: 'New York' },
  bundle_austria: { al: 'Austri', en: 'Austria' },
  bundle_italy: { al: 'Itali', en: 'Italy' },
  bundle_china: { al: 'Kinë', en: 'China' },
  bundle_maldives: { al: 'Maldivet', en: 'Maldives' },
  bundle_croatia: { al: 'Kroaci', en: 'Croatia' },
  bundle_finland: { al: 'Finlandë', en: 'Finland' },
  bundle_spain: { al: 'Spanjë', en: 'Spain' },
  bundle_thailand: { al: 'Tajlandë', en: 'Thailand' },
  bundle_uk: { al: 'Mbretëria e Bashkuar', en: 'United Kingdom' },
  bundle_saudi_arabia: { al: 'Arabia Saudite', en: 'Saudi Arabia' },
  bundle_greece: { al: 'Greqi', en: 'Greece' },
  bundle_kosovo: { al: 'Kosovë', en: 'Kosovo' },
  bundle_sweden: { al: 'Suedi', en: 'Sweden' },
  bundle_canada: { al: 'Kanada', en: 'Canada' },
  bundle_netherlands: { al: 'Holandë', en: 'Netherlands' },
  bundle_illyria: { al: 'Iliri', en: 'Illyria' },
  bundle_europe: { al: 'Europa', en: 'Europe' },
  bundle_africa: { al: 'Afrika', en: 'Africa' },
  bundle_asia: { al: 'Azi', en: 'Asia' },
  bundle_north_america: { al: 'Amerika e Veriut', en: 'North America' },
  bundle_south_america: { al: 'Amerika e Jugut', en: 'South America' },
  bundle_middle_east: { al: 'Lindja e Mesme', en: 'Middle East' },
  bundle_europe_balkan: { al: 'Europa & Ballkani', en: 'Europe & Balkan' },
  your_esim_data: { al: 'Të dhënat e eSIM tuaj!', en: 'Your eSIM data!' },
  your_esim_number: { al: 'Numri i eSIM tuaj', en: 'Your eSIM number' },
  enter_your_esim_number: { al: 'Vendosni numrin tuaj eSIM', en: 'Enter your eSIM number' },
  bundle_packages: { al: 'Paketat e Bundles', en: 'Bundle Packages' },
  package_not_found: { al: 'Paketa nuk u gjet', en: 'Package Not Found' },
  selected_package_not_found: { al: 'Paketa e zgjedhur nuk u gjet.', en: 'The selected package could not be found.' },
  failed_to_load_package_details: { al: 'Dështoi ngarkimi i detajeve të paketës.', en: 'Failed to load package details.' },
  order_summary: { al: 'Përmbledhje e Porosisë', en: 'Order Summary' },
  data: { al: 'Të dhëna', en: 'Data' },
  validity: { al: 'Vlefshmëria', en: 'Validity' },
  total: { al: 'Totali', en: 'Total' },
  your_info: { al: 'Informatat tuaja', en: 'Your Information' },
  phone_number: { al: 'Numri i telefonit', en: 'Phone Number' },
  phone_number_placeholder: { al: 'Numri i telefonit (04x xxx xxx)', en: 'Phone number (04x xxx xxx)' },
  pay_with_card: { al: 'Pagesë me kartelë online', en: 'Pay with card online' },
  all_banks: { al: 'Të gjitha bankat', en: 'All banks' },
};

interface LanguageContextType {
  language: 'al' | 'en';
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{children: ReactNode;}> = ({ children }) => {
  const [language, setLanguage] = useState<'al' | 'en'>(() => {
    // Check localStorage for saved language preference
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('preferred-language');
      if (savedLanguage === 'en' || savedLanguage === 'al') {
        return savedLanguage;
      }
    }
    // Default to Albanian if no preference is saved
    return 'al';
  });

  const toggleLanguage = () => {
    setLanguage((prev) => {
      const newLang = prev === 'al' ? 'en' : 'al';
      if (typeof window !== 'undefined') {
        localStorage.setItem('preferred-language', newLang);
      }
      return newLang;
    });
  };

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation[language];
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};