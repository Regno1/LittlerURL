const URL = require('../model/url');
const shortid = require('shortid');

async function ShortURL(req, res) {
  const body = req.body;
  if (!body.url) return res.status(400).json({ error: "URL required" });

  const shortID = shortid();
  await URL.create({
    shortID: shortID,
    redirectURL: body.url,
    visitHistory: [],
  });

  return res.json({ id: shortID });
}

 module.exports={
  ShortURL,
 }