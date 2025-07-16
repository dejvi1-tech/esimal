import { Helmet } from 'react-helmet-async';

const ESimDeviceListPage = () => (
  <>
    <Helmet>
      <title>Lista e Pajisjeve që Mbështesin eSIM | e-SimFly</title>
      <meta name="description" content="Kontrolloni nëse telefoni juaj mbështet eSIM. Lista e plotë e pajisjeve që mbështesin eSIM nga Apple, Samsung, Google, Huawei dhe shumë të tjera." />
    </Helmet>
    <div className="min-h-screen flex flex-col items-center justify-center py-20 px-4">
      <section className="w-full max-w-4xl mx-auto">
        <div className="card-glass p-10 md:p-14 rounded-3xl shadow-glow text-white">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-6 tracking-tight font-orbitron text-center">
            ✅ Lista e Pajisjeve që Mbështesin eSIM
          </h1>
          
          <div className="text-gray-200 text-base md:text-lg leading-relaxed space-y-6">
            
            {/* Important Notice */}
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold mb-4 text-yellow-300">⚠️ Shënim i rëndësishëm përpara aktivizimit të eSIM</h2>
              <ul className="space-y-3">
                <li><strong>Pajisja duhet të jetë e shkyçur (unlocked).</strong></li>
                <li>Nëse telefoni është i kyçur te një operator, kontakto operatorin ose tregtarin ku e ke blerë për opsionet e zhbllokimit.</li>
                <li><strong>Jo çdo variant i të njëjtit model mbështet eSIM.</strong></li>
                <li>Brenda të njëjtit emër modeli (p.sh. "Galaxy S20" ose "iPhone 14") mund të ketë versione rajonale me ose pa eSIM.</li>
                <li><strong>Verifiko përpara blerjes.</strong></li>
                <li>Kontrollo specifikimet teknike ose pyet shitësin/operatoin që të konfirmojë mbështetjen e eSIM për modelin dhe rajonin tënd.</li>
              </ul>
            </div>

            {/* How to Check Section */}
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold mb-4 text-blue-300">🔍 Si ta kontrollosh nëse telefoni yt mbështet eSIM (shkurt)</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">🍏 iPhone</h3>
                  <p>Settings → Cellular (ose Mobile Data).</p>
                  <p>Kërko opsionin <strong>Add eSIM</strong> / <strong>Add Cellular Plan</strong>.</p>
                  <p>Nëse shfaqet skanimi i QR kodit ose opsion "Transfer from nearby iPhone", pajisja mbështet eSIM.</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">🤖 Android (hapët mund të ndryshojnë sipas markës)</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold">Opsioni i zakonshëm (Pixel / shumica e Android 14+):</h4>
                      <p>Settings → Network & Internet → SIMs.</p>
                      <p>Zgjidh <strong>Add eSIM</strong> ose <strong>Download a SIM instead</strong>.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Samsung Galaxy:</h4>
                      <p>Settings → Connections → SIM Manager (ose Mobile networks).</p>
                      <p>Trokit <strong>Add eSIM</strong> / <strong>Add mobile plan</strong>.</p>
                      <p>Skan QR ose përdor transfer / carrier app.</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm">Nëse nuk sheh opsion për eSIM: versioni i pajisjes ose firmware-i mund të mos e mbështesë; kontrollo me operatorin.</p>
                </div>
              </div>
            </div>

            {/* Device Lists */}
            <div className="space-y-8">
              
              {/* Apple Section */}
              <div>
                <h2 className="text-2xl font-bold mb-4 text-white border-b border-white/20 pb-2">🍏 Apple (iPhone & iPad)</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-200">
                  <li>• iPhone 16, 16 Plus, 16 Pro, 16 Pro Max</li>
                  <li>• iPhone 15, 15 Plus, 15 Pro, 15 Pro Max</li>
                  <li>• iPhone 14, 14 Plus, 14 Pro, 14 Pro Max</li>
                  <li>• iPhone 13, 13 mini, 13 Pro, 13 Pro Max</li>
                  <li>• iPhone 12, 12 mini, 12 Pro, 12 Pro Max</li>
                  <li>• iPhone 11, 11 Pro, 11 Pro Max</li>
                  <li>• iPhone XS, XS Max, XR</li>
                  <li>• iPhone SE (gjenerata 2 dhe 3)</li>
                  <li>• iPad Pro 11" (gjenerata 1–3)</li>
                  <li>• iPad Pro 12.9" (gjenerata 3–6)</li>
                  <li>• iPad Air (gjenerata 3–5)</li>
                  <li>• iPad 7, 8, 9, 10</li>
                  <li>• iPad mini 5 dhe 6</li>
                </ul>
              </div>

              {/* Samsung Section */}
              <div>
                <h2 className="text-2xl font-bold mb-4 text-white border-b border-white/20 pb-2">📱 Samsung</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-200">
                  <li>• Galaxy S25, S25+, S25 Ultra</li>
                  <li>• Galaxy S24, S24+, S24 Ultra</li>
                  <li>• Galaxy S23, S23+, S23 Ultra</li>
                  <li>• Galaxy S22, S22+, S22 Ultra</li>
                  <li>• Galaxy S21, S21+, S21 Ultra</li>
                  <li>• Galaxy S20, S20+, S20 Ultra, S20 FE (disa versione)</li>
                  <li>• Galaxy Note 20, Note 20 Ultra</li>
                  <li>• Galaxy Z Fold 2, 3, 4, 5, 6</li>
                  <li>• Galaxy Z Flip, Flip 3, 4, 5, 6</li>
                  <li>• Galaxy A54, A55, A56</li>
                  <li>• Galaxy A35, A36 (në disa rajone)</li>
                </ul>
              </div>

              {/* Google Pixel Section */}
              <div>
                <h2 className="text-2xl font-bold mb-4 text-white border-b border-white/20 pb-2">🔍 Google Pixel</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-200">
                  <li>• Pixel 9, Pixel 9 Pro, Pixel 9a</li>
                  <li>• Pixel 8, 8 Pro, 8a</li>
                  <li>• Pixel 7, 7 Pro, 7a</li>
                  <li>• Pixel 6, 6 Pro, 6a</li>
                  <li>• Pixel 5, 5a</li>
                  <li>• Pixel 4, 4 XL, 4a</li>
                  <li>• Pixel 3, 3 XL, 3a, 3a XL</li>
                  <li>• Pixel 2, 2 XL (vetëm në disa versione)</li>
                </ul>
              </div>

              {/* Huawei Section */}
              <div>
                <h2 className="text-2xl font-bold mb-4 text-white border-b border-white/20 pb-2">📷 Huawei</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-200">
                  <li>• Huawei P40, P40 Pro</li>
                  <li>• Huawei P50, P50 Pro</li>
                  <li>• Huawei Mate 40 Pro</li>
                  <li>• Huawei Mate Xs</li>
                  <li>• Huawei Pura 70, P70, P70 Pro, P70 Art</li>
                </ul>
              </div>

              {/* Motorola Section */}
              <div>
                <h2 className="text-2xl font-bold mb-4 text-white border-b border-white/20 pb-2">📱 Motorola</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-200">
                  <li>• Razr (2019), Razr 5G</li>
                  <li>• Razr 40, Razr 40 Ultra, Razr+</li>
                  <li>• Edge 2022, Edge 2023</li>
                  <li>• Edge+, Edge 30, Edge 40, Edge 40 Pro, Edge 40 Neo</li>
                  <li>• Edge 50 Pro, Edge 50 Ultra, Edge 50 Fusion</li>
                  <li>• Edge 60, Edge 60 Pro, Edge 60 Fusion</li>
                  <li>• Moto G53, G54, G84, G34</li>
                  <li>• Moto G Power (2024, 2025)</li>
                  <li>• Moto G Stylus 5G (2024)</li>
                </ul>
              </div>

              {/* Xiaomi Section */}
              <div>
                <h2 className="text-2xl font-bold mb-4 text-white border-b border-white/20 pb-2">🔥 Xiaomi / Redmi / Poco</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-200">
                  <li>• Xiaomi 12T Pro</li>
                  <li>• Xiaomi 13, 13 Lite, 13 Pro, 13T, 13T Pro</li>
                  <li>• Xiaomi 14, 14 Pro, 14T, 14T Pro</li>
                  <li>• Xiaomi 15, 15 Ultra</li>
                  <li>• Redmi Note 13 Pro, 14 Pro, 14 Pro+</li>
                  <li>• Poco X7</li>
                </ul>
              </div>

              {/* Oppo Section */}
              <div>
                <h2 className="text-2xl font-bold mb-4 text-white border-b border-white/20 pb-2">🌀 Oppo</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-200">
                  <li>• Oppo Find X3 Pro</li>
                  <li>• Oppo Find X5, X5 Pro</li>
                  <li>• Oppo Find X8, X8 Pro</li>
                  <li>• Oppo Reno 5A</li>
                  <li>• Oppo Reno 6 Pro</li>
                  <li>• Oppo Reno A</li>
                  <li>• Oppo A55s 5G</li>
                  <li>• Oppo Find N2 Flip</li>
                </ul>
              </div>

              {/* Sony Section */}
              <div>
                <h2 className="text-2xl font-bold mb-4 text-white border-b border-white/20 pb-2">🎥 Sony Xperia</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-200">
                  <li>• Xperia 10 III Lite</li>
                  <li>• Xperia 10 IV, 10 V</li>
                  <li>• Xperia 1 IV, 1 V, 1 VI, 1 VII</li>
                  <li>• Xperia 5 IV, 5 V</li>
                </ul>
              </div>

              {/* OnePlus Section */}
              <div>
                <h2 className="text-2xl font-bold mb-4 text-white border-b border-white/20 pb-2">🔴 OnePlus</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-200">
                  <li>• OnePlus 11</li>
                  <li>• OnePlus 12</li>
                  <li>• OnePlus 13</li>
                  <li>• OnePlus Open</li>
                </ul>
              </div>

              {/* Nokia Section */}
              <div>
                <h2 className="text-2xl font-bold mb-4 text-white border-b border-white/20 pb-2">📡 Nokia</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-200">
                  <li>• Nokia G60</li>
                  <li>• Nokia X30</li>
                  <li>• Nokia XR21</li>
                </ul>
              </div>

              {/* Fairphone Section */}
              <div>
                <h2 className="text-2xl font-bold mb-4 text-white border-b border-white/20 pb-2">🌱 Fairphone</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-200">
                  <li>• Fairphone 4</li>
                  <li>• Fairphone 5</li>
                </ul>
              </div>

              {/* Honor Section */}
              <div>
                <h2 className="text-2xl font-bold mb-4 text-white border-b border-white/20 pb-2">✨ Honor</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-200">
                  <li>• Honor Magic 4, 5, 6, 7</li>
                  <li>• Honor Magic Lite, Pro (disa versione)</li>
                </ul>
              </div>

              {/* Sharp Section */}
              <div>
                <h2 className="text-2xl font-bold mb-4 text-white border-b border-white/20 pb-2">🔹 Sharp</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-200">
                  <li>• AQUOS Sense4 Lite</li>
                  <li>• AQUOS Sense6s</li>
                  <li>• AQUOS Sense7, 7 Plus</li>
                  <li>• AQUOS Wish</li>
                  <li>• AQUOS Zero6</li>
                  <li>• AQUOS R7, R8, R9 Pro</li>
                </ul>
              </div>

              {/* Realme Section */}
              <div>
                <h2 className="text-2xl font-bold mb-4 text-white border-b border-white/20 pb-2">⚡ Realme</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-200">
                  <li>• Realme 14 Pro+</li>
                </ul>
              </div>

              {/* Nothing Phone Section */}
              <div>
                <h2 className="text-2xl font-bold mb-4 text-white border-b border-white/20 pb-2">🔲 Nothing Phone</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-200">
                  <li>• Nothing Phone 3a, 3a Pro</li>
                </ul>
              </div>

              {/* Asus Section */}
              <div>
                <h2 className="text-2xl font-bold mb-4 text-white border-b border-white/20 pb-2">💻 Asus</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-200">
                  <li>• Asus Zenfone 12 Ultra</li>
                </ul>
              </div>

            </div>

            {/* Final Note */}
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-6 mt-8">
              <p className="text-center text-green-300 font-semibold">
                💡 Nëse telefoni juaj nuk është në këtë listë, kontrolloni specifikimet teknike ose kontaktoni prodhuesin për të konfirmuar mbështetjen e eSIM.
              </p>
            </div>

          </div>
        </div>
      </section>
    </div>
  </>
);

export default ESimDeviceListPage; 