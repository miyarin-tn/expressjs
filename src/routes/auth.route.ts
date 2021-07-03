import express from 'express';

const router = express.Router();

const Validator = require('../utils/validator');
const AuthController = require('../controllers/auth.controller');

router.post('/register', Validator.RegisterValidator, AuthController.AuthRegisterController);
router.post('/login', Validator.LoginValidator, AuthController.AuthLoginController);

module.exports = router;
