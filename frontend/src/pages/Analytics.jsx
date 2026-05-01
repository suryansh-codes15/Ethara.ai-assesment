import React, { useEffect, useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend 
} from "recharts";
import { 
  TrendingUp, Users, CheckCircle, Clock, FileText, Download,
  AlertCircle, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import api from "../api";
import { motion } from "framer-motion";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get("/analytics/dashboard");
        setData(data);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const handleExport = async (projectId) => {
    try {
      const response = await api.get(`/analytics/report/${projectId}`, {
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `project-report.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (!data) return (
    <div className="flex flex-col items-center justify-center h-screen p-8 bg-gray-50 dark:bg-gray-900 text-center">
      <div className="text-6xl mb-4">🔐</div>
      <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
      <p className="text-gray-500 max-w-md">Enterprise analytics are reserved for administrative personnel. Please contact your workspace administrator for access.</p>
    </div>
  );

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold">Enterprise Analytics</h1>
            <p className="text-gray-500 mt-2">Real-time performance metrics and project health.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none">
            <Download className="w-4 h-4" />
            Export Executive Summary
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Total Tasks", value: data.stats.totalTasks, icon: FileText, trend: "+12%", color: "text-blue-600", bg: "bg-blue-100" },
            { label: "Completion Rate", value: `${data.stats.completionRate}%`, icon: CheckCircle, trend: "+5%", color: "text-emerald-600", bg: "bg-emerald-100" },
            { label: "Active Projects", value: data.stats.totalProjects, icon: TrendingUp, trend: "Stable", color: "text-indigo-600", bg: "bg-indigo-100" },
            { label: "Total Team", value: data.stats.totalUsers, icon: Users, trend: "+2", color: "text-purple-600", bg: "bg-purple-100" },
          ].map((stat, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={stat.label}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <span className="text-xs font-medium text-emerald-600 flex items-center bg-emerald-50 px-2 py-1 rounded-full">
                  <ArrowUpRight className="w-3 h-3 mr-1" /> {stat.trend}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Priority Distribution */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-bold mb-6">Task Priority Distribution</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.priorityStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="priority" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="_count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Project Health Matrix */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <h3 className="text-lg font-bold mb-6">Project Health Matrix</h3>
            <div className="space-y-6">
              {data.healthMatrix.map((project) => (
                <div key={project.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{project.name}</span>
                    <button 
                      onClick={() => handleExport(project.id)}
                      className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> Report
                    </button>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${project.progress}%` }}
                      className={`h-full ${
                        project.health === "green" ? "bg-emerald-500" : 
                        project.health === "amber" ? "bg-amber-500" : "bg-red-500"
                      }`}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{project.progress}% Complete</span>
                    <span>{project.totalTasks} Tasks</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
