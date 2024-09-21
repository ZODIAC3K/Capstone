
const { CouponDetails } = require('../models');

exports.createCoupon = async (req, res, next) => {
    try {
        const { discount, title, description, end_at } = req.body;
        const coupon = new CouponDetails({
            discount,
            title,
            description,
            end_at
        });
        await coupon.save();
        res.status(201).json({ 
            status: 'success',
            data: {
                coupons : coupon
            }
        });
    } catch (error) {
        res.status(400).json({ status: 'fail', error: error.message });
    }
};

exports.updateCoupon = async (req, res, next) => {
    try {
        const { discount, title, description, end_at } = req.body;
        const updatedCoupon = await CouponDetails.findByIdAndUpdate(
            req.params.id,
            {
                discount,
                title,
                description,
                end_at,
                modified_at: Date.now()
            },
            { new: true }
        );
        if (!updatedCoupon) {
            return res.status(404).json({ status: "fail", message: 'Coupon not found' });
        }
        res.status(200).json({ status: 'success',
        message : "Coupon updated Successfully",
        data: {
            coupon: updatedCoupon
        }  });
    } catch (error) {
        res.status(400).json({ status: 'fail', error: error.message });
    }
};

exports.deleteCoupon = async (req, res, next) => {
    try {
        const { id } = req.params;
        await CouponDetails.findByIdAndDelete(id);
        res.status(200).json({ status: "success", message : "Category Deleted Successfully", });
    } catch (error) {
        res.status(400).json({ status: 'fail', error: error.message });
    }
};
exports.getCoupon = async (req, res, next) => {
    try {
        const coupons = await CouponDetails.find();
        res.status(200).json({ status: "success", results: coupons.length, data: {coupons : coupons}  });
    } catch (error) {
        res.status(400).json({ status: 'fail', error: error.message });
    }
};
