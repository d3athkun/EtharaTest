const router = require('express').Router();
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  dueDate: z.string().datetime({ offset: true }).optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  projectId: z.string().min(1, 'Project ID is required'),
});

// Helper: verify user is member of task's project
const getTaskAndVerifyMembership = async (taskId, userId) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { include: { members: true } } },
  });
  if (!task) return { task: null, membership: null };

  const membership = task.project.members.find((m) => m.userId === userId);
  return { task, membership };
};

// GET /api/tasks - all tasks for current user across all projects
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, priority, projectId } = req.query;

    // Get all project IDs user is member of
    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.user.id },
      select: { projectId: true },
    });
    const projectIds = memberships.map((m) => m.projectId);

    const where = {
      projectId: { in: projectId ? [projectId] : projectIds },
      ...(status && { status }),
      ...(priority && { priority }),
    };

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks - create a task (must be project member)
router.post('/', authenticate, async (req, res, next) => {
  try {
    const parsed = taskSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { projectId, title, description, status, priority, dueDate, assigneeId } = parsed.data;

    // Verify membership
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } },
    });
    if (!membership) return res.status(403).json({ error: 'Not a project member' });

    // If assigning to someone, verify they are also a member
    if (assigneeId) {
      const assigneeMembership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: assigneeId } },
      });
      if (!assigneeMembership) {
        return res.status(400).json({ error: 'Assignee is not a project member' });
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        creatorId: req.user.id,
        assigneeId: assigneeId || null,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { task, membership } = await getTaskAndVerifyMembership(req.params.id, req.user.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (!membership) return res.status(403).json({ error: 'Access denied' });

    res.json(task);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tasks/:id - update task
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const { task, membership } = await getTaskAndVerifyMembership(req.params.id, req.user.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (!membership) return res.status(403).json({ error: 'Access denied' });

    // Members can only update status of their own tasks; Admins can update anything
    const isAdmin = membership.role === 'ADMIN';
    const isCreator = task.creatorId === req.user.id;
    const isAssignee = task.assigneeId === req.user.id;

    if (!isAdmin && !isCreator && !isAssignee) {
      return res.status(403).json({ error: 'You can only update tasks assigned to or created by you' });
    }

    const allowedFields = isAdmin
      ? ['title', 'description', 'status', 'priority', 'dueDate', 'assigneeId']
      : ['status']; // members can only update status

    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate);
    if (updateData.dueDate === null) updateData.dueDate = null;

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id (admin or creator only)
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { task, membership } = await getTaskAndVerifyMembership(req.params.id, req.user.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (!membership) return res.status(403).json({ error: 'Access denied' });

    const isAdmin = membership.role === 'ADMIN';
    const isCreator = task.creatorId === req.user.id;

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ error: 'Only admins or task creators can delete tasks' });
    }

    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
