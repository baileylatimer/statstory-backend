import { Router } from 'express';
import postsController from '../controllers/posts.controller';
import { authenticateUser } from '../middleware/auth';

const router = Router({ mergeParams: true });

// Apply authentication middleware to all routes
router.use(authenticateUser as any);

/**
 * @route   GET /api/saves/:saveId/posts
 * @desc    Get all posts for a save
 * @access  Private
 */
router.get('/', postsController.getPosts);

/**
 * @route   GET /api/saves/:saveId/posts/:postId
 * @desc    Get a single post by ID
 * @access  Private
 */
router.get('/:postId', postsController.getPostById);

/**
 * @route   POST /api/saves/:saveId/posts
 * @desc    Create a new post
 * @access  Private
 */
router.post('/', postsController.createPost);

/**
 * @route   PUT /api/saves/:saveId/posts/:postId
 * @desc    Update a post
 * @access  Private
 */
router.put('/:postId', postsController.updatePost);

/**
 * @route   DELETE /api/saves/:saveId/posts/:postId
 * @desc    Delete a post
 * @access  Private
 */
router.delete('/:postId', postsController.deletePost);

export default router;
