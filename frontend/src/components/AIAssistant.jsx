import React, { useState } from "react";
import { Sparkles, Wand2, Loader2, CheckCircle, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import { toast } from "react-hot-toast";

export default function AIAssistant({ projectId, projectName, projectDescription, onTasksGenerated }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const handleGenerate = async () => {
    if (!projectDescription) return toast.error("Add a project description first for better AI results");
    setLoading(true);
    try {
      const { data } = await api.post("/ai/generate-tasks", {
        projectName,
        description: projectDescription
      });
      
      // Handle different possible data structures from AI
      const tasks = Array.isArray(data) ? data : (data.tasks || Object.values(data).find(v => Array.isArray(v)) || []);
      
      if (tasks.length === 0) {
        toast.error("AI couldn't generate specific tasks. Try a more detailed description.");
      } else {
        setSuggestions(tasks);
        toast.success(`AI generated ${tasks.length} strategic milestones!`);
      }
    } catch (error) {
      console.error("AI Generate Error:", error);
      toast.error(error.response?.data?.message || "Failed to generate tasks with AI");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptAll = async () => {
    if (!suggestions || suggestions.length === 0) return;
    setLoading(true);
    try {
      const taskPromises = suggestions.map(task => {
        const { daysFromNow, ...taskData } = task;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (daysFromNow || 1));

        return api.post(`/tasks`, {
          ...taskData,
          project: projectId,
          status: "todo",
          dueDate: dueDate.toISOString()
        });
      });

      await Promise.all(taskPromises);
      
      if (onTasksGenerated) onTasksGenerated();
      setSuggestions(null);
      toast.success("All strategic milestones deployed to backlog!");
    } catch (error) {
      console.error("Accept all error:", error);
      toast.error("Failed to deploy some milestones. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {!suggestions ? (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2.5 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_10px_20px_rgba(99,102,241,0.3)] disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "AI Analysis..." : "Generate Strategy"}
        </motion.button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="absolute top-16 right-0 w-[460px] bg-[#0d0d1a] rounded-[32px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden z-[1000]"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shadow-inner">
                <Sparkles className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-black text-white text-base uppercase tracking-tight">AI Strategy Intel</h3>
                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] mt-0.5">Automated Backlog Expansion</p>
              </div>
            </div>
            <button 
              onClick={() => setSuggestions(null)} 
              className="w-10 h-10 rounded-xl hover:bg-white/10 flex items-center justify-center transition-all text-[var(--text-muted)] hover:text-white"
            >
              <Plus className="w-5 h-5 rotate-45" />
            </button>
          </div>
          
          {/* List */}
          <div className="p-6 space-y-4 max-h-[420px] overflow-y-auto custom-scrollbar">
            {suggestions.map((task, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group p-5 bg-white/[0.02] hover:bg-white/[0.05] rounded-[24px] border border-white/5 hover:border-indigo-500/40 transition-all cursor-default relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start gap-4">
                  <div className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.5)]" 
                       style={{ backgroundColor: task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#3b82f6', boxShadow: `0 0 12px ${task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#3b82f6'}60` }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black text-white leading-snug uppercase tracking-tight">{task.title}</p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-2 leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all font-medium">
                      {task.description}
                    </p>
                    <div className="flex items-center gap-4 mt-4">
                      <span className="text-[9px] font-black px-2.5 py-1 rounded-lg bg-white/5 text-[var(--text-muted)] border border-white/5 uppercase tracking-widest">
                        {task.priority} Priority
                      </span>
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Wand2 className="w-3 h-3" />
                        T+{task.daysFromNow || 1} Days
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-6 bg-white/[0.02] border-t border-white/5">
            <button
              onClick={handleAcceptAll}
              disabled={loading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[20px] text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-[0_15px_30px_rgba(99,102,241,0.3)] active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {loading ? "Deploying..." : "Initialize All Milestones"}
            </button>
            <p className="text-[9px] text-center text-[var(--text-muted)] mt-4 font-black uppercase tracking-[0.1em] opacity-40">
              Authorized Strategic Expansion Component
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};
