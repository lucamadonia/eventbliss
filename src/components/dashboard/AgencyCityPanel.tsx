import { X, Phone, Mail, Globe, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import type { Agency } from "@/lib/agencies-data";

interface AgencyCityPanelProps {
  city: string;
  agencies: Agency[];
  onClose: () => void;
}

export function AgencyCityPanel({ city, agencies, onClose }: AgencyCityPanelProps) {
  if (!city || agencies.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="absolute top-4 right-4 bottom-4 w-80 bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-xl z-10 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-semibold text-foreground">{city}</h3>
              <p className="text-xs text-muted-foreground">
                {agencies.length} {agencies.length === 1 ? 'Agentur' : 'Agenturen'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Agency List */}
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-2">
            {agencies.map((agency, index) => (
              <motion.div
                key={agency.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-3 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors"
              >
                <h4 className="font-medium text-sm text-foreground mb-1 line-clamp-1">
                  {agency.name}
                </h4>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {agency.description}
                </p>
                
                <div className="flex flex-wrap gap-1">
                  {agency.website && (
                    <a
                      href={agency.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Globe className="w-3 h-3" />
                      Website
                    </a>
                  )}
                  {agency.phone && (
                    <a
                      href={`tel:${agency.phone}`}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                    >
                      <Phone className="w-3 h-3" />
                      Anrufen
                    </a>
                  )}
                  {agency.email && (
                    <a
                      href={`mailto:${agency.email}`}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                    >
                      <Mail className="w-3 h-3" />
                      E-Mail
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </motion.div>
    </AnimatePresence>
  );
}
