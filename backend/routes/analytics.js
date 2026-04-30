const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { protect: auth } = require("../middleware/auth");
const { generateProjectReport } = require("../services/pdfService");

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get global analytics for admin
 */
router.get("/dashboard", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const totalUsers = await prisma.user.count();
    const totalProjects = await prisma.project.count();
    const totalTasks = await prisma.task.count();
    const completedTasks = await prisma.task.count({ where: { status: "done" } });

    // Tasks by priority
    const priorityStats = await prisma.task.groupBy({
      by: ["priority"],
      _count: true
    });

    // Project health matrix
    const projects = await prisma.project.findMany({
      include: {
        _count: { select: { tasks: true } },
        tasks: { where: { status: "done" } }
      }
    });

    const healthMatrix = projects.map(p => {
      const total = p._count.tasks;
      const done = p.tasks.length;
      const progress = total > 0 ? Math.round((done / total) * 100) : 0;
      
      return {
        id: p.id,
        name: p.name,
        totalTasks: total,
        progress,
        status: p.status,
        health: progress > 70 ? "green" : progress > 40 ? "amber" : "red"
      };
    });

    res.json({
      stats: {
        totalUsers,
        totalProjects,
        totalTasks,
        completedTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      priorityStats,
      healthMatrix
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   GET /api/analytics/report/:projectId
 * @desc    Export project PDF report
 */
router.get("/report/:projectId", auth, async (req, res) => {
  const { projectId } = req.params;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          include: { assignedTo: true },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!project) return res.status(404).json({ message: "Project not found" });

    // Calculate stats
    const total = project.tasks.length;
    const done = project.tasks.filter(t => t.status === "done").length;
    
    const stats = {
      totalTasks: total,
      completedTasks: done,
      onTimeRate: total > 0 ? Math.round((done / total) * 100) : 0,
      avgCompletionDays: 3 // Placeholder
    };

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=report-${project.name}.pdf`);

    await generateProjectReport(res, project, stats);
  } catch (error) {
    console.error("PDF Export Error:", error);
    res.status(500).json({ message: "Failed to generate PDF report" });
  }
});

module.exports = router;
