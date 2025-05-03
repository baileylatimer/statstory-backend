import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebase';
import { ApiError } from '../middleware/error';
import { CreatePostRequest, Post } from '../types';

/**
 * Controller for post-related operations
 */
export const postsController = {
  /**
   * Get all posts for a save
   */
  getPosts: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new ApiError('Unauthorized', 401));
      }
      
      const { saveId } = req.params;
      
      // Check if save exists and belongs to the user
      const saveDoc = await db.collection('saves').doc(saveId).get();
      
      if (!saveDoc.exists) {
        return next(new ApiError('Save not found', 404));
      }
      
      if (saveDoc.data()?.userId !== req.user.uid) {
        return next(new ApiError('Unauthorized', 403));
      }
      
      // Get posts
      const snapshot = await db
        .collection('saves')
        .doc(saveId)
        .collection('posts')
        .orderBy('createdAt', 'desc')
        .get();
      
      const posts: Post[] = [];
      
      snapshot.forEach((doc) => {
        posts.push({
          id: doc.id,
          ...doc.data()
        } as Post);
      });
      
      res.status(200).json({
        success: true,
        data: posts,
      });
    } catch (error) {
      next(new ApiError('Failed to get posts', 500));
    }
  },
  
  /**
   * Get a single post by ID
   */
  getPostById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new ApiError('Unauthorized', 401));
      }
      
      const { saveId, postId } = req.params;
      
      // Check if save exists and belongs to the user
      const saveDoc = await db.collection('saves').doc(saveId).get();
      
      if (!saveDoc.exists) {
        return next(new ApiError('Save not found', 404));
      }
      
      if (saveDoc.data()?.userId !== req.user.uid) {
        return next(new ApiError('Unauthorized', 403));
      }
      
      // Get post
      const postDoc = await db
        .collection('saves')
        .doc(saveId)
        .collection('posts')
        .doc(postId)
        .get();
      
      if (!postDoc.exists) {
        return next(new ApiError('Post not found', 404));
      }
      
      const post = {
        id: postDoc.id,
        ...postDoc.data()
      } as Post;
      
      res.status(200).json({
        success: true,
        data: post,
      });
    } catch (error) {
      next(new ApiError('Failed to get post', 500));
    }
  },
  
  /**
   * Create a new post
   */
  createPost: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new ApiError('Unauthorized', 401));
      }
      
      const { saveId } = req.params;
      const { title, vibe, mediaStyle, description, imageURL } = req.body as CreatePostRequest;
      
      if (!vibe || !mediaStyle || !description || !imageURL) {
        return next(new ApiError('Vibe, mediaStyle, description, and imageURL are required', 400));
      }
      
      // Check if save exists and belongs to the user
      const saveDoc = await db.collection('saves').doc(saveId).get();
      
      if (!saveDoc.exists) {
        return next(new ApiError('Save not found', 404));
      }
      
      if (saveDoc.data()?.userId !== req.user.uid) {
        return next(new ApiError('Unauthorized', 403));
      }
      
      // Create post
      const postData = {
        saveId,
        title,
        vibe,
        mediaStyle,
        description,
        imageURL,
        createdAt: new Date().toISOString(),
      };
      
      const postRef = await db
        .collection('saves')
        .doc(saveId)
        .collection('posts')
        .add(postData);
      
      const postDoc = await postRef.get();
      
      const post = {
        id: postDoc.id,
        ...postDoc.data()
      } as Post;
      
      res.status(201).json({
        success: true,
        data: post,
      });
    } catch (error) {
      next(new ApiError('Failed to create post', 500));
    }
  },
  
  /**
   * Update a post
   */
  updatePost: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new ApiError('Unauthorized', 401));
      }
      
      const { saveId, postId } = req.params;
      const { title, vibe, mediaStyle, description, imageURL } = req.body;
      
      // Check if save exists and belongs to the user
      const saveDoc = await db.collection('saves').doc(saveId).get();
      
      if (!saveDoc.exists) {
        return next(new ApiError('Save not found', 404));
      }
      
      if (saveDoc.data()?.userId !== req.user.uid) {
        return next(new ApiError('Unauthorized', 403));
      }
      
      // Check if post exists
      const postDoc = await db
        .collection('saves')
        .doc(saveId)
        .collection('posts')
        .doc(postId)
        .get();
      
      if (!postDoc.exists) {
        return next(new ApiError('Post not found', 404));
      }
      
      // Update post
      const updateData: Partial<Post> = {};
      
      if (title !== undefined) updateData.title = title;
      if (vibe) updateData.vibe = vibe;
      if (mediaStyle) updateData.mediaStyle = mediaStyle;
      if (description) updateData.description = description;
      if (imageURL) updateData.imageURL = imageURL;
      
      await db
        .collection('saves')
        .doc(saveId)
        .collection('posts')
        .doc(postId)
        .update(updateData);
      
      // Get updated post
      const updatedPostDoc = await db
        .collection('saves')
        .doc(saveId)
        .collection('posts')
        .doc(postId)
        .get();
      
      const updatedPost = {
        id: updatedPostDoc.id,
        ...updatedPostDoc.data()
      } as Post;
      
      res.status(200).json({
        success: true,
        data: updatedPost,
      });
    } catch (error) {
      next(new ApiError('Failed to update post', 500));
    }
  },
  
  /**
   * Delete a post
   */
  deletePost: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new ApiError('Unauthorized', 401));
      }
      
      const { saveId, postId } = req.params;
      
      // Check if save exists and belongs to the user
      const saveDoc = await db.collection('saves').doc(saveId).get();
      
      if (!saveDoc.exists) {
        return next(new ApiError('Save not found', 404));
      }
      
      if (saveDoc.data()?.userId !== req.user.uid) {
        return next(new ApiError('Unauthorized', 403));
      }
      
      // Check if post exists
      const postDoc = await db
        .collection('saves')
        .doc(saveId)
        .collection('posts')
        .doc(postId)
        .get();
      
      if (!postDoc.exists) {
        return next(new ApiError('Post not found', 404));
      }
      
      // Delete post
      await db
        .collection('saves')
        .doc(saveId)
        .collection('posts')
        .doc(postId)
        .delete();
      
      res.status(200).json({
        success: true,
        message: 'Post deleted successfully',
      });
    } catch (error) {
      next(new ApiError('Failed to delete post', 500));
    }
  },
};

export default postsController;
