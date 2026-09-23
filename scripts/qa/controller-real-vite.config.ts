import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';
import fs from 'node:fs';
const config=JSON.parse(fs.readFileSync('scripts/tmp/controller-native-public.json','utf8'));
const url='http://127.0.0.1:56321';
// Real local Supabase/Auth; only native route eligibility is simulated.
export default defineConfig({plugins:[{name:'qa-tv-observer',enforce:'pre',transform(code,id){if(id.replaceAll('\\','/').endsWith('/games/tv/useTVConnection.ts'))return code.replace('return { isConnected, players, gameState, leaderboard, drawing, gameStarted, gameEnded, error };','window.__qaTVHook = { isConnected, gameState, gameStarted, gameEnded }; return { isConnected, players, gameState, leaderboard, drawing, gameStarted, gameEnded, error };');}},react()],cacheDir:'node_modules/.vite-controller-real',server:{host:'127.0.0.1',port:5185},define:{'import.meta.env.VITE_SUPABASE_URL':JSON.stringify(url),'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY':JSON.stringify(config.anonKey)},resolve:{alias:[
 {find:'@/lib/platform',replacement:path.resolve('scripts/qa/controller-platform.ts')},
 {find:'@',replacement:path.resolve('src')},
]}});
