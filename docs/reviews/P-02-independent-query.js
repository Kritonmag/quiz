const page = await figma.getNodeByIdAsync('0:1');
await figma.setCurrentPageAsync(page);
const ids=['1:1588','1:271','1:1412','1:1322','1:1548','1:2104','1:1540','1:1611','1:305'];
const nodes=[];
const fontPairs=new Map();
const typography=[];
for(const id of ids){
 const n=await figma.getNodeByIdAsync(id);
 if(!n)throw new Error('Missing node '+id);
 const item={id:n.id,name:n.name,type:n.type,width:n.width,height:n.height};
 if('children' in n)item.children=n.children.map(c=>({id:c.id,name:c.name,type:c.type,x:c.x,y:c.y,width:c.width,height:c.height,...('reactions' in c?{reactionCount:c.reactions.length}: {})}));
 if('layoutMode' in n)Object.assign(item,{layoutMode:n.layoutMode,paddingLeft:n.paddingLeft,paddingRight:n.paddingRight,paddingTop:n.paddingTop,paddingBottom:n.paddingBottom,itemSpacing:n.itemSpacing});
 nodes.push(item);
 if(id==='1:1588'||id==='1:271'){
  for(const t of n.findAllWithCriteria({types:['TEXT']})){
   for(const s of t.getStyledTextSegments(['fontName','fontSize','lineHeight','letterSpacing'])){
    const key=JSON.stringify(s.fontName);
    if(!fontPairs.has(key))fontPairs.set(key,{...s.fontName,sourceNodeIds:[],count:0});
    const f=fontPairs.get(key);f.count++;if(f.sourceNodeIds.length<2)f.sourceNodeIds.push(t.id);
   }
  }
 }
}
for(const id of ['1:1600','1:1601','1:1594','1:1925','1:1926','1:1316','1:1317','1:2089']){
 const t=await figma.getNodeByIdAsync(id);
 if(t&&t.type==='TEXT')typography.push({id:t.id,text:t.characters,segments:t.getStyledTextSegments(['fontName','fontSize','lineHeight','letterSpacing']).map(s=>({fontName:s.fontName,fontSize:s.fontSize,lineHeight:s.lineHeight,letterSpacing:s.letterSpacing}))});
}
const collections=await figma.variables.getLocalVariableCollectionsAsync();
return {fileKey:'0unNm6ej8Ig8v7eN5wUpZK',page:{id:page.id,name:page.name},nodes,fontPairs:[...fontPairs.values()],typography,variableCollections:collections.map(c=>({id:c.id,name:c.name,variableCount:c.variableIds.length,modes:c.modes}))};
