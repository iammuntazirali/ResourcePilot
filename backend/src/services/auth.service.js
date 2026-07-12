const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const jwtConfig = require('../config/jwt');
const { User, Role, Permission, RefreshToken } = require('../models');
const ApiError = require('../utils/ApiError');
const { hashToken } = require('../utils/tokens');
const { createAuditLog } = require('./audit.service');

const SALT_ROUNDS = 12;

const signAccessToken = (userId, roles, permissions) =>
  jwt.sign({ userId, roles, permissions }, jwtConfig.accessSecret, {
    expiresIn: jwtConfig.accessExpires,
  });

const createRefreshToken = async (userId) => {
  const rawToken = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    userId,
    tokenHash: hashToken(rawToken),
    expiresAt,
  });

  return rawToken;
};

const getUserAuthPayload = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [
      {
        model: Role,
        as: 'roles',
        include: [{ model: Permission, as: 'permissions' }],
      },
      'department',
    ],
  });

  if (!user) throw ApiError.notFound('User not found');

  const roles = user.roles.map((r) => r.name);
  const permissions = [...new Set(user.roles.flatMap((r) => r.permissions.map((p) => p.code)))];

  return {
    user: user.toJSON(),
    roles,
    permissions,
  };
};

const login = async (email, password, req) => {
  const user = await User.scope('withPassword').findOne({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  await user.update({ lastLoginAt: new Date() });

  const { user: authUser, roles, permissions } = await getUserAuthPayload(user.id);
  const accessToken = signAccessToken(user.id, roles, permissions);
  const refreshToken = await createRefreshToken(user.id);

  await createAuditLog({
    userId: user.id,
    action: 'LOGIN',
    entityType: 'user',
    entityId: user.id,
    req,
  });

  return { user: authUser, accessToken, refreshToken, roles, permissions };
};

const refresh = async (rawRefreshToken) => {
  const tokenRecord = await RefreshToken.findOne({
    where: { tokenHash: hashToken(rawRefreshToken), revokedAt: null },
  });

  if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  await tokenRecord.update({ revokedAt: new Date() });

  const { user, roles, permissions } = await getUserAuthPayload(tokenRecord.userId);
  const accessToken = signAccessToken(tokenRecord.userId, roles, permissions);
  const refreshToken = await createRefreshToken(tokenRecord.userId);

  return { user, accessToken, refreshToken, roles, permissions };
};

const logout = async (rawRefreshToken, userId, req) => {
  if (rawRefreshToken) {
    await RefreshToken.update(
      { revokedAt: new Date() },
      { where: { tokenHash: hashToken(rawRefreshToken), revokedAt: null } }
    );
  }

  if (userId) {
    await createAuditLog({
      userId,
      action: 'LOGOUT',
      entityType: 'user',
      entityId: userId,
      req,
    });
  }
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.scope('withPassword').findByPk(userId);
  if (!user) throw ApiError.notFound('User not found');

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw ApiError.badRequest('Current password is incorrect');

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.update({ passwordHash });

  await RefreshToken.update({ revokedAt: new Date() }, { where: { userId, revokedAt: null } });
};

const signup = async (data, req) => {
  const email = data.email.toLowerCase().trim();
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw ApiError.badRequest('Email is already registered');
  }

  const existingCode = await User.findOne({ where: { employeeCode: data.employeeCode } });
  if (existingCode) {
    throw ApiError.badRequest('Employee code is already registered');
  }

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  const role = await Role.findOne({ where: { name: 'employee' } });
  if (!role) {
    throw ApiError.internal('Employee role not configured in the system');
  }

  const user = await User.create({
    email,
    passwordHash,
    employeeCode: data.employeeCode,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone || null,
    departmentId: data.departmentId || null,
    isActive: true,
  });

  await require('../models').UserRole.create({
    userId: user.id,
    roleId: role.id,
    assignedAt: new Date(),
  });

  const { user: authUser, roles, permissions } = await getUserAuthPayload(user.id);
  const accessToken = signAccessToken(user.id, roles, permissions);
  const refreshToken = await createRefreshToken(user.id);

  await createAuditLog({
    userId: user.id,
    action: 'SIGNUP',
    entityType: 'user',
    entityId: user.id,
    req,
  });

  return { user: authUser, accessToken, refreshToken, roles, permissions };
};

const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);

module.exports = {
  login,
  signup,
  refresh,
  logout,
  changePassword,
  hashPassword,
  getUserAuthPayload,
};
