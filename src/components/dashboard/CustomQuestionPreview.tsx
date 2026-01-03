import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Eye, Type, AlignLeft, List, CircleDot, CheckSquare, ToggleLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import { CustomQuestion } from '@/lib/survey-config';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface CustomQuestionPreviewProps {
  questions: CustomQuestion[];
}

const getQuestionIcon = (type: CustomQuestion['type']) => {
  switch (type) {
    case 'text': return Type;
    case 'textarea': return AlignLeft;
    case 'select': return List;
    case 'radio': return CircleDot;
    case 'checkbox': return CheckSquare;
    case 'toggle': return ToggleLeft;
    default: return Type;
  }
};

export function CustomQuestionPreview({ questions }: CustomQuestionPreviewProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(true);

  if (questions.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
        <Eye className="w-6 h-6 mx-auto mb-2 opacity-50" />
        <p className="text-sm">{t('dashboard.form.customQuestions.noPreview')}</p>
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-primary" />
            <div className="text-left">
              <h4 className="font-medium text-sm">{t('dashboard.form.customQuestions.previewTitle')}</h4>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.form.customQuestions.previewDescription')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{questions.length}</Badge>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 space-y-4 p-4 bg-background/50 rounded-lg border border-dashed"
        >
          <div className="text-xs text-muted-foreground text-center mb-4">
            👁️ {t('dashboard.form.customQuestions.previewReadOnly')}
          </div>
          
          {questions.map((question, index) => {
            const Icon = getQuestionIcon(question.type);
            
            return (
              <GlassCard key={question.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <Label className="font-medium">
                      {question.label || t('dashboard.form.customQuestions.untitledQuestion')}
                      {question.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                  </div>
                  
                  {/* Render based on question type */}
                  {question.type === 'text' && (
                    <Input 
                      placeholder={question.placeholder || ''} 
                      disabled 
                      className="bg-muted/30"
                    />
                  )}
                  
                  {question.type === 'textarea' && (
                    <Textarea 
                      placeholder={question.placeholder || ''} 
                      disabled 
                      className="bg-muted/30 min-h-[80px]"
                    />
                  )}
                  
                  {question.type === 'select' && (
                    <Select disabled>
                      <SelectTrigger className="bg-muted/30">
                        <SelectValue placeholder={t('dashboard.form.customQuestions.selectPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {question.options?.map((option, i) => (
                          <SelectItem key={i} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {question.type === 'radio' && (
                    <RadioGroup disabled className="space-y-2">
                      {question.options?.map((option, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <RadioGroupItem value={option} id={`${question.id}-${i}`} disabled />
                          <Label htmlFor={`${question.id}-${i}`} className="text-sm font-normal">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                  
                  {question.type === 'checkbox' && (
                    <div className="space-y-2">
                      {question.options?.map((option, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Checkbox id={`${question.id}-${i}`} disabled />
                          <Label htmlFor={`${question.id}-${i}`} className="text-sm font-normal">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {question.type === 'toggle' && (
                    <div className="flex items-center gap-3">
                      <Switch disabled />
                      <span className="text-sm text-muted-foreground">
                        {t('common.yes')} / {t('common.no')}
                      </span>
                    </div>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  );
}
