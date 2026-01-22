import { Request, Response } from "express";
import User from "../models/User";
import FriendRequest from "../models/FriendRequest";
import mongoose from "mongoose";

interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

export const getAllUsers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getFriends = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select("friends")
      .populate("friends", "phoneNumber name image");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user.friends,
    });
  } catch (error) {
    console.error("Get friends error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const sendFriendRequest = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const fromUserId = req.user?.userId;
    const { toUserId } = req.body;

    if (!fromUserId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    if (!toUserId) {
      res.status(400).json({
        success: false,
        message: "Target user ID is required",
      });
      return;
    }

    if (fromUserId === toUserId) {
      res.status(400).json({
        success: false,
        message: "You cannot send a friend request to yourself",
      });
      return;
    }

    // Check if target user exists
    const targetUser = await User.findById(toUserId);
    if (!targetUser) {
      res.status(404).json({
        success: false,
        message: "Target user not found",
      });
      return;
    }

    // Check if already friends
    const currentUser = await User.findById(fromUserId);
    if (currentUser?.friends?.includes(new mongoose.Types.ObjectId(toUserId))) {
      res.status(400).json({
        success: false,
        message: "You are already friends with this user",
      });
      return;
    }

    // Check if request already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { from: fromUserId, to: toUserId },
        { from: toUserId, to: fromUserId },
      ],
      status: "pending",
    });

    if (existingRequest) {
      res.status(400).json({
        success: false,
        message: "A friend request already exists between you and this user",
      });
      return;
    }

    const friendRequest = await FriendRequest.create({
      from: fromUserId,
      to: toUserId,
      status: "pending",
    });

    await friendRequest.populate("from to", "phoneNumber name image");

    res.status(201).json({
      success: true,
      message: "Friend request sent successfully",
      data: friendRequest,
    });
  } catch (error) {
    console.error("Send friend request error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get pending friend requests (received)
export const getPendingRequests = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    const requests = await FriendRequest.find({
      to: userId,
      status: "pending",
    }).populate("from", "phoneNumber name image");

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("Get pending requests error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get sent friend requests
export const getSentRequests = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    const requests = await FriendRequest.find({
      from: userId,
      status: "pending",
    }).populate("to", "phoneNumber name image");

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("Get sent requests error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Accept friend request
export const acceptFriendRequest = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { requestId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      res.status(404).json({
        success: false,
        message: "Friend request not found",
      });
      return;
    }

    if (friendRequest.to.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to accept this request",
      });
      return;
    }

    if (friendRequest.status !== "pending") {
      res.status(400).json({
        success: false,
        message: "This request has already been processed",
      });
      return;
    }

    // Update request status
    friendRequest.status = "accepted";
    await friendRequest.save();

    // Add each user to the other's friends list
    await User.findByIdAndUpdate(friendRequest.from, {
      $addToSet: { friends: friendRequest.to },
    });

    await User.findByIdAndUpdate(friendRequest.to, {
      $addToSet: { friends: friendRequest.from },
    });

    res.status(200).json({
      success: true,
      message: "Friend request accepted",
    });
  } catch (error) {
    console.error("Accept friend request error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Reject friend request
export const rejectFriendRequest = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { requestId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      res.status(404).json({
        success: false,
        message: "Friend request not found",
      });
      return;
    }

    if (friendRequest.to.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to reject this request",
      });
      return;
    }

    if (friendRequest.status !== "pending") {
      res.status(400).json({
        success: false,
        message: "This request has already been processed",
      });
      return;
    }

    friendRequest.status = "rejected";
    await friendRequest.save();

    res.status(200).json({
      success: true,
      message: "Friend request rejected",
    });
  } catch (error) {
    console.error("Reject friend request error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Remove friend
export const removeFriend = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { friendId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    // Remove from both users' friends lists
    await User.findByIdAndUpdate(userId, {
      $pull: { friends: friendId },
    });

    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: userId },
    });

    // Delete the friend request record
    await FriendRequest.deleteOne({
      $or: [
        { from: userId, to: friendId },
        { from: friendId, to: userId },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Friend removed successfully",
    });
  } catch (error) {
    console.error("Remove friend error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
