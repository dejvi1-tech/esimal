import { Smartphone, Mail, Phone, MapPin, Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import { Link } from 'react-router-dom';
import React from 'react';

// Define a type for footer links
// Either a normal link or a social link with an icon

type FooterLink =
  | { name: string; href: string; target?: string; rel?: string }
  | { icon: React.ElementType; href: string; name: string };

const Footer = () => {
  const footerSections: { title: string; links: FooterLink[] }[] = [
    {
      title: "Produkti",
      links: [
        { name: "Planet eSIM", href: "https://esimfly.al/packages" },
        { name: "Si lidhemi?", href: "https://esimfly.al/how-it-works" },
        
      ]
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
        { name: "Help Center", href: "https://esimfly.al/support" },
      ]
    },
    {
      title: "Na Ndiqni",
      links: [
        { icon: Facebook, href: "#", name: "Facebook" },
        { icon: Twitter, href: "#", name: "Twitter" },
        { icon: Instagram, href: "#", name: "Instagram" },
        { icon: Linkedin, href: "#", name: "LinkedIn" }
      ]
    }
  ];

  return (
    <footer className="glass-medium text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-5 md:grid-cols-2 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-4">
              <img src="/esimflylogo.webp" alt="e-SimFly Logo" width={40} height={40} className="mr-2 inline-block align-middle" />
              <span className="text-2xl font-bold text-white align-middle">e-SimFly</span>
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
                    {"icon" in link ? (
                      <a
                        href={link.href}
                        className="flex items-center gap-3 text-gray-300 text-base font-medium hover:text-accent transition-none"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <link.icon className="w-5 h-5" />
                        <span>{link.name}</span>
                      </a>
                    ) : (
                      <a
                        href={link.href}
                        className="text-gray-300 text-sm"
                        target={link.target}
                        rel={link.rel}
                      >
                        {link.name}
                      </a>
                    )}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-300 text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} e-SimFly. Të gjitha të drejtat e rezervuara.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;