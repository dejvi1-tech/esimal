import React from 'react';
import { motion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { Smartphone, Download, QrCode, Wifi, CheckCircle, Phone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const HowToUseSection: React.FC = () => {
  const { language } = useLanguage();

  const steps = [
  {
    id: 1,
    icon: Download,
    title: language === 'al' ? 'Shkarkoni eSIM' : 'Download eSIM',
    description: language === 'al' ?
    'Pas blerjes, do të merrni një email me QR kodin dhe udhëzimet për instalim.' :
    'After purchase, you will receive an email with QR code and installation instructions.',
    color: 'bg-blue-100 text-blue-600',
    image: 'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?auto=format&fit=crop&w=400&h=300'
  },
  {
    id: 2,
    icon: QrCode,
    title: language === 'al' ? 'Skanoni QR Kodin' : 'Scan QR Code',
    description: language === 'al' ?
    'Hapni cilësimet e telefonit dhe zgjidhni "Shtoni Plan Cellular". Skanoni QR kodin.' :
    'Open your phone settings and select "Add Cellular Plan". Scan the QR code.',
    color: 'bg-purple-100 text-purple-600',
    image: 'https://images.unsplash.com/photo-1607799632518-da91dd151b38?auto=format&fit=crop&w=400&h=300'
  },
  {
    id: 3,
    icon: Smartphone,
    title: language === 'al' ? 'Konfiguroni Planin' : 'Configure Plan',
    description: language === 'al' ?
    'Ndiqni udhëzimet në ekran për të konfiguruar planin tuaj eSIM si planin kryesor ose dytësor.' :
    'Follow the on-screen instructions to configure your eSIM plan as primary or secondary.',
    color: 'bg-green-100 text-green-600',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=400&h=300'
  },
  {
    id: 4,
    icon: Wifi,
    title: language === 'al' ? 'Lidhu me Internetin' : 'Connect to Internet',
    description: language === 'al' ?
    'Aktivizoni të dhënat mobile për planin eSIM dhe gëzoni internetin e shpejtë kudo që të jeni.' :
    'Turn on mobile data for your eSIM plan and enjoy high-speed internet wherever you are.',
    color: 'bg-orange-100 text-orange-600',
    image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=400&h=300'
  }];


  const compatibleDevices = [
  { name: 'iPhone XS, XR, 11, 12, 13, 14, 15', icon: Phone },
  { name: 'Samsung Galaxy S20, S21, S22, S23, S24', icon: Phone },
  { name: 'Google Pixel 3, 4, 5, 6, 7, 8', icon: Phone },
  { name: 'iPad Pro (2018+), iPad Air (2019+)', icon: Smartphone }];


  return (
    <section id="how-to-use" className="py-20" data-id="inbuexxoc" data-path="src/components/HowToUseSection.tsx">
      <div className="container mx-auto px-4" data-id="h90fs6n1f" data-path="src/components/HowToUseSection.tsx">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16" data-id="wy588kp0u" data-path="src/components/HowToUseSection.tsx">

          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800 dark:text-gray-200" data-id="p5ub4ddvf" data-path="src/components/HowToUseSection.tsx">
            {language === 'al' ? 'Si të Përdorni eSIM' : 'How to Use eSIM'}
          </h2>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto" data-id="1vunnb9xp" data-path="src/components/HowToUseSection.tsx">
            {language === 'al' ?
            'Aktivizoni planin tuaj eSIM në vetëm 4 hapa të thjeshtë dhe filloni të gëzoni internetin e shpejtë menjëherë.' :
            'Activate your eSIM plan in just 4 simple steps and start enjoying high-speed internet instantly.'}
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20" data-id="ibsk34mf3" data-path="src/components/HowToUseSection.tsx">
          {steps.map((step, index) =>
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ y: -5 }}
            className="relative" data-id="68bo113j6" data-path="src/components/HowToUseSection.tsx">

              <Card className="h-full bg-slate-100/30 dark:bg-slate-900/50 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden" data-id="wz9txa0ni" data-path="src/components/HowToUseSection.tsx">
                {/* Step Image */}
                <div className="h-40 overflow-hidden" data-id="9rh5nzcyp" data-path="src/components/HowToUseSection.tsx">
                  <img
                  src={step.image}
                  alt={step.title}
                  className="w-full h-full object-cover" data-id="kd6aya60n" data-path="src/components/HowToUseSection.tsx" />

                  <div className="absolute top-4 left-4" data-id="khttcvep8" data-path="src/components/HowToUseSection.tsx">
                    <div className={`w-12 h-12 rounded-full ${step.color} flex items-center justify-center shadow-lg bg-opacity-30`} data-id="w27hprncc" data-path="src/components/HowToUseSection.tsx">
                      <step.icon className="w-6 h-6 text-white" data-id="kfcbujfo4" data-path="src/components/HowToUseSection.tsx" />
                    </div>
                  </div>
                  <div className="absolute top-4 right-4" data-id="g6dw3ac2w" data-path="src/components/HowToUseSection.tsx">
                    <div className="w-8 h-8 bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg" data-id="xw9mbbb6b" data-path="src/components/HowToUseSection.tsx">
                      <span className="text-sm font-bold text-gray-800" data-id="a66gm2h7r" data-path="src/components/HowToUseSection.tsx">{step.id}</span>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6" data-id="57wh6mg14" data-path="src/components/HowToUseSection.tsx">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3" data-id="4chvn93wz" data-path="src/components/HowToUseSection.tsx">{step.title}</h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed" data-id="9lhux5yv9" data-path="src/components/HowToUseSection.tsx">{step.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Compatible Devices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-slate-100/30 dark:bg-slate-900/50 backdrop-blur-sm border border-white/20 rounded-3xl p-8 md:p-12" data-id="jlqjk5vs4" data-path="src/components/HowToUseSection.tsx">

          <div className="text-center mb-12" data-id="lwzfcgz06" data-path="src/components/HowToUseSection.tsx">
            <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4" data-id="re8uzkxpv" data-path="src/components/HowToUseSection.tsx">
              {language === 'al' ? 'Pajisje të Përshtatshme' : 'Compatible Devices'}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-lg" data-id="pbkogjgkv" data-path="src/components/HowToUseSection.tsx">
              {language === 'al' ?
              'eSIM funksionon me shumicën e pajisjeve moderne të Apple, Samsung, Google dhe të tjera.' :
              'eSIM works with most modern Apple, Samsung, Google and other devices.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-id="plegzn3zn" data-path="src/components/HowToUseSection.tsx">
            {compatibleDevices.map((device, index) =>
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/30 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300" data-id="uejdorwkp" data-path="src/components/HowToUseSection.tsx">

                <div className="flex items-center gap-4" data-id="vzrkogwzs" data-path="src/components/HowToUseSection.tsx">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center" data-id="df1mcxtsd" data-path="src/components/HowToUseSection.tsx">
                    <device.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" data-id="mirdj85g1" data-path="src/components/HowToUseSection.tsx" />
                  </div>
                  <div data-id="s9ux9xg01" data-path="src/components/HowToUseSection.tsx">
                    <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm" data-id="uwkdlxhxp" data-path="src/components/HowToUseSection.tsx">{device.name}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-8 text-center" data-id="76jqcq7pu" data-path="src/components/HowToUseSection.tsx">

            <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-800 dark:text-green-200 px-4 py-2 rounded-full text-sm font-medium" data-id="2ttqy7jel" data-path="src/components/HowToUseSection.tsx">
              <CheckCircle className="w-4 h-4" data-id="zqaxe6ndz" data-path="src/components/HowToUseSection.tsx" />
              {language === 'al' ? 'Kontrolloni nëse pajisja juaj mbështet eSIM' : 'Check if your device supports eSIM'}
            </div>
          </motion.div>
        </motion.div>

        {/* Additional Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8" data-id="7p082w498" data-path="src/components/HowToUseSection.tsx">

          <div className="text-center" data-id="7d3cowku0" data-path="src/components/HowToUseSection.tsx">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4" data-id="hxwq1hu03" data-path="src/components/HowToUseSection.tsx">
              <CheckCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" data-id="15xqr4ss3" data-path="src/components/HowToUseSection.tsx" />
            </div>
            <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2" data-id="ljidz0r44" data-path="src/components/HowToUseSection.tsx">
              {language === 'al' ? 'Aktivizim i Menjëhershëm' : 'Instant Activation'}
            </h4>
            <p className="text-gray-700 dark:text-gray-300 text-sm" data-id="pm7y9m8n8" data-path="src/components/HowToUseSection.tsx">
              {language === 'al' ?
              'eSIM aktivizohet menjëherë pas instalimit, pa nevojë për të pritur.' :
              'eSIM activates immediately after installation, no waiting required.'}
            </p>
          </div>

          <div className="text-center" data-id="8zuuejigx" data-path="src/components/HowToUseSection.tsx">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4" data-id="378vs7oz5" data-path="src/components/HowToUseSection.tsx">
              <Wifi className="w-8 h-8 text-purple-600 dark:text-purple-400" data-id="bd7l90h97" data-path="src/components/HowToUseSection.tsx" />
            </div>
            <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2" data-id="wpuwn8wym" data-path="src/components/HowToUseSection.tsx">
              {language === 'al' ? 'Internet i Shpejtë' : 'High-Speed Internet'}
            </h4>
            <p className="text-gray-700 dark:text-gray-300 text-sm" data-id="0bmujvo11" data-path="src/components/HowToUseSection.tsx">
              {language === 'al' ?
              'Gëzoni internet 4G/5G me shpejtësi të lartë në çdo destinacion.' :
              'Enjoy high-speed 4G/5G internet at every destination.'}
            </p>
          </div>

          <div className="text-center" data-id="ymnmhtsob" data-path="src/components/HowToUseSection.tsx">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4" data-id="x5fsb2st2" data-path="src/components/HowToUseSection.tsx">
              <Phone className="w-8 h-8 text-green-600 dark:text-green-400" data-id="rni0bjqfh" data-path="src/components/HowToUseSection.tsx" />
            </div>
            <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2" data-id="kh6gi6cw1" data-path="src/components/HowToUseSection.tsx">
              {language === 'al' ? 'Dual SIM' : 'Dual SIM'}
            </h4>
            <p className="text-gray-700 dark:text-gray-300 text-sm" data-id="9endtyox7" data-path="src/components/HowToUseSection.tsx">
              {language === 'al' ?
              'Përdorni eSIM-in bashkë me SIM-in tuaj fizik për dy numra telefoni.' :
              'Use eSIM alongside your physical SIM for two phone numbers.'}
            </p>
          </div>
        </motion.div>
      </div>
    </section>);

};

export default HowToUseSection;