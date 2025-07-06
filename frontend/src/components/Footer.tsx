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
    title: "e-SimFly",
    links: [
    { name: "Privatësia & Cookies", href: "/privacy", target: "_blank", rel: "noopener noreferrer" },
    { name: "Termat & Kushtet", href: "/terms", target: "_blank", rel: "noopener noreferrer" },
    ]

  },
  {
    title: "Kompania",
    links: [
    { name: "Rreth Nesh", href: "https://esimfly.al/about" },
    ]

  },
  {
    title: "Ndihme",
    links: [
    { name: "Help Center", href: "https://esimfly.al/support" },
    ]

  }];


  const socialLinks = [
  { icon: Facebook, href: "#", name: "Facebook" },
  { icon: Twitter, href: "#", name: "Twitter" },
  { icon: Instagram, href: "#", name: "Instagram" },
  { icon: Linkedin, href: "#", name: "LinkedIn" }];


  return (
    <footer className="glass-medium text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-5 md:grid-cols-2 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-6">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <Link
                to="/"
                className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent cursor-pointer"
                onClick={e => {
                  if (window.location.pathname === "/") {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'auto' });
                  }
                }}
              >
                e-SimFly
              </Link>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Duke lidhur udhëtarët në mbarë botën me zgjidhje eSIM të besueshme dhe të përballueshme. 
              Qëndroni të lidhur, vazhdoni të eksploroni.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center text-gray-300">
                <Mail className="w-4 h-4 mr-3" />
                <span className="text-sm">support@esimfly.al</span>
              </div>
              <div className="flex items-center text-gray-300">
                <Phone className="w-4 h-4 mr-3" />
                <span className="text-sm">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center text-gray-300">
                <MapPin className="w-4 h-4 mr-3" />
                <span className="text-sm">Albania , Tiranë</span>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, index) =>
          <div key={index}>
              <h3 className="font-semibold mb-4 text-white">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) =>
              <li key={linkIndex}>
                    <a
                  href={link.href}
                  className="text-gray-300 text-sm"
                  {...(link.target ? { target: link.target } : {})}
                  {...(link.rel ? { rel: link.rel } : {})}
                >
                      {link.name}
                    </a>
                  </li>
              )}
              </ul>
            </div>
          )}
        </div>

        {/* Newsletter Signup */}
        <div className="border-t border-white/20 mt-12 pt-8">
          <div className="max-w-md">
            <h3 className="font-semibold mb-4 text-white">Qëndroni të Përditësuar</h3>
            <p className="text-gray-300 text-sm mb-4">
              Merrni këshillat më të reja të udhëtimit dhe ofertat eSIM të dërguara në email-in tuaj.
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Shkruani email-in tuaj"
                className="input-glass flex-1 px-4 py-2 rounded-l-lg text-white placeholder-gray-300" />

              <button className="btn-glass px-6 py-2 bg-accent text-accent-foreground rounded-r-lg font-semibold">
                Regjistrohu
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-300 text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} e-SimFly. Të gjitha të drejtat e rezervuara.
          </div>
          
          {/* Social Links */}
          <div className="flex space-x-4">
            {socialLinks.map((social, index) =>
            <a
              key={index}
              href={social.href}
              className="text-gray-300"
              aria-label={social.name}>

                <social.icon className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>);

};

export default Footer;