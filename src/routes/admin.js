const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

// GET /api/admin/overview - all projects where current user is ADMIN
router.get('/overview', authenticate, async (req, res, next) => {
  try {
    const adminMemberships = await prisma.projectMember.findMany({
      where: { userId: req.user.id, role: 'ADMIN' },
      include: {
        project: {
          include: {
            members: {
              include: { user: { select: { id: true, name: true, email: true } } },
              orderBy: { joinedAt: 'asc' },
            },
            tasks: {
              select: { id: true, status: true, priority: true, dueDate: true, title: true, createdAt: true },
            },
          },
        },
      },
    });

    if (adminMemberships.length === 0) {
      return res.status(403).json({ error: 'No admin access. Create a project to become its admin.' });
    }

    const projects = adminMemberships.map((m) => ({ ...m.project, role: 'ADMIN' }));
    const allMemberIds = new Set(projects.flatMap((p) => p.members.map((m) => m.userId)));
    const totalTasks = projects.reduce((sum, p) => sum + p.tasks.length, 0);
    const doneTasks = projects.reduce((sum, p) => sum + p.tasks.filter((t) => t.status === 'DONE').length, 0);

    res.json({
      projects,
      stats: {
        adminProjects: projects.length,
        totalMembers: allMemberIds.size,
        totalTasks,
        doneTasks,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/projects/:projectId/members/:userId - change member role
router.patch('/projects/:projectId/members/:userId', authenticate, async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['ADMIN', 'MEMBER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be ADMIN or MEMBER.' });
    }

    const myMembership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: req.params.projectId, userId: req.user.id } },
    });

    if (!myMembership || myMembership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required for this project' });
    }

    if (req.params.userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    const updated = await prisma.projectMember.update({
      where: { projectId_userId: { projectId: req.params.projectId, userId: req.params.userId } },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
