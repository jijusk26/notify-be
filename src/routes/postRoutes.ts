import { Router } from "express";
import {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  toggleLike,
  addComment,
  deleteComment,
  getPostsByUser,
} from "../controllers/postController";
import { authenticateToken as authenticate } from "../middleware/auth";
import { upload } from "../middleware/upload";

const router = Router();

router.get("/", getAllPosts);
router.get("/:id", getPostById);
router.get("/user/:userId", getPostsByUser);
router.post("/", authenticate, upload.single("image"), createPost);
router.put("/:id", authenticate, upload.single("image"), updatePost);
router.delete("/:id", authenticate, deletePost);
router.post("/:id/like", authenticate, toggleLike);
router.post("/:id/comments", authenticate, addComment);
router.delete("/:id/comments/:commentId", authenticate, deleteComment);

export default router;
