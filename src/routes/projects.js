const router = require('express').Router();
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const { requireAdmin, requireMember } = require('../middleware/rbac');

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
});

// GET /api/projects - list all projects the user is a member of
router.get('/', authenticate, async (req, res, next) => {
  try {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.user.id },
      include: {
        project: {
          include: {
            _count: { select: { tasks: true, members: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const projects = memberships.map((m) => ({
      ...m.project,
      role: m.role,
    }));

    res.json(projects);
  } catch (err) {
    next(err);
  }
});

// POST /api/projects - create project (user becomes ADMIN)
router.post('/', authenticate, async (req, res, next) => {
  try {
    const parsed = projectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const project = await prisma.project.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        members: {
          create: { userId: req.user.id, role: 'ADMIN' },
        },
      },
      include: { _count: { select: { tasks: true, members: true } } },
    });

    res.status(201).json({ ...project, role: 'ADMIN' });
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id - project detail
router.get('/:id', authenticate, requireMember, async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            creator: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ ...project, role: req.membership.role });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/projects/:id - update project (admin only)
router.patch('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const parsed = projectSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: parsed.data,
    });
    res.json(project);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:id (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:id/members - invite member by email (admin only)
router.post('/:id/members', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const invitee = await prisma.user.findUnique({ where: { email } });
    if (!invitee) return res.status(404).json({ error: 'User not found' });

    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: req.params.id, userId: invitee.id } },
    });
    if (existing) return res.status(409).json({ error: 'User already a member' });

    const member = await prisma.projectMember.create({
      data: {
        projectId: req.params.id,
        userId: invitee.id,
        role: role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json(member);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:id/members/:userId (admin only)
router.delete('/:id/members/:userId', authenticate, requireAdmin, async (req, res, next) => {
  try {
    if (req.params.userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot remove yourself as admin' });
    }

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId: req.params.id, userId: req.params.userId } },
    });
    res.json({ message: 'Member removed' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
