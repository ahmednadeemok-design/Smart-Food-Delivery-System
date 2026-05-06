export function optimizeStops(stops=[]){return [...stops].sort((a,b)=>Number(a.eta.replace(' min',''))-Number(b.eta.replace(' min','')))}
