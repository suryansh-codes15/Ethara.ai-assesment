const OpenAI = require("openai");

// Using Groq's high-speed inference engine
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "",
  baseURL: "https://api.groq.com/openai/v1",
});

const MODEL = "llama-3.1-70b-versatile"; 

/**
 * Generate tasks for a project based on its name and description.
 */
const generateTasks = async (projectName, description) => {
  const prompt = `
    You are an expert project manager. Given a project named "${projectName}" with the description: "${description}",
    suggest 5-8 highly relevant tasks.
    
    Return the response ONLY as a JSON array of objects with the following structure:
    [
      {
        "title": "Task Title",
        "description": "Short but detailed task description",
        "priority": "low" | "medium" | "high",
        "daysFromNow": 1-14
      }
    ]
    
    Ensure the tasks are professional and specific to the project context.
  `;

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : (parsed.tasks || Object.values(parsed)[0]);
  } catch (error) {
    console.error("Groq AI Generate Tasks Error:", error);
    throw new Error("Failed to generate tasks with Groq AI");
  }
};

/**
 * Summarize project health and progress.
 */
const summarizeProject = async (projectData) => {
  const prompt = `
    Summarize the health of this project in exactly 3 sentences. 
    Focus on progress, potential blockers based on priority/due dates, and one strategic recommendation.
    
    Project Data: ${JSON.stringify(projectData)}
  `;

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }]
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Groq AI Summarize Project Error:", error);
    throw new Error("Failed to summarize project with Groq AI");
  }
};

/**
 * Recommend the best member for a task based on workload.
 */
const smartAssign = async (taskTitle, members) => {
  const prompt = `
    Given a task titled "${taskTitle}" and the following team members with their current task counts:
    ${JSON.stringify(members)}
    
    Recommend the best member to assign the task to. 
    Return the response ONLY as a JSON object:
    {
      "memberId": "the-recommended-id",
      "reason": "short explanation of why"
    }
  `;

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });
    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Groq AI Smart Assign Error:", error);
    throw new Error("Failed to get smart assignment recommendation");
  }
};

module.exports = {
  generateTasks,
  summarizeProject,
  smartAssign
};
