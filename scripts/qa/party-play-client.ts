// Party-Play QA adapter for the Node broker (party-play-harness.mjs).
// Same wire as controller-client.ts, plus: switchable sign-in (A03), topic
// names like the real SDK ("realtime:<topic>") and a permissive query stub.
type Handler = {type:string;event:string;callback:(message:any)=>void};
const channels = new Map<string, LocalChannel>();
const byTopic = new Map<string, LocalChannel>();
class LocalChannel {
  id=crypto.randomUUID(); state='joining'; handlers:Handler[]=[]; presence:Record<string,unknown>={};
  status?: (state:string)=>void;
  topic:string;
  constructor(public name:string){this.topic=`realtime:${name}`;channels.set(this.id,this);byTopic.set(this.topic,this);}
  on(type:string,filter:{event:string},callback:Handler['callback']){this.handlers.push({type,event:filter?.event,callback});return this;}
  subscribe(callback?:(state:string)=>void){this.status=callback;void window.controllerWire({kind:'subscribe',id:this.id,topic:this.name}).then(()=>{if(this.state==='closed')return;this.state='joined';callback?.('SUBSCRIBED');});return this;}
  async track(presence:unknown){await window.controllerWire({kind:'track',id:this.id,presence});return 'ok';}
  async untrack(){await window.controllerWire({kind:'track',id:this.id,presence:null});return 'ok';}
  async unsubscribe(){this.state='closed';channels.delete(this.id);if(byTopic.get(this.topic)===this)byTopic.delete(this.topic);await window.controllerWire({kind:'remove',id:this.id});return 'ok';}
  presenceState(){return this.presence;}
  async send(message:unknown){await window.controllerWire({kind:'send',id:this.id,message});return 'ok';}
}
window.controllerDeliver = (packet:any) => {
  const channel=channels.get(packet.id);if(!channel)return;
  if(packet.kind==='presence')channel.presence=packet.presence;
  if(packet.kind==='disconnect'){channel.state='closed';channel.status?.('CHANNEL_ERROR');return;}
  // QA: last payload per broadcast event (game rosters / active player for the kick matrix).
  if(packet.kind==='broadcast'&&packet.message?.event){
    const w=window as any;let event=packet.message.event,payload=packet.message.payload;
    // Signed room packets: key by the inner event and keep the inner data.
    if(event==='room-wire'&&typeof payload?.body==='string'){try{const b=JSON.parse(payload.body);event=`room:${b.event}`;payload=b.data;}catch{/* opaque */}}
    (w.__qaBroadcasts??={})[event]={at:performance.timeOrigin+performance.now(),payload};
    // Ordered log of everything received (repro of TV hangs), capped.
    const log=(w.__qaPacketLog??=[]);log.push({at:performance.timeOrigin+performance.now(),topic:channel.name,event,game:payload?.game,phase:payload?.phase,keys:payload&&typeof payload==='object'?Object.keys(payload).slice(0,12):[]});if(log.length>800)log.splice(0,log.length-800);
  }
  const type=packet.kind==='presence'?'presence':'broadcast';
  const event=packet.kind==='presence'?'sync':packet.message.event;
  channel.handlers.filter(h=>h.type===type&&(h.event===event||h.event==='*')).forEach(h=>h.callback({event,payload:packet.message?.payload}));
};
const authListeners=new Set<(event:string,session:unknown)=>void>();
const session=()=>window.controllerIdentity?{user:window.controllerIdentity,access_token:'synthetic-local-only'}:null;
/** Harness-driven sign-in/out; listeners mirror supabase.auth.onAuthStateChange. */
window.partyQAAuth=(identity:any)=>{window.controllerIdentity=identity;for(const fn of authListeners)fn(identity?'SIGNED_IN':'SIGNED_OUT',session());};
// Table reads return nothing, except the premium row for devices opened with premium (usePremium reads it).
// Content tables some games load (same fixtures as local-game-network.mjs; images are same-origin).
const FIXTURES:Record<string,unknown>={
  pixel_images:['bomb','headup','taboo','category','brew','ohrwurm'].map((g,i)=>({id:`qa-image-${i}`,image_path:`/images/games/${g}.webp`,answers:{de:g,en:g},aliases:[],category:'filme',difficulty:1,credit:'Local QA fixture',source_url:null})),
  closeenough_questions:Array.from({length:10},(_,i)=>({id:`qa-question-${i}`,name_i18n:{de:'Test',en:'Test'},question_i18n:{de:'Wie viele Seiten haben drei Quadrate zusammen?',en:'How many sides do three squares have in total?'},frame_key:'custom',answer:12,unit_key:'count',category:'alltag',tolerance_pct:10,as_of_year:null,difficulty:1,source_label:'Local QA fixture',source_url:null})),
};
// Like supabase-js, from() itself is not thenable (closeenough awaits an async helper returning it);
// only the filter builder after the first call resolves to {data,error}.
const query=(table?:string):any=>{const result={data:table==='subscriptions'?((window as any).controllerPremium?{plan:'premium',expires_at:null,stripe_subscription_id:null}:null):(table&&FIXTURES[table])??null,error:null};const builder:any=new Proxy(function(){},{get:(_t,key)=>key==='then'?(resolve:any,reject:any)=>Promise.resolve(result).then(resolve,reject):()=>builder,apply:()=>builder});return new Proxy({},{get:(_t,key)=>key==='then'?undefined:()=>builder});};
export const supabase:any = {
  channel:(topic:string)=>byTopic.get(`realtime:${topic}`)&&byTopic.get(`realtime:${topic}`)!.state!=='closed'?byTopic.get(`realtime:${topic}`):new LocalChannel(topic),
  removeChannel:(channel:LocalChannel)=>channel.unsubscribe(),
  removeAllChannels:async()=>{await Promise.all([...channels.values()].map(c=>c.unsubscribe()));},
  getChannels:()=>[...channels.values()],
  realtime:{connectionState:()=>'open',isDisconnecting:()=>false,setAuth:()=>{}},
  rpc:async(name:string,args:any)=>name==='controller_party_request'||name==='controller_party_upgrade'
    ? window.controllerRPC({...args,name}):{data:null,error:null},
  from:query, storage:{from:query}, functions:{invoke:async()=>({data:{isPremium:true},error:null})},
  auth:{
    getSession:async()=>({data:{session:session()},error:null}),
    getUser:async()=>({data:{user:window.controllerIdentity??null},error:null}),
    onAuthStateChange:(fn:(event:string,session:unknown)=>void)=>{authListeners.add(fn);return {data:{subscription:{unsubscribe(){authListeners.delete(fn);}}}};},
    signOut:async()=>{window.partyQAAuth(null);return {error:null};},
    updateUser:async(update:any)=>{Object.assign(window.controllerIdentity?.user_metadata??{},update?.data??{});return {data:{user:window.controllerIdentity},error:null};},
  },
};
