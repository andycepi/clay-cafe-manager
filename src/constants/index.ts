export const PIECE_STATUSES = [
  { value: 'in-progress', label: 'In Progress' },
  { value: 'bisque-fired', label: 'Bisque Fired' },
  { value: 'glazed', label: 'Glazed' },
  { value: 'glaze-fired', label: 'Glaze Fired' },
  { value: 'ready-for-pickup', label: 'Ready for Pickup' },
  { value: 'picked-up', label: 'Picked Up' }
];

export const STATUS_COLORS = {
  piece: {
    'in-progress': 'bg-blue-100 text-blue-800',
    'bisque-fired': 'bg-orange-100 text-orange-800',
    'glazed': 'bg-purple-100 text-purple-800',
    'glaze-fired': 'bg-indigo-100 text-indigo-800',
    'ready-for-pickup': 'bg-green-100 text-green-800',
    'picked-up': 'bg-gray-100 text-gray-500'
  },
  event: {
    'upcoming': 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    'completed': 'bg-green-100 text-green-800',
    'cancelled': 'bg-red-100 text-red-800'
  },
  booking: {
    'confirmed': 'bg-green-100 text-green-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'cancelled': 'bg-red-100 text-red-800'
  }
} as const;

export const EVENT_TYPE_COLORS = {
  'workshop': 'bg-blue-100 text-blue-800',
  'open-studio': 'bg-green-100 text-green-800',
  'private-party': 'bg-purple-100 text-purple-800',
  'class': 'bg-orange-100 text-orange-800',
  'special-event': 'bg-pink-100 text-pink-800'
} as const;

// Helper functions
export const getStatusColor = (type: 'piece' | 'event' | 'booking', status: string): string => {
  return STATUS_COLORS[type][status as keyof typeof STATUS_COLORS[typeof type]] || 'bg-gray-100 text-gray-800';
};

export const getPieceStatusInfo = (status: string) => {
  const statusInfo = PIECE_STATUSES.find(s => s.value === status) || PIECE_STATUSES[0];
  return {
    ...statusInfo,
    color: getStatusColor('piece', status)
  };
};