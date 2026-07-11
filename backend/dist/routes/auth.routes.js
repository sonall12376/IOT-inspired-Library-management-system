"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const validation_1 = require("../middlewares/validation");
const auth_1 = require("../middlewares/auth");
const schemas_1 = require("../validations/schemas");
const router = (0, express_1.Router)();
// Registration route
router.post('/register', (0, validation_1.validateRequest)(schemas_1.registerSchema), auth_controller_1.AuthController.register);
// Login route
router.post('/login', (0, validation_1.validateRequest)(schemas_1.loginSchema), auth_controller_1.AuthController.login);
// Profile route (requires JWT authentication)
router.get('/profile', auth_1.validateJWT, auth_controller_1.AuthController.getProfile);
exports.default = router;
