import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK (uses application default credentials or service account)
if (!admin.apps.length) {
  admin.initializeApp({
    // If you need a service account, set GOOGLE_APPLICATION_CREDENTIALS env var
    // pointing to your service account JSON file. Otherwise, this works with
    // Firebase project defaults.
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  });
}

export interface AuthRequest extends Request {
  uid?: string;
  email?: string;
}

/**
 * Express middleware that verifies the Firebase ID token from the
 * Authorization header and attaches uid/email to the request.
 */
export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = header.split('Bearer ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.uid = decoded.uid;
    req.email = decoded.email;
    next();
  } catch (err) {
    console.error('Auth verification failed:', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
