import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedMimes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/pdf",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only JPEG, PNG, and PDF files are allowed"),
    );
  }
};

const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
});

export default uploadMiddleware;
