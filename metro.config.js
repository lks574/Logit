// Expo 기본 Metro 설정 + Firebase JS SDK(RN) 해석 fix.
// firebase 12는 package exports가 켜져 있으면 web 빌드를 골라 getReactNativePersistence가
// 사라지고 "Component auth has not been registered yet"로 죽는다. exports를 끄고 cjs를 추가해
// react-native 엔트리(index.rn)를 강제한다. (Firebase RN 공식 대응)
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.unstable_enablePackageExports = false;
config.resolver.sourceExts.push('cjs');

module.exports = config;
