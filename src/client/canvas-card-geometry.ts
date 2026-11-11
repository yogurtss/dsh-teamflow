import type {TeamTask} from '../types.ts'

export const CARD_WIDTH=294, CARD_HEIGHT=230, CARD_PORT_Y=114
type Point={x:number;y:number}
// Persist layouts in their original coordinate space so old layouts and templates can round-trip.
export const displayPoint=(p:Point):Point=>({x:p.x*CARD_WIDTH/225,y:p.y*CARD_HEIGHT/150})
export const storedPoint=(p:Point):Point=>({x:p.x*225/CARD_WIDTH,y:p.y*150/CARD_HEIGHT})
export function connectionPort(p:Point,side:'input'|'output'):Point {
  return {x:p.x+(side==='output'?CARD_WIDTH:0),y:p.y+CARD_PORT_Y}
}
export function connectionTarget(tasks:TeamTask[],position:(id:string)=>Point,point:Point,from:string) {
  return tasks.filter(t=>t.id!==from).map(task=>{
    const p=position(task.id),anchor=connectionPort(p,'input')
    const distance=Math.hypot(point.x-anchor.x,point.y-anchor.y)
    const inside=point.x>=p.x-18 && point.x<=p.x+CARD_WIDTH+18 && point.y>=p.y-12 && point.y<=p.y+CARD_HEIGHT+12
    return {task,distance,inside}
  }).filter(hit=>hit.inside||hit.distance<=40).sort((a,b)=>a.distance-b.distance)[0]?.task
}
