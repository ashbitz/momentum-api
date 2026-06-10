import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not defined`);
  }

  return value;
}

export function getFirebaseAdminAuth() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: getRequiredEnv('FIREBASE_PROJECT_ID'),
        clientEmail: getRequiredEnv('FIREBASE_CLIENT_EMAIL'),
        privateKey: getRequiredEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
      }),
    });
  }

  return getAuth();
}
