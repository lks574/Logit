import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const OPTS = { mediaTypes: ['images'] as ImagePicker.MediaType[], quality: 0.7 };

// 사진을 앱 영구 디렉토리(document/photos)로 복사하고 그 uri를 반환한다.
// image-picker 반환 uri는 캐시 경로라 OS가 비우거나 시간이 지나면 깨지므로,
// 참조가 아니라 영구 사본을 두고 그 경로를 저장한다.
// expo-file-system은 최상위에서 requireNativeModule을 호출하므로, 네이티브 모듈이
// 아직 없는 dev 빌드에서 import 시 크래시하지 않도록 여기서 지연 require + try/catch로
// 감싼다. (웹·구 빌드에선 원본 uri 폴백)
// ponytail: 지연 require는 새 네이티브 dep이 dev 빌드에 반영되기 전 세션을 보호하려는 것.
//           재빌드가 표준이 되면 일반 import로 되돌려도 됨.
async function persist(uri: string): Promise<string> {
  if (Platform.OS === 'web') return uri;
  try {
    const { Directory, File, Paths } = require('expo-file-system');
    const dir = new Directory(Paths.document, 'photos');
    if (!dir.exists) dir.create();
    const ext = uri.split('?')[0].split('.').pop()?.toLowerCase() || 'jpg';
    const name = `${Date.now()}-${Math.floor(Math.random() * 1e9).toString(36)}.${ext}`;
    const src = new File(uri);
    const dest = new File(dir, name);
    await src.copy(dest);
    // 상대경로만 저장한다. iOS는 앱 업데이트마다 컨테이너 UUID가 바뀌어 절대 uri가
    // 깨지므로, 렌더 시 photoUri()로 현재 document 경로에 다시 결합한다.
    return `photos/${name}`;
  } catch {
    return uri; // 네이티브 모듈 부재/복사 실패 시 원본 uri 폴백
  }
}

// 저장된 사진 값 → 렌더용 uri. 절대 uri(웹 blob/http/data, 구버전 file://)는 그대로,
// 상대경로(photos/…)만 현재 document 경로로 해석한다.
export function photoUri(stored: string): string {
  if (Platform.OS === 'web' || /^[a-z][a-z0-9+.-]*:/i.test(stored)) return stored;
  try {
    const { File, Paths } = require('expo-file-system');
    return new File(Paths.document, stored).uri;
  } catch {
    return stored;
  }
}

async function launch(source: 'camera' | 'library'): Promise<string | null> {
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('카메라 권한 필요', '설정에서 카메라 접근을 허용해 주세요.');
      return null;
    }
    const res = await ImagePicker.launchCameraAsync(OPTS);
    return !res.canceled && res.assets?.[0] ? persist(res.assets[0].uri) : null;
  }
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('사진 권한 필요', '설정에서 사진 접근을 허용해 주세요.');
    return null;
  }
  const res = await ImagePicker.launchImageLibraryAsync(OPTS);
  return !res.canceled && res.assets?.[0] ? persist(res.assets[0].uri) : null;
}

// 사진 추가 — 촬영 / 앨범에서 선택 액션 시트를 띄우고 선택된 이미지 uri(없으면 null)를 반환.
// 웹에는 촬영이 없으므로 바로 라이브러리로.
export function choosePhoto(): Promise<string | null> {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      launch('library').then(resolve);
      return;
    }
    Alert.alert('사진 추가', undefined, [
      { text: '촬영', onPress: () => launch('camera').then(resolve) },
      { text: '앨범에서 선택', onPress: () => launch('library').then(resolve) },
      { text: '취소', style: 'cancel', onPress: () => resolve(null) },
    ]);
  });
}
