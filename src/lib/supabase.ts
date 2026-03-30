import { createClient } from '@supabase/supabase-js';

// Environment variables from .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are missing. Check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Database Types (Matches schema.sql) ---

export type Priority = 'Baja' | 'Media' | 'Alta' | 'Crítica';
export type TicketStatus = 'Nuevo' | 'Asignado' | 'En Proceso' | 'En Espera' | 'Resuelto' | 'Cerrado' | 'Pendiente' | 'Terminado' | 'Finalizado';

export interface Company {
  id: string;
  name: string;
  nit?: string;
  lat?: string;
  lng?: string;
  email?: string;
  created_at?: string;
}

export interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  role?: string;
  photo?: string;
  vehicle?: string;
  plate?: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  soat_expiry?: string;
  tecno_expiry?: string;
  created_at?: string;
}

export interface Ticket {
  id: string;
  company_id: string;
  requester_name?: string;
  type?: string;
  priority: Priority;
  status: TicketStatus;
  date: string;
  assigned_staff_id?: string;
  tech_notes?: string;
  created_at?: string;
  // Join fields (readonly)
  company?: Company;
  staff?: Staff;
}

export interface ServiceReport {
  id: string;
  report_id: string;
  date: string;
  time: string;
  modality: string;
  technician_name: string;
  technician_id?: string;
  company_id?: string;
  sede_id?: string;
  employee_id?: string;
  inventory_id?: string;
  ticket_id?: string;
  activities: string;
  maintenance_performed: boolean;
  parts_changed: boolean;
  parts_details?: string;
  capacity_upgraded: boolean;
  upgrade_details?: string;
  is_resolved: string;
  created_at?: string;
}

// --- SLA Logic ---

export const SLA_POLICIES: Record<string, { response: number; resolution: number }> = {
  Crítica: { response: 15, resolution: 120 }, // 15min, 2h
  Alta: { response: 30, resolution: 240 },     // 30min, 4h
  Media: { response: 60, resolution: 480 },   // 1h, 8h
  Baja: { response: 120, resolution: 1440 },    // 2h, 24h
};

/**
 * Calculates the target response and resolution times for a ticket based on priority.
 */
export function calculateSLATargets(priority: string, creationDate: Date = new Date()) {
  const policy = SLA_POLICIES[priority] || SLA_POLICIES.Baja;
  
  const targetResponse = new Date(creationDate.getTime() + policy.response * 60000);
  const targetResolution = new Date(creationDate.getTime() + policy.resolution * 60000);
  
  return {
    targetResponse,
    targetResolution
  };
}

/**
 * Checks if a ticket is at risk of breaching SLA.
 * @returns boolean true if the ticket has breached or is within 15% of the time limit.
 */
export function isSLARisk(target: Date, isActive: boolean = true) {
  if (!isActive) return false;
  const now = new Date();
  if (now > target) return true; // breached
  
  const totalLimit = target.getTime() - now.getTime();
  const fifteenPercent = 15 * 60000; 
  return totalLimit < fifteenPercent;
}
