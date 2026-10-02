// Device-only scenarios (masterplan level G / Video). Listed in every full run as MANUAL
// with the checklist the tester signs off in docs/qa/party-play-<date>.md.
export const manualScenarios = [
  { id: 'A02', title: 'App not installed', checklist: ['Uninstall app; scan TV QR with camera', 'Web page shows code + App Store / Google Play links', 'Install, open app, enter code → join works'] },
  { id: 'A04', title: 'App cold start vs. background', checklist: ['Force-quit app, scan QR → lands in join', 'App in background (other party screen), scan QR → lands in join, no double navigation'] },
  { id: 'A11', title: 'Fresh install, Universal/App Link', checklist: ['iOS: fresh install, tap event-bliss.com/party/join/CODE in Notes → app opens', 'Android: same via Messages; verify assetlinks', 'If link opens browser: web fallback offers code + store'] },
  { id: 'G07', title: 'QR scannable from 3 m', checklist: ['Tizen, webOS, Fire TV browser at 1080p and 4K', 'iPhone + Android camera at 3 m, normal room light', 'QR ≥ 30 % screen height, white quiet zone'] },
  { id: 'G08', title: 'Fullscreen / screensaver', checklist: ['Fullscreen button works on each TV browser', 'TV does not dim/sleep for 30 min during lobby and game'] },
  { id: 'H01', title: 'iOS background ↔ foreground', checklist: ['In lobby and mid-game: home button 30 s, return', 'Reconnects without double navigation, same seat, no duplicate result'] },
  { id: 'H02', title: 'Android back button everywhere', checklist: ['Who-are-you, profile, lobby, every game, handover, kick sheet', 'Never leaves the party without confirmation'] },
  { id: 'T-5', title: 'Confetti T16 simultaneous (video)', checklist: ['Film TV + 3 phones in one shot at 60 fps during finale', 'Confetti start frames within 15 frames (250 ms)'] },
  { id: 'P', title: 'Playtests (12.3)', checklist: ['Family / JGA / tech-savvy group', 'Scan→first game ≤ 2 min; handover ≤ 5 s; 0 technical aborts; "again?" ≥ 8/10'] },
];
