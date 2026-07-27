import {
  GoogleAuthProvider,
  reauthenticateWithCredential,
  signInWithCredential,
  type User,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { googleIosClientId, googleWebClientId } from '../lib/firebaseConfig';
import { tr } from '../i18n/i18n';

async function loadGoogleSignin() {
  try {
    return await import('@react-native-google-signin/google-signin');
  } catch {
    throw new Error(
      tr({
        en: 'Google sign-in module is missing. Please rebuild the dev build.',
        ko: 'Google 로그인 모듈이 없어요. dev 빌드를 재생성해주세요.',
      }),
    );
  }
}

async function nativeGoogleCredential() {
  const { GoogleSignin } = await loadGoogleSignin();
  GoogleSignin.configure({ webClientId: googleWebClientId, iosClientId: googleIosClientId });
  await GoogleSignin.hasPlayServices();
  const result: any = await GoogleSignin.signIn();
  const idToken = result?.data?.idToken ?? result?.idToken;
  if (!idToken) {
    throw new Error(
      tr({
        en: 'Couldn’t get an idToken from Google sign-in.',
        ko: 'Google 로그인에서 idToken을 받지 못했어요.',
      }),
    );
  }
  return GoogleAuthProvider.credential(idToken);
}

export async function signInWithGoogleAccount(): Promise<void> {
  await signInWithCredential(auth, await nativeGoogleCredential());
}

export async function reauthenticateGoogleAccount(user: User): Promise<void> {
  await reauthenticateWithCredential(user, await nativeGoogleCredential());
}
