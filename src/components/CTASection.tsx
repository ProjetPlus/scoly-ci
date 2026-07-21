import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

const CTASection = () => {
  const { t, language } = useLanguage();
  
  const texts = {
    fr: {
      contact: "Contacter l'équipe",
      freeSignup: "Inscription gratuite • Aucune carte bancaire requise",
    },
    en: {
      contact: "Contact the team",
      freeSignup: "Free signup • No credit card required",
    },
    de: {
      contact: "Team kontaktieren",
      freeSignup: "Kostenlose Anmeldung • Keine Kreditkarte erforderlich",
    },
    es: {
      contact: "Contactar al equipo",
      freeSignup: "Registro gratuito • Sin tarjeta de crédito",
    },
  };

  const currentTexts = texts[language] || texts.fr;
  
  return (
    <section className="py-6 lg:py-8 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-secondary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto bg-primary rounded-2xl p-6 lg:p-10 text-center relative overflow-hidden">
          <div className="absolute top-3 right-3 text-accent/30">
            <Sparkles size={32} />
          </div>
          <div className="absolute bottom-3 left-3 text-primary-foreground/20">
            <Sparkles size={24} />
          </div>

          <h2 className="text-2xl lg:text-3xl font-display font-bold text-primary-foreground mb-2">
            {t.cta.title}
          </h2>
          <p className="text-sm lg:text-base text-primary-foreground/80 mb-5 max-w-2xl mx-auto">
            {t.cta.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/auth">
              <Button variant="accent" size="lg">
                {t.cta.button}
                <ArrowRight size={18} />
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="heroOutline" size="lg">
                {currentTexts.contact}
              </Button>
            </Link>
          </div>

          <p className="mt-3 text-xs text-primary-foreground/60">
            {currentTexts.freeSignup}
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;