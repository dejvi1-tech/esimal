import { Helmet } from 'react-helmet-async';

const AboutUsPage = () => {
  return (
    <>
      <Helmet>
        <title>Rreth Nesh - e-SIM Fly</title>
        <meta name="description" content="e-SIM Fly është një platformë moderne, e krijuar në vitin 2025, që sjell teknologjinë më të fundit të eSIM për përdoruesit e telefonisë mobile anembanë botës." />
      </Helmet>
      <div className="min-h-screen flex flex-col items-center justify-center py-20 px-4">
        <section className="w-full max-w-2xl mx-auto">
          <div className="card-glass p-10 md:p-14 rounded-3xl shadow-glow text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight font-orbitron">
              Rreth Nesh
              <span className="block w-16 h-1 bg-accent mx-auto mt-4 rounded-full"></span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 leading-relaxed font-medium" style={{textShadow: '0 2px 8px rgba(0,0,0,0.10)'}}>
              e-SIM Fly është një platformë moderne, e krijuar në vitin 2025, që sjell teknologjinë më të fundit të eSIM për përdoruesit e telefonisë mobile anembanë botës. Me ne, nuk ke më nevojë për karta fizike SIM – aktivizo internetin direkt në pajisjen tënde, në vetëm pak klikime.<br /><br />
              Ne ofrojmë internet të shpejtë, të sigurt dhe të besueshëm, kudo që të ndodhesh – për udhëtarët, aventurierët, profesionistët apo këdo që ka nevojë për lidhje të menjëhershme dhe pa komplikime.<br /><br />
              Me e-SIM Fly, ti udhëton lirshëm dhe qëndron gjithmonë i lidhur. Teknologji e zgjuar për një botë pa kufij.
            </p>
          </div>
        </section>
      </div>
    </>
  );
};

export default AboutUsPage;