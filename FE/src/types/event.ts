// src/types/event.ts

export type EventSummary = {
  _id: string;
  title: string;
  startDateTime: string | Date;
  endDateTime: string | Date;
  location: {
    address: string;
    city: string;
    venue: string;
  };
  posterURL: string;
  description?: string;
};


export type Ticket = {
  _id?: string;
  ticketClass: string;
  seat?: string; // chỉ dành cho reserved
  isSold?: boolean;
  qrCode?: string;
  ticketId: string;
};

export type TicketClass = {
  _id?: string;
  name: string;
  price: number;
  totalQuantity: number;
  soldQuantity?: number;
  availableFrom: string | Date;
  availableUntil: string | Date;
  status: 'available' | 'sold_out' | 'unavailable';
  seatType: 'general' | 'reserved';
  event: string;
  ticketList?: Ticket[]; 
};
