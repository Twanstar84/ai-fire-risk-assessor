import { Request, Response } from "express";
import multer from "multer";
import { storagePut } from "./storage";
import { addAssessmentImage } from "./db";
import crypto from "crypto";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 16 * 1024 * 1024, // 16MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export const uploadMiddleware = upload.single("file");

export async function handleImageUpload(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const assessmentId = parseInt(req.body.assessmentId);
    if (!assessmentId || isNaN(assessmentId)) {
      return res.status(400).json({ error: "Invalid assessment ID" });
    }

    // Generate a unique file key
    const randomSuffix = crypto.randomBytes(8).toString("hex");
    const fileExtension = req.file.originalname.split(".").pop() || "jpg";
    const fileKey = `assessments/${assessmentId}/images/${Date.now()}-${randomSuffix}.${fileExtension}`;

    // Upload to S3
    const { url } = await storagePut(fileKey, req.file.buffer, req.file.mimetype);

    // Save to database
    await addAssessmentImage({
      assessmentId,
      imageUrl: url,
      imageType: "general",
    });

    return res.json({
      success: true,
      imageUrl: url,
      message: "Image uploaded successfully",
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return res.status(500).json({
      error: "Failed to upload image",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
