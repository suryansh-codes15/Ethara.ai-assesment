const prisma = require('../config/db');

const formatUser = (user) => {
  if (!user) return null;
  return { ...user, _id: user.id };
};

const formatProject = (project) => {
  if (!project) return null;
  return {
    ...project,
    _id: project.id,
    creator: formatUser(project.creator),
    members: project.members ? project.members.map(formatUser) : [],
  };
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private/Admin
const createProject = async (req, res, next) => {
  try {
    const { name, description, status, color } = req.body;
    const project = await prisma.project.create({
      data: {
        name,
        description,
        status,
        color,
        createdBy: req.user.id,
        members: {
          connect: [{ id: req.user.id }]
        }
      },
      include: {
        creator: { select: { name: true, email: true, role: true, avatar: true } },
        members: { select: { id: true, name: true, email: true, role: true, avatar: true } }
      }
    });

    res.status(201).json({ success: true, project: formatProject(project) });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all projects (admin: all, member: own)
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res, next) => {
  try {
    let where = {};
    if (req.user.role !== 'admin') {
      where = { members: { some: { id: req.user.id } } };
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { name: true, email: true, avatar: true } },
        members: { select: { id: true, name: true, email: true, role: true, avatar: true } },
        _count: {
          select: { tasks: true }
        }
      }
    });

    // Add task counts
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const completedCount = await prisma.task.count({
          where: { projectId: project.id, status: 'done' }
        });
        const taskCount = project._count.tasks;
        delete project._count;
        return {
          ...project,
          taskCount,
          completedCount,
        };
      })
    );

    res.json({ success: true, count: projects.length, projects: projectsWithCounts.map(formatProject) });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
const getProject = async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        creator: { select: { name: true, email: true, avatar: true } },
        members: { select: { id: true, name: true, email: true, role: true, avatar: true } }
      }
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // Check access
    const isMember = project.members.some(m => m.id === req.user.id);
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, project: formatProject(project) });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private/Admin
const updateProject = async (req, res, next) => {
  try {
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        creator: { select: { name: true, email: true, role: true, avatar: true } },
        members: { select: { id: true, name: true, email: true, role: true, avatar: true } }
      }
    });

    res.json({ success: true, project: formatProject(project) });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private/Admin
const deleteProject = async (req, res, next) => {
  try {
    await prisma.task.deleteMany({ where: { projectId: req.params.id } });
    await prisma.project.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: 'Project and all its tasks deleted.' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    next(error);
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/add-member
// @access  Private/Admin
const addMember = async (req, res, next) => {
  try {
    const { userId } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        members: { connect: [{ id: userId }] }
      },
      include: {
        creator: { select: { name: true, email: true, role: true, avatar: true } },
        members: { select: { id: true, name: true, email: true, role: true, avatar: true } }
      }
    });

    res.json({ success: true, message: 'Member added successfully.', project: formatProject(project) });
  } catch (error) {
    if (error.code === 'P2025') {
       return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    next(error);
  }
};

// @desc    Remove member from project
// @route   POST /api/projects/:id/remove-member
// @access  Private/Admin
const removeMember = async (req, res, next) => {
  try {
    const { userId } = req.body;

    const projectCheck = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!projectCheck) {
       return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    if (projectCheck.createdBy === userId) {
      return res.status(400).json({ success: false, message: 'Cannot remove the project creator.' });
    }

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        members: { disconnect: [{ id: userId }] }
      },
      include: {
        creator: { select: { name: true, email: true, role: true, avatar: true } },
        members: { select: { id: true, name: true, email: true, role: true, avatar: true } }
      }
    });

    res.json({ success: true, message: 'Member removed.', project: formatProject(project) });
  } catch (error) {
    if (error.code === 'P2025') {
       return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    next(error);
  }
};

module.exports = { createProject, getProjects, getProject, updateProject, deleteProject, addMember, removeMember };
