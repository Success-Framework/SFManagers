export interface Role {
  id: string;
  title: string;
  startupId: string;
  isOpen: boolean;
  createdAt: string;
  updatedAt: string;
  assignedUsers?: UserRole[];
  requests?: JoinRequest[];
}

export interface Startup {
  id: string;
  name: string;
  details: string;
  stage: string;
  ownerId: string;
  owner?: User;
  roles: Role[];
  joinRequests?: JoinRequest[];
  createdAt: string;
  updatedAt: string;
}

export interface StartupFormData {
  name: string;
  details: string;
  stage: string;
  roles: string[];
}

export interface User {
  id: string;
  email: string;
  name?: string;
  ownedStartups?: Startup[];
  sentRequests?: JoinRequest[];
  receivedRequests?: JoinRequest[];
  joinedRoles?: UserRole[];
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