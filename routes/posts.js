const express = require("express");
const { check, validationResult } = require("express-validator");
const axios = require("axios");
const auth = require("../middleware/auth");
const User = require("../models/User");
const Post = require("../models/Post");
require("dotenv").config();

const router = express.Router();
const camera = ["navcam", "rhaz", "fhaz"];

//@route  Post /api/posts
//@access Private
//@desc   Create a post
router.post("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const tDE = new Date(); //todaysDateEarth
    const cLDE = new Date("2012-08-06Z05:17+01:00"); //curiosityLandingDateEarth
    const nOEDSBCOM = Math.round((tDE - cLDE) / (1000 * 60 * 60 * 24)); //noOfEarthDaysSpentByCuriosityOnMars
    const cNOSM = Math.floor(nOEDSBCOM / 1.0275); //curiosityNumberOfSolsMars
    for(let i=1; i<=7; i++)
    {
        let postContent = {
            sol: cNOSM - i,
            images: []
        };
        for(let j=0; j<3; j++)
        {
            const res = await axios.get(`https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?sol=${cNOSM-i}&camera=${camera[j]}&api_key=${process.env.API_KEY}`);
            if(res.data.photos.slice(0,1).length!==0)
            {
                postContent.images.push(res.data.photos.slice(0,1)[0].img_src);
            }
        }
        const newPost = new Post({
            name: user.name,
            user: user._id,
            postContent,
            date: new Date(),
        });
        await newPost.save();
    }
    const allPosts = await Post.find();
    res.json(allPosts);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

//@access Private
//@route  Get /api/posts
//@desc   Retrieve all posts
router.get('/',auth,async(req,res)=>{
    try{
      const posts=await Post.find().sort({date:-1});
      res.json(posts);
    }catch(err){
      console.error(err);
      res.status(500).send('Server Error');
    }
  })

//@access Private
//@desc  Get posts by id
//@route Get /api/posts/:id
router.get('/:id',auth,async(req,res)=>{
    try{
      const post=await Post.findById(req.params.id);
      if(!post)
      {
        return res.status(404).json({msg:'No post found'});
      }
      res.json(post);
    }catch(err){
      console.error(err);
      if(err.kind==='ObjectId')
      {
        return res.status(404).json({msg:'No post found'});
      }
      res.status(500).send('Server Error');
    }
  })
  
//@access Private
//@desc Delete post using its id
//@@route Delete /api/posts/:id
router.delete('/:id',auth,async(req,res)=>{
    try{
      const post=await Post.findById(req.params.id);
      if(!post)
      {
        return res.status(404).json({errors: [{msg:'No post found'}]});
      }
      if(post.user.toString()!==req.user.id)
      {
        return res.status(401).json({errors: [{msg:'User not authorised'}]});
      }
      await post.remove();
      res.json({msg:'The post has been removed'});
    }catch(err){
      console.error(err);
      if(err.kind==='ObjectId')
      {
        return res.status(404).json({errors: [{msg:'No post found'}]});
      }
      res.status(500).send('Server Error');
    }
  })

//@desc   Comment on a post
//@access Private
//@route  Put /api/posts/comment/:id
router.put('/comment/:id',[auth,check('text','Text is required').not().isEmpty()],async(req,res)=>{
    const errors=validationResult(req);
    if(!errors.isEmpty())
    {
      return res.status(400).json({errors:errors.array()});
    }
    try{
       const user=await User.findById(req.user.id);
       const post=await Post.findById(req.params.id);
       const newComment={
         text:req.body.text,
         name:user.name,
         user:req.user.id
       };
       post.comments.unshift(newComment);
       await post.save();
       res.json(post.comments);
    }catch(err){
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  })
  
  //@desc     Delete comment
  //@route    Delete /api/posts/comment/:id/:comment_id
  //@access   Private
  router.delete('/comment/:id/:comment_id',auth,async(req,res)=>{
    try{
      const post=await Post.findById(req.params.id);
      const comment=post.comments.find(comment=>comment.id.toString()===req.params.comment_id);
      if(comment.user.toString()!==req.user.id)
      {
        return res.status(401).json({msg:'User not authorised'});
      }
      const removeIndex=post.comments.map(comment=>comment.id).indexOf(req.params.comment_id);
      post.comments.splice(removeIndex,1);
      await post.save();
      res.json(post.comments);
    }catch(err){
      console.error(err);
      res.status(500).send('Server Error');
    }
  })

module.exports = router;
