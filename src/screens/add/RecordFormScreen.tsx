import { RouteProp, useRoute } from '@react-navigation/native';
import React from 'react';
import { RootStackParamList } from '../../navigation/types';
import { useStore } from '../../store/StoreContext';
import CampingForm from './forms/CampingForm';
import EnduranceForm from './forms/EnduranceForm';
import FreeForm from './forms/FreeForm';
import MatchForm from './forms/MatchForm';
import SetRepForm from './forms/SetRepForm';
import SpectateForm from './forms/SpectateForm';

// Dispatches to the template form. §02 common skeleton lives inside each form
// (필수 fields + 세부 입력 disclosure). Template → form (README §정보구조).
// planId가 있으면 약속을 기록으로 전환하는 흐름 — 폼이 약속 데이터로 프리필하고
// 저장 시 기록 생성 + 약속 완료 처리(completePlan)한다.
export default function RecordFormScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'RecordForm'>>();
  const { activity, template, recordId, planId, dateISO } = params;
  const { getPlan } = useStore();
  const plan = planId ? getPlan(planId) : undefined;
  // dateISO: 캘린더 "이 날 기록 추가"의 프리필 날짜(신규 생성 시 기본 날짜).
  const p = { recordId, plan, initialDate: dateISO };
  // 캠핑은 free 템플릿을 공유하지만 전용 폼(기간·장소·동행)을 쓴다.
  if (activity === '캠핑') return <CampingForm activity={activity} {...p} />;
  switch (template) {
    case 'endurance':
      return <EnduranceForm activity={activity} {...p} />;
    case 'setrep':
      return <SetRepForm activity={activity} {...p} />;
    case 'match':
      return <MatchForm activity={activity} {...p} />;
    case 'spectate':
      return <SpectateForm activity={activity} {...p} />;
    default:
      return <FreeForm activity={activity} {...p} />;
  }
}
