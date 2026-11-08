// Browser adapter for the local Node broker. Real RoomSession signs/verifies
// packets; only the Supabase wire and synthetic authentication are replaced.
type Handler = {type:string;event:string;callback:(message:any)=>void};
const channels = new Map<string, LocalChannel>();
class LocalChannel {
  id=crypto.randomUUID(); state='joining'; handlers:Handler[]=[]; presence:Record<string,unknown>={};
  status?: (state:string)=>void;
  constructor(public topic:string){channels.set(this.id,this);}
  on(type:string,filter:{event:string},callback:Handler['callback']){this.handlers.push({type,event:filter.event,callback});return this;}
  subscribe(callback:(state:string)=>void){this.status=callback;void window.controllerWire({kind:'subscribe',id:this.id,topic:this.topic}).then(()=>{this.state='joined';callback('SUBSCRIBED');});return this;}
  async track(presence:unknown){await window.controllerWire({kind:'track',id:this.id,presence});return 'ok';}
  async untrack(){await window.controllerWire({kind:'track',id:this.id,presence:null});return 'ok';}
  async unsubscribe(){this.state='closed';await window.controllerWire({kind:'remove',id:this.id});channels.delete(this.id);return 'ok';}
  presenceState(){return this.presence;}
  async send(message:unknown){await window.controllerWire({kind:'send',id:this.id,message});return 'ok';}
}
window.controllerDeliver = (packet:any) => {
  const channel=channels.get(packet.id);if(!channel)return;
  if(packet.kind==='presence')channel.presence=packet.presence;
  if(packet.kind==='disconnect'){channel.state='closed';channel.status?.('CHANNEL_ERROR');return;}
  const type=packet.kind==='presence'?'presence':'broadcast';
  const event=packet.kind==='presence'?'sync':packet.message.event;
  channel.handlers.filter(h=>h.type===type&&(h.event===event||h.event==='*')).forEach(h=>h.callback({event,payload:packet.message?.payload}));
};
const session=()=>({user:window.controllerIdentity,access_token:'synthetic-local-only'});
const query=(table?:string)=>{const result=table==='pixel_images'
  ? {data:[{id:'qa-pixel',image_path:'/images/form-templates/tropical-paradise.webp',answers:{de:'Tropen',en:'Tropics'},aliases:[],category:'orte',difficulty:1,credit:'EventBliss QA',source_url:null}],error:null}
  : {data:null,error:null};
  const builder:any={then:(resolve:any)=>Promise.resolve(result).then(resolve)};for(const name of ['select','eq','in','order','limit','maybeSingle','single','update','insert','upsert'])builder[name]=()=>builder;return builder;};
export const supabase:any = {
  channel:(topic:string)=>new LocalChannel(topic),
  removeChannel:(channel:LocalChannel)=>channel.unsubscribe(),
  rpc:async(name:string,args:any)=>name==='controller_party_request'?window.controllerRPC(args):{data:null,error:null},
  from:query, functions:{invoke:async()=>({data:{isPremium:true},error:null})},
  auth:{getSession:async()=>({data:{session:session()}}),getUser:async()=>({data:{user:window.controllerIdentity}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},
};
