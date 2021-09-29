  
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

let userSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, unique: true },
    password: { type: String, minlength: 5, maxlength: 20 },
    city: String,
    fullName: String,
  },
  { timestamps: true }
);

userSchema.pre('save', function (next) {
  this.fullName = this.firstName + ' ' + this.lastName;
  next();
});

userSchema.pre('save', function (next) {
  if (this.password && this.isModified('password')) {
    bcrypt.hash(this.password, 10, (err, hashedPwd) => {
      if (err) return next(err);
      this.password = hashedPwd;
      return next();
    });
  } else {
    next();
  }
});

userSchema.methods.verifyPassword = function (password, cb) {
  bcrypt.compare(password, this.password, (err, result) => {
    return cb(err, result);
  });
};

module.exports = mongoose.model('User', userSchema);