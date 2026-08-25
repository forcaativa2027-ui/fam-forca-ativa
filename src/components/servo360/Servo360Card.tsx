import Link from "next/link";
import { ReactNode } from "react";
import { Servo360Icon } from "./Servo360Icon";

type Variant = "navigation"|"mini"|"feature"|"learning"|"bible"|"kids"|"continue";
type Props = {
  title:string; description?:string; iconKey:string; href?:string; onClick?:()=>void;
  variant?:Variant; selected?:boolean; disabled?:boolean; badge?:ReactNode; meta?:ReactNode; progress?:number;
};

export function Servo360Card({title,description,iconKey,href,onClick,variant="navigation",selected=false,disabled=false,badge,meta,progress}:Props){
  const cls=["s360-card",`s360-card--${variant}`,selected&&"is-selected",disabled&&"is-disabled"].filter(Boolean).join(" ");
  const body=<>
    <div className="s360-card__top"><Servo360Icon iconKey={iconKey} size={variant==="mini"?44:64}/>{badge}</div>
    <div><h3 className="s360-card__title">{title}</h3>{description&&<p className="s360-card__description">{description}</p>}{meta&&<div className="s360-card__meta">{meta}</div>}
    {typeof progress==="number"&&<div className="s360-card__progress" aria-label={`${progress}% concluído`}><div className="s360-card__progress-track"><span className="s360-card__progress-value" style={{width:`${Math.max(0,Math.min(100,progress))}%`}}/></div><span>{progress}%</span></div>}</div>
  </>;
  if(href&&!disabled) return <Link href={href} className={cls} aria-current={selected?"page":undefined}>{body}</Link>;
  return <button type="button" className={cls} onClick={onClick} disabled={disabled} aria-pressed={selected||undefined}>{body}</button>;
}
