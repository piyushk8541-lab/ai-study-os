import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:'Please log in.'},{status:401});
 const [attempts,weaknesses,revisions,profile]=await Promise.all([
  supabase.from('exam_attempts').select('id,exam_id,score,accuracy,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(50),
  supabase.from('weaknesses').select('subject,topic,weakness_score,accuracy,attempts_count,status').eq('user_id',user.id).order('weakness_score',{ascending:false}).limit(50),
  supabase.from('revision_schedule').select('status,scheduled_for,last_reviewed_at').eq('user_id',user.id),
  supabase.from('profiles').select('name,target_exam,preferred_language').eq('id',user.id).maybeSingle(),
 ]);
 if(attempts.error)return NextResponse.json({error:attempts.error.message},{status:500});
 const a=attempts.data??[],w=weaknesses.data??[],r=revisions.data??[];
 const avg=a.length?Math.round(a.reduce((s,x)=>s+Number(x.accuracy??0),0)/a.length):0;
 const revisionCompleted=r.filter(x=>x.status==='completed').length;
 const revisionTotal=r.length;
 const subjectMap=new Map<string,{sum:number;n:number}>();
 for(const x of w){const key=x.subject||'Other';const old=subjectMap.get(key)||{sum:0,n:0};old.sum+=Number(x.accuracy??0);old.n++;subjectMap.set(key,old)}
 const subjects=[...subjectMap].map(([subject,v])=>({subject,accuracy:Math.round(v.sum/v.n),topics:v.n})).sort((x,y)=>y.accuracy-x.accuracy);
 return NextResponse.json({profile:profile.data??null,stats:{attempts:a.length,averageAccuracy:avg,weakTopics:w.filter(x=>x.status!=='resolved').length,revisionCompletion:revisionTotal?Math.round(revisionCompleted/revisionTotal*100):0},recentAttempts:a,weaknesses:w,subjects});
}
