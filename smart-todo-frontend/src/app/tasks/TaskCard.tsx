'use client';
import { useState } from 'react';
import { Calendar, Clock, Edit, Trash2, CheckCircle, Circle, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Task } from '@/app/dashboard/page';

/* ----------- local helpers (simple & dependency-free) ----------- */
const truncate = (txt:string,len:number)=> txt.length<=len?txt:txt.slice(0,len)+'…';
const formatDate = (d:string|null)=> d ? new Date(d).toLocaleDateString() : '—';
const relTime = (d:string|null)=>{
  if(!d) return '—';
  const diff=(new Date(d).getTime()-Date.now())/36e5;
  if(diff<0) return 'Overdue';
  if(diff<24) return `${Math.round(diff)}h left`;
  return `${Math.round(diff/24)}d left`;
};
const prColor=(p:string)=>({
  urgent:'bg-red-100 text-red-800',
  high:'bg-orange-100 text-orange-800',
  medium:'bg-yellow-100 text-yellow-800',
  low:'bg-green-100 text-green-800'
} as any)[p] ?? 'bg-gray-100 text-gray-800';
const stColor=(s:string)=>({
  completed:'bg-green-100 text-green-800',
  in_progress:'bg-blue-100 text-blue-800',
  pending:'bg-gray-100 text-gray-800'
} as any)[s];

/* ---------------------------------------------------------------- */
interface Props {
  task: Task;
  onStatusChange: (id: string, newStatus: string) => void;
  onEdit: (t: Task) => void;
  onDelete: (id: string) => void;
}
export default function TaskCard({ task, onStatusChange, onEdit, onDelete }: Props) {
  const [expand, setExpand] = useState(false);
  const nextStatus = task.status==='pending'?'in_progress':task.status==='in_progress'?'completed':'pending';
  const overdue = task.deadline && new Date(task.deadline)<new Date() && task.status!=='completed';

  const StatusIcon = task.status==='completed'?CheckCircle: task.status==='in_progress'?PlayCircle:Circle;

  return (
    <Card className={`transition-all ${overdue?'ring-2 ring-red-300':''}`}>
      <CardContent className="p-6">
        <div className="flex justify-between">
          {/* left */}
          <div className="flex gap-3 flex-1">
            <button onClick={()=>onStatusChange(task.id.toString(),nextStatus)} className="mt-1 hover:scale-110">
              <StatusIcon className={`h-5 w-5 ${task.status==='completed'?'text-green-600':task.status==='in_progress'?'text-blue-600':'text-gray-400'}`} />
            </button>
            <div className="flex-1 min-w-0">
              <h3 className={`text-lg font-semibold ${task.status==='completed'?'line-through opacity-60':''}`} style={{ color:'var(--foreground)' }}>
                {task.title}
              </h3>
              {task.description && (
                <p className="text-sm mt-2" style={{ color:'var(--muted-foreground)' }}>
                  {expand?task.description:truncate(task.description,110)}
                  {task.description.length>110 && (
                    <button onClick={()=>setExpand(!expand)} className="ml-2 text-blue-600 hover:underline text-xs font-medium">
                      {expand?'Show less':'Show more'}
                    </button>
                  )}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-4 text-xs">
                <span className={`px-3 py-1 rounded-full font-medium ${prColor(task.priority)}`}>{task.priority.toUpperCase()}</span>
                <span className={`px-3 py-1 rounded-full font-medium ${stColor(task.status)}`}>{task.status.replace('_',' ').toUpperCase()}</span>
                {task.category && <span className="px-3 py-1 rounded-full border" style={{ borderColor:'var(--border)'}}>{task.category}</span>}
              </div>

              <div className="flex gap-4 mt-3 text-sm" style={{ color:overdue?'#dc2626':'var(--muted-foreground)' }}>
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4"/>{formatDate(task.deadline)}</span>
                <span className="flex items-center gap-1"><Clock className="h-4 w-4"/>{relTime(task.deadline)}</span>
              </div>

              {task.ai_suggestions?.length ? (
                <div className="mt-4 p-3 rounded-lg border-l-4 border-blue-500" style={{ background:'var(--muted)' }}>
                  <p className="text-xs font-medium mb-1 text-blue-600">AI Suggestions</p>
                  <ul className="text-xs list-disc list-inside space-y-1">
                    {task.ai_suggestions.slice(0,2).map((s,i)=><li key={i}>{s}</li>)}
                  </ul>
                </div>
              ):null}
            </div>
          </div>

          {/* actions */}
          <div className="flex items-start gap-2">
            <Button variant="ghost" size="sm" onClick={()=>onEdit(task)}><Edit className="h-4 w-4 text-blue-600"/></Button>
            <Button variant="ghost" size="sm" onClick={()=>onDelete(task.id.toString())}><Trash2 className="h-4 w-4 text-red-500"/></Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
