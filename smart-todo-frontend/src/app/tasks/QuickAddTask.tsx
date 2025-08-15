'use client';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Zap } from 'lucide-react';

interface Props { onAddTask: (payload:{title:string;description:string}) => Promise<void>; }

export default function QuickAddTask({ onAddTask }: Props) {
  const [title,setTitle]=useState(''); const [desc,setDesc]=useState('');
  const [expand,setExpand]=useState(false); const [loading,setLoading]=useState(false);

  const submit = async(e:React.FormEvent)=>{ e.preventDefault();
    if(!title.trim()) return;
    setLoading(true);
    try{ await onAddTask({ title:title.trim(), description:desc.trim() });
      setTitle(''); setDesc(''); setExpand(false);
    }catch(err){ console.error(err);}finally{ setLoading(false);}
  };

  return (
    <Card className="border-dashed border-2 hover:border-solid transition-colors">
      <CardContent className="p-6">
        <form onSubmit={submit}>
          <div className="flex gap-3">
            <Input
              placeholder="✨ Quick add a new task"
              className="flex-1 border-0 bg-transparent"
              value={title} onChange={e=>setTitle(e.target.value)} onFocus={()=>setExpand(true)}
            />
            <Button type="submit" disabled={!title.trim()||loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? <div className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full"/> : <Plus className="h-4 w-4"/>}
            </Button>
          </div>

          {expand && (
            <div className="mt-4 space-y-3 animate-fade-in">
              <textarea
                placeholder="Description (optional)…"
                rows={3}
                className="w-full p-3 rounded-lg border"
                value={desc} onChange={e=>setDesc(e.target.value)}
              />
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2 text-yellow-600"><Zap className="h-4 w-4"/>Set details later</span>
                <Button type="button" variant="ghost" size="sm" onClick={()=>{setExpand(false);setDesc('');}}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </form>
      </CardContent>

      <style jsx>{`
        @keyframes fade-in{from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:translateY(0);}}
        .animate-fade-in{animation:fade-in .3s ease-out;}
      `}</style>
    </Card>
  );
}
