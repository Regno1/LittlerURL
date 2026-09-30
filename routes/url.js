const express= require('express');
const {ShortURL}= require('../controllers/url')

const router= express.Router();


router.post("/",ShortURL);

module.exports= router;