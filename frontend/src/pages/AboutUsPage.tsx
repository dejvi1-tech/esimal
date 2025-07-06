import { Helmet } from 'react-helmet-async';

const AboutUsPage = () => {
  return (
    <>
      <Helmet>
        <title>Rreth Nesh - e-SIM Fly</title>
        <meta name="description" content="e-SIM Fly është një platformë moderne, e krijuar në vitin 2025, që sjell teknologjinë më të fundit të eSIM për përdoruesit e telefonisë mobile anembanë botës." />
      </Helmet>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-16 px-4">
        <div className="glass-card max-w-2xl w-full mx-auto p-10 rounded-3xl shadow-2xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-8 tracking-tight">Rreth Nesh</h1>
          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-200 leading-relaxed">
            e-SIM Fly është një platformë moderne, e krijuar në vitin 2025, që sjell teknologjinë më të fundit të eSIM për përdoruesit e telefonisë mobile anembanë botës. Me ne, nuk ke më nevojë për karta fizike SIM – aktivizo internetin direkt në pajisjen tënde, në vetëm pak klikime.<br /><br />
            Ne ofrojmë internet të shpejtë, të sigurt dhe të besueshëm, kudo që të ndodhesh – për udhëtarët, aventurierët, profesionistët apo këdo që ka nevojë për lidhje të menjëhershme dhe pa komplikime.<br /><br />
            Me e-SIM Fly, ti udhëton lirshëm dhe qëndron gjithmonë i lidhur. Teknologji e zgjuar për një botë pa kufij.
          </p>
        </div>
      </div>
      <style>{`
        .glass-card {
          background: rgba(255,255,255,0.65);
          backdrop-filter: blur(18px) saturate(180%);
          -webkit-backdrop-filter: blur(18px) saturate(180%);
          border-radius: 2rem;
          border: 1.5px solid rgba(200,200,255,0.18);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.10);
        }
        .dark .glass-card {
          background: rgba(30,34,54,0.7);
          border: 1.5px solid rgba(80,80,180,0.18);
        }
      `}</style>
    </>
  );
};

export default AboutUsPage;