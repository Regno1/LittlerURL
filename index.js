const path = require('path');
const express = require('express');
const { connectMongo } = require('./connect')
const urlRoute = require('./routes/url')
const app = express();
const URL = require("./model/url")

const PORT = 8001;
const url = "mongodb://127.0.0.1:27017/short-url";

connectMongo(url)
  .then(() => {
    console.log("connected db");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/url', urlRoute);

app.get('/:shortId', async (req, res) => {
  const shortId = req.params.shortId;
  const entry = await URL.findOneAndUpdate({
    shortID: shortId,
  }, {
    $push: {
      visitHistory: {
        timestamp: Date.now(),
      },
    },
  });

  if (!entry) {
    return res.status(404).send("Short URL not found");
  }

  res.redirect(entry.redirectURL);
});

app.listen(PORT, () => {
  console.log(`Server Started:${PORT}`);
});