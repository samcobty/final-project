var express = require('express');
var router = express.Router();
const Users = require('../models/users');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Take A Penny, Leave A Penny' });
});

module.exports = router;
