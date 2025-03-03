const multer = require("multer");
const path = require("path");

const profileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/assets/profile-image/");
    },
    filename: function (req, file, cb) {
        cb(null, "profile-" + Date.now() + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);

    if (extName && mimeType) {
        return cb(null, true);
    } else {
        cb("Error: Only images are allowed!");
    }
};

const uploadConfig = {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
    fileFilter: fileFilter
};

const profileUpload = multer({
    storage: profileStorage,
    ...uploadConfig
});

module.exports = profileUpload;