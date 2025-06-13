export interface Country {
  code: string;
  name: {
    al: string;
    en: string;
  };
  flag: string;
  packages: Package[];
  region: string;
}

export interface Package {
  id: string;
  data: string;
  price: string;
  validity: string;
  priceValue: number;
  coverage: string;
  description?: string;
  isOffer?: boolean;
  bonusData?: string;
  specialFeatures?: string[];
}

// Global packages that work across multiple regions
export const globalPackages: Package[] = [
{
  id: 'global-1gb',
  data: '1GB',
  price: '€2.90',
  validity: '60 Ditë',
  priceValue: 2.90,
  coverage: 'Europë, SHBA, Ballkan - 75 Shtete',
  description: 'Data Only'
},
{
  id: 'global-3gb',
  data: '3GB',
  price: '€6.99',
  validity: '60 Ditë',
  priceValue: 6.99,
  coverage: 'Europë, SHBA, Ballkan - 75 Shtete',
  description: 'Data Only'
},
{
  id: 'global-5gb',
  data: '5GB',
  price: '€9.99',
  validity: '60 Ditë',
  priceValue: 9.99,
  coverage: 'Europë, SHBA, Ballkan - 75 Shtete',
  description: 'Data Only',
  bonusData: '+ 1GB Falas',
  isOffer: true
},
{
  id: 'global-10gb',
  data: '10GB',
  price: '€14.99',
  validity: '60 Ditë',
  priceValue: 14.99,
  coverage: 'Europë, SHBA, Ballkan - 75 Shtete',
  description: 'Data Only',
  bonusData: '+ 2GB Falas',
  isOffer: true
},
{
  id: 'offer-10gb-special',
  data: '10GB',
  price: '€14.99',
  validity: '60 Ditë',
  priceValue: 14.99,
  coverage: 'Europë, SHBA, Shqipëri - 40 Shtete',
  description: 'Data Only',
  bonusData: '+ 5GB FALAS',
  isOffer: true
},
{
  id: 'offer-15gb-special',
  data: '15GB',
  price: '€17.50',
  validity: '30 Ditë',
  priceValue: 17.50,
  coverage: 'Europë, SHBA, Shqipëri - 40 Shtete',
  description: 'Data Only',
  bonusData: '+ 3GB FALAS',
  isOffer: true
},
{
  id: 'global-20gb',
  data: '20GB',
  price: '€24.99',
  validity: '60 Ditë',
  priceValue: 24.99,
  coverage: 'Europë, SHBA, Ballkan - 75 Shtete',
  description: 'Data Only'
},
{
  id: 'global-30gb',
  data: '30GB',
  price: '€29.99',
  validity: '30 Ditë',
  priceValue: 29.99,
  coverage: 'Europë, SHBA, Ballkan - 75 Shtete',
  description: 'Data Only'
},
{
  id: 'uk-special',
  data: '35GB EU, 50GB Angli',
  price: '€28.00',
  validity: '30 Ditë',
  priceValue: 28.00,
  coverage: 'EU, Angli, Zvicër - 48 shtete',
  description: 'O2 SUPER',
  specialFeatures: [
  'Numër +44 Anglez për thirje brënda vendit të qëndrimit',
  'Telefonata pa limit brënda vendit të qëndrimit',
  'SMS hyrëse pa limit',
  '30 ditë aktive nga momenti i blerjes',
  '*Nuk funksionon në Ballkan*']

},
{
  id: 'global-50gb',
  data: '50GB',
  price: '€35.90',
  validity: '30 Ditë',
  priceValue: 35.90,
  coverage: 'Europë, SHBA, Ballkan - 75 Shtete',
  description: 'Data Only'
},
{
  id: 'unlimited-7d',
  data: 'Pa Limit',
  price: '€23.00',
  validity: '7 Ditë',
  priceValue: 23.00,
  coverage: 'Europë, SHBA, Shqipëri - 40 Shtete',
  description: 'Data Only'
},
{
  id: 'unlimited-15d',
  data: 'Pa Limit',
  price: '€35.00',
  validity: '15 Ditë',
  priceValue: 35.00,
  coverage: 'Europë, SHBA, Shqipëri - 40 Shtete',
  description: 'Data Only'
},
{
  id: 'unlimited-30d',
  data: 'Pa Limit',
  price: '€59.99',
  validity: '30 Ditë',
  priceValue: 59.99,
  coverage: 'Europë, SHBA, Shqipëri - 40 Shtete',
  description: 'Data Only'
}];


export const europeanCountries: Country[] = [
{
  code: 'AL',
  name: { al: 'Shqipëria', en: 'Albania' },
  flag: 'https://flagcdn.com/w40/al.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'AD',
  name: { al: 'Andora', en: 'Andorra' },
  flag: 'https://flagcdn.com/w40/ad.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'AT',
  name: { al: 'Austria', en: 'Austria' },
  flag: 'https://flagcdn.com/w40/at.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'BY',
  name: { al: 'Bjellorusia', en: 'Belarus' },
  flag: 'https://flagcdn.com/w40/by.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'BE',
  name: { al: 'Belgjika', en: 'Belgium' },
  flag: 'https://flagcdn.com/w40/be.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'BA',
  name: { al: 'Bosnja dhe Hercegovina', en: 'Bosnia and Herzegovina' },
  flag: 'https://flagcdn.com/w40/ba.png',
  region: 'Balkans',
  packages: globalPackages
},
{
  code: 'BG',
  name: { al: 'Bullgaria', en: 'Bulgaria' },
  flag: 'https://flagcdn.com/w40/bg.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'HR',
  name: { al: 'Kroacia', en: 'Croatia' },
  flag: 'https://flagcdn.com/w40/hr.png',
  region: 'Balkans',
  packages: globalPackages
},
{
  code: 'CY',
  name: { al: 'Qipro', en: 'Cyprus' },
  flag: 'https://flagcdn.com/w40/cy.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'CZ',
  name: { al: 'Republika Çeke', en: 'Czech Republic' },
  flag: 'https://flagcdn.com/w40/cz.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'DK',
  name: { al: 'Danimarka', en: 'Denmark' },
  flag: 'https://flagcdn.com/w40/dk.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'EE',
  name: { al: 'Estonia', en: 'Estonia' },
  flag: 'https://flagcdn.com/w40/ee.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'FI',
  name: { al: 'Finlanda', en: 'Finland' },
  flag: 'https://flagcdn.com/w40/fi.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'FR',
  name: { al: 'Franca', en: 'France' },
  flag: 'https://flagcdn.com/w40/fr.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'GE',
  name: { al: 'Gjeorgjia', en: 'Georgia' },
  flag: 'https://flagcdn.com/w40/ge.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'DE',
  name: { al: 'Gjermania', en: 'Germany' },
  flag: 'https://flagcdn.com/w40/de.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'GR',
  name: { al: 'Greqia', en: 'Greece' },
  flag: 'https://flagcdn.com/w40/gr.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'HU',
  name: { al: 'Hungaria', en: 'Hungary' },
  flag: 'https://flagcdn.com/w40/hu.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'IS',
  name: { al: 'Islanda', en: 'Iceland' },
  flag: 'https://flagcdn.com/w40/is.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'IE',
  name: { al: 'Irlanda', en: 'Ireland' },
  flag: 'https://flagcdn.com/w40/ie.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'IT',
  name: { al: 'Italia', en: 'Italy' },
  flag: 'https://flagcdn.com/w40/it.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'XK',
  name: { al: 'Kosova', en: 'Kosovo' },
  flag: 'https://flagcdn.com/w40/xk.png',
  region: 'Balkans',
  packages: globalPackages
},
{
  code: 'LV',
  name: { al: 'Letonia', en: 'Latvia' },
  flag: 'https://flagcdn.com/w40/lv.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'LI',
  name: { al: 'Lihtenshtajni', en: 'Liechtenstein' },
  flag: 'https://flagcdn.com/w40/li.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'LT',
  name: { al: 'Lituania', en: 'Lithuania' },
  flag: 'https://flagcdn.com/w40/lt.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'LU',
  name: { al: 'Luksemburgu', en: 'Luxembourg' },
  flag: 'https://flagcdn.com/w40/lu.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'MT',
  name: { al: 'Malta', en: 'Malta' },
  flag: 'https://flagcdn.com/w40/mt.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'MD',
  name: { al: 'Moldavia', en: 'Moldova' },
  flag: 'https://flagcdn.com/w40/md.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'MC',
  name: { al: 'Monako', en: 'Monaco' },
  flag: 'https://flagcdn.com/w40/mc.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'ME',
  name: { al: 'Mali i Zi', en: 'Montenegro' },
  flag: 'https://flagcdn.com/w40/me.png',
  region: 'Balkans',
  packages: globalPackages
},
{
  code: 'NL',
  name: { al: 'Holanda', en: 'Netherlands' },
  flag: 'https://flagcdn.com/w40/nl.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'MK',
  name: { al: 'Maqedonia e Veriut', en: 'North Macedonia' },
  flag: 'https://flagcdn.com/w40/mk.png',
  region: 'Balkans',
  packages: globalPackages
},
{
  code: 'NO',
  name: { al: 'Norvegjia', en: 'Norway' },
  flag: 'https://flagcdn.com/w40/no.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'PL',
  name: { al: 'Polonia', en: 'Poland' },
  flag: 'https://flagcdn.com/w40/pl.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'PT',
  name: { al: 'Portugalia', en: 'Portugal' },
  flag: 'https://flagcdn.com/w40/pt.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'RO',
  name: { al: 'Rumania', en: 'Romania' },
  flag: 'https://flagcdn.com/w40/ro.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'RU',
  name: { al: 'Rusia', en: 'Russia' },
  flag: 'https://flagcdn.com/w40/ru.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'SM',
  name: { al: 'San Marino', en: 'San Marino' },
  flag: 'https://flagcdn.com/w40/sm.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'RS',
  name: { al: 'Serbia', en: 'Serbia' },
  flag: 'https://flagcdn.com/w40/rs.png',
  region: 'Balkans',
  packages: globalPackages
},
{
  code: 'SK',
  name: { al: 'Sllovakia', en: 'Slovakia' },
  flag: 'https://flagcdn.com/w40/sk.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'SI',
  name: { al: 'Sllovenia', en: 'Slovenia' },
  flag: 'https://flagcdn.com/w40/si.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'ES',
  name: { al: 'Spanja', en: 'Spain' },
  flag: 'https://flagcdn.com/w40/es.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'SE',
  name: { al: 'Suedia', en: 'Sweden' },
  flag: 'https://flagcdn.com/w40/se.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'CH',
  name: { al: 'Zvicra', en: 'Switzerland' },
  flag: 'https://flagcdn.com/w40/ch.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'TR',
  name: { al: 'Turqia', en: 'Turkey' },
  flag: 'https://flagcdn.com/w40/tr.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'UA',
  name: { al: 'Ukraina', en: 'Ukraine' },
  flag: 'https://flagcdn.com/w40/ua.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'GB',
  name: { al: 'Mbretëria e Bashkuar', en: 'United Kingdom' },
  flag: 'https://flagcdn.com/w40/gb.png',
  region: 'Europe',
  packages: globalPackages
},
{
  code: 'VA',
  name: { al: 'Vatikani', en: 'Vatican City' },
  flag: 'https://flagcdn.com/w40/va.png',
  region: 'Europe',
  packages: globalPackages
},
// USA and North America
{
  code: 'US',
  name: { al: 'Shtetet e Bashkuara', en: 'United States' },
  flag: 'https://flagcdn.com/w40/us.png',
  region: 'North America',
  packages: globalPackages
},
{
  code: 'CA',
  name: { al: 'Kanada', en: 'Canada' },
  flag: 'https://flagcdn.com/w40/ca.png',
  region: 'North America',
  packages: globalPackages
},
{
  code: 'MX',
  name: { al: 'Meksika', en: 'Mexico' },
  flag: 'https://flagcdn.com/w40/mx.png',
  region: 'North America',
  packages: globalPackages
},
// Asia
{
  code: 'JP',
  name: { al: 'Japonia', en: 'Japan' },
  flag: 'https://flagcdn.com/w40/jp.png',
  region: 'Asia',
  packages: globalPackages
},
{
  code: 'KR',
  name: { al: 'Koreja e Jugut', en: 'South Korea' },
  flag: 'https://flagcdn.com/w40/kr.png',
  region: 'Asia',
  packages: globalPackages
},
{
  code: 'CN',
  name: { al: 'Kina', en: 'China' },
  flag: 'https://flagcdn.com/w40/cn.png',
  region: 'Asia',
  packages: globalPackages
},
{
  code: 'IN',
  name: { al: 'India', en: 'India' },
  flag: 'https://flagcdn.com/w40/in.png',
  region: 'Asia',
  packages: globalPackages
},
{
  code: 'TH',
  name: { al: 'Tailanda', en: 'Thailand' },
  flag: 'https://flagcdn.com/w40/th.png',
  region: 'Asia',
  packages: globalPackages
},
{
  code: 'SG',
  name: { al: 'Singapori', en: 'Singapore' },
  flag: 'https://flagcdn.com/w40/sg.png',
  region: 'Asia',
  packages: globalPackages
},
// Oceania
{
  code: 'AU',
  name: { al: 'Australia', en: 'Australia' },
  flag: 'https://flagcdn.com/w40/au.png',
  region: 'Oceania',
  packages: globalPackages
},
{
  code: 'NZ',
  name: { al: 'Zelanda e Re', en: 'New Zealand' },
  flag: 'https://flagcdn.com/w40/nz.png',
  region: 'Oceania',
  packages: globalPackages
},
// Africa
{
  code: 'ZA',
  name: { al: 'Afrika e Jugut', en: 'South Africa' },
  flag: 'https://flagcdn.com/w40/za.png',
  region: 'Africa',
  packages: globalPackages
},
{
  code: 'EG',
  name: { al: 'Egjipti', en: 'Egypt' },
  flag: 'https://flagcdn.com/w40/eg.png',
  region: 'Africa',
  packages: globalPackages
},
// Middle East
{
  code: 'AE',
  name: { al: 'Emiratet e Bashkuara Arabe', en: 'United Arab Emirates' },
  flag: 'https://flagcdn.com/w40/ae.png',
  region: 'Middle East',
  packages: globalPackages
},
{
  code: 'SA',
  name: { al: 'Arabia Saudite', en: 'Saudi Arabia' },
  flag: 'https://flagcdn.com/w40/sa.png',
  region: 'Middle East',
  packages: globalPackages
},
{
  code: 'IL',
  name: { al: 'Izraeli', en: 'Israel' },
  flag: 'https://flagcdn.com/w40/il.png',
  region: 'Middle East',
  packages: globalPackages
}];