import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const OPTS = { mediaTypes: ['images'] as ImagePicker.MediaType[], quality: 0.7 };

async function launch(source: 'camera' | 'library'): Promise<string | null> {
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('카메라 권한 필요', '설정에서 카메라 접근을 허용해 주세요.');
      return null;
    }
    const res = await ImagePicker.launchCameraAsync(OPTS);
    return !res.canceled && res.assets?.[0] ? res.assets[0].uri : null;
  }
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('사진 권한 필요', '설정에서 사진 접근을 허용해 주세요.');
    return null;
  }
  const res = await ImagePicker.launchImageLibraryAsync(OPTS);
  return !res.canceled && res.assets?.[0] ? res.assets[0].uri : null;
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
