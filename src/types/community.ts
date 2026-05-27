export interface Post {
  id: string;
  userId: string;
  username: string;
  text: string;
  imageUrl: string | null;
  timestamp: any; // Firestore Timestamp
  likes: string[]; // array of user UIDs
  comments: CommentItem[];
  avatarUrl?: string;
  avatarColor?: string;
  spiritAnimal?: string;
  category?: string;
  story?: string;
}

export interface CommentItem {
  userId: string;
  username: string;
  text: string;
  timestamp: string; // ISO string
  avatarUrl?: string;
  avatarColor?: string;
  spiritAnimal?: string;
}

export interface Member {
  userId: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  avatarColor?: string;
  spiritAnimal?: string;
  joinedAt?: any; // Firestore Timestamp
}

export interface CurrentUser {
  uid: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  avatarColor?: string;
  avatarAnimal?: string;
  photoURL?: string;
}

export const POST_CATEGORIES = [
  { value: '', label: '📋 Select Category (optional)' },
  { value: 'wildlife', label: '🐯 Wildlife' },
  { value: 'birds', label: '🦅 Birds' },
  { value: 'landscape', label: '🏔️ Landscape' },
  { value: 'macro', label: '🔍 Macro' },
  { value: 'underwater', label: '🐠 Underwater' },
  { value: 'conservation', label: '🌍 Conservation' },
  { value: 'tips', label: '📸 Photography Tips' },
  { value: 'other', label: '✨ Other' },
];
