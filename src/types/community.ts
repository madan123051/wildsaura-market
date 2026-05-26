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
  { value: '', label: '\uD83D\uDCCB Select Category (optional)' },
  { value: 'wildlife', label: '\uD83D\uDC2F Wildlife' },
  { value: 'birds', label: '\uD83E\uDD85 Birds' },
  { value: 'landscape', label: '\uD83C\uDFD4\uFE0F Landscape' },
  { value: 'macro', label: '\uD83D\uDD0D Macro' },
  { value: 'underwater', label: '\uD83D\uDC20 Underwater' },
  { value: 'conservation', label: '\uD83C\uDF0D Conservation' },
  { value: 'tips', label: '\uD83D\uDCF8 Photography Tips' },
  { value: 'other', label: '\u2728 Other' },
];
