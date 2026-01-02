import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  ClipboardCheck,
  Download,
  Filter,
  CheckCircle,
  HelpCircle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EventData } from "@/hooks/useEvent";

interface Response {
  id: string;
  participant: string;
  attendance: string;
  budget: string;
  destination: string;
  duration_pref: string;
  travel_pref: string;
  fitness_level: string;
  alcohol: string | null;
  restrictions: string | null;
  suggestions: string | null;
  partial_days: string | null;
  preferences: string[];
  date_blocks: string[];
  created_at: string;
}

interface ResponsesTabProps {
  event: EventData;
  responses: Response[];
  isLoading: boolean;
}

export function ResponsesTab({ event, responses, isLoading }: ResponsesTabProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<string>("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const filteredResponses = responses.filter((r) => {
    if (filter === "all") return true;
    return r.attendance === filter;
  });

  const getAttendanceIcon = (attendance: string) => {
    switch (attendance) {
      case "yes":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "maybe":
        return <HelpCircle className="w-4 h-4 text-warning" />;
      case "no":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getAttendanceBadge = (attendance: string) => {
    switch (attendance) {
      case "yes":
        return (
          <Badge variant="default" className="bg-success/20 text-success border-success/30">
            {t("dashboard.responses.attendance.yes")}
          </Badge>
        );
      case "maybe":
        return (
          <Badge variant="default" className="bg-warning/20 text-warning border-warning/30">
            {t("dashboard.responses.attendance.maybe")}
          </Badge>
        );
      case "no":
        return (
          <Badge variant="default" className="bg-destructive/20 text-destructive border-destructive/30">
            {t("dashboard.responses.attendance.no")}
          </Badge>
        );
      default:
        return <Badge variant="outline">{attendance}</Badge>;
    }
  };

  const exportCsv = () => {
    const headers = [
      t("dashboard.responses.columns.name"),
      t("dashboard.responses.columns.attendance"),
      t("dashboard.responses.columns.duration"),
      t("dashboard.responses.columns.budget"),
      t("dashboard.responses.columns.destination"),
      t("dashboard.responses.columns.fitness"),
      t("dashboard.responses.columns.alcohol"),
      t("dashboard.responses.columns.restrictions"),
      t("dashboard.responses.columns.suggestions"),
    ];

    const rows = filteredResponses.map((r) => [
      r.participant,
      r.attendance,
      r.duration_pref,
      r.budget,
      r.destination,
      r.fitness_level,
      r.alcohol || "",
      r.restrictions || "",
      r.suggestions || "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${event.slug}-responses.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <GlassCard className="p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">{t("dashboard.responses.loading")}</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <GlassCard className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <ClipboardCheck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{t("dashboard.responses.title")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.responses.subtitle", { count: responses.length })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Filter */}
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder={t("dashboard.responses.filter")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  <SelectItem value="yes">{t("dashboard.responses.attendance.yes")}</SelectItem>
                  <SelectItem value="maybe">{t("dashboard.responses.attendance.maybe")}</SelectItem>
                  <SelectItem value="no">{t("dashboard.responses.attendance.no")}</SelectItem>
                </SelectContent>
              </Select>

              {/* Export */}
              <Button variant="outline" onClick={exportCsv} disabled={responses.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                {t("dashboard.responses.exportCsv")}
              </Button>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Responses Table */}
      {filteredResponses.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">{t("dashboard.responses.noResponses")}</h3>
          <p className="text-muted-foreground">{t("dashboard.responses.noResponsesDesc")}</p>
        </GlassCard>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassCard className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">{t("dashboard.responses.columns.name")}</TableHead>
                  <TableHead className="w-[120px]">{t("dashboard.responses.columns.attendance")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("dashboard.responses.columns.duration")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("dashboard.responses.columns.budget")}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t("dashboard.responses.columns.destination")}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t("dashboard.responses.columns.fitness")}</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResponses.map((response) => {
                  const isExpanded = expandedRow === response.id;
                  return (
                    <>
                      <TableRow
                        key={response.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setExpandedRow(isExpanded ? null : response.id)}
                      >
                        <TableCell className="font-medium">{response.participant}</TableCell>
                        <TableCell>{getAttendanceBadge(response.attendance)}</TableCell>
                        <TableCell className="hidden md:table-cell">{response.duration_pref}</TableCell>
                        <TableCell className="hidden md:table-cell">{response.budget}</TableCell>
                        <TableCell className="hidden lg:table-cell">{response.destination}</TableCell>
                        <TableCell className="hidden lg:table-cell">{response.fitness_level}</TableCell>
                        <TableCell>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={`${response.id}-details`}>
                          <TableCell colSpan={7} className="bg-muted/30 p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-muted-foreground">
                                  {t("dashboard.responses.columns.duration")}:
                                </span>{" "}
                                {response.duration_pref}
                              </div>
                              <div>
                                <span className="font-medium text-muted-foreground">
                                  {t("dashboard.responses.columns.budget")}:
                                </span>{" "}
                                {response.budget}
                              </div>
                              <div>
                                <span className="font-medium text-muted-foreground">
                                  {t("dashboard.responses.columns.destination")}:
                                </span>{" "}
                                {response.destination}
                              </div>
                              <div>
                                <span className="font-medium text-muted-foreground">
                                  {t("dashboard.responses.columns.fitness")}:
                                </span>{" "}
                                {response.fitness_level}
                              </div>
                              <div>
                                <span className="font-medium text-muted-foreground">
                                  {t("dashboard.responses.columns.alcohol")}:
                                </span>{" "}
                                {response.alcohol || "-"}
                              </div>
                              <div>
                                <span className="font-medium text-muted-foreground">
                                  {t("dashboard.responses.columns.travel")}:
                                </span>{" "}
                                {response.travel_pref}
                              </div>
                              {response.preferences && response.preferences.length > 0 && (
                                <div className="sm:col-span-2 lg:col-span-3">
                                  <span className="font-medium text-muted-foreground">
                                    {t("dashboard.responses.columns.activities")}:
                                  </span>{" "}
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {response.preferences.map((pref, i) => (
                                      <Badge key={i} variant="secondary" className="text-xs">
                                        {pref}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {response.restrictions && (
                                <div className="sm:col-span-2 lg:col-span-3">
                                  <span className="font-medium text-muted-foreground">
                                    {t("dashboard.responses.columns.restrictions")}:
                                  </span>{" "}
                                  {response.restrictions}
                                </div>
                              )}
                              {response.suggestions && (
                                <div className="sm:col-span-2 lg:col-span-3">
                                  <span className="font-medium text-muted-foreground">
                                    {t("dashboard.responses.columns.suggestions")}:
                                  </span>{" "}
                                  {response.suggestions}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
}
