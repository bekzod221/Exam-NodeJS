import { Router } from "express";
import { 
  sendCode, 
  verifyCode, 
  register, 
  login,
  logout, 
  getCurrentUser,
  adminLogin,
  adminLogout,
  addAdmin
} from "../controller/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireAdminAuth } from "../middleware/admin.middleware.js";

const authRouter = Router();

// User authentication routes
authRouter.post("/login", login);
authRouter.post("/send-code", sendCode);
authRouter.post("/verify-code", verifyCode);
authRouter.post("/register", register);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, getCurrentUser);

// Admin authentication routes
authRouter.post("/admin/login", adminLogin);
authRouter.post("/admin/logout", adminLogout);
authRouter.post("/admin/add", requireAuth, requireAdminAuth, addAdmin);

export { authRouter };