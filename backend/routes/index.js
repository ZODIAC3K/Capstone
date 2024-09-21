const authRouter = require('./auth');
const emailVerificationRouter = require('./email');
const userRouter = require('./user');
const productRouter = require('./products');
const adminRouter = require('./admin');
const orderRouter = require('./orders');
const bannerRouter = require('./banner');
const offerRouter = require('./offers');
const brandRouter = require('./brand');
const categoryRouter = require('./category')

module.exports = {
    authRouter,
    emailVerificationRouter,
    userRouter,
    productRouter,
    adminRouter,
    orderRouter,
    bannerRouter,
    offerRouter,
    brandRouter,
    categoryRouter
}