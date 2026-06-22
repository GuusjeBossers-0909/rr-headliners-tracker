/* RR Smaller Artists — per-profile Instagram extractor (run AFTER navigating to a profile, logged in).
   Returns JSON: {f: <followers int|null>, posts: [{date,type,likes,comments,cap}, ...]} (3 most-recent NON-pinned posts).
   type = 'collab' | 'reel' | 'normal'  (collab takes priority). */
(async()=>{
  function P(s){if(!s)return null;s=s.trim();const k=s.match(/^([\d.,]+)\s*([KMkm])/);if(k){let n=parseFloat(k[1].replace(/\./g,'').replace(',','.'));const u=k[2].toLowerCase();if(u=='k')n*=1e3;if(u=='m')n*=1e6;return Math.round(n);}const d=s.replace(/[^\d]/g,'');return d?parseInt(d,10):null;}
  function dec(c){const t=document.createElement('textarea');t.innerHTML=c;return t.value;}
  const NL={january:'jan',february:'feb',march:'mrt',april:'apr',may:'mei',june:'jun',july:'jul',august:'aug',september:'sep',october:'okt',november:'nov',december:'dec',januari:'jan',februari:'feb',maart:'mrt',mei:'mei',juni:'jun',juli:'jul',augustus:'aug',oktober:'okt'};
  function fd(s){if(!s)return '';let m=s.match(/([A-Za-z]+)\s+(\d{1,2}),?\s*\d{4}/);if(m){return m[2]+' '+(NL[m[1].toLowerCase()]||m[1].slice(0,3).toLowerCase());}m=s.match(/(\d{1,2})\s+([A-Za-z]+)/);if(m){return m[1]+' '+(NL[m[2].toLowerCase()]||m[2].slice(0,3).toLowerCase());}return s.trim().slice(0,12);}
  function fol(){const og=document.querySelector('meta[property="og:description"]');let rough=null;if(og){const m=og.content.match(/([\d.,KMkm]+)\s*(volgers|followers)/i);if(m)rough=P(m[1]);}const cands=[...document.querySelectorAll('span[title]')].map(s=>s.getAttribute('title')).filter(t=>/^\s*[\d.,]+\s*$/.test(t)).map(t=>P(t)).filter(x=>x!=null);if(cands.length){if(rough!=null){let best=cands[0],bd=Infinity;for(const c of cands){const d=Math.abs(c-rough)/rough;if(d<bd){bd=d;best=c;}}return best;}return cands[0];}return rough;}
  const profile=(location.pathname.split('/').filter(Boolean)[0]||'').toLowerCase();
  function ph(){const seen=new Set(),out=[];document.querySelectorAll('main a[href*="/p/"],main a[href*="/reel/"]').forEach(a=>{const h=a.getAttribute('href');if(seen.has(h))return;seen.add(h);const pin=!!a.querySelector('svg[aria-label*="astgezet"],svg[aria-label*="inned"]');const owner=(h.split('/').filter(Boolean)[0]||'').toLowerCase();out.push({h,pin,reel:h.includes('/reel/'),crossAuthor:owner!==profile});});return out;}
  let t0=Date.now(),hs=ph();while(hs.length<5&&Date.now()-t0<9000){await new Promise(z=>setTimeout(z,400));hs=ph();}
  const f=fol();const recent=hs.filter(x=>!x.pin).slice(0,3);const posts=[];
  for(const it of recent){
    let likes=0,comments=0,date='',cap='',collab=it.crossAuthor;
    try{
      const r=await fetch(it.h,{credentials:'include'});const html=await r.text();
      const m=html.match(/<meta property="og:description" content="([^"]*)"/);
      if(m){let c=dec(m[1]);
        const mm=c.match(/([\d.,]+\s*[KMkm]?)\s+(?:likes?|vind-ik-leuks),\s*([\d.,]+\s*[KMkm]?)\s+(?:comments?|reacties)\s*-\s*([\s\S]*?):\s*"?([\s\S]*?)"?\s*$/i);
        if(mm){likes=P(mm[1])||0;comments=P(mm[2])||0;const dm=mm[3].match(/op\s+(.+)$/i);date=fd(dm?dm[1]:mm[3]);cap=mm[4];}
        else{const f2=c.match(/op\s+([^:]+):\s*"?([\s\S]*?)"?\s*$/i);if(f2){date=fd(f2[1]);cap=f2[2];}else cap=c;}
      }
      if(!likes){const lm=html.match(/"like_count":(\d+)/)||html.match(/"edge_media_preview_like":\{"count":(\d+)/)||html.match(/"edge_liked_by":\{"count":(\d+)/);if(lm)likes=parseInt(lm[1]);}
      if(!comments){const cm=html.match(/"comment_count":(\d+)/)||html.match(/"edge_media_to_parent_comment":\{"count":(\d+)/)||html.match(/"edge_media_to_comment":\{"count":(\d+)/);if(cm)comments=parseInt(cm[1]);}
      if(!collab && /"coauthor_producers":\[\s*\{/.test(html)) collab=true;
    }catch(e){}
    const type=collab?'collab':(it.reel?'reel':'normal');
    posts.push({date,type,likes,comments,cap:(cap||'').replace(/\s+/g,' ').slice(0,200)});
  }
  return JSON.stringify({f,posts});
})()
