import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Plus,
  Trash2,
  GripVertical,
  Type,
  AlignLeft,
  List,
  CircleDot,
  CheckSquare,
  ToggleLeft,
  HelpCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { CustomQuestion } from '@/lib/survey-config';
import { usePremium } from '@/hooks/usePremium';
import { PaywallOverlay } from '@/components/premium/PaywallOverlay';
import { toast } from 'sonner';

const MAX_FREE_OPTIONS = 5;

interface CustomQuestionBuilderProps {
  questions: CustomQuestion[];
  onChange: (questions: CustomQuestion[]) => void;
}

const QUESTION_TYPE_KEYS = [
  { value: 'text', labelKey: 'types.text', icon: Type },
  { value: 'textarea', labelKey: 'types.textarea', icon: AlignLeft },
  { value: 'select', labelKey: 'types.select', icon: List },
  { value: 'radio', labelKey: 'types.radio', icon: CircleDot },
  { value: 'checkbox', labelKey: 'types.checkbox', icon: CheckSquare },
  { value: 'toggle', labelKey: 'types.toggle', icon: ToggleLeft },
] as const;

const QUESTION_PRESET_KEYS = [
  { labelKey: 'presets.dietary', id: 'dietary' },
  { labelKey: 'presets.songWish', id: 'song_wish' },
  { labelKey: 'presets.tshirtSize', id: 'tshirt_size' },
  { labelKey: 'presets.driversLicense', id: 'drivers_license' },
  { labelKey: 'presets.specialWishes', id: 'special_wishes' },
];

export function CustomQuestionBuilder({
  questions,
  onChange,
}: CustomQuestionBuilderProps) {
  const { t } = useTranslation();
  const { isPremium, loading: premiumLoading } = usePremium();
  const [newQuestionType, setNewQuestionType] = useState<string>('text');

  // Show paywall if not premium (custom questions require premium)
  if (!premiumLoading && !isPremium) {
    return <PaywallOverlay feature="custom_questions" />;
  }

  // Build presets with translations
  const QUESTION_PRESETS = [
    {
      label: t('dashboard.form.customQuestions.presets.dietary'),
      question: {
        id: 'dietary',
        type: 'text' as const,
        label: t('dashboard.form.customQuestions.presetQuestions.dietary.label'),
        placeholder: t('dashboard.form.customQuestions.presetQuestions.dietary.placeholder'),
        required: false,
      },
    },
    {
      label: t('dashboard.form.customQuestions.presets.songWish'),
      question: {
        id: 'song_wish',
        type: 'text' as const,
        label: t('dashboard.form.customQuestions.presetQuestions.songWish.label'),
        placeholder: t('dashboard.form.customQuestions.presetQuestions.songWish.placeholder'),
        required: false,
      },
    },
    {
      label: t('dashboard.form.customQuestions.presets.tshirtSize'),
      question: {
        id: 'tshirt_size',
        type: 'select' as const,
        label: t('dashboard.form.customQuestions.presetQuestions.tshirtSize.label'),
        options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        required: false,
      },
    },
    {
      label: t('dashboard.form.customQuestions.presets.driversLicense'),
      question: {
        id: 'drivers_license',
        type: 'toggle' as const,
        label: t('dashboard.form.customQuestions.presetQuestions.driversLicense.label'),
        required: false,
      },
    },
    {
      label: t('dashboard.form.customQuestions.presets.specialWishes'),
      question: {
        id: 'special_wishes',
        type: 'textarea' as const,
        label: t('dashboard.form.customQuestions.presetQuestions.specialWishes.label'),
        placeholder: t('dashboard.form.customQuestions.presetQuestions.specialWishes.placeholder'),
        required: false,
      },
    },
  ];

  // Build question types with translations
  const QUESTION_TYPES = QUESTION_TYPE_KEYS.map(qt => ({
    value: qt.value,
    label: t(`dashboard.form.customQuestions.${qt.labelKey}`),
    icon: qt.icon,
  }));

  const addQuestion = (preset?: typeof QUESTION_PRESETS[0]['question']) => {
    const baseQuestion = preset || {
      id: `custom_${Date.now()}`,
      type: newQuestionType as CustomQuestion['type'],
      label: '',
      placeholder: '',
      required: false,
      options: newQuestionType === 'select' || newQuestionType === 'radio' || newQuestionType === 'checkbox'
        ? ['Option 1', 'Option 2']
        : undefined,
    };
    
    // Ensure unique ID
    const question = {
      ...baseQuestion,
      id: `${baseQuestion.id}_${Date.now()}`,
    };
    
    onChange([...questions, question]);
  };

  const updateQuestion = (index: number, updates: Partial<CustomQuestion>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    onChange(newQuestions);
  };

  const removeQuestion = (index: number) => {
    onChange(questions.filter((_, i) => i !== index));
  };

  const handleReorder = (newOrder: CustomQuestion[]) => {
    onChange(newOrder);
  };

  const addOption = (questionIndex: number) => {
    const question = questions[questionIndex];
    if (question.options) {
      // Check premium limit for options
      if (!isPremium && question.options.length >= MAX_FREE_OPTIONS) {
        toast.info(t('premium.paywall.maxOptions'));
        return;
      }
      updateQuestion(questionIndex, {
        options: [...question.options, `Option ${question.options.length + 1}`],
      });
    }
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const question = questions[questionIndex];
    if (question.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionIndex, { options: newOptions });
    }
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const question = questions[questionIndex];
    if (question.options && question.options.length > 2) {
      updateQuestion(questionIndex, {
        options: question.options.filter((_, i) => i !== optionIndex),
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Add Presets */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">{t('dashboard.form.customQuestions.quickAdd')}</Label>
        <div className="flex flex-wrap gap-2">
          {QUESTION_PRESETS.map((preset) => (
            <Button
              key={preset.question.id}
              variant="outline"
              size="sm"
              onClick={() => addQuestion(preset.question)}
              className="text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Questions List */}
      {questions.length > 0 ? (
        <Reorder.Group
          axis="y"
          values={questions}
          onReorder={handleReorder}
          className="space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {questions.map((question, index) => (
              <Reorder.Item
                key={question.id}
                value={question}
                className="cursor-grab active:cursor-grabbing"
              >
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <GlassCard className="p-4">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start gap-3">
                        <div className="mt-2 text-muted-foreground cursor-grab">
                          <GripVertical className="w-4 h-4" />
                        </div>

                        <div className="flex-1 space-y-3">
                          {/* Type & Label Row */}
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Select
                              value={question.type}
                              onValueChange={(value) =>
                                updateQuestion(index, {
                                  type: value as CustomQuestion['type'],
                                  options: ['select', 'radio', 'checkbox'].includes(value)
                                    ? question.options || ['Option 1', 'Option 2']
                                    : undefined,
                                })
                              }
                            >
                              <SelectTrigger className="w-full sm:w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {QUESTION_TYPES.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    <div className="flex items-center gap-2">
                                      <type.icon className="w-4 h-4" />
                                      {type.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Input
                              value={question.label}
                              onChange={(e) =>
                                updateQuestion(index, { label: e.target.value })
                              }
                              placeholder={t('dashboard.form.customQuestions.questionPlaceholder')}
                              className="flex-1"
                            />
                          </div>

                          {/* Placeholder for text types */}
                          {['text', 'textarea'].includes(question.type) && (
                          <Input
                            value={question.placeholder || ''}
                            onChange={(e) =>
                              updateQuestion(index, { placeholder: e.target.value })
                            }
                            placeholder={t('dashboard.form.customQuestions.placeholderPlaceholder')}
                            className="text-sm"
                          />
                          )}

                          {/* Options for select/radio/checkbox */}
                          {question.options && (
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">
                                {t('dashboard.form.customQuestions.options')}
                              </Label>
                              <div className="space-y-2">
                                {question.options.map((option, optIndex) => (
                                  <div key={optIndex} className="flex gap-2">
                                    <Input
                                      value={option}
                                      onChange={(e) =>
                                        updateOption(index, optIndex, e.target.value)
                                      }
                                      className="flex-1 text-sm"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeOption(index, optIndex)}
                                      disabled={question.options!.length <= 2}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addOption(index)}
                                  className="w-full"
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  {t('dashboard.form.customQuestions.addOption')}
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Required Toggle */}
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={question.required}
                              onCheckedChange={(checked) =>
                                updateQuestion(index, { required: checked })
                              }
                            />
                            <Label className="text-sm">{t('dashboard.form.customQuestions.requiredField')}</Label>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeQuestion(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t('dashboard.form.customQuestions.noQuestions')}</p>
          <p className="text-xs">{t('dashboard.form.customQuestions.noQuestionsHint')}</p>
        </div>
      )}

      {/* Add New Question */}
      <div className="flex gap-2">
        <Select value={newQuestionType} onValueChange={setNewQuestionType}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {QUESTION_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center gap-2">
                  <type.icon className="w-4 h-4" />
                  {type.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={() => addQuestion()} className="flex-1">
          <Plus className="w-4 h-4 mr-2" />
          {t('dashboard.form.customQuestions.addNew')}
        </Button>
      </div>

      {/* Summary */}
      {questions.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">{questions.length}</Badge>
          <span>
            {t('dashboard.form.customQuestions.questionsConfigured', { count: questions.length })}
          </span>
        </div>
      )}
    </div>
  );
}
