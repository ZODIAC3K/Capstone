const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
   user_id: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    order_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Order'},
    razorpay_payment_id : {String},
    razorpay_order_id : {String},
    razorpay_signature : {String},
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = {Transaction, transactionSchema};