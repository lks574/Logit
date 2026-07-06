import { TemplateType } from '../theme/tokens';

export type RootStackParamList = {
  MainTabs: undefined;
  ActivitySelect: undefined;
  RecordForm: { activity: string; template: TemplateType; recordId?: string };
  Detail: { activity: string; recordId?: string };
  CategoryStats: { category: 'cardio' | 'strength' | 'performance' };
  AddChooser: undefined;
  AddPlan: { planId?: string; dateISO?: string } | undefined;
  AddActivity: undefined;
  Plans: undefined;
  ProfileEdit: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  PasswordReset: undefined;
};

export type TabParamList = {
  Home: undefined;
  Calendar: { dateISO?: string } | undefined;
  Stats: undefined;
  Settings: undefined;
};
