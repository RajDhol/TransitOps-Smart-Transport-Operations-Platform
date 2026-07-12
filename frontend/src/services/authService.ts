const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

export interface LoginResponse {
    token: string;
    user: User;
}

export async function loginUser(email: string, password: string, role: string): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // removed credentials: "include" — not needed and causes CORS preflight issues
        body: JSON.stringify({ email, password, role }),
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || "Login failed");
    }

    return res.json();
}
//dashboard api 
export interface DashboardStats {
    total_vehicles: number;
    active_vehicles: number;
    available_vehicles: number;
    vehicles_in_shop: number;
    active_trips: number;
    pending_trips: number;
    total_drivers: number;
    drivers_on_duty: number;
    available_drivers: number;
    fleet_utilization_percentage: number;
}

export async function getDashboardStats(type?: string, region?: string): Promise<DashboardStats> {
    const params = new URLSearchParams();
    if (type) params.append("type", type);
    if (region) params.append("region", region);

    const res = await fetch(`${API_BASE_URL}/api/dashboard?${params.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to load dashboard data");
    }

    return res.json();
}

// --- Vehicle Registry API ---

export interface Vehicle {
    registration_number: string;
    model: string;
    type: string;
    max_load_capacity: number;
    odometer: number;
    acquisition_cost: number;
    status: string;
}

export interface VehicleCreatePayload {
    registration_number: string;
    model: string;
    type: string;
    max_load_capacity: number;
    odometer: number;
    acquisition_cost: number;
}

export interface VehicleRegistrationResponse {
    registration_number: string;
    status: string;
    message: string;
}

export async function getVehicles(status?: string, type?: string): Promise<Vehicle[]> {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (type) params.append("type", type);

    const res = await fetch(`${API_BASE_URL}/api/vehicles?${params.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to load vehicles");
    }

    return res.json();
}

export async function registerVehicle(vehicle: VehicleCreatePayload): Promise<VehicleRegistrationResponse> {
    const res = await fetch(`${API_BASE_URL}/api/vehicles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vehicle),
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        // Preserve 400 (duplicate) and 422 (invalid values) messages exactly as backend sends
        throw new Error(errorData?.detail || "Failed to register vehicle");
    }

    return res.json();
}