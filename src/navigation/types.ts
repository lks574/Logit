import { TemplateType } from '../theme/tokens';

export type RootStackParamList = {
  MainTabs: undefined;
  ActivitySelect: undefined;
  RecordForm: { activity: string; template: TemplateType };
  Detail: { activity: string; recordId?: string };
  AddPlan: undefined;
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
