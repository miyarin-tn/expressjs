import express from 'express';

const router = express.Router();

const VerifyToken = require('../middlewares/verify');
const UserController = require('../controllers/user.controller');

router.get('/', VerifyToken.VerifyAccessToken, UserController.UserListController);
router.get('/:user_id', VerifyToken.VerifyAccessToken, UserController.UserDetailController);
router.patch('/me', VerifyToken.VerifyAccessToken, UserController.UserUpdateController);
router.delete('/me', VerifyToken.VerifyAccessToken, UserController.UserDeactiveController);

module.exports = router;
