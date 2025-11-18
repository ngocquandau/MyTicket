export type EventSummary = {
  _id: string;
  title: string;
  genre: string;
  description: string;
  posterURL: string;
  startDateTime: string;
  endDateTime: string;
  maxCapacity: number;
  platformCommission: number;
  status: string;
  organizer: string;
  location: {
    venue?: string;
    address?: string;
    city?: string;
    coordinates?: { lat: number; lng: number };
  };
  createdAt?: string;
  updatedAt?: string;
  // computed fields for display
  dateDisplay?: string;
  priceText?: string;
  tickets?: { type: string; price: string; status: 'available' | 'soldout' }[];
};

const defaultTickets = [
  { type: 'Diamond', price: '2.500.000 VND', status: 'available' as const },
  { type: 'Platinum', price: '1.800.000 VND', status: 'soldout' as const },
  { type: 'Gold', price: '1.000.000 VND', status: 'available' as const },
];

export const mockEvents: EventSummary[] = [
  {
    _id: '69118e00d6d9405ffb879d82',
    title: 'Concert Summer 2025',
    genre: 'Music',
    description: 'Join us for an unforgettable night of music with top artists performing...',
    posterURL: 'https://salt.tkbcdn.com/ts/ds/8e/89/4c/407e32bba0e4d1651175680a2452954e.jpg',
    startDateTime: '2025-12-20T19:00:00.000Z',
    endDateTime: '2025-12-20T22:00:00.000Z',
    maxCapacity: 500,
    platformCommission: 10,
    status: 'published',
    organizer: '69118d563c258b0a25b0649c',
    location: {
      venue: 'Nhà hát MYTICKET Fan Club',
      address: '158 Lĩnh Đông, Thủ Đức',
      city: 'TP.HCM',
      coordinates: { lat: 10.8505, lng: 106.7717 }
    },
    dateDisplay: '20/12/2025',
    priceText: 'Từ 450.000 VND',
    tickets: defaultTickets,
  },
  {
    _id: '69118e00d6d9405ffb879d83',
    title: 'Festival of Innovation',
    genre: 'Technology',
    description: 'Explore the latest innovations in technology and startups.',
    posterURL: 'https://ticketbox.vn/_next/image?url=https%3A%2F%2Fimages.tkbcdn.com%2F2%2F608%2F332%2Fts%2Fds%2F99%2F06%2F33%2F62c45b644eb852db380370cffb345241.jpg&w=1920&q=75',
    startDateTime: '2025-10-18T09:00:00.000Z',
    endDateTime: '2025-10-18T18:00:00.000Z',
    maxCapacity: 1000,
    platformCommission: 15,
    status: 'published',
    organizer: '69118d563c258b0a25b0649c',
    location: {
      venue: 'Trung tâm Hội nghị Quốc gia',
      address: 'Mỹ Đình',
      city: 'Hà Nội',
      coordinates: { lat: 21.0285, lng: 105.8542 }
    },
    dateDisplay: '18/10/2025',
    priceText: 'Miễn phí',
    tickets: defaultTickets,
  },
  {
    _id: '69118e00d6d9405ffb879d84',
    title: 'Music Night',
    genre: 'Music',
    description: 'An amazing night with live music performances.',
    posterURL: 'https://salt.tkbcdn.com/ts/ds/92/5a/25/9252f67ff027a0e07f467fe6c9a5d8dd.jpeg',
    startDateTime: '2025-10-19T19:00:00.000Z',
    endDateTime: '2025-10-19T23:00:00.000Z',
    maxCapacity: 800,
    platformCommission: 12,
    status: 'published',
    organizer: '69118d563c258b0a25b0649c',
    location: {
      venue: 'SVĐ Thống Nhất',
      address: 'Quận 10',
      city: 'TP.HCM',
      coordinates: { lat: 10.7769, lng: 106.6602 }
    },
    dateDisplay: '19/10/2025',
    priceText: 'Từ 200.000 VND',
    tickets: defaultTickets,
  },
  {
    _id: '69118e00d6d9405ffb879d85',
    title: 'Art Expo',
    genre: 'Art',
    description: 'Discover contemporary art from local and international artists.',
    posterURL: 'https://images.tkbcdn.com/2/608/332/ts/ds/57/00/c5/6271a558f72c011ec6b8a608ac0811c1.jpg',
    startDateTime: '2025-10-20T10:00:00.000Z',
    endDateTime: '2025-10-20T20:00:00.000Z',
    maxCapacity: 600,
    platformCommission: 10,
    status: 'published',
    organizer: '69118d563c258b0a25b0649c',
    location: {
      venue: 'Trung tâm Triển lãm',
      address: 'Nguyễn Văn Linh',
      city: 'Đà Nẵng',
      coordinates: { lat: 16.0544, lng: 108.2022 }
    },
    dateDisplay: '20/10/2025',
    priceText: 'Từ 150.000 VND',
    tickets: defaultTickets,
  },
  {
    _id: '69118e00d6d9405ffb879d86',
    title: 'Food Fair',
    genre: 'Food',
    description: 'Taste delicious food from around the world.',
    posterURL: 'https://images.tkbcdn.com/2/608/332/ts/ds/2d/31/3d/4b0f9252bc35025a06be58f823fcd231.jpg',
    startDateTime: '2025-10-21T11:00:00.000Z',
    endDateTime: '2025-10-21T21:00:00.000Z',
    maxCapacity: 1500,
    platformCommission: 8,
    status: 'published',
    organizer: '69118d563c258b0a25b0649c',
    location: {
      venue: 'Công viên 23/9',
      address: 'Quận 1',
      city: 'TP.HCM',
      coordinates: { lat: 10.7691, lng: 106.6907 }
    },
    dateDisplay: '21/10/2025',
    priceText: 'Từ 50.000 VND',
    tickets: defaultTickets,
  },
  {
    _id: '69118e00d6d9405ffb879d87',
    title: 'Tech Summit',
    genre: 'Technology',
    description: 'Connect with tech leaders and innovators.',
    posterURL: 'https://vma.org.vn/wp-content/uploads/2023/08/KV_EVENT-TECH_20230808_1200x630.jpg',
    startDateTime: '2025-10-22T08:00:00.000Z',
    endDateTime: '2025-10-22T17:00:00.000Z',
    maxCapacity: 2000,
    platformCommission: 20,
    status: 'published',
    organizer: '69118d563c258b0a25b0649c',
    location: {
      venue: 'TT Hội nghị Quốc gia',
      address: 'Mỹ Đình',
      city: 'Hà Nội',
      coordinates: { lat: 21.0285, lng: 105.8542 }
    },
    dateDisplay: '22/10/2025',
    priceText: 'Từ 1.200.000 VND',
    tickets: defaultTickets,
  },
];

export const getMockEventById = (id?: string) =>
  mockEvents.find((e) => e._id === id);

// Helper function to format date from ISO string
export const formatEventDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleDateString('vi-VN');
};

// Helper function to format time range
export const formatEventTimeRange = (startISO: string, endISO: string): string => {
  const start = new Date(startISO);
  const end = new Date(endISO);
  return `${start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
};