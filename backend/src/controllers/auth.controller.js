const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendCreated } = require('../utils/response');
const authService = require('../services/auth.service');

exports.login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body.email, req.body.password, req);
  sendSuccess(res, result, null, 'Login successful');
});

exports.signup = asyncHandler(async (req, res) => {
  const result = await authService.signup(req.body, req);
  sendCreated(res, result, 'User registered successfully');
});

exports.refresh = asyncHandler(async (req, res) => {
  const result = await authService.refresh(req.body.refreshToken);
  sendSuccess(res, result);
});

exports.logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body.refreshToken, req.user?.id, req);
  sendSuccess(res, null, null, 'Logged out');
});

exports.me = asyncHandler(async (req, res) => {
  const payload = await authService.getUserAuthPayload(req.user.id);
  sendSuccess(res, payload);
});

exports.changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
  sendSuccess(res, null, null, 'Password updated');
});
