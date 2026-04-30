import React, { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import { Search, Plus, LayoutDashboard, BarChart3, Settings, Bell, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState({ tasks: [], projects: [] });
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (search.length > 2) {
      const fetchResults = async () => {
        try {
          const { data } = await api.get(`/search?q=${search}`);
          setResults(data);
        } catch (error) {
          console.error("Search error:", error);
        }
      };
      const debounce = setTimeout(fetchResults, 300);
      return () => clearTimeout(debounce);
    } else {
      setResults({ tasks: [], projects: [] });
    }
  }, [search]);

  const runCommand = (command) => {
    setOpen(false);
    command();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
          >
            <Command label="Global Command Menu">
              <div className="flex items-center border-b border-gray-200 dark:border-gray-800 px-4">
                <Search className="w-5 h-5 text-gray-400" />
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Search tasks, projects, or commands..."
                  className="w-full h-14 bg-transparent border-none focus:ring-0 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                />
                <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <Command.List className="max-h-[300px] overflow-y-auto p-2 scroll-py-2">
                <Command.Empty className="py-6 text-center text-sm text-gray-500">
                  No results found.
                </Command.Empty>

                {results.projects.length > 0 && (
                  <Command.Group heading="Projects" className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">
                    {results.projects.map((project) => (
                      <Command.Item
                        key={project.id}
                        onSelect={() => runCommand(() => navigate(`/projects/${project.id}`))}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/30 text-gray-700 dark:text-gray-300 transition-colors"
                      >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
                        <span>{project.name}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                <Command.Group heading="Quick Actions" className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">
                  <Command.Item
                    onSelect={() => runCommand(() => navigate("/dashboard"))}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/30 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Go to Dashboard</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => navigate("/analytics"))}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/30 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>View Analytics</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => navigate("/settings"))}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/30 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Command.Item>
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
