export interface Role {
  id: string;
  title: string;
  roleType: string;
  isOpen: boolean;
  startupId: string;
  isPaid: boolean;
  createdAt: string;
  updatedAt: string;
  assignedUser?: User;
  assignedUsers?: UserRole[];
  requests?: JoinRequest[];
}

export interface RoleData {
  title: string;
  roleType: string;
  isOpen: boolean;
  isPaid: boolean;
}

export interface Startup {
  id: string;
  name: string;
  details: string;
  stage: string;
  logo?: string;
  banner?: string;
  location?: string;
  industry?: string;
  ownerId: string;
  owner?: User;
  roles: Role[];
  joinRequests?: JoinRequest[];
  createdAt: string;
  updatedAt: string;
}

export interface StartupFormData {
  name: string;
  description: string;
  location: string;
  industry: string;
  logo: string;
  banner: string;
  mission: string;
  vision: string;
  roles: RoleData[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  points: number;
  level: number;
  password?: string;
  headline?: string;
  bio?: string;
  location?: string;
  skills?: string[];
  education?: Education[];
  experience?: Experience[];
  profileImage?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolio?: string;
  phone?: string;
  ownedStartups?: Startup[];
  sentRequests?: JoinRequest[];
  receivedRequests?: JoinRequest[];
  joinedRoles?: UserRole[];
  createdAt: string;
  updatedAt: string;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  user?: User;
  role?: Role;
  joinedAt: string;
}

export interface JoinRequest {
  id: string;
  userId: string;
  startupId: string;
  roleId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  message?: string;
  receiverId: string;
  user?: User;
  startup?: Startup;
  role?: Role;
  receiver?: User;
  createdAt: string;
  updatedAt: string;
}

export interface JoinRequestFormData {
  roleId: string;
  message?: string;
}

export interface AuthFormData {
  email: string;
  password: string;
  name?: string;
}

export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'; 

export interface Opportunity {
  id: string;
  position: string;
  experience: string;
  description: string;
  openings: number;
  startupId: string;
  startup?: Startup;
  createdAt: string;
  updatedAt: string;
}

export interface OpportunityFormData {
  position: string;
  experience: string;
  description: string;
  openings: number;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED';
  source: string;
  notes?: string;
  salesAmount: number;
  nextActionDate?: string;
  assignedToId?: string;
  assignedTo?: User;
  startupId: string;
  startup?: Startup;
  createdAt: string;
  updatedAt: string;
  comments?: LeadComment[];
}

export interface LeadComment {
  id: string;
  content: string;
  leadId: string;
  userId: string;
  user?: User;
  createdAt: string;
}

export interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED';
  source: string;
  notes: string;
  salesAmount: number;
  assignedToId?: string;
  nextActionDate: string;
}

export interface TaskStatus {
  id: string;
  name: string;
  startupId: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  statusId: string;
  status: TaskStatus;
  startupId: string;
  createdBy: string;
  creator: User;
  assignees: User[];
  createdAt: string;
  updatedAt: string;
  // Time tracking fields
  totalTimeSpent: number;
  isTimerRunning: boolean;
  timerStartedAt: string | null;
  timeTrackingLogs?: TimeTrackingLog[];
}

export interface TimeTrackingLog {
  id: string;
  taskId: string;
  userId: string;
  user: User;
  startTime: string;
  endTime: string;
  duration: number; // Duration in seconds
  note?: string;
  createdAt: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  statusId: string;
  assigneeIds?: string[];
}

export interface PointsTransaction {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  meta?: string;
  createdAt: string;
}

export interface Education {
  id?: string;
  userId?: string;
  school: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

export interface Experience {
  id?: string;
  userId?: string;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
} 