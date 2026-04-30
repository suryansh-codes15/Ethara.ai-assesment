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
      // Logic to add all tasks to backend
      for (const task of suggestions) {
        await api.post(`/tasks`, {
          ...task,
          projectId,
          status: "todo"
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
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute top-12 right-0 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 z-50"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-indigo-500" />
              AI Suggestions
            </h3>
            <button onClick={() => setSuggestions(null)} className="text-gray-400 hover:text-gray-600">
              <Plus className="w-4 h-4 rotate-45" />
            </button>
          </div>
          
          <div className="space-y-3 max-h-60 overflow-y-auto mb-4 pr-2 custom-scrollbar">
            {suggestions.map((task, i) => (
              <div key={i} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                <p className="text-sm font-semibold">{task.title}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
              </div>
            ))}
          </div>

          <button
            onClick={handleAcceptAll}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Accept All Suggestions
          </button>
        </motion.div>
      )}
    </div>
  );
};
