const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

// GET /api/dashboard
router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // All project IDs user belongs to
    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });
    const projectIds = memberships.map((m) => m.projectId);

    // Task stats across all user's projects
    const [total, todo, inProgress, done, overdue, assignedToMe, myProjects] = await Promise.all([
      prisma.task.count({ where: { projectId: { in: projectIds } } }),
      prisma.task.count({ where: { projectId: { in: projectIds }, status: 'TODO' } }),
      prisma.task.count({ where: { projectId: { in: projectIds }, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { projectId: { in: projectIds }, status: 'DONE' } }),
      prisma.task.count({
        where: {
          projectId: { in: projectIds },
          dueDate: { lt: now },
          status: { not: 'DONE' },
        },
      }),
      prisma.task.count({ where: { assigneeId: userId } }),
      prisma.project.count({ where: { id: { in: projectIds } } }),
    ]);

    // Recent overdue tasks (up to 5)
    const overdueTasks = await prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        dueDate: { lt: now },
        status: { not: 'DONE' },
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
    });

    // Recent tasks (up to 8)
    const recentTasks = await prisma.task.findMany({
      where: { projectId: { in: projectIds } },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 8,
    });

    res.json({
      stats: { total, todo, inProgress, done, overdue, assignedToMe, myProjects },
      overdueTasks,
      recentTasks,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
