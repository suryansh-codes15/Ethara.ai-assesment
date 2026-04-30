const PDFDocument = require("pdfkit");

const generateProjectReport = async (res, project, stats) => {
  const doc = new PDFDocument({ margin: 50 });

  // Stream directly to response
  doc.pipe(res);

  // Header
  doc
    .fillColor("#444444")
    .fontSize(24)
    .text("Project Performance Report", { align: "center" });
  
  doc.moveDown();
  
  doc
    .fontSize(12)
    .text(`Project Name: ${project.name}`)
    .text(`Report Generated: ${new Date().toLocaleDateString()}`)
    .text(`Status: ${project.status.toUpperCase()}`);

  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown();

  // Metrics Section
  doc.fontSize(16).text("Key Performance Indicators", { underline: true });
  doc.moveDown();
  
  doc.fontSize(12)
    .text(`Total Tasks: ${stats.totalTasks}`)
    .text(`Completed Tasks: ${stats.completedTasks}`)
    .text(`On-Time Delivery Rate: ${stats.onTimeRate}%`)
    .text(`Average Completion Time: ${stats.avgCompletionDays} days`);

  doc.moveDown();

  // Task Table Header
  doc.fontSize(16).text("Recent Tasks", { underline: true });
  doc.moveDown();

  const tableTop = doc.y;
  const col1 = 50;
  const col2 = 250;
  const col3 = 350;
  const col4 = 450;

  doc.fontSize(10).font("Helvetica-Bold");
  doc.text("Title", col1, tableTop);
  doc.text("Assignee", col2, tableTop);
  doc.text("Priority", col3, tableTop);
  doc.text("Status", col4, tableTop);

  doc.moveDown();
  doc.font("Helvetica");

  project.tasks.slice(0, 15).forEach((task, i) => {
    const y = doc.y + 5;
    doc.text(task.title.substring(0, 30), col1, y);
    doc.text(task.assignedTo?.name || "Unassigned", col2, y);
    doc.text(task.priority, col3, y);
    doc.text(task.status, col4, y);
    doc.moveDown();
  });

  // Footer
  const footerY = doc.page.height - 70;
  doc
    .fontSize(10)
    .text(
      "TaskFlow Enterprise | Strictly Confidential",
      50,
      footerY,
      { align: "center", width: 500 }
    );

  doc.end();
};

module.exports = {
  generateProjectReport
};
