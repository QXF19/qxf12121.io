'use strict';
(()=>{
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 function pagePosition(value){
  if(!value)return null;
  try{
   const url=new URL(value,location.href);
   const pathname=url.pathname.replace(/\/index\.html$/,'/').replace(/\/?$/,'/');
   const page=pathname.match(/^(.*\/)page\/([1-9]\d*)\/$/);
   return {origin:url.origin,base:page?page[1]:pathname,number:page?Number(page[2]):1};
  }catch{return null;}
 }
 function direction(activation){
  const from=pagePosition(activation?.from?.url);
  const to=pagePosition(activation?.entry?.url);
  let back=activation?.navigationType==='traverse'&&activation?.from&&activation?.entry&&activation.entry.index<activation.from.index;
  if(from&&to&&from.origin===to.origin&&from.base===to.base&&from.number!==to.number)back=to.number<from.number;
  document.documentElement.dataset.navigationDirection=back?'back':'forward';
 }
 addEventListener('pageswap',event=>{direction(event.activation);if(reduced())event.viewTransition?.skipTransition();});
 addEventListener('pagereveal',event=>{direction(window.navigation?.activation);if(event.viewTransition&&reduced())event.viewTransition.skipTransition();});
})();
