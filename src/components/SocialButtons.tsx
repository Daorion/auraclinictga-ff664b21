import { MessageCircle, MapPin, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SocialButtons = () => {
  const socialLinks = [
    {
      icon: MessageCircle,
      label: 'WhatsApp',
      href: 'https://wa.me/5565996480484',
      bgColor: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
      textColor: 'text-white'
    },
    {
      icon: MapPin,
      label: 'Localização',
      href: 'https://maps.app.goo.gl/aWPuEFij2rnNgxU19',
      bgColor: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      textColor: 'text-white'
    },
    {
      icon: Instagram,
      label: 'Instagram',
      href: 'https://www.instagram.com/sirleiglatzmassoterapeuta/',
      bgColor: 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700',
      textColor: 'text-white'
    }
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
      {socialLinks.map((link) => {
        const IconComponent = link.icon;
        return (
          <Button
            key={link.label}
            asChild
            className={`${link.bgColor} ${link.textColor} border-0 shadow-elegant hover:shadow-glow transition-all duration-300 transform hover:scale-105 px-6 py-3 rounded-full font-semibold`}
          >
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2"
            >
              <IconComponent size={20} />
              <span>{link.label}</span>
            </a>
          </Button>
        );
      })}
    </div>
  );
};

export default SocialButtons;