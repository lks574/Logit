import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Screen } from '../../components/primitives';
import { FormHeader } from '../../components/FormHeader';
import { DisclosureButton } from '../../components/Field';
import { Stepper, Chip } from '../../components/controls';
import { Glyph, Path, Rect, Circle, Icon } from '../../components/Glyph';
import { useStore } from '../../store/StoreContext';
import { useTheme } from '../../theme/ThemeContext';

// 3.4 SpectateForm — 관람·공연형 (perf color). Copy: Logit.dc.html lines 618–678.

export default function SpectateForm({ activity }: { activity: string }) {
  const { c } = useTheme();
  const nav = useNavigation<any>();
  const { addRecord, today } = useStore();
  const [title, setTitle] = React.useState('레미제라블');
  const [round, setRound] = React.useState(3);
  const [open, setOpen] = React.useState(false);
  const [photos, setPhotos] = React.useState<string[]>([]);

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!res.canceled && res.assets?.[0]) setPhotos((p) => [...p, res.assets[0].uri]);
  };

  const handleSave = () => {
    const 공연장 = '블루스퀘어';
    addRecord({
      activity,
      template: 'spectate',
      dateISO: today,
      timeLabel: '방금',
      photos,
      meta: `〈${title || '작품'}〉 · ${공연장}`,
      fields: {
        작품: title,
        공연장,
        회차: `${round}차`,
      },
    });
    nav.navigate('MainTabs');
  };

  const infoCard = (label: string, value: string, flex: number) => (
    <View
      style={{
        flex,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 12,
        paddingVertical: 11,
        paddingHorizontal: 13,
      }}
    >
      <Text style={{ fontSize: 12, color: c.text2 }}>{label}</Text>
      <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '600', color: c.text, marginTop: 3 }}>
        {value}
      </Text>
    </View>
  );

  return (
    <Screen edges={['top', 'bottom']}>
      <FormHeader
        title={activity}
        icon={<Icon.performance size={13} color={c.perf} strokeWidth={2.2} />}
        color={c.perf}
        soft={c.perfSoft}
        onSave={handleSave}
      />

      <View style={{ padding: 16, gap: 13 }}>
        {/* 작품명 — required */}
        <View>
          <Text style={{ fontSize: 11, fontWeight: '700', color: c.text3, letterSpacing: 0.4, marginBottom: 7 }}>필수</Text>
          <View style={{ backgroundColor: c.surface, borderWidth: 1.5, borderColor: c.perf, borderRadius: 13, paddingVertical: 13, paddingHorizontal: 14 }}>
            <Text style={{ fontSize: 12, color: c.text2 }}>작품명</Text>
            <Text style={{ fontSize: 19, fontWeight: '700', color: c.text, marginTop: 3 }}>{title}</Text>
          </View>
        </View>

        {/* 공연장 / 좌석 */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {infoCard('공연장', '블루스퀘어', 1.4)}
          {infoCard('좌석', '1층 F12', 1)}
        </View>

        {/* 관람 회차 — Stepper (perf color) */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: c.surface,
              borderWidth: 1,
              borderColor: c.border,
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 13,
            }}
          >
            <View>
              <Text style={{ fontSize: 12, color: c.text2 }}>관람 회차</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: c.perf, marginTop: 2 }}>{round}차</Text>
            </View>
            <Stepper value={round} onChange={setRound} format={(v) => `${v}차`} color={c.perf} />
          </View>
        </View>

        {/* 러닝타임 / 티켓 가격 */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {infoCard('러닝타임', '170분', 1)}
          {infoCard('티켓 가격', '₩150,000', 1)}
        </View>

        {/* 출연진 chips */}
        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 7 }}>출연진</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
            <Chip label="장발장 · 민우혁" selected color={c.perf} />
            <Chip label="자베르 · 카이" />
            <Chip label="추가" dashed icon={<Icon.plus size={13} color={c.text2} strokeWidth={2.2} />} />
          </View>
        </View>

        {/* 셋리스트 · 넘버 (콘서트 전환) — last element in HTML (margin-top:auto) */}
        <DisclosureButton
          title="셋리스트 · 넘버"
          subtitle="콘서트는 셋리스트로 전환"
          icon={
            <Glyph size={17} color={c.text2}>
              <Path d="M9 18V5l12-2v13" />
              <Circle cx="6" cy="18" r="3" />
              <Circle cx="18" cy="16" r="3" />
            </Glyph>
          }
          open={open}
          onPress={() => setOpen((o) => !o)}
        />

        {/* Expanded — 사진 */}
        {open ? (
          <View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: c.text, marginBottom: 7 }}>사진</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {photos.map((uri) => (
                <Image key={uri} source={{ uri }} style={{ width: 60, height: 60, borderRadius: 11 }} />
              ))}
              <Pressable
                onPress={pickPhoto}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 11,
                  backgroundColor: c.surfaceAlt,
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: c.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Glyph size={20} color={c.text3} strokeWidth={2}>
                  <Rect x="3" y="5" width="18" height="15" rx="3" />
                  <Path d="M3 16l5-4 4 3 3-2 6 4" />
                  <Path d="M9 10 m -1.4 0 a 1.4 1.4 0 1 0 2.8 0 a 1.4 1.4 0 1 0 -2.8 0" />
                </Glyph>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
