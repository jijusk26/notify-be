import { Request, Response } from "express";
import Post from "../models/Post";
import { AuthRequest } from "../middleware/auth";
import { bufferToBase64 } from "../middleware/upload";

export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const { description } = req.body;

    console.log("File received in createPost: the description", description);

    const userId = req.user?.userId;
    const file = req.file;

    if (!description) {
      res.status(400).json({
        success: false,
        message: "Description is required",
      });
      return;
    }

    if (!file) {
      res.status(400).json({
        success: false,
        message: "Image file is required",
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    console.log("File received in createPost:", file);
    const image = bufferToBase64(file.buffer, file.mimetype);

    const post = await Post.create({
      description,
      image,
      user: userId,
      likes: [],
      comments: [],
    });

    await post.populate("user", "phoneNumber name");

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: post,
    });
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAllPosts = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .populate("user", "phoneNumber name")
      .populate("likes", "phoneNumber name")
      .populate("comments.user", "phoneNumber name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments();

    res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error("Get all posts error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getPostById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id)
      .populate("user", "phoneNumber name")
      .populate("likes", "phoneNumber name")
      .populate("comments.user", "phoneNumber name");

    if (!post) {
      res.status(404).json({
        success: false,
        message: "Post not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error("Get post by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updatePost = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { description } = req.body;
    const userId = req.user?.userId;
    const file = req.file;

    const post = await Post.findById(id);

    if (!post) {
      res.status(404).json({
        success: false,
        message: "Post not found",
      });
      return;
    }

    if (post.user.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to update this post",
      });
      return;
    }

    if (description) post.description = description;
    if (file) {
      post.image = bufferToBase64(file.buffer, file.mimetype);
    }

    await post.save();
    await post.populate("user", "phoneNumber name");

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: post,
    });
  } catch (error) {
    console.error("Update post error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deletePost = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const post = await Post.findById(id);

    if (!post) {
      res.status(404).json({
        success: false,
        message: "Post not found",
      });
      return;
    }

    if (post.user.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to delete this post",
      });
      return;
    }

    await Post.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Like/Unlike post
export const toggleLike = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    const post = await Post.findById(id);

    if (!post) {
      res.status(404).json({
        success: false,
        message: "Post not found",
      });
      return;
    }

    const likeIndex = post.likes.findIndex(
      (like) => like.toString() === userId,
    );

    if (likeIndex === -1) {
      post.likes.push(userId as any);
    } else {
      post.likes.splice(likeIndex, 1);
    }

    await post.save();

    res.status(200).json({
      success: true,
      message: likeIndex === -1 ? "Post liked" : "Post unliked",
      data: {
        likesCount: post.likes.length,
        isLiked: likeIndex === -1,
      },
    });
  } catch (error) {
    console.error("Toggle like error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const addComment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user?.userId;

    if (!text) {
      res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    const post = await Post.findById(id);

    if (!post) {
      res.status(404).json({
        success: false,
        message: "Post not found",
      });
      return;
    }

    post.comments.push({
      user: userId as any,
      text,
      createdAt: new Date(),
    });

    await post.save();
    await post.populate("comments.user", "phoneNumber name");

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: post.comments[post.comments.length - 1],
    });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteComment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id, commentId } = req.params;
    const userId = req.user?.userId;

    const post = await Post.findById(id);

    if (!post) {
      res.status(404).json({
        success: false,
        message: "Post not found",
      });
      return;
    }

    const commentIndex = post.comments.findIndex(
      (comment: any) => comment._id.toString() === commentId,
    );

    if (commentIndex === -1) {
      res.status(404).json({
        success: false,
        message: "Comment not found",
      });
      return;
    }

    const comment = post.comments[commentIndex];
    if (comment.user.toString() !== userId && post.user.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to delete this comment",
      });
      return;
    }

    post.comments.splice(commentIndex, 1);
    await post.save();

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getPostsByUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ user: userId })
      .populate("user", "phoneNumber name")
      .populate("likes", "phoneNumber name")
      .populate("comments.user", "phoneNumber name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ user: userId });

    res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error("Get posts by user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
