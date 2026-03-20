import { NextResponse } from 'next/server';
import { calculateSLATargets, Priority } from '@/lib/supabase';

export async function POST(request: Request) {
      try {
              const data = await request.json();
              const { client_id, requester_name, description, type } = data;

        let priority: Priority = 'Baja';
              const desc = description.toLowerCase();

        if (desc.includes('caido') || desc.includes('critico') || desc.includes('urgente')) {
                  priority = 'Critica' as Priority;
        } else if (desc.includes('fallo') || desc.includes('grave')) {
                  priority = 'Alta';
        }

        const { targetResponse, targetResolution } = calculateSLATargets(priority);

        const newTicket = {
                  id: `TICK-${Math.floor(Math.random() * 9000) + 1000}`,
                  client_id,
                  requester_name,
                  description,
                  type: type || 'Incident',
                  priority,
                  status: 'New',
                  target_response_date: targetResponse,
                  target_resolution_date: targetResolution,
                  created_at: new Date().toISOString()
        };

        return NextResponse.json({ success: true, ticket: newTicket });
      } catch (error) {
              return NextResponse.json({ success: false, error: 'Error' }, { status: 500 });
      }
}
