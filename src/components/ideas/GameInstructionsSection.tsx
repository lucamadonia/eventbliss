import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { 
  ClipboardList, 
  Gamepad2, 
  Scale, 
  RefreshCw, 
  Lightbulb,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GameInstructionsSectionProps {
  instructions: string;
  className?: string;
}

interface Section {
  title: string;
  content: string;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

// Map section titles to styling (German + English keywords)
const sectionConfig: Record<string, { icon: React.ReactNode; colorClass: string; bgClass: string; borderClass: string }> = {
  // German
  "vorbereitung": {
    icon: <ClipboardList className="w-4 h-4" />,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/30"
  },
  "spielablauf": {
    icon: <Gamepad2 className="w-4 h-4" />,
    colorClass: "text-green-600 dark:text-green-400",
    bgClass: "bg-green-500/10",
    borderClass: "border-green-500/30"
  },
  "regeln": {
    icon: <Scale className="w-4 h-4" />,
    colorClass: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-500/10",
    borderClass: "border-blue-500/30"
  },
  "varianten": {
    icon: <RefreshCw className="w-4 h-4" />,
    colorClass: "text-purple-600 dark:text-purple-400",
    bgClass: "bg-purple-500/10",
    borderClass: "border-purple-500/30"
  },
  "tipps": {
    icon: <Lightbulb className="w-4 h-4" />,
    colorClass: "text-orange-600 dark:text-orange-400",
    bgClass: "bg-orange-500/10",
    borderClass: "border-orange-500/30"
  },
  // English
  "preparation": {
    icon: <ClipboardList className="w-4 h-4" />,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/30"
  },
  "setup": {
    icon: <ClipboardList className="w-4 h-4" />,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/30"
  },
  "gameplay": {
    icon: <Gamepad2 className="w-4 h-4" />,
    colorClass: "text-green-600 dark:text-green-400",
    bgClass: "bg-green-500/10",
    borderClass: "border-green-500/30"
  },
  "how to play": {
    icon: <Gamepad2 className="w-4 h-4" />,
    colorClass: "text-green-600 dark:text-green-400",
    bgClass: "bg-green-500/10",
    borderClass: "border-green-500/30"
  },
  "rules": {
    icon: <Scale className="w-4 h-4" />,
    colorClass: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-500/10",
    borderClass: "border-blue-500/30"
  },
  "variants": {
    icon: <RefreshCw className="w-4 h-4" />,
    colorClass: "text-purple-600 dark:text-purple-400",
    bgClass: "bg-purple-500/10",
    borderClass: "border-purple-500/30"
  },
  "variations": {
    icon: <RefreshCw className="w-4 h-4" />,
    colorClass: "text-purple-600 dark:text-purple-400",
    bgClass: "bg-purple-500/10",
    borderClass: "border-purple-500/30"
  },
  "tips": {
    icon: <Lightbulb className="w-4 h-4" />,
    colorClass: "text-orange-600 dark:text-orange-400",
    bgClass: "bg-orange-500/10",
    borderClass: "border-orange-500/30"
  },
  // Other languages - French
  "préparation": {
    icon: <ClipboardList className="w-4 h-4" />,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/30"
  },
  "déroulement": {
    icon: <Gamepad2 className="w-4 h-4" />,
    colorClass: "text-green-600 dark:text-green-400",
    bgClass: "bg-green-500/10",
    borderClass: "border-green-500/30"
  },
  "règles": {
    icon: <Scale className="w-4 h-4" />,
    colorClass: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-500/10",
    borderClass: "border-blue-500/30"
  },
  "variantes": {
    icon: <RefreshCw className="w-4 h-4" />,
    colorClass: "text-purple-600 dark:text-purple-400",
    bgClass: "bg-purple-500/10",
    borderClass: "border-purple-500/30"
  },
  "conseils": {
    icon: <Lightbulb className="w-4 h-4" />,
    colorClass: "text-orange-600 dark:text-orange-400",
    bgClass: "bg-orange-500/10",
    borderClass: "border-orange-500/30"
  },
  // Spanish
  "preparación": {
    icon: <ClipboardList className="w-4 h-4" />,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/30"
  },
  "desarrollo": {
    icon: <Gamepad2 className="w-4 h-4" />,
    colorClass: "text-green-600 dark:text-green-400",
    bgClass: "bg-green-500/10",
    borderClass: "border-green-500/30"
  },
  "reglas": {
    icon: <Scale className="w-4 h-4" />,
    colorClass: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-500/10",
    borderClass: "border-blue-500/30"
  },
  "consejos": {
    icon: <Lightbulb className="w-4 h-4" />,
    colorClass: "text-orange-600 dark:text-orange-400",
    bgClass: "bg-orange-500/10",
    borderClass: "border-orange-500/30"
  },
  // Italian
  "preparazione": {
    icon: <ClipboardList className="w-4 h-4" />,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/30"
  },
  "svolgimento": {
    icon: <Gamepad2 className="w-4 h-4" />,
    colorClass: "text-green-600 dark:text-green-400",
    bgClass: "bg-green-500/10",
    borderClass: "border-green-500/30"
  },
  "regole": {
    icon: <Scale className="w-4 h-4" />,
    colorClass: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-500/10",
    borderClass: "border-blue-500/30"
  },
  "suggerimenti": {
    icon: <Lightbulb className="w-4 h-4" />,
    colorClass: "text-orange-600 dark:text-orange-400",
    bgClass: "bg-orange-500/10",
    borderClass: "border-orange-500/30"
  },
  // Dutch
  "voorbereiding": {
    icon: <ClipboardList className="w-4 h-4" />,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/30"
  },
  "spelverloop": {
    icon: <Gamepad2 className="w-4 h-4" />,
    colorClass: "text-green-600 dark:text-green-400",
    bgClass: "bg-green-500/10",
    borderClass: "border-green-500/30"
  }
};

const defaultConfig = {
  icon: <Info className="w-4 h-4" />,
  colorClass: "text-muted-foreground",
  bgClass: "bg-muted/50",
  borderClass: "border-border"
};

export const GameInstructionsSection = ({ instructions, className }: GameInstructionsSectionProps) => {
  const { t } = useTranslation();

  const sections = useMemo(() => {
    // Parse markdown sections
    const parts: Section[] = [];
    
    // Match **Section Title** pattern
    const sectionRegex = /\*\*([^*]+)\*\*\s*([\s\S]*?)(?=\*\*[^*]+\*\*|$)/g;
    let match;
    
    while ((match = sectionRegex.exec(instructions)) !== null) {
      const title = match[1].trim();
      const content = match[2].trim();
      
      // Find matching config
      const titleLower = title.toLowerCase().replace(/[📋🎮📏🔄💡]/g, "").trim();
      const config = Object.entries(sectionConfig).find(
        ([key]) => titleLower.includes(key)
      )?.[1] || defaultConfig;
      
      parts.push({
        title,
        content,
        ...config
      });
    }
    
    // If no sections found, treat as single block
    if (parts.length === 0) {
      parts.push({
        title: "",
        content: instructions,
        ...defaultConfig
      });
    }
    
    return parts;
  }, [instructions]);

  if (sections.length === 1 && !sections[0].title) {
    // Simple text without sections - just render markdown
    return (
      <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
        {instructions}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {sections.map((section, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={cn(
            "rounded-lg border p-3",
            section.bgClass,
            section.borderClass
          )}
        >
          {/* Section Header */}
          {section.title && (
            <div className={cn(
              "flex items-center gap-2 mb-2 font-semibold text-sm",
              section.colorClass
            )}>
              {section.icon}
              <span>{section.title}</span>
            </div>
          )}
          
          {/* Section Content */}
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {section.content
              .split("\n")
              .map((line, i) => {
                // Handle bullet points
                if (line.trim().startsWith("-") || line.trim().startsWith("•")) {
                  return (
                    <div key={i} className="flex items-start gap-2 my-1">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{line.replace(/^[-•]\s*/, "")}</span>
                    </div>
                  );
                }
                
                // Handle numbered lists
                const numberedMatch = line.match(/^(\d+)\.\s*(.+)/);
                if (numberedMatch) {
                  return (
                    <div key={i} className="flex items-start gap-2 my-1">
                      <span className="text-primary font-medium min-w-[1.5rem]">
                        {numberedMatch[1]}.
                      </span>
                      <span>{numberedMatch[2]}</span>
                    </div>
                  );
                }
                
                // Regular paragraph
                if (line.trim()) {
                  return <p key={i} className="my-1">{line}</p>;
                }
                
                return null;
              })
            }
          </div>
        </motion.div>
      ))}
    </div>
  );
};
