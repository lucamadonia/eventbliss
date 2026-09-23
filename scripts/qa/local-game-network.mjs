/** Read-only synthetic content fixtures; no external request is sent. */
export async function installLocalGameNetwork(page, base) {
  const blocked = new Set();
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = request.url();
    if (url.startsWith(base + '/') || /^(data:|blob:)/.test(url)) { void request.continue(); return; }
    blocked.add(new URL(url).origin);
    const headers = {'access-control-allow-origin': base, 'access-control-allow-headers': '*', 'access-control-allow-methods':'GET, OPTIONS', 'content-type':'application/json'};
    if (request.method() === 'OPTIONS') { void request.respond({status: 200, headers, body: ''}); return; }
    if (request.method() !== 'GET') { void request.abort(); return; }
    let body;
    if (url.includes('/rest/v1/closeenough_questions')) body = Array.from({length: 10}, (_, index) => ({
      id:`qa-question-${index}`, name_i18n:{de:'Test',en:'Test'},
      question_i18n:{de:'Wie viele Seiten haben drei Quadrate zusammen?',en:'How many sides do three squares have in total?'},
      frame_key:'custom', answer:12, unit_key:'count', category:'alltag', tolerance_pct:10,
      as_of_year:null,difficulty:1,source_label:'Local QA fixture',source_url:null,
    }));
    if (url.includes('/rest/v1/pixel_images')) body = [{id:'qa-image',image_path:'/images/games/bomb.webp',answers:{de:'Bombe',en:'Bomb'},aliases:[],category:'filme',difficulty:1,credit:'Local QA fixture',source_url:null}];
    if (body) void request.respond({status:200,headers,body:JSON.stringify(body)});
    else void request.abort();
  });
  return blocked;
}
