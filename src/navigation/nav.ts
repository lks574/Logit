// 기록 저장 후: 모달 시트(ActivitySelect/RecordForm)를 모두 닫고 홈 탭으로.
// navigate('MainTabs')가 모달을 확실히 dismiss하지 못하는 경우가 있어 스택을 reset한다.
// reset은 MainTabs를 초기 상태로 두므로 첫 탭(Home)에 랜딩한다.
export function resetToHome(nav: { reset: (state: unknown) => void }) {
  nav.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
}
