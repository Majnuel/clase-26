const mongoose = require('mongoose')

const userCollection = 'users'

const userSchema = mongoose.Schema({
    username:{ type: String, required: true, max: 50 },
    password:{ type: String, required: true, max: 70 },
})

module.exports = mongoose.model(userCollection, userSchema)