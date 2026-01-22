import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  getFriends,
  sendFriendRequest,
  getPendingRequests,
  getSentRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
} from "../controllers/userController";
import { authenticateToken as authenticate } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, getAllUsers);
router.get("/:id", authenticate, getUserById);
router.get("/:id/friends", authenticate, getFriends);
router.post("/friend-request", authenticate, sendFriendRequest);
router.get("/friend-requests/pending", authenticate, getPendingRequests);
router.get("/friend-requests/sent", authenticate, getSentRequests);
router.post(
  "/friend-request/:requestId/accept",
  authenticate,
  acceptFriendRequest,
);
router.post(
  "/friend-request/:requestId/reject",
  authenticate,
  rejectFriendRequest,
);
router.delete("/friends/:friendId", authenticate, removeFriend);

export default router;
