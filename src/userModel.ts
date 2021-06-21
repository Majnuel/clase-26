const mongoose = require('mongoose')

const userCollection = 'sessions'

const userSchema = new mongoose.Schema({
    user:{ type: String, required: true, max: 50 },
    password:{ type: String, required: true, max: 70 },
})

module.exports = mongoose.model(userCollection, userSchema)