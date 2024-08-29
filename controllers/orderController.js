const Order = require("../models/orderModel");
const Product = require("../models/productmodel");

exports.newOrder = async (req, res, next) => {
  try {
    const {
      shippingInfo,
      orderItems,
      paymentInfo,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
    } = req.body;

    const order = await Order.create({
      shippingInfo,
      orderItems,
      paymentInfo,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      paidAt: Date.now(),
      user: req.user._id,
    });
    return res.status(201).json({
      success: true,
      order,
    });
  } catch (error) {
    const err = error.message;
    return res.status(400).json({ error: err });
  }
};

exports.getSingleOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email"
    );

    if (!order) {
      return res
        .status(404)
        .json({ message: `No order found with id: ${req.params.id}` });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    const err = error.message;
    return res.status(500).json({ error: err });
  }
};

//get logged in user orders

exports.myOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id });

    if (!orders) {
      return res
        .status(404)
        .json({ message: `No order found with id: ${req.user._id}` });
    }

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    const err = error.message;
    return res.status(500).json({ error: err });
  }
};

//get all orders --admin

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find();

    if (!orders) {
      return res.status(404).json({ message: `No orders` });
    }
    if (orders.length === 0) {
      return res
        .status(200)
        .json({ success: true, message: `There are no orders` });
    }

    let totalAmount = 0;
    orders.forEach((order) => {
      totalAmount += order.totalPrice;
    });

    return res.status(200).json({
      success: true,
      totalAmount,
      orders,
    });
  } catch (error) {
    const err = error.message;
    return res.status(500).json({ error: err });
  }
};

//get order Status --admin

exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "No order found." });
    }

    if (order.orderStatus === "Delivered") {
      return res
        .status(400)
        .json({ success: true, message: "Order has been delivered already." });
    }

    order.orderItems.forEach(async (o) => {
      await updateStock(o.product, o.quantity);
    });

    order.orderStatus = req.body.status;

    if (req.body.status === "Delivered") {
      order.deliveredAt = Date.now();
    }

    await order.save({ validateBeforeSave: false });
    return res.status(201).json({ success: true });
  } catch (error) {
    const err = error.message;
    return res.status(500).json({ error: err });
  }
};

async function updateStock(id, quantity) {
  const product = await Product.findById(id);
  product.stock -= quantity;

  await product.save({ validateBeforeSave: false });
}

// delete order --admin

exports.deleteOrders = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `No order with id : ${req.params.id}`,
      });
    }

    await order.deleteOne();
    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    const err = error.message;
    return res.status(500).json({ success: false, error: err });
  }
};
