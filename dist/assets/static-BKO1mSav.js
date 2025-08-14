import{de as h}from"./index-u40D7Obu.js";/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const l=Symbol.for(""),S=t=>{if((t==null?void 0:t.r)===l)return t==null?void 0:t._$litStatic$},y=t=>({_$litStatic$:t,r:l}),p=t=>{if(t._$litStatic$!==void 0)return t._$litStatic$;throw new Error(`Value passed to 'literal' function must be a 'literal' result: ${t}. Use 'unsafeStatic' to pass non-literal values, but
            take care to ensure page security.`)},V=(t,...e)=>({_$litStatic$:e.reduce((c,n,r)=>c+p(n)+t[r+1],t[0]),r:l}),d=new Map,m=t=>(e,...c)=>{const n=c.length;let r,o;const a=[],f=[];let i=0,$=!1,s;for(;i<n;){for(s=e[i];i<n&&(o=c[i],(r=S(o))!==void 0);)s+=r+e[++i],$=!0;i!==n&&f.push(o),a.push(s),i++}if(i===n&&a.push(e[n]),$){const u=a.join("$$lit$$");e=d.get(u),e===void 0&&(a.raw=a,d.set(u,e=a)),c=f}return t(e,...c)},_=m(h);export{_ as h,V as l,y as u};
