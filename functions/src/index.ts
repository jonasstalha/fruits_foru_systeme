import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import cors from "cors";

admin.initializeApp();

// Configure CORS middleware
const corsHandler = cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "https://fruitsforyou-10acc.web.app",
    "https://fruitsforyou-10acc.firebaseapp.com",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Origin", "Accept"],
  credentials: true,
  maxAge: 3600,
});

export const uploadFile = functions.https.onRequest((req, res) => {
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    corsHandler(req, res, () => {
      res.status(204).send("");
    });
    return;
  }

  // Handle actual request
  corsHandler(req, res, async () => {
    try {
      if (req.method !== "POST") {
        throw new Error("Method not allowed");
      }

      const { fileData, boxId, itemName, type, userId } = req.body;

      if (!fileData || !boxId || !itemName || !type || !userId) {
        throw new Error("Missing required fields");
      }

      // Convert base64 to buffer
      const buffer = Buffer.from(fileData.split(",")[1], "base64");

      // Upload to Storage
      const bucket = admin.storage().bucket();
      const fileName = `${Date.now()}_${itemName}`;
      const file = bucket.file(`boxes/${boxId}/${fileName}`);
      await file.save(buffer, {
        metadata: {
          contentType: type,
          metadata: {
            userId,
            boxId,
          },
        },
      });

      // Get download URL
      const [url] = await file.getSignedUrl({
        action: "read",
        expires: "03-01-2500", // Far future expiration
      });

      // Add to Firestore
      const db = admin.firestore();
      const itemRef = await db.collection("boxItems").add({
        boxId,
        name: itemName,
        type,
        fileUrl: url,
        userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.status(200).json({
        success: true,
        itemId: itemRef.id,
        fileUrl: url,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      });
    }
  });
});