/**
 * PartyLobbyScreen — die Schaltzentrale eines Party-Abends.
 *
 * Spieler werden einmal angelegt und ueber viele Spiele mitgenommen. Neu ist
 * die SET-LISTE: Der Abend wird im Vorfeld geplant und ist damit schon
 * sichtbar, bevor das erste Spiel laeuft — bisher zeigte die Lobby erst nach
 * dem ersten Spiel ueberhaupt etwas an.
 *
 * Tabelle, Set-Liste und Abschluss liegen in `@/components/native/party/*`,
 * damit diese Datei uebersichtlich bleibt.
 */
import { useState, useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Minus, Trophy, Users, Tv, Crown, Gamepad2,
  X, ChevronRight, RotateCcw, CalendarPlus, ListPlus, Play,
} from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import { usePartySession } from "@/hooks/usePartySession";
import { useBackGuard } from "@/lib/back-guard";
import { PartyGamePicker, type PartyPickerMode } from "@/components/native/PartyGamePicker";
import { PartyFinaleOverlay } from "@/components/native/party/PartyFinaleOverlay";
import { PartySetlistStrip } from "@/components/native/party/PartySetlistStrip";
import { nextFittingIndex } from "@/components/native/party/setlist";
import { TVRemote } from "@/components/native/party/TVRemote";
import { setTvView, resetTvView } from "@/games/tv/tv-view";
import { useTVContext } from "@/contexts/TVBroadcastContext";
import { PartyStandingsList } from "@/components/native/party/PartyStandingsList";
import { EventParticipantPicker } from "@/games/ui/EventParticipantPicker";
import { derivePartyStandings } from "@/games/party/standings";
import { playableGames } from "@/lib/playable-games";
import { spring, stagger, staggerItem, blissBloom } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { getBaseUrl } from "@/lib/platform";

const MAX_PLAYERS = 12;

export default function PartyLobbyScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const haptics = useHaptics();
  const party = usePartySession();
  // Seit der Provider ueber der ganzen App haengt, kann auch die Lobby senden.
  const tv = useTVContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [newName, setNewName] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<PartyPickerMode>("setlist");
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [showFinalLeaderboard, setShowFinalLeaderboard] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  const startSession = party.startSession;
  const isPartyActive = party.isPartyActive;

  /**
   * Zurueck fuehrt hier bewusst zur Spieleuebersicht statt navigate(-1) in die
   * Verlaufsgeschichte: Die Lobby wird aus Spielen heraus wieder betreten
   * (GameBackTarget schickt ?party=true hierher), ein blindes Zurueck landete
   * deshalb schnell in einem gerade beendeten Spiel. Rang "route", damit der
   * Rueckfall NACH Overlays wie Picker oder Finale gefragt wird.
   *
   * Die Sitzung bleibt dabei absichtlich am Leben — beendet wird sie nur ueber
   * "Party beenden". Wer nur kurz wegschaut, findet sie im Fortsetzen-Banner.
   */
  useBackGuard(
    useCallback(() => { navigate("/games"); return true; }, [navigate]),
    true,
    "route",
  );

  // Ohne laufende Sitzung gibt es nichts zu planen — genau einmal beim Betreten.
  useEffect(() => {
    if (!isPartyActive) startSession();
    // Absichtlich nur beim Mounten: ein spaeteres `resetSession` soll die
    // Sitzung nicht sofort wieder auferstehen lassen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const session = party.session;
  const players = useMemo(() => session?.players ?? [], [session]);
  const history = useMemo(() => session?.gameHistory ?? [], [session]);
  const standings = useMemo(
    () => derivePartyStandings(players, history),
    [players, history]
  );
  const canStartGame = players.length >= 2;

  const playlist = session?.playlist ?? [];
  const playlistIndex = session?.playlistIndex ?? 0;
  const playlistActive = session?.playlistActive ?? false;
  /**
   * Der faellige Eintrag — aber der naechste, der zur JETZIGEN Runde passt.
   *
   * Ohne diese Pruefung bot die Lobby stur `playlist[playlistIndex]` an. Geht
   * nach dem Planen jemand, startete der grosse Knopf damit ein Spiel, das mit
   * der verbliebenen Gruppe gar nicht beginnt. Der Uebersprung-Schutz sass
   * bisher allein im Zwischenspiel (`PartyNightFlow`) — an der Lobby vorbei.
   */
  const currentPlaylistIndex = playlistActive
    ? nextFittingIndex(playlist, playlistIndex, players.length)
    : -1;
  const currentPlaylistGame = currentPlaylistIndex >= 0 ? playlist[currentPlaylistIndex] : null;
  const currentPlaylistName = currentPlaylistGame
    ? t(playableGames.find((g) => g.id === currentPlaylistGame)?.nameKey ?? currentPlaylistGame)
    : null;

  const handleAddPlayer = useCallback(() => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if ((party.session?.players.length ?? 0) >= MAX_PLAYERS) return;
    haptics.success();
    party.addPlayer(trimmed);
    setNewName("");
  }, [newName, haptics, party]);

  const handleImportNames = useCallback((names: string[]) => {
    const free = MAX_PLAYERS - (party.session?.players.length ?? 0);
    names.slice(0, Math.max(0, free)).forEach((n) => party.addPlayer(n));
    haptics.success();
  }, [party, haptics]);

  const handleRemovePlayer = useCallback((id: string) => {
    haptics.light();
    party.removePlayer(id);
  }, [haptics, party]);

  const openPicker = useCallback((mode: PartyPickerMode) => {
    haptics.medium();
    setPickerMode(mode);
    setShowPicker(true);
  }, [haptics]);

  const launchGame = useCallback((gameId: string) => {
    party.startGame(gameId);
    setShowPicker(false);
    navigate(`/games/${gameId}?party=true`);
  }, [party, navigate]);

  /**
   * Einen Eintrag der Set-Liste starten — und dabei den Zeiger mitnehmen.
   *
   * Wurden Eintraege uebersprungen (passen nicht zur Gruppengroesse), muss der
   * Zeiger nachgezogen werden. Sonst wuerde das Zwischenspiel nach dem Spiel
   * genau die Eintraege erneut anbieten, die die Lobby gerade uebergangen hat.
   */
  const launchPlaylistEntry = useCallback((gameId: string) => {
    const target = playlist.indexOf(gameId, playlistIndex);
    for (let i = playlistIndex; i >= 0 && i < target; i++) party.advancePlaylist();
    launchGame(gameId);
  }, [playlist, playlistIndex, party, launchGame]);

  const handleSelectGame = useCallback((gameId: string) => {
    haptics.medium();
    launchGame(gameId);
  }, [haptics, launchGame]);

  /** Set-Liste uebernehmen und direkt mit dem ersten Eintrag loslegen. */
  const handleStartSetlist = useCallback((gameIds: string[]) => {
    if (gameIds.length === 0) return;
    haptics.celebrate();
    party.setPlaylist(gameIds);
    // Der Abend eroeffnet auf dem Fernseher mit der Nacht-Route: einmal die
    // ganze Strecke sehen, bevor es losgeht. Danach uebernimmt das Spiel von
    // selbst — ohne diesen Ruecksprung bliebe die Karte ueber der ersten Runde
    // liegen.
    setTvView("map");
    window.setTimeout(resetTvView, 6000);
    launchGame(gameIds[0]);
  }, [party, haptics, launchGame]);

  /**
   * `?finale=1` kommt vom Uebergang nach dem letzten Spiel der Set-Liste.
   * Der Parameter wird sofort entfernt, damit ein Zurueck-Wisch oder ein
   * spaeterer Besuch die Zeremonie nicht ein zweites Mal aufzieht.
   */
  useEffect(() => {
    if (searchParams.get("finale") !== "1") return;
    haptics.celebrate();
    setShowFinalLeaderboard(true);
    // Die Siegerehrung auf den Fernseher holen. `TVPartyFinale` ist seit
    // Langem fertig gebaut und wurde bis hierher von NIRGENDWO ausgeloest —
    // dieselbe Luecke, die der Zwischenstand bis 1.3.8 hatte.
    setTvView("finale");
    const next = new URLSearchParams(searchParams);
    next.delete("finale");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, haptics]);

  /**
   * Ohne gespieltes Spiel gibt es nichts zu feiern — die Zeremonie ueber eine
   * leere Tabelle waere Hohn. Dann fragt der Knopf direkt an Ort und Stelle
   * nach, statt das Finale-Overlay aufzuziehen.
   */
  /**
   * Die Zeremonie ist vorbei — der Fernseher darf nicht auf ihr kleben
   * bleiben. Zurueck auf die Nacht-Route: Sie zeigt den Abend als Ganzes und
   * ist das schoenere Standbild als eine erloschene Siegerehrung.
   */
  useEffect(() => {
    if (showFinalLeaderboard) return;
    setTvView("map");
  }, [showFinalLeaderboard]);

  const handleEndParty = useCallback(() => {
    if (history.length === 0) {
      haptics.light();
      setConfirmEnd(true);
      return;
    }
    haptics.celebrate();
    setShowFinalLeaderboard(true);
  }, [haptics, history.length]);

  const handleConfirmEnd = useCallback(() => {
    party.resetSession();
    setShowFinalLeaderboard(false);
    setConfirmEnd(false);
    navigate("/games");
  }, [party, navigate]);

  const handleCopyTvLink = useCallback(async () => {
    if (!party.tvCode) return;
    haptics.success();
    try {
      await navigator.clipboard.writeText(`${getBaseUrl()}/tv/${party.tvCode}?lang=${i18n.language}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Zwischenablage nicht verfuegbar — der Code steht ja daneben.
    }
  }, [party.tvCode, haptics]);

  return (
    <div className="relative h-full overflow-y-auto native-scroll bg-background safe-top">
      {/* Ambiente */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-32 -start-32 w-64 h-64 bg-[#df8eff]/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-32 -end-32 w-64 h-64 bg-[#ff6b98]/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#8ff5ff]/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 pb-tabbar">
        {/* Kopf */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <motion.h1
                className="text-3xl font-display font-bold text-foreground"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {t('nativeExtra.partyLobby.title')}
              </motion.h1>
              <motion.p
                className="text-sm text-muted-foreground mt-0.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {t('nativeExtra.partyLobby.subtitle', { players: players.length, games: history.length })}
              </motion.p>
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => { haptics.light(); navigate("/games"); }}
              aria-label={t('common.close', 'Schließen')}
              className="cursor-pointer w-11 h-11 shrink-0 rounded-full bg-foreground/5 border border-border flex items-center justify-center"
            >
              <X className="w-5 h-5 text-muted-foreground" aria-hidden />
            </motion.button>
          </div>
        </div>

        {/* Set-Liste — sichtbar, bevor das erste Spiel laeuft */}
        <PartySetlistStrip
          playlist={playlist}
          playlistIndex={playlistIndex}
          playlistActive={playlistActive}
          playerCount={players.length}
          onEdit={() => openPicker("setlist")}
          onPlayCurrent={launchPlaylistEntry}
        />

        {/* Spieler */}
        <section className="px-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" aria-hidden />
              {t('nativeExtra.partyLobby.playersHeading', { count: players.length, max: MAX_PLAYERS })}
            </h2>
          </div>

          <motion.div className="space-y-2" variants={stagger} initial="initial" animate="animate">
            <AnimatePresence initial={false}>
              {players.map((player) => (
                <motion.div
                  key={player.id}
                  layout
                  variants={staggerItem}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: player.color + "30", borderColor: player.color, borderWidth: 2 }}
                  >
                    {player.avatar}
                  </div>
                  <div className="flex-1 min-w-0 text-start">
                    <p className="text-sm font-semibold text-foreground truncate">{player.name}</p>
                    {player.gamesPlayed > 0 && (
                      <p className="text-[11px] text-muted-foreground">
                        {t('nativeExtra.partyLobby.playerRowStats', { points: player.totalScore, wins: player.gamesWon })}
                      </p>
                    )}
                  </div>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleRemovePlayer(player.id)}
                    aria-label={t('nativeExtra.partyNight.removePlayer', { name: player.name })}
                    className="cursor-pointer w-11 h-11 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0"
                  >
                    <Minus className="w-4 h-4 text-red-400" aria-hidden />
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {players.length < MAX_PLAYERS && (
            <>
              <motion.div
                className="flex items-center gap-2 mt-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddPlayer()}
                  placeholder={t('nativeExtra.partyLobby.namePlaceholder')}
                  maxLength={20}
                  className="flex-1 h-11 px-4 rounded-xl bg-foreground/5 border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={handleAddPlayer}
                  disabled={!newName.trim()}
                  aria-label={t('nativeExtra.partyNight.addPlayer')}
                  className={cn(
                    "cursor-pointer h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-all",
                    newName.trim()
                      ? "bg-primary text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                      : "bg-foreground/5 text-muted-foreground border border-border"
                  )}
                >
                  <Plus className="w-5 h-5" aria-hidden />
                </motion.button>
              </motion.div>

              <button
                type="button"
                onClick={() => setShowEventPicker(true)}
                className="cursor-pointer mt-2 w-full flex items-center justify-center gap-2 min-h-[44px] rounded-xl text-sm font-medium text-primary bg-primary/10 border border-primary/25"
              >
                <CalendarPlus className="w-4 h-4" aria-hidden />
                {t('nativeExtra.partyNight.importFromEvent')}
              </button>
            </>
          )}
        </section>

        <EventParticipantPicker
          open={showEventPicker}
          onClose={() => setShowEventPicker(false)}
          onSelect={handleImportNames}
        />

        {/* TV-Verbindung */}
        {party.tvCode && (
          <section className="px-5 mb-5">
            <motion.div
              className="p-4 rounded-2xl bg-[#df8eff]/5 border border-[#df8eff]/15"
              variants={blissBloom}
              initial="initial"
              animate="animate"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#df8eff]/20 flex items-center justify-center shrink-0">
                  <Tv className="w-5 h-5 text-violet-500 dark:text-[#df8eff]" aria-hidden />
                </div>
                <div className="flex-1 min-w-0 text-start">
                  <p className="text-sm font-semibold text-foreground">{t('nativeExtra.connectTV')}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {getBaseUrl()}/tv/{party.tvCode}
                  </p>
                </div>
                <div className="text-center shrink-0">
                  <p className="text-xl font-display font-black text-violet-500 dark:text-[#df8eff] tracking-[0.15em]">
                    {party.tvCode}
                  </p>
                </div>
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={handleCopyTvLink}
                className="cursor-pointer w-full mt-3 min-h-[44px] rounded-xl bg-[#df8eff]/10 border border-[#df8eff]/20 text-violet-500 dark:text-[#df8eff] text-xs font-semibold"
              >
                {copied ? t('common.copied') : t('nativeExtra.partyLobby.copyTvLink')}
              </motion.button>

              {/*
                Die Fernbedienung. Bis hierher zeigte diese Karte nur den Code —
                die Lobby lag ausserhalb des Providers und konnte gar nichts
                senden. Der Zwischenstand und die fertig gebaute Siegerehrung
                waren von hier aus unerreichbar.
              */}
              {tv?.isActive && (
                <div className="mt-3 pt-3 border-t border-[#df8eff]/15">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('tv.remote.title')}
                  </p>
                  <TVRemote isActive variant="card" />
                </div>
              )}
            </motion.div>
          </section>
        )}

        {/* Gesamtwertung */}
        {history.length > 0 && (
          <section className="px-5 mb-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4" aria-hidden /> {t('nativeExtra.partyLobby.overallScore')}
            </h2>
            <PartyStandingsList standings={standings} compact />
          </section>
        )}

        {/* Historie */}
        {history.length > 0 && (
          <section className="px-5 mb-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
              <Gamepad2 className="w-4 h-4" aria-hidden /> {t('nativeExtra.partyLobby.gamesPlayedHeading')}
            </h2>
            <div className="space-y-2">
              {[...history].reverse().map((entry, i) => (
                <motion.div
                  key={`${entry.gameId}-${entry.playedAt}`}
                  className="p-3 rounded-xl bg-card border border-border"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 6) * 0.05 }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{entry.gameName}</p>
                    {entry.scored && entry.winnerName && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Crown className="w-3.5 h-3.5 text-amber-500 dark:text-[#f9ca24]" aria-hidden />
                        <span className="text-xs font-medium text-muted-foreground">{entry.winnerName}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Aktionen */}
        <div className="px-5 space-y-3">
          {currentPlaylistGame && currentPlaylistName ? (
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              transition={spring.snappy}
              onClick={() => { haptics.medium(); launchPlaylistEntry(currentPlaylistGame); }}
              disabled={!canStartGame}
              className={cn(
                "cursor-pointer w-full min-h-[56px] rounded-2xl font-bold text-base flex items-center justify-center gap-2.5 transition-all",
                canStartGame
                  ? "bg-gradient-to-r from-[#df8eff] via-[#ff6b98] to-[#f9ca24] text-white shadow-[0_0_30px_rgba(223,142,255,0.3)]"
                  : "bg-foreground/5 text-muted-foreground border border-border cursor-not-allowed"
              )}
            >
              <Play className="w-5 h-5" aria-hidden />
              <span className="truncate">
                {t('nativeExtra.partyNight.continueSetlist', { game: currentPlaylistName })}
              </span>
            </motion.button>
          ) : (
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              transition={spring.snappy}
              onClick={() => openPicker("setlist")}
              disabled={!canStartGame}
              className={cn(
                "cursor-pointer w-full min-h-[56px] rounded-2xl font-bold text-base flex items-center justify-center gap-2.5 transition-all",
                canStartGame
                  ? "bg-gradient-to-r from-[#df8eff] via-[#ff6b98] to-[#f9ca24] text-white shadow-[0_0_30px_rgba(223,142,255,0.3)]"
                  : "bg-foreground/5 text-muted-foreground border border-border cursor-not-allowed"
              )}
            >
              <ListPlus className="w-5 h-5" aria-hidden />
              {t('nativeExtra.partyNight.planEvening')}
              <ChevronRight className="w-5 h-5 rtl:rotate-180" aria-hidden />
            </motion.button>
          )}

          <button
            type="button"
            onClick={() => openPicker("single")}
            disabled={!canStartGame}
            className={cn(
              "cursor-pointer w-full min-h-[48px] rounded-2xl border border-border font-semibold text-sm flex items-center justify-center gap-2 transition-colors",
              canStartGame
                ? "text-foreground active:bg-foreground/5"
                : "text-muted-foreground cursor-not-allowed opacity-60"
            )}
          >
            <Gamepad2 className="w-4 h-4" aria-hidden />
            {t('nativeExtra.partyNight.singleGame')}
          </button>

          {!canStartGame && (
            <p className="text-xs text-center text-muted-foreground">
              {t('nativeExtra.partyLobby.needTwoPlayers')}
            </p>
          )}

          {/*
            Bewusst NICHT hinter history.length > 0: Eine Party mit Spielern,
            aber noch ohne Spiel, war sonst gar nicht mehr zu beenden — die
            Sitzung ueberlebte im localStorage und kam ueber das Fortsetzen-
            Banner sofort zurueck.
          */}
          {confirmEnd ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring.snappy}
              className="flex gap-2"
            >
              <button
                type="button"
                onClick={handleConfirmEnd}
                className="cursor-pointer flex-1 min-h-[48px] rounded-2xl bg-red-500/15 border border-red-400/30 text-red-500 dark:text-red-400 font-semibold text-sm"
              >
                {t('nativeExtra.partyLobby.endConfirm')}
              </button>
              <button
                type="button"
                onClick={() => { haptics.light(); setConfirmEnd(false); }}
                className="cursor-pointer flex-1 min-h-[48px] rounded-2xl bg-foreground/5 border border-border text-muted-foreground font-semibold text-sm"
              >
                {t('common.cancel')}
              </button>
            </motion.div>
          ) : (
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={handleEndParty}
              className="cursor-pointer w-full min-h-[48px] rounded-2xl border border-border text-muted-foreground font-semibold text-sm flex items-center justify-center gap-2 active:bg-foreground/5 transition-colors"
            >
              <RotateCcw className="w-4 h-4" aria-hidden />
              {t('nativeExtra.partyLobby.endParty')}
            </motion.button>
          )}
        </div>
      </div>

      <PartyGamePicker
        open={showPicker}
        onClose={() => setShowPicker(false)}
        onSelectGame={handleSelectGame}
        playerCount={players.length}
        mode={pickerMode}
        initialSetlist={playlist}
        onStartSetlist={handleStartSetlist}
      />

      <PartyFinaleOverlay
        open={showFinalLeaderboard}
        standings={standings}
        gamesPlayed={history.length}
        playerCount={players.length}
        onDone={handleConfirmEnd}
      />
    </div>
  );
}
