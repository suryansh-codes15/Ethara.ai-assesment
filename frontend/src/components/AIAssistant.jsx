import React, { useState } from "react";
import { Sparkles, Wand2, Loader2, CheckCircle, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import { toast } from "react-hot-toast";

export default function AIAssistant({ projectId, projectName, projectDescription, onTasksGenerated }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/ai/generate-tasks", {
        projectName,
        description: projectDescription
      });
      setSuggestions(data);
      toast.success("AI generated 5-8 new task suggestions!");
    } catch (error) {
      toast.error("Failed to generate tasks with AI");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptAll = async () => {
    try {
      for (const task of suggestions) {
        const { daysFromNow, ...taskData } = task;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (daysFromNow || 1));

        await api.post(`/tasks`, {
          ...taskData,
          project: projectId,
          status: "todo",
          dueDate: dueDate.toISOString()
        });
      }
      onTasksGenerated();
      setSuggestions(null);
      toast.success("All AI tasks added to backlog!");
    } catch (error) {
      toast.error("Failed to add tasks");
    }
  };

  return (
    <div className="relative">
      {!suggestions ? (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "AI Thinking..." : "Generate with AI"}
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          className="absolute top-14 right-0 w-[420px] bg-[var(--surface-1)] rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] border border-[var(--border)] overflow-hidden z-[100]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[var(--border)] bg-gradient-to-r from-indigo-500/10 to-purple-500/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--text-primary)] text-base">AI Strategy</h3>
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Recommended Actions</p>
              </div>
            </div>
            <button 
              onClick={() => setSuggestions(null)} 
              className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <Plus className="w-4 h-4 rotate-45 text-[var(--text-muted)]" />
            </button>
          </div>
          
          {/* List */}
          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
            {suggestions.map((task, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group p-4 bg-white/[0.03] hover:bg-white/[0.05] rounded-2xl border border-white/[0.05] hover:border-indigo-500/30 transition-all cursor-default"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#3b82f6' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight">{task.title}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">
                      {task.description}
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-[var(--text-muted)] uppercase tracking-tighter">
                        {task.priority} Priority
                      </span>
                      <span className="text-[10px] font-bold text-indigo-400/80">
                        In {task.daysFromNow || 1} day(s)
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 bg-white/[0.02] border-t border-[var(--border)]">
            <button
              onClick={handleAcceptAll}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20 active:scale-[0.98]"
            >
              <CheckCircle className="w-4 h-4" />
              Import all to Backlog
            </button>
            <p className="text-[10px] text-center text-[var(--text-muted)] mt-3 font-medium">
              These tasks will be added to the <b>To Do</b> column automatically.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};
