const {
	Product,
	stockDetail,
	productDetailsSchema,
	stockDetailSchema,
} = require("./ProductDetailsSchema");
const {BrandDetails, brandSchema} = require("./BrandDetailsSchema");
const {CategoryDetails, categorySchema} = require("./CategoryDetailsSchema");
const ImageDetails = require("./ImageDetailsSchema");
const {CouponDetails, couponSchema} = require("./CouponDetailsSchema");
const {OfferDetails, offerSchema} = require("./OfferDetailsSchema");
const {ProductReviewDetails, productReviewSchema} = require("./ProductReviewDetails");
const {BannerDetails, bannerSchema} = require("./BannerDetailsSchema");
const {OrderDetails, orderSchema} = require("./OrderDetailsSchema");
const {ReturnDetails, returnSchema} = require("./ReturnDetailsSchema");
const {ModificationTrackingDetails, modificationTrackingDetailsSchema} = require("./ModificationTrackingDetails");
const {Admin, adminSchema} = require("./AdminSchema");
const {UserDetail, userDetailSchema} = require("./UserDetailSchema");
const { Token, tokenSchema } = require("./VerificationTokens");
const { Address, addressSchema } = require("./AddressSchema");
const { Transaction, transactionSchema } = require("./TransactionSchema");


module.exports = {
	Product,
	stockDetail,
	BrandDetails,
	CategoryDetails,
	ImageDetails,
	CouponDetails,
	OfferDetails,
	ProductReviewDetails,
	BannerDetails,
	OrderDetails,
	ReturnDetails,
	ModificationTrackingDetails,
	Admin,
	UserDetail,
	Token,
	Address,
	Transaction,
	productDetailsSchema,
	stockDetailSchema,
	brandSchema,
	categorySchema,
	couponSchema,
	offerSchema,
	productReviewSchema,
	bannerSchema,
	orderSchema,
	returnSchema,
	modificationTrackingDetailsSchema,
	adminSchema,
	userDetailSchema,
	tokenSchema,
	addressSchema,
	transactionSchema,
};
