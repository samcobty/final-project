var express = require('express');
var router = express.Router();
const Users = require('../models/users');
const mongoose = require('mongoose'); 

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/all', async (req, res) => {
    try {
        const coins = await Users.find();
        res.json(coins);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST new coin
router.post('/', async (req, res) => {
    try {
        const newCoin = new Users({
            name: req.body.name,
        });

        const savedCoin = await newCoin.save();
        res.status(201).json(savedCoin); 
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//PUT take coin (does not delete from DB)
router.put('/:id', async (req, res) => {
    try {
        const updatedCoin = await Users.findByIdAndUpdate(
            req.params.id, 
            { 
                status: 'taken',
                updatedAt: Date.now()
            }, 
            { new: true }
        );
        
        if (!updatedCoin) return res.status(404).send("Coin not found");
        res.json({ message: "Success!", coin: updatedCoin });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

//GET last 20 interactions
router.get('/logs', async (req, res) => {
    try {
        const recentActivity = await Users.find()
            .sort({ updatedAt: -1 }) 
            .limit(20);
        res.json(recentActivity);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;