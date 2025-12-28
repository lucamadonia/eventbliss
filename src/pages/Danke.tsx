import { Link } from "react-router-dom";
import { CheckCircle, Heart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Danke = () => {
  return (
    <main className="min-h-screen hero-gradient flex items-center justify-center p-4">
      <div className="text-center max-w-md animate-scale-in">
        <div className="mb-6 relative inline-block">
          <CheckCircle className="w-20 h-20 text-success mx-auto" />
          <Heart className="w-6 h-6 text-primary absolute -top-1 -right-1 animate-pulse" />
        </div>
        
        <h1 className="font-display text-3xl font-semibold mb-4 text-foreground">
          Danke!
        </h1>
        
        <p className="text-lg text-muted-foreground mb-2">
          Deine Antwort ist drin ✅
        </p>
        
        <p className="text-sm text-muted-foreground mb-8">
          Wenn du etwas ändern willst, kannst du das Formular einfach erneut ausfüllen.
        </p>
        
        <Button asChild variant="outline" size="lg">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zur Startseite
          </Link>
        </Button>
      </div>
    </main>
  );
};

export default Danke;
