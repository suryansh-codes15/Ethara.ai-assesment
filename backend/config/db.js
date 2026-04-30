const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient().$extends({
  result: {
    user: {
      _id: {
        needs: { id: true },
        compute(user) {
          return user.id;
        },
      },
    },
    project: {
      _id: {
        needs: { id: true },
        compute(project) {
          return project.id;
        },
      },
    },
    task: {
      _id: {
        needs: { id: true },
        compute(task) {
          return task.id;
        },
      },
    },
  },
});

module.exports = prisma;
