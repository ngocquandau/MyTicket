import React from 'react';
import OrganizerLayout from '../../../layouts/OrganizerLayout';

const EventInforPage: React.FC = () => {
  return (
    <OrganizerLayout>
      <h2 className="text-2xl font-bold mb-4">Event Information</h2>
      <p className="text-gray-600">List of events and basic controls (scaffold only).</p>
    </OrganizerLayout>
  );
};

export default EventInforPage;
