import {readFile} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
export async function createRealDB(){
 const env=JSON.parse(await readFile(new URL('../tmp/controller-supabase-status.json',import.meta.url),'utf8'));
 if(env.API_URL!=='http://127.0.0.1:56321')throw new Error('Local QA only');
 const admin=createClient(env.API_URL,env.SERVICE_ROLE_KEY,{auth:{persistSession:false}}),users=[];
 return {
  url:env.API_URL,anonKey:env.ANON_KEY,
  async seedUser(requestedId,{premium=false}={}){
   const email=`qa-${requestedId}-${Date.now()}@example.test`,password=`Local-${crypto.randomUUID()}!`;
   const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true});if(error)throw error;
   users.push(data.user.id);
   const subscription=await admin.from('subscriptions').insert({user_id:data.user.id,plan:premium?'premium':'free'});if(subscription.error)throw subscription.error;
   return {userId:data.user.id,email,password};
  },
  async close(){for(const user of users)await admin.auth.admin.deleteUser(user);await admin.removeAllChannels();}
 };
}
