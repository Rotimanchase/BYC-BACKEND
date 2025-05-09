import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import config from 'config'

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    recentlyViewed: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
      ],
    cartItems: {
        type: Object,
        default: {},
    }
}, {minimize: false})

userSchema.methods.generateAuthToken = function() {
    const token = jwt.sign({ _id: this._id, name: this.name, email: this.email, cartItems: this.cartItems}, config.get('jwtPrivateKey'))
    return token
}

const User = mongoose.model('User', userSchema)

export default User;