import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import MenuManagement from '../../components/vendor/MenuManagement';

const MenuPage: React.FC = () => {
  return (
    <DashboardLayout title="Menu Management">
      <MenuManagement />
    </DashboardLayout>
  );
};

export default MenuPage;