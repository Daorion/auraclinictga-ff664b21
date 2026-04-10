import { MessageCircle, MapPin, Instagram } from 'lucide-react';

const SocialButtons = () => {
  const socialLinks = [
    {
      icon: MessageCircle,
      label: 'WhatsApp',
      href: 'https://wa.me/5565996480484',
    },
    {
      icon: MapPin,
      label: 'Localização',
      href: 'https://maps.app.goo.gl/aWPuEFij2rnNgxU19',
    },
    {
      icon: Instagram,
      label: 'Instagram',
      href: 'https://www.instagram.com/beautyvilleespaco/',
    }
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
      {socialLinks.map((link) => {
        const IconComponent = link.icon;
        return (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm text-white text-sm font-medium tracking-wide hover:bg-white/20 transition-all duration-300"
          >
            <IconComponent size={16} />
            <span>{link.label}</span>
          </a>
        );
      })}
    </div>
  );
};

export default SocialButtons;
