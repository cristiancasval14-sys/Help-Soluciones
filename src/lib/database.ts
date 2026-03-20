
import { 
    MOCK_USERS, 
    MOCK_COMPANIES, 
    MOCK_TICKETS, 
    MOCK_INVENTORY, 
    MOCK_KNOWLEDGE,
    MOCK_STAFF
} from './mock-data';

// Storage Keys
const KEYS = {
    USERS: 'help_soluciones_users',
    CLIENTS: 'help_soluciones_clients',
    TICKETS: 'help_soluciones_tickets',
    INVENTORY: 'help_soluciones_inventory',
    STAFF: 'help_soluciones_staff',
    KNOWLEDGE: 'help_soluciones_knowledge',
    SESSION: 'help_session',
    PASSWORD_REQUESTS: 'help_password_requests'
};

export const AppDatabase = {
    /**
     * Initializes the entire database with mock data if keys are missing.
     * @param force - If true, overwrites existing data with mock data.
     */
    init(force: boolean = false) {
        if (typeof window === 'undefined') return;

        console.log('Initializing Database Simulation...');

        const seed = (key: string, data: any) => {
            if (force || !localStorage.getItem(key)) {
                localStorage.setItem(key, JSON.stringify(data));
            }
        };

        seed(KEYS.USERS, MOCK_USERS);
        seed(KEYS.CLIENTS, MOCK_COMPANIES);
        seed(KEYS.TICKETS, MOCK_TICKETS);
        seed(KEYS.INVENTORY, MOCK_INVENTORY);
        seed(KEYS.STAFF, MOCK_STAFF);
        seed(KEYS.KNOWLEDGE, MOCK_KNOWLEDGE);
        
        if (force || !localStorage.getItem(KEYS.PASSWORD_REQUESTS)) {
            localStorage.setItem(KEYS.PASSWORD_REQUESTS, JSON.stringify([]));
        }

        console.log('Database Ready ✅');
    },

    /**
     * Resets the entire database to its original mock state.
     */
    reset() {
        this.init(true);
    },

    /**
     * Clear current session (logout).
     */
    logout() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(KEYS.SESSION);
            window.location.href = '/auth/login';
        }
    }
};

export default AppDatabase;
