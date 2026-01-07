const mongoose = require('mongoose');

const imageSchema = mongoose.Schema(
  {
    filename: String,
    filePath: String, // e.g., "products/product1/image.jpg"
    mimeType: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Image', imageSchema);
