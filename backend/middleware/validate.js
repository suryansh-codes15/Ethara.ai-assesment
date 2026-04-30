const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map(d => d.message.replace(/"/g, '')).join(', ');
    return res.status(400).json({ success: false, message: messages });
  }
  next();
};

// Auth Schemas
const signupSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'member').optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Project Schemas
const projectSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional().allow(''),
  status: Joi.string().valid('active', 'completed', 'on-hold').optional(),
  color: Joi.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

const addMemberSchema = Joi.object({
  userId: Joi.string().required(),
});

// Task Schemas
const taskSchema = Joi.object({
  title: Joi.string().min(2).max(150).required(),
  description: Joi.string().max(1000).optional().allow(''),
  project: Joi.string().required(),
  assignedTo: Joi.string().optional().allow('', null),
  status: Joi.string().valid('todo', 'in-progress', 'done').optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  dueDate: Joi.date().optional().allow(null),
  tags: Joi.string().max(200).optional().allow(''),
});

const updateTaskSchema = Joi.object({
  title: Joi.string().min(2).max(150).optional(),
  description: Joi.string().max(1000).optional().allow(''),
  assignedTo: Joi.string().optional().allow('', null),
  status: Joi.string().valid('todo', 'in-progress', 'done').optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  dueDate: Joi.date().optional().allow(null),
  tags: Joi.string().max(200).optional().allow(''),
});

module.exports = {
  validate,
  signupSchema,
  loginSchema,
  projectSchema,
  addMemberSchema,
  taskSchema,
  updateTaskSchema,
};
