import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';
// Party-Play QA server only: PGlite RPC bridge + synthetic realtime broker + switchable auth.
// Production builds never load these adapters.
export default defineConfig({ plugins:[react()], cacheDir:'node_modules/.vite-party-play', server:{host:'127.0.0.1',port:5186}, resolve:{alias:[
  {find:'@/integrations/supabase/client',replacement:path.resolve('scripts/qa/party-play-client.ts')},
  {find:'@/components/auth/AuthProvider',replacement:path.resolve('scripts/qa/party-play-auth.tsx')},
  {find:'@/lib/platform',replacement:path.resolve('scripts/qa/controller-platform.ts')},
  {find:'@',replacement:path.resolve('src')},
]}});
