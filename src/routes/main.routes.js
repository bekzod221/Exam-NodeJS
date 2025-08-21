import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { adminRouter } from "./admin.routes.js";
import { bookmarkRouter } from "./bookmark.routes.js";

export const mainRouter = Router();

mainRouter.use("/auth", authRouter);
mainRouter.use("/admin", adminRouter);
mainRouter.use("/bookmarks", bookmarkRouter); 