const mongoose = require('mongoose');

const coinSchema = new mongoose.Schema({
    name: { type: String, required: true },
    status: { type: String, default: 'circulating' },
}, 

{ timestamps: true});

module.exports = mongoose.model('Users', coinSchema);