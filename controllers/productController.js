const Product = require("../models/productmodel");
const ApiFeatures = require("../utils/apiFeatures");

//create product --ADMIN
exports.createProducts = async (req, res, next) => {
  try {
    req.body.user = req.user.id;
    const product = await Product.create(req.body);
    if (product) {
      res.status(200).json({ success: true, product });
    }
  } catch (error) {
    res.status(500).json({ error: "Cannot create product", error });
  }
};

//update product --ADMIN

exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(500).json({
        success: false,
        message: "Product not found",
      });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      useFindAndModify: true,
    });

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    const err = error.message;
    res.status(500).json({
      success: false,
      error: err,
    });
  }
};

//delete product --ADMIN

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(500).json({
        success: false,
        message: "Product not found",
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Product deleted",
    });
  } catch (error) {
    const err = error.message;
    res.status(500).json({
      success: false,
      error: err,
    });
  }
};

//get product details

exports.getProductDetail = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(500).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    const err = error.message;
    res.status(500).json({
      success: false,
      error: err,
    });
  }
};
//get all products
exports.getAllProducts = async (req, res) => {
  try {
    const resultPerPage = 9;
    const productCount = await Product.countDocuments();
    const apiFeature = new ApiFeatures(Product.find(), req.query)
      .search()
      .filter();

    let products = await apiFeature.query;
    let filteredProductsCount = products.length;

    apiFeature.pagination(resultPerPage);
    products = await apiFeature.query.clone();
    return res.status(200).json({
      success: true,
      products,
      productCount,
      resultPerPage,
      filteredProductsCount,
    });
  } catch (error) {
    const err = error.message;
    return res.status(500).json({ success: false, error: err });
  }
};

//create new review or update
exports.createProductReview = async (req, res) => {
  try {
    const { rating, comment, productId } = req.body;
    const review = {
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment,
    };

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const isReviewed = product.reviews.find(
      (rev) => rev.user.toString() === req.user._id.toString()
    );

    if (isReviewed) {
      product.reviews.forEach((rev) => {
        if (rev.user.toString() === req.user._id.toString()) {
          rev.rating = rating;
          rev.comment = comment;
        }
      });
    } else {
      product.reviews.push(review);
      product.numOfReviews = product.reviews.length;
    }

    //overall rating
    const totalRating = product.reviews.reduce(
      (total, rev) => total + rev.rating,
      0
    );

    const avgRating = totalRating / product.reviews.length;
    product.ratings = avgRating;
    await product.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    const err = error.message;
    return res.status(500).json({
      success: false,
      message: err,
    });
  }
};

//get all reviews
exports.getAllReviews = async (req, res) => {
  try {
    const product = await Product.findById(req.query.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      reviews: product.reviews,
    });
  } catch (error) {
    const err = error.message;
    return res.status(400).json({
      success: false,
      message: err,
    });
  }
};

//delete reviews
exports.deleteReview = async (req, res) => {
  try {
    const product = await Product.findById(req.query.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const reviews = product.reviews.filter(
      (rev) => rev._id.toString() !== req.query.productId.toString()
    );

    const totalRating = reviews.reduce((total, rev) => total + rev.rating, 0);

    const avgRating = totalRating / reviews.length;
    const ratings = avgRating;
    const numOfReviews = reviews.length;

    await Product.findByIdAndUpdate(
      req.query.productId,
      {
        reviews,
        ratings,
        numOfReviews,
      },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    );

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    const err = error.message;
    return res.status(500).json({
      success: false,
      message: err,
    });
  }
};
