const { timingSafeEqual } = require("crypto");

module.exports = (req, res, next) => {
  const expected = process.env.MCP_API_TOKEN;
  if (!expected) {
    return res.status(503).json({ success: false, message: "MCP API is not configured" });
  }

  const authorization = req.get("authorization") || "";
  const supplied = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);

  if (
    expectedBuffer.length !== suppliedBuffer.length ||
    !timingSafeEqual(expectedBuffer, suppliedBuffer)
  ) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  next();
};
