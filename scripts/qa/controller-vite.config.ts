import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';
// Test server only: production builds never load these adapters.
export default defineConfig({ plugins:[react()], server:{host:'127.0.0.1',port:5183}, resolve:{alias:[
  {find:'@/integrations/supabase/client',replacement:path.resolve('scripts/qa/controller-client.ts')},
  {find:'@/components/auth/AuthProvider',replacement:path.resolve('scripts/qa/controller-auth.tsx')},
  {find:'@/lib/platform',replacement:path.resolve('scripts/qa/controller-platform.ts')},
  {find:'@',replacement:path.resolve('src')},
]}});
