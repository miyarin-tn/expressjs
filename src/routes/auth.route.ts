import express from 'express';

const router = express.Router();

const VerifyToken = require('../middlewares/verify');
const Validator = require('../middlewares/validator');
const AuthController = require('../controllers/auth.controller');

router.post('/register', Validator.RegisterValidator, AuthController.AuthRegisterController);
router.post('/login', Validator.LoginValidator, AuthController.AuthLoginController);
router.post('/login-social', Validator.SocialValidator, AuthController.AuthSocialController);
router.post('/:type_id/callback', AuthController.AuthCallbackController);
router.post('/refresh-token', VerifyToken.VerifyRefreshToken, AuthController.AuthRefreshController);
router.post('/logout', VerifyToken.VerifyAccessToken, AuthController.AuthLogoutController);

module.exports = router;
