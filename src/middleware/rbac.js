const prisma = require('../lib/prisma');

// Requires user to be ADMIN in the target project (projectId from req.params)
const requireAdmin = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } },
    });

    if (!membership) return res.status(403).json({ error: 'Not a project member' });
    if (membership.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });

    req.membership = membership;
    next();
  } catch (err) {
    next(err);
  }
};

// Requires user to be any member (ADMIN or MEMBER)
const requireMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } },
    });

    if (!membership) return res.status(403).json({ error: 'Not a project member' });

    req.membership = membership;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireAdmin, requireMember };
