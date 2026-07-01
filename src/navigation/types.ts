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
  HomeEmpty: undefined;
  StatsEmpty: undefined;
};

export type TabParamList = {
  Home: undefined;
  Calendar: undefined;
  Add: undefined; // action tab → navigates to ActivitySelect
  Stats: undefined;
  Settings: undefined;
};
