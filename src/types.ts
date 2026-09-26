export type HazardType = 'FIRE' | 'ELECTRICAL' | 'PPE' | 'SPILL' | 'STRUCTURAL' | 'OTHER';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ReportStatus = 'PENDING' | 'SYNCING' | 'SYNCHRONIZED' | 'FAILED';
export interface HazardReport {
  id: string;
  type: HazardType;
  severity: Severity;
  location: string;
  timestamp: string;
  notes: string;
  photoUrl: string;
  status: ReportStatus;
  isSos?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}
export interface WorkerState {
  thermalStatus: 'NORMAL' | 'HOT' | 'EXTREME';
  lastCheckin: string | null;
  activeZone: string;
}
export interface SupervisorIncident extends HazardReport {
  assignedCrew: string;
  resolved: boolean;
  remoteId?: string;
}
export type View = 'home' | 'hazard' | 'inspection' | 'location' | 'queue' | 'heat' | 'supervisor';
