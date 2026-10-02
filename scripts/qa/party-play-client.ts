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
const query=(table?:string):any=>{const result={data:table==='subscriptions'&&(window as any).controllerPremium?{plan:'premium',expires_at:null,stripe_subscription_id:null}:null,error:null};const builder:any=new Proxy(function(){},{get:(_t,key)=>key==='then'?(resolve:any,reject:any)=>Promise.resolve(result).then(resolve,reject):()=>builder,apply:()=>builder});return builder;};
export const supabase:any = {
  channel:(topic:string)=>byTopic.get(`realtime:${topic}`)&&byTopic.get(`realtime:${topic}`)!.state!=='closed'?byTopic.get(`realtime:${topic}`):new LocalChannel(topic),
  removeChannel:(channel:LocalChannel)=>channel.unsubscribe(),
  removeAllChannels:async()=>{await Promise.all([...channels.values()].map(c=>c.unsubscribe()));},
  getChannels:()=>[...channels.values()],
  realtime:{connectionState:()=>'open',isDisconnecting:()=>false,setAuth:()=>{}},
  rpc:async(name:string,args:any)=>name==='controller_party_request'?window.controllerRPC(args):{data:null,error:null},
  from:query, storage:{from:query}, functions:{invoke:async()=>({data:{isPremium:true},error:null})},
  auth:{
    getSession:async()=>({data:{session:session()},error:null}),
    getUser:async()=>({data:{user:window.controllerIdentity??null},error:null}),
    onAuthStateChange:(fn:(event:string,session:unknown)=>void)=>{authListeners.add(fn);return {data:{subscription:{unsubscribe(){authListeners.delete(fn);}}}};},
    signOut:async()=>{window.partyQAAuth(null);return {error:null};},
    updateUser:async(update:any)=>{Object.assign(window.controllerIdentity?.user_metadata??{},update?.data??{});return {data:{user:window.controllerIdentity},error:null};},
  },
};
