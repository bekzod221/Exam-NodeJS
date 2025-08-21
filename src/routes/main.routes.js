import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { adminRouter } from "./admin.routes.js";
import { cartRouter } from "./cart.routes.js";
import { orderRouter } from "./order.routes.js";

export const mainRouter = Router();

mainRouter.use("/auth", authRouter);
mainRouter.use("/admin", adminRouter);
mainRouter.use("/cart", cartRouter);
mainRouter.use("/orders", orderRouter); 