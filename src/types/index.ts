// User type
export interface User {
  id: string;
  createdAt: Date | number;
  proStatus: boolean;
  email?: string;
}

// Save type
export interface Save {
  id: string;
  userId: string;
  name: string;
  sport: string;
  createdAt: Date | number;
}

// Event type
export interface Event {
  id: string;
  saveId: string;
  title?: string;
  description: string;
  type: 'Match' | 'Transfer' | 'Recap' | string;
  createdAt: Date | number;
  eventDate?: Date | number | string; // Optional fictional date for the event
  imageURL?: string;
}

// Post type
export interface Post {
  id: string;
  saveId: string;
  title?: string;
  vibe: string;
  mediaStyle: string;
  description: string;
  imageURL: string;
  createdAt: Date | number;
}

// Player Stats type
export interface PlayerStats {
  id: string;
  saveId: string;
  seasonId: string;
  name: string;
  goals: number;
  assists: number;
  matches: number;
  rating: number;
}

// Request types
export interface CreateSaveRequest {
  userId: string;
  name: string;
  sport: string;
}

export interface CreateEventRequest {
  saveId: string;
  title?: string;
  description: string;
  type: string;
  imageURL?: string;
  eventDate?: string | number; // Optional fictional date for the event
}

export interface CreatePostRequest {
  saveId: string;
  title?: string;
  vibe: string;
  mediaStyle: string;
  description: string;
  imageURL: string;
}

export interface CreatePlayerStatsRequest {
  saveId: string;
  seasonId: string;
  name: string;
  goals: number;
  assists: number;
  matches: number;
  rating: number;
}

// Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Auth types
export interface AuthRequest {
  idToken?: string;
}

export interface AuthResponse {
  userId: string;
  token: string;
  expiresIn: number;
}
