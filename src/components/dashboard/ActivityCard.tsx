import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import {
  Clock,
  MapPin,
  User,
  Euro,
  Phone,
  Mail,
  ExternalLink,
  Edit,
  Trash2,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Send,
  Tag,
  FileText,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CATEGORY_CONFIG, ActivityCategory } from "@/lib/category-config";
import { cn } from "@/lib/utils";

interface Participant {
  id: string;
  name: string;
  role: string;
}

interface Activity {
  id: string;
  title: string;
  description: string | null;
  day_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  location_url: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  estimated_cost: number | null;
  currency: string;
  cost_per_person: boolean;
  requirements: string[] | null;
  notes: string | null;
  responsible_participant_id: string | null;
  category?: string | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  participant_name?: string;
}

interface ActivityCardProps {
  activity: Activity;
  participants: Participant[];
  comments: Comment[];
  onEdit: () => void;
  onDelete: () => void;
  onAddComment: (content: string, participantId: string) => void;
  index: number;
}

export const ActivityCard = ({
  activity,
  participants,
  comments,
  onEdit,
  onDelete,
  onAddComment,
  index,
}: ActivityCardProps) => {
  const { t } = useTranslation();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [selectedParticipant, setSelectedParticipant] = useState("");

  const responsiblePerson = participants.find(
    (p) => p.id === activity.responsible_participant_id
  );

  const formatTime = (time: string | null) => {
    if (!time) return null;
    return time.slice(0, 5);
  };

  const handleSubmitComment = () => {
    if (newComment.trim() && selectedParticipant) {
      onAddComment(newComment.trim(), selectedParticipant);
      setNewComment("");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <GlassCard className="p-4 hover:border-primary/30 transition-all">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {activity.category && CATEGORY_CONFIG[activity.category as ActivityCategory] && (
                  <Badge 
                    className={cn(
                      "text-xs border",
                      CATEGORY_CONFIG[activity.category as ActivityCategory].bgClass,
                      CATEGORY_CONFIG[activity.category as ActivityCategory].colorClass,
                      CATEGORY_CONFIG[activity.category as ActivityCategory].borderClass
                    )}
                  >
                    {CATEGORY_CONFIG[activity.category as ActivityCategory].emoji}{" "}
                    {t(`planner.categories.${activity.category}`)}
                  </Badge>
                )}
                {activity.start_time && (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatTime(activity.start_time)}
                    {activity.end_time && ` - ${formatTime(activity.end_time)}`}
                  </Badge>
                )}
              </div>
              <h3 className="font-bold text-lg">{activity.title}</h3>
              {activity.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {activity.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={onEdit}
                className="h-8 w-8"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('planner.deleteConfirm')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('planner.deleteConfirmDescription')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete}>
                      {t('common.delete')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {/* Location */}
            {activity.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{activity.location}</span>
                {activity.location_url && (
                  <a
                    href={activity.location_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            {/* Responsible Person */}
            {responsiblePerson && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4 flex-shrink-0" />
                <span>{responsiblePerson.name}</span>
              </div>
            )}

            {/* Contact Phone */}
            {activity.contact_phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <a
                  href={`tel:${activity.contact_phone}`}
                  className="hover:text-primary"
                >
                  {activity.contact_phone}
                </a>
              </div>
            )}

            {/* Cost */}
            {activity.estimated_cost && (
              <div className="flex items-center gap-2">
                <Euro className="w-4 h-4 flex-shrink-0 text-primary" />
                <span className="font-medium">
                  {activity.estimated_cost.toFixed(2)} {activity.currency}
                  {activity.cost_per_person && (
                    <span className="text-muted-foreground text-xs ml-1">
                      / {t('planner.perPerson')}
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Requirements */}
          {activity.requirements && activity.requirements.length > 0 && (
            <div className="flex items-start gap-2">
              <Tag className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="flex flex-wrap gap-1">
                {activity.requirements.map((req, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {req}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {activity.notes && (
            <div className="flex items-start gap-2 text-sm">
              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-muted-foreground">{activity.notes}</p>
            </div>
          )}

          {/* Comments Section */}
          <div className="pt-2 border-t border-border/50">
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>
                {comments.length} {comments.length === 1 ? t('planner.comment') : t('planner.comments')}
              </span>
              {showComments ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showComments && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-3"
              >
                {/* Existing Comments */}
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-background/50 rounded-lg p-3 text-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{comment.participant_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(comment.created_at), "dd.MM. HH:mm")}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{comment.content}</p>
                  </div>
                ))}

                {/* New Comment Form */}
                <div className="flex flex-col gap-2">
                  <select
                    value={selectedParticipant}
                    onChange={(e) => setSelectedParticipant(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-background/50 border border-border/50 text-sm"
                  >
                    <option value="">{t('planner.selectParticipant')}</option>
                    {participants.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={t('planner.writeComment')}
                      className="bg-background/50"
                      onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
                    />
                    <Button
                      size="icon"
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || !selectedParticipant}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};
