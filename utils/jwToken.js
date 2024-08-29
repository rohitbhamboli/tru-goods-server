//create token and save to cookie

const sendToken = (user, statusCode, res) => {
  const token = user.getJWToken();

  //cooklie option
  const option = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  return res.status(statusCode).cookie("token", token, option).json({
    success: true,
    token,
    user,
  });
};

module.exports = sendToken;
