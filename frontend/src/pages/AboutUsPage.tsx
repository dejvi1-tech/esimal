import { Helmet } from 'react-helmet-async';

const AboutUsPage = () => {
  return (
    <>
      <Helmet>
        <title>Rreth Nesh - e-SIM Fly</title>
        <meta name="description" content="e-SIM Fly është një platformë moderne, e krijuar në vitin 2025, që sjell teknologjinë më të fundit të eSIM për përdoruesit e telefonisë mobile anembanë botës." />
      </Helmet>
      <div className="min-h-screen flex flex-col items-center justify-center py-20 px-4">
        <section className="w-full max-w-6xl mx-auto">
          <div className="card-glass p-8 md:p-12 rounded-3xl shadow-glow">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight font-orbitron">
                Rreth Nesh
                <span className="block w-16 h-1 bg-accent mx-auto mt-4 rounded-full"></span>
              </h1>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Image Section */}
              <div className="flex justify-center lg:justify-start lg:-mt-8">
                <div className="relative">
                  <div className="w-80 h-80 md:w-96 md:h-96 rounded-3xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-300">
                    <picture>
                      <source srcSet="/heropanda5.webp" type="image/webp" />
                      <img 
                        src="/heropanda5.png" 
                        alt="e-SIM Fly Team" 
                        className="w-full h-full object-cover"
                        style={{filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))'}}
                      />
                    </picture>
                  </div>
                  {/* Decorative elements */}
                  <div className="absolute -top-4 -right-4 w-8 h-8 bg-accent rounded-full opacity-60 animate-pulse"></div>
                  <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-blue-400 rounded-full opacity-40 animate-pulse" style={{animationDelay: '1s'}}></div>
                </div>
              </div>

              {/* Text Section */}
              <div className="space-y-6 lg:pt-4">
                <div className="space-y-4">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 font-orbitron">
                    Teknologji e Zgjuar për Botën Pa Kufij
                  </h2>
                  
                  <div className="space-y-4 text-lg md:text-xl text-gray-200 leading-relaxed font-medium" style={{textShadow: '0 2px 8px rgba(0,0,0,0.10)'}}>
                    <p>
                      e-SIM Fly është një platformë moderne, e krijuar në vitin 2025, që sjell teknologjinë më të fundit të eSIM për përdoruesit e telefonisë mobile anembanë botës.
                    </p>
                    
                    <p>
                      Me ne, nuk ke më nevojë për karta fizike SIM – aktivizo internetin direkt në pajisjen tënde, në vetëm pak klikime.
                    </p>
                    
                    <p>
                      Ne ofrojmë internet të shpejtë, të sigurt dhe të besueshëm, kudo që të ndodhesh – për udhëtarët, aventurierët, profesionistët apo këdo që ka nevojë për lidhje të menjëhershme dhe pa komplikime.
                    </p>
                    
                    <p>
                      Me e-SIM Fly, ti udhëton lirshëm dhe qëndron gjithmonë i lidhur. Teknologji e zgjuar për një botë pa kufij.
                    </p>
                  </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                  <div className="flex items-center space-x-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-white font-medium">Aktivizim i Menjëhershëm</span>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                    <span className="text-white font-medium">Siguri e Plotë</span>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                    <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                    <span className="text-white font-medium">Mbështetje 24/7</span>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <span className="text-white font-medium">Çmime Konkurruese</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default AboutUsPage;