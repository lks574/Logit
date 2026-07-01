import { RouteProp, useRoute } from '@react-navigation/native';
import React from 'react';
import { RootStackParamList } from '../navigation/types';
import EnduranceForm from './forms/EnduranceForm';
import FreeForm from './forms/FreeForm';
import MatchForm from './forms/MatchForm';
import SetRepForm from './forms/SetRepForm';
import SpectateForm from './forms/SpectateForm';

// Dispatches to the template form. §02 common skeleton lives inside each form
// (필수 fields + 세부 입력 disclosure). Template → form (README §정보구조).
export default function RecordFormScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'RecordForm'>>();
  const { activity, template } = params;
  switch (template) {
    case 'endurance':
      return <EnduranceForm activity={activity} />;
    case 'setrep':
      return <SetRepForm activity={activity} />;
    case 'match':
      return <MatchForm activity={activity} />;
    case 'spectate':
      return <SpectateForm activity={activity} />;
    default:
      return <FreeForm activity={activity} />;
  }
}
