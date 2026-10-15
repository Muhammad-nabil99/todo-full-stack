import { Router } from "express";
import health from "./health.js";
import todos from "./todos.js";

const router = Router();

router.use("/health", health);
router.use("/todos", todos);

export default router;
