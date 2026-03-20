import { NextResponse } from 'next/server';
import { calculateSLATargets, Priority } from '@/lib/supabase';

/**
 * Intelligent Agent for Automatic Ticket Registration.
 * Handles incoming requests from web forms or emails.
 */
export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { client_id, requester_name, description, type } = data;

        // Logic: Intelligent classification
        let priority: Priority = 'Medium';
        if (description.toLowerCase().includes('caído') || description.toLowerCase().includes('crítico') || description.toLowerCase().includes('urgente')) {
            priority = 'Critical';
        } else if (description.toLowerCase().includes('fallo') || description.toLowerCase().includes('grave')) {
            priority = 'High';
        }

        // SLA Calculation
        const { targetResponse, targetResolution } = calculateSLATargets(priority);

        // Simulated ticket creation (Supabase logic would go here)
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
            created_at: new Date().toISOString(),
        };

        // Logic for notifications (Email/In-app)
        // console.log('Enviando notificación al coordinador...');

        return NextResponse.json({
            message: 'Ticket registrado exitosamente por el agente inteligente.',
            ticket: newTicket
        }, { status: 201 });

    } catch (error) {
        return NextResponse.json({
            error: 'Fallo al procesar la solicitud del agente.'
        }, { status: 500 });
    }
}
