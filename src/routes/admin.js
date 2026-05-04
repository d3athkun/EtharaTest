const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

// Only the email in SUPER_ADMIN_EMAIL env var can access this panel
const requireSuperAdmin = (req, res, next) => {
  const superEmail = process.env.SUPER_ADMIN_EMAIL;
  if (!superEmail) return res.status(403).json({ error: 'Super admin not configured on this server.' });
  if (req.user.email !== superEmail) return res.status(403).json({ error: 'Super admin access required.' });
  next();
};

// GET /api/admin/overview — system-wide stats + all projects
router.get('/overview', authenticate, requireSuperAdmin, async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        tasks: {
          select: { id: true, status: true, priority: true, dueDate: true, title: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const allMemberIds = new Set(projects.flatMap(p => p.members.map(m => m.userId)));
    const totalTasks = projects.reduce((sum, p) => sum + p.tasks.length, 0);
    const doneTasks = projects.reduce((sum, p) => sum + p.tasks.filter(t => t.status === 'DONE').length, 0);

    res.json({
      projects: projects.map(p => ({ ...p, role: 'ADMIN' })),
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

// PATCH /api/admin/projects/:projectId/members/:userId — change any member's role
router.patch('/projects/:projectId/members/:userId', authenticate, requireSuperAdmin, async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['ADMIN', 'MEMBER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be ADMIN or MEMBER.' });
    }
    if (req.params.userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot change your own role.' });
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
