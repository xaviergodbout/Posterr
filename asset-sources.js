// Provider adapters for a static, browser-only poster editor.
const AssetSources = (() => {
  const names = {tmdb:'TMDB',tvmaze:'TVmaze',fanart:'Fanart.tv'};
  const defaults = {tvmaze:true,fanartProject:'',fanartPersonal:''};
  function publicURL(value,source) {
    try {const u=new URL(value);const hosts=source==='tvmaze'?['static.tvmaze.com']:source==='fanart'?['assets.fanart.tv']:[];
      if(!['http:','https:'].includes(u.protocol)||!hosts.includes(u.hostname)||u.username||u.password||u.search||u.hash)return null;
      u.protocol='https:';return u.href;
    } catch {return null}
  }
  function language(value) {return value==='00'||value===null?null:/^[a-z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/.test(value||'')?value:'und'}
  function normalize(asset,source) {
    const url=publicURL(asset.url,source);if(!url)return null;
    return {source,url,type:asset.type==='background'?'background':asset.type==='logo'?'logo':'poster',iso_639_1:language(asset.lang??'und'),width:Number(asset.width)||0,height:Number(asset.height)||0,season:asset.season!=null&&Number.isInteger(Number(asset.season))&&asset.season!==''?Number(asset.season):undefined};
  }
  function artworkURL(asset,size='original',config=defaults) {
    if(asset.url){const url=publicURL(asset.url,asset.source);if(!url)return '';if(asset.source==='fanart'&&size!=='original')return url.replace('/fanart/','/preview/');return url}
    return /^\/[a-zA-Z0-9_.-]+$/.test(asset.file_path||'')?'https://image.tmdb.org/t/p/'+size+asset.file_path:'';
  }
  function identity(asset){return (asset.url||asset.file_path)+(asset.season!==undefined?':season:'+asset.season:'')}
  function merge(...lists){const seen=new Set();return lists.flat().filter(asset=>{const id=identity(asset);if(!id||seen.has(id))return false;seen.add(id);return true})}
  async function request(url,{signal,notFound=false}={}) {
    const controller=new AbortController(),abort=()=>controller.abort();if(signal?.aborted)abort();signal?.addEventListener('abort',abort,{once:true});
    const timer=setTimeout(abort,12000);
    try {const response=await fetch(url,{signal:controller.signal,headers:{accept:'application/json'}});
      if(response.status===404&&notFound)return null;
      if(!response.ok)throw new Error(response.status===401||response.status===403?'Key rejected or access unavailable.':response.status===429?'Rate limit reached. Try again later.':'Source request failed.');
      return await response.json();
    } catch(error) {if(error.name==='AbortError')throw new Error(signal?.aborted?'Request cancelled.':'Source timed out.');if(error instanceof TypeError)throw new Error('Cannot reach this source from the browser. Check its availability and browser access.');throw error}
    finally {clearTimeout(timer);signal?.removeEventListener('abort',abort)}
  }
  async function tvmaze(ids,signal) {
    let show=null;
    for(const [key,value] of [['imdb',ids.imdb_id],['thetvdb',ids.tvdb_id]]){if(!value)continue;show=await request('https://api.tvmaze.com/lookup/shows?'+key+'='+encodeURIComponent(value),{signal,notFound:true});if(show)break}
    if(!show)return {posters:[],logos:[],seasons:[],note:'No matching TVmaze ID.'};
    const [gallery,seasonList]=await Promise.all([request(`https://api.tvmaze.com/shows/${show.id}/images`,{signal}),request(`https://api.tvmaze.com/shows/${show.id}/seasons`,{signal})]);
    const posters=[],logos=[];for(const item of gallery||[]){if(!['poster','background','typography'].includes(item.type))continue;const asset=normalize({type:item.type==='typography'?'logo':item.type,url:item.resolutions?.original?.url,width:item.resolutions?.original?.width,height:item.resolutions?.original?.height,lang:'und'},'tvmaze');if(asset)(item.type==='typography'?logos:posters).push(asset)}
    const primary=normalize({url:show.image?.original,lang:'und'},'tvmaze');if(primary)posters.push(primary);
    const seasons=(seasonList||[]).flatMap(s=>{if(!Number.isInteger(s.number)||s.number<0)return [];const asset=normalize({url:s.image?.original,lang:'und',season:s.number},'tvmaze');return asset?[asset]:[]});
    return {posters:merge(posters),logos:merge(logos),seasons};
  }
  async function fanart(mediaMode,id,ids,config,signal) {
    const fanartId=mediaMode==='tv'?ids.tvdb_id:id;if(!fanartId)return {posters:[],logos:[],seasons:[],note:'No Fanart.tv ID mapping for this show.'};
    const url=new URL(`https://webservice.fanart.tv/v3.2/${mediaMode==='tv'?'tv':'movies'}/${fanartId}`);
    if(config.fanartProject)url.searchParams.set('api_key',config.fanartProject);if(config.fanartPersonal)url.searchParams.set('client_key',config.fanartPersonal);
    const data=await request(url.href,{signal,notFound:true});if(!data)return {posters:[],logos:[],seasons:[],note:'No artwork found.'};
    const collect=fields=>merge(fields.flatMap(field=>(data[field]||[]).map(a=>normalize({...a,type:/background/.test(field)?'background':/logo/.test(field)?'logo':'poster'},'fanart')).filter(Boolean)));
    return {posters:collect(mediaMode==='tv'?['tvposter','showbackground']:['movieposter','moviebackground']),logos:collect(mediaMode==='tv'?['hdtvlogo','clearlogo']:['hdmovielogo','movielogo']),seasons:mediaMode==='tv'?collect(['seasonposter']).filter(a=>Number.isInteger(a.season)&&a.season>=0):[]};
  }
  async function collect({mediaMode,id,ids={},config,signal}) {
    const jobs=[];if(mediaMode==='tv'&&config.tvmaze)jobs.push(['tvmaze',()=>tvmaze(ids,signal)]);
    if(config.fanartProject||config.fanartPersonal)jobs.push(['fanart',()=>fanart(mediaMode,id,ids,config,signal)]);
    const results=await Promise.all(jobs.map(async([source,load])=>{try{return {source,...await load()}}catch(error){return {source,posters:[],logos:[],seasons:[],error:error.message}}}));
    return {posters:merge(results.flatMap(r=>r.posters)),logos:merge(results.flatMap(r=>r.logos)),seasons:merge(results.flatMap(r=>r.seasons)),results};
  }
  function safeAsset(asset) {
    if(asset.url){const normalized=normalize({url:asset.url,lang:asset.iso_639_1===null?'00':asset.iso_639_1,width:asset.width,height:asset.height,season:asset.season,type:asset.type},asset.source);if(!normalized)throw new Error('Invalid provider artwork URL.');return normalized}
    if(!/^\/[a-zA-Z0-9_.-]+$/.test(asset.file_path||''))throw new Error('Invalid TMDB artwork path.');return {source:'tmdb',file_path:asset.file_path,iso_639_1:language(asset.iso_639_1),width:Number(asset.width)||0,height:Number(asset.height)||0};
  }
  return {names,defaults,artworkURL,merge,collect,safeAsset,identity};
})();
