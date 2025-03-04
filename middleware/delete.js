const fs = require('fs');
const path = require('path');
const dashboardController = require('../controllers/dashboardController');

const deleteImg = async (req, res, next) => {
    const { id } = req.body;

    // For new product creation, skip image deletion check
    if (!id) {
        req.newImage = req.file ? `/assets/product-image/${req.file.filename}` : '/assets/product-image/default.jpg';
        return next();
    }

    const newImage = req.file ? `/assets/product-image/${req.file.filename}` : null;

    try {
        // Fetch the old product details
        const oldProduct = await dashboardController.getProductById(id);
        const oldImage = oldProduct.image_url;

        // Delete the old image if a new image is uploaded
        if (newImage && oldImage && oldImage !== newImage) {
            const oldImagePath = path.join(__dirname, '..', oldImage);
            fs.unlink(oldImagePath, (err) => {
                if (err) {
                    console.error('Error deleting old image:', err);
                }
            });
        }

        // Attach the new image path to the request object
        req.newImage = newImage || oldImage;
        next();
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).send('Error updating product');
    }
};

module.exports = deleteImg;