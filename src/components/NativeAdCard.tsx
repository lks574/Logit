import React from 'react';
import { Image, Text, View } from 'react-native';
import {
  NativeAd,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { useTheme } from '../theme/ThemeContext';
import { tr } from '../i18n/i18n';

// dev/테스트는 Google 테스트 ID, Release는 실제 네이티브 광고단위(iOS).
// ponytail: iOS 단일 unit. Android 출시 시 Platform.select로 분기.
const NATIVE_UNIT = __DEV__ ? TestIds.NATIVE : 'ca-app-pub-8242072118866709/4427317823';

// 리스트 하단에 콘텐츠 카드처럼 섞이는 네이티브 광고. 로드 실패/없으면 아무것도 안 그림.
// AdMob 정책상 "광고(Ad)" 배지 필수.
export function NativeAdCard() {
  const { c } = useTheme();
  const [ad, setAd] = React.useState<NativeAd | null>(null);

  React.useEffect(() => {
    let current: NativeAd | null = null;
    let alive = true;
    NativeAd.createForAdRequest(NATIVE_UNIT, { requestNonPersonalizedAdsOnly: true })
      .then((a) => {
        current = a;
        if (alive) setAd(a);
        else a.destroy();
      })
      .catch(() => {});
    return () => {
      alive = false;
      current?.destroy();
    };
  }, []);

  if (!ad) return null;

  // NativeAdView에 직접 padding/gap을 주면 네이티브 asset 프레임 계산이 어긋나
  // "asset outside native ad view" validator 경고가 뜬다. 스타일은 안쪽 래퍼로 옮긴다.
  return (
    <NativeAdView nativeAd={ad}>
      <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 13, padding: 12, gap: 9 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {ad.icon?.url ? (
          <NativeAsset assetType={NativeAssetType.ICON}>
            <Image source={{ uri: ad.icon.url }} style={{ width: 38, height: 38, borderRadius: 9 }} />
          </NativeAsset>
        ) : null}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ backgroundColor: c.warning, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: '#fff' }}>{tr({ en: 'Ad', ko: '광고' })}</Text>
            </View>
            <NativeAsset assetType={NativeAssetType.HEADLINE}>
              <Text numberOfLines={1} style={{ flex: 1, fontSize: 13.5, fontWeight: '700', color: c.text }}>
                {ad.headline}
              </Text>
            </NativeAsset>
          </View>
          {ad.body ? (
            <NativeAsset assetType={NativeAssetType.BODY}>
              <Text numberOfLines={2} style={{ fontSize: 12, color: c.text2, marginTop: 2 }}>
                {ad.body}
              </Text>
            </NativeAsset>
          ) : null}
        </View>
      </View>
      {ad.callToAction ? (
        <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
          <View style={{ alignSelf: 'flex-start', backgroundColor: c.accentSoft, borderRadius: 8, paddingVertical: 7, paddingHorizontal: 14 }}>
            <Text style={{ fontSize: 12.5, fontWeight: '700', color: c.accent }}>{ad.callToAction}</Text>
          </View>
        </NativeAsset>
      ) : null}
      </View>
    </NativeAdView>
  );
}
