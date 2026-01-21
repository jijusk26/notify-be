import { Router } from "express";
import { getAllUsers, getUserById } from "../controllers/userController";
import { authenticateToken as authenticate } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, getAllUsers);
router.get("/:id", authenticate, getUserById);

export default router;
