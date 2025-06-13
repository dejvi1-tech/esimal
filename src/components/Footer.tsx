import { Smartphone, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { Link, useLocation } from 'react-router-dom';

const Footer = () => {
  const footerSections = [
  {
    title: "Produkti",
    links: [
    { name: "Planet eSIM", href: "#" },
    { name: "Harta e Mbulimit", href: "#" },
    { name: "Çmimet", href: "#" },
    { name: "Përputhshmëria e Pajisjeve", href: "#" }]

  },
  {
    title: "Mbështetja",
    links: [
    { name: "Qendra e Ndihmës", href: "#" },
    { name: "Udhëzuesit e Konfigurimit", href: "#" },
    { name: "Na Kontaktoni", href: "#" },
    { name: "Chat i Drejtpërdrejtë", href: "#" }]

  },
  {
    title: "Kompania",
    links: [
    { name: "Rreth Nesh", href: "#" },
    { name: "Blogu", href: "#" },
    { name: "Karriera", href: "#" },
    { name: "Shtypi", href: "#" }]

  },
  {
    title: "Ligjore",
    links: [
    { name: "Kushtet e Shërbimit", href: "#" },
    { name: "Politika e Privatësisë", href: "#" },
    { name: "Politika e Cookies", href: "#" },
    { name: "Politika e Rimbursimit", href: "#" }]

  }];


  const socialLinks = [
  { icon: Facebook, href: "#", name: "Facebook" },
  { icon: Twitter, href: "#", name: "Twitter" },
  { icon: Instagram, href: "#", name: "Instagram" },
  { icon: Linkedin, href: "#", name: "LinkedIn" }];


  return (
    <footer className="bg-gray-900 text-white" data-id="evxg7c3zq" data-path="src/components/Footer.tsx">
      <div className="container mx-auto px-4 py-16" data-id="wmkxhu6xj" data-path="src/components/Footer.tsx">
        <div className="grid lg:grid-cols-5 md:grid-cols-2 gap-8" data-id="4v3xaf2oc" data-path="src/components/Footer.tsx">
          {/* Brand Section */}
          <div className="lg:col-span-1" data-id="8lgf4u2i9" data-path="src/components/Footer.tsx">
            <div className="flex items-center space-x-2 mb-6" data-id="jadubhpqj" data-path="src/components/Footer.tsx">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl" data-id="hvfuoz00t" data-path="src/components/Footer.tsx">
                <Smartphone className="w-6 h-6 text-white" data-id="y7r8hx6ty" data-path="src/components/Footer.tsx" />
              </div>
              <Link
                to="/"
                className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent cursor-pointer"
                onClick={e => {
                  if (window.location.pathname === "/") {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                data-id="sx4iozs8k" data-path="src/components/Footer.tsx"
              >
                e-SimFly
              </Link>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed" data-id="ssuu6ws2s" data-path="src/components/Footer.tsx">
              Duke lidhur udhëtarët në mbarë botën me zgjidhje eSIM të besueshme dhe të përballueshme. 
              Qëndroni të lidhur, vazhdoni të eksploroni.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3" data-id="xqktyxqsx" data-path="src/components/Footer.tsx">
              <div className="flex items-center text-gray-400" data-id="ze9tlyjvu" data-path="src/components/Footer.tsx">
                <Mail className="w-4 h-4 mr-3" data-id="cn29n0fws" data-path="src/components/Footer.tsx" />
                <span className="text-sm" data-id="fnzuywgfw" data-path="src/components/Footer.tsx">support@globalesim.com</span>
              </div>
              <div className="flex items-center text-gray-400" data-id="ubf14qwyo" data-path="src/components/Footer.tsx">
                <Phone className="w-4 h-4 mr-3" data-id="ztfc1mx6f" data-path="src/components/Footer.tsx" />
                <span className="text-sm" data-id="4yj5dft39" data-path="src/components/Footer.tsx">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center text-gray-400" data-id="jrxnbgy9l" data-path="src/components/Footer.tsx">
                <MapPin className="w-4 h-4 mr-3" data-id="o4l41h2f7" data-path="src/components/Footer.tsx" />
                <span className="text-sm" data-id="twp5mqg6a" data-path="src/components/Footer.tsx">San Francisco, CA</span>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, index) =>
          <div key={index} data-id="cfriqnzo5" data-path="src/components/Footer.tsx">
              <h3 className="font-semibold mb-4 text-white" data-id="12572cwqz" data-path="src/components/Footer.tsx">{section.title}</h3>
              <ul className="space-y-3" data-id="w3ki2pqgb" data-path="src/components/Footer.tsx">
                {section.links.map((link, linkIndex) =>
              <li key={linkIndex} data-id="lvkm4087s" data-path="src/components/Footer.tsx">
                    <a
                  href={link.href}
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm" data-id="ac4l6wgul" data-path="src/components/Footer.tsx">

                      {link.name}
                    </a>
                  </li>
              )}
              </ul>
            </div>
          )}
        </div>

        {/* Newsletter Signup */}
        <div className="border-t border-gray-800 mt-12 pt-8" data-id="6jq5yrr62" data-path="src/components/Footer.tsx">
          <div className="max-w-md" data-id="rr1nuzswb" data-path="src/components/Footer.tsx">
            <h3 className="font-semibold mb-4 text-white" data-id="lswg787cb" data-path="src/components/Footer.tsx">Qëndroni të Përditësuar</h3>
            <p className="text-gray-400 text-sm mb-4" data-id="s1aou5gbw" data-path="src/components/Footer.tsx">
              Merrni këshillat më të reja të udhëtimit dhe ofertat eSIM të dërguara në email-in tuaj.
            </p>
            <div className="flex" data-id="rrtkzjsuq" data-path="src/components/Footer.tsx">
              <input
                type="email"
                placeholder="Shkruani email-in tuaj"
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-lg focus:outline-none focus:border-blue-500 text-white placeholder-gray-500" data-id="8jkdmktpa" data-path="src/components/Footer.tsx" />

              <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-r-lg font-semibold transition-colors" data-id="ka444053t" data-path="src/components/Footer.tsx">
                Regjistrohu
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center" data-id="isjqrg0jr" data-path="src/components/Footer.tsx">
          <div className="text-gray-400 text-sm mb-4 md:mb-0" data-id="c9d002u0v" data-path="src/components/Footer.tsx">
            © {new Date().getFullYear()} e-SimFly. Të gjitha të drejtat e rezervuara.
          </div>
          
          {/* Social Links */}
          <div className="flex space-x-4" data-id="x4vsikglv" data-path="src/components/Footer.tsx">
            {socialLinks.map((social, index) =>
            <a
              key={index}
              href={social.href}
              className="text-gray-400 hover:text-white transition-colors duration-200"
              aria-label={social.name} data-id="qnnl5m910" data-path="src/components/Footer.tsx">

                <social.icon className="w-5 h-5" data-id="aubfrcn1b" data-path="src/components/Footer.tsx" />
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>);

};

export default Footer;