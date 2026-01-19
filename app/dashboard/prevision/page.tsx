import { Metadata } from 'next';
import TreasuryForecastDashboard from '@/components/TreasuryForecastDashboard';

export const metadata: Metadata = {
  title: 'Previsión de Tesorería - Rekalcula',
  description: 'Planifica tus cobros y pagos futuros para anticipar tu liquidez'
};

export default function PrevisionPage() {
  return <TreasuryForecastDashboard />;
}