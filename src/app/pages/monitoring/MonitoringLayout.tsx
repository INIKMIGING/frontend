import { Outlet } from 'react-router';
import { PageContainer } from '../../components/layout/PageContainer';

export function MonitoringLayout() {
  return (
    <PageContainer>
      <Outlet />
    </PageContainer>
  );
}
