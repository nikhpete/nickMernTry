const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../../middleware/auth');
const User = require('../../models/User');
const Profile = require('../../models/Profile');
const Post = require('../../models/Post');
const { json } = require('express');

// @route   POST api/posts
// @desc    Create a Post
// @access  Private
router.post(
  '/',
  [auth, check('text', 'text is required').not().isEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    try {
      const user = await User.findById(req.user.id).select('-password');
      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });
      const post = await newPost.save();
      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Internal Server Error');
    }
  }
);

// @route   GET api/posts
// @desc    get all Posts
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const post = await Post.find().sort({ date: -1 });
    res.json(post);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Internal server error');
  }
});

// @route   GET api/posts/:post_id
// @desc    get post by id
// @access  Private
router.get('/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (!post) return res.status(404).json({ msg: 'Post not found' });
    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId')
      return res.status(404).json({ msg: 'Post not found' });
    res.status(500).send('Internal server error');
  }
});

// @route   DELETE api/posts/:post_id
// @desc    delete post by id
// @access  Private
router.delete('/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    //check for post exits
    if (!post) return res.status(400).send('Post not found');

    //check user
    if (post.user.toString() !== req.user.id)
      return res.status(401).json({ msg: 'User not authorised' });

    await post.remove();

    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'Objectid') return res.status(400).send('Post not found');
    res.status(500).send('Internal server error');
  }
});

// @route   PUT api/posts/like/:post_id
// @desc    like a post by id
// @access  Private
router.put('/like/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    //check for post exits
    if (!post) return res.status(400).send('Post not found');

    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length > 0
    ) {
      return res.status(400).json({ msg: 'post already liked' });
    }

    post.likes.unshift({ user: req.user.id });

    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'Objectid') return res.status(400).send('Post not found');
    res.status(500).send('Internal server error');
  }
});

// @route   PUT api/posts/unlike/:post_id
// @desc    unlike a post by id
// @access  Private
router.put('/unlike/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    //check for post exits
    if (!post) return res.status(400).send('Post not found');

    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length ===
      0
    ) {
      return res.status(400).json({ msg: 'post not liked' });
    }

    const rowIndex = post.likes
      .map(like => like.user.toString())
      .indexOf(req.user.id);
    post.likes.splice(rowIndex, 1);

    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'Objectid') return res.status(400).send('Post not found');
    res.status(500).send('Internal server error');
  }
});

// @route   PUT api/posts/comment/:post_id
// @desc    comment a post by id
// @access  Private
router.put(
  '/comment/:post_id',
  [auth, check('text', 'text is required').not().isEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const post = await Post.findById(req.params.post_id);

      const user = await User.findById(req.user.id).select('-password');
      //check for post exits
      if (!post) return res.status(400).send('Post not found');

      const comment = {
        user: req.user.id,
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
      };

      post.comments.unshift(comment);

      await post.save();

      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'Objectid')
        return res.status(400).send('Post not found');
      res.status(500).send('Internal server error');
    }
  }
);

// @route   PUT api/posts/uncomment/:post_id/:comment_id
// @desc    comment a post by id
// @access  Private
router.put('/uncomment/:post_id/:comment_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    //check for post exits
    if (!post) return res.status(400).send('Post not found');

    const comment = post.comments.find(
      comment => comment.id === req.params.comment_id
    );

    if (!comment) {
      return res.status(404).json({ msg: 'comment does not exists' });
    }

    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'user not authorised' });
    }

    const rowIndex = post.comments.indexOf(comment);

    post.comments.splice(rowIndex, 1);

    await post.save();

    res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'Objectid') return res.status(404).send('Post not found');
    res.status(500).send('Internal server error');
  }
});

module.exports = router;
