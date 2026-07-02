import { TemplateType } from '../theme/tokens';

export type RootStackParamList = {
  MainTabs: undefined;
  ActivitySelect: undefined;
  RecordForm: { activity: string; template: TemplateType; recordId?: string };
  Detail: { activity: string; recordId?: string };
  AddChooser: undefined;
  AddPlan: { planId?: string; dateISO?: string } | undefined;
  AddActivity: undefined;
  Plans: undefined;
  ProfileEdit: undefined;
};

export type TabParamList = {
  Home: undefined;
  Calendar: undefined;
  Stats: undefined;
  Settings: undefined;
};
