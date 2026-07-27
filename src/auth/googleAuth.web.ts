import {
  GoogleAuthProvider,
  reauthenticateWithPopup,
  signInWithPopup,
  type User,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

function googleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

export async function signInWithGoogleAccount(): Promise<void> {
  await signInWithPopup(auth, googleProvider());
}

export async function reauthenticateGoogleAccount(user: User): Promise<void> {
  await reauthenticateWithPopup(user, googleProvider());
}
