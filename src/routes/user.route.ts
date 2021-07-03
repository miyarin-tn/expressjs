import express from 'express';

const router = express.Router();

const UserController = require('../controllers/user.controller');

router.get('/', UserController.UserListController);
router.get('/:user_id', UserController.UserDetailController);
router.delete('/:user_id', UserController.UserDeactiveController);

module.exports = router;
