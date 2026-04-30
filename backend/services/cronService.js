const cron = require("node-cron");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { createNotification } = require("./eventService");

/**
 * Daily check at 9 AM for overdue tasks.
 */
const initOverdueCheck = () => {
  cron.schedule("0 9 * * *", async () => {
    console.log("Running daily overdue task check...");
    
    try {
      const today = new Date();
      const overdueTasks = await prisma.task.findMany({
        where: {
          status: { not: "done" },
          dueDate: { lt: today },
          assignedToId: { not: null }
        },
        include: {
          assignedTo: true
        }
      });

      for (const task of overdueTasks) {
        await createNotification({
          userId: task.assignedToId,
          type: "overdue",
          message: `Task "${task.title}" is overdue! Please update its status.`,
          link: `/projects/${task.projectId}?task=${task.id}`
        });
      }
      
      console.log(`Sent ${overdueTasks.length} overdue notifications.`);
    } catch (error) {
      console.error("Overdue check failed:", error);
    }
  });
};

module.exports = {
  initOverdueCheck
};
