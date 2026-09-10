import Header from '../components/Header';
import Hero from '../components/Hero';
import StatsRow from '../components/StatsRow';
import PanelsRow from '../components/PanelsRow';

/**
 * Dashboard page — wraps the existing CropGuard dashboard components.
 * Only accessible when authenticated.
 */
export default function Dashboard() {
  return (

    <>
      <Header />
      <Hero />
      <StatsRow />
      <PanelsRow />
    </>
  );
}
