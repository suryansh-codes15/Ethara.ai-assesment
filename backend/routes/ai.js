const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const aiService = require("../services/aiService");
const { protect: auth } = require("../middleware/auth");

/**
 * @route   POST /api/ai/generate-tasks
 * @desc    Generate 5-8 tasks for a project
 */
router.post("/generate-tasks", auth, async (req, res) => {
  const { projectName, description } = req.body;

  try {
    const tasks = await aiService.generateTasks(projectName, description);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   POST /api/ai/summarize-project
 * @desc    Get an AI executive summary of a project
 */
router.post("/summarize-project", auth, async (req, res) => {
  const { projectId } = req.body;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          include: { assignedTo: true }
        }
      }
    });

    if (!project) return res.status(404).json({ message: "Project not found" });

    const summary = await aiService.summarizeProject(project);
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   POST /api/ai/smart-assign
 * @desc    Get AI recommendation for task assignment
 */
router.post("/smart-assign", auth, async (req, res) => {
  const { taskTitle, projectId } = req.body;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: {
            assignedTasks: {
              where: { status: { not: "done" } }
            }
          }
        }
      }
    });

    const membersWithWorkload = project.members.map(m => ({
      id: m.id,
      name: m.name,
      activeTasks: m.assignedTasks.length
    }));

    const recommendation = await aiService.smartAssign(taskTitle, membersWithWorkload);
    res.json(recommendation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
