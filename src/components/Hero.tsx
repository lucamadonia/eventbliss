import { Heart } from "lucide-react";
import { SITE_NAME, WEDDING_DATE } from "@/lib/constants";

const Hero = () => {
  return (
    <section className="relative overflow-hidden py-12 md:py-20">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 opacity-20 heart-decoration">
        <Heart className="w-24 h-24 fill-current" strokeWidth={1} />
      </div>
      <div className="absolute bottom-0 right-0 opacity-20 heart-decoration">
        <Heart className="w-20 h-20 fill-current" strokeWidth={1} />
      </div>
      
      <div className="container relative z-10">
        <div className="text-center max-w-2xl mx-auto animate-fade-in">
          {/* Main title */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground mb-4">
            {SITE_NAME}
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-primary font-medium mb-6">
            Termin finden & Action planen
          </p>
          
          {/* Wedding date badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Heart className="w-4 h-4 text-primary fill-primary/30" />
            <span className="text-sm font-medium text-foreground">
              Hochzeit: {WEDDING_DATE}
            </span>
            <Heart className="w-4 h-4 text-primary fill-primary/30" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
