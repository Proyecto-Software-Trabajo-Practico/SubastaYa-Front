/*
  Cliente HTTP centralizado para SubastaYa.
  Encapsula la API nativa fetch para estandarizar cabeceras, 
  negociación de contenido JSON (RESTful Nivel 2), inyección de JWT y captura de errores HTTP.
*/

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7127/api';

// Clase personalizada para capturar y defender respuestas no exitosas (400, 401, 404, 409, 500)
export class ApiError extends Error {
    status: number;
    detalles?: any;

    constructor(status: number, message: string, detalles?: any) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.detalles = detalles;
    }
}

// Función genérica tipada para despachar peticiones HTTP
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    // Cabeceras estándar requeridas por la cátedra para RESTful Nivel 2
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }
    if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json');
    }

    // Inyección automática del Token JWT almacenado en localStorage
    const token = localStorage.getItem('jwt_token');
    if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const config: RequestInit = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(url, config);

        // Si la respuesta no es exitosa (código fuera del rango 200-299)
        if (!response.ok) {
            let mensajeError = `Error HTTP ${response.status}: ${response.statusText}`;
            let detalles: any = null;

            try {
                const bodyError = await response.json();
                // Captura mensajes emitidos por el ExceptionMiddleware del backend (estándar RFC 7807 ProblemDetails)
                mensajeError = bodyError.detail || bodyError.error || bodyError.message || bodyError.mensaje || mensajeError;
                detalles = bodyError;
            } catch {
                // En caso de que la respuesta de error no sea JSON legible
            }

            // Si el token expiro o es invalido, limpiamos la sesion del storage
            if (response.status === 401) {
                localStorage.removeItem('jwt_token');
                localStorage.removeItem('usuario_data');
            }

            throw new ApiError(response.status, mensajeError, detalles);
        }

        // Caso HTTP 204 No Content (ej. operaciones de eliminación o comandos sin cuerpo)
        if (response.status === 204) {
            return null as T;
        }

        return await response.json() as T;
    } catch (error) {
        // Si ya es un ApiError lo relanzamos; si es error de red (backend caído) lanzamos mensaje claro
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(0, 'No se pudo establecer conexión con el servidor backend.');
    }
}

// Métodos auxiliares según la semántica HTTP
export const httpClient = {
    get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
    post: <T>(endpoint: string, body?: any) =>
        request<T>(endpoint, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined
        }),
    put: <T>(endpoint: string, body?: any) =>
        request<T>(endpoint, {
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined
        }),
    delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};