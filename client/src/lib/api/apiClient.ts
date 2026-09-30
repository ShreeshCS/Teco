const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Extended fetch options with support for request body data
 * @property {unknown} [data] - Request body data to be JSON-stringified automatically
 *
 * @example
 * const options: RequestOptions = {
 *   method: 'POST',
 *   data: { someKey: 'some value' }
 * };
 */
interface RequestOptions extends RequestInit {
	payload?: unknown;
}

/**
 * Unified API client for making authenticated HTTP requests
 *
 * Features:
 * - Automatically attaches JWT token from localStorage as Bearer token
 * - Handles 401 responses by clearing session and throwing error
 * - Provides global error handling with message extraction
 *
 * @template T - Expected response data type
 * @param {string} endpoint - API endpoint path (e.g., '/api/auth/login')
 * @param {RequestOptions} [options={}] - Fetch options with optional 'payload' property for request body
 * @returns {Promise<T>} Parsed JSON response data
 * @throws {Error} If response is not ok or session expires (401)
 *
 * @example
 * // POST with data
 * const user = await apiClient<User>('/api/auth/login', {
 *   method: 'POST',
 *   payload: { email: 'user@example.com', password: 'secret' }
 * });
 *
 * @example
 * // GET with authentication (token auto-attached)
 * const users = await apiClient<User[]>('/api/user/details', {
 *   method: 'GET'
 * });
 *
 * @example
 * // Custom headers with data
 * const result = await apiClient('/api/custom', {
 *   method: 'POST',
 *   payload: { key: 'value' },
 *   headers: { 'X-Custom-Header': 'value' }
 * });
 */
export async function apiClient<T>(
	endpoint: string,
	options: RequestOptions = {},
): Promise<T> {
	const { payload, headers, ...customConfig } = options;
	const token = localStorage.getItem("token");

	const defaultHeaders: Record<string, string> = {
		"Content-Type": "application/json",
	};

	// Automatically attach Bearer token if it exists for no-auth endpoints
	if (token && !endpoint.includes("auth")) {
		defaultHeaders["Authorization"] = `Bearer ${token}`;
	}

	const response = await fetch(`${BASE_URL}${endpoint}`, {
		...customConfig,
		headers: {
			...defaultHeaders,
			...headers,
		},
		body: payload ? JSON.stringify(payload) : undefined,
	});

	// Global 401 interceptor
	if (response.status === 401) {
		localStorage.removeItem("token");
	}

	const responseData = await response.json().catch(() => null);

	if (!response.ok) {
		throw new Error(
			responseData?.message || `Request failed (${response.status})`,
		);
	}

	return responseData as T;
}
