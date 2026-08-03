import { API_BASE_URL } from '../config';

class ApiClient {
    constructor() {
        this.baseUrl = API_BASE_URL.replace(/\/+$/, '');
    }

    _getHeaders(customHeaders = {}) {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...customHeaders
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    async get(endpoint, customHeaders = {}) {
        const response = await fetch(`${this.baseUrl}/${endpoint.replace(/^\/+/, '')}`, {
            method: 'GET',
            headers: this._getHeaders(customHeaders)
        });
        return this._handleResponse(response);
    }

    async post(endpoint, body, customHeaders = {}) {
        const response = await fetch(`${this.baseUrl}/${endpoint.replace(/^\/+/, '')}`, {
            method: 'POST',
            headers: this._getHeaders(customHeaders),
            body: JSON.stringify(body)
        });
        return this._handleResponse(response);
    }

    async put(endpoint, body, customHeaders = {}) {
        const response = await fetch(`${this.baseUrl}/${endpoint.replace(/^\/+/, '')}`, {
            method: 'PUT',
            headers: this._getHeaders(customHeaders),
            body: JSON.stringify(body)
        });
        return this._handleResponse(response);
    }

    async delete(endpoint, customHeaders = {}) {
        const response = await fetch(`${this.baseUrl}/${endpoint.replace(/^\/+/, '')}`, {
            method: 'DELETE',
            headers: this._getHeaders(customHeaders)
        });
        return this._handleResponse(response);
    }

    async patch(endpoint, body = null, customHeaders = {}) {
        const options = {
            method: 'PATCH',
            headers: this._getHeaders(customHeaders)
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        const response = await fetch(`${this.baseUrl}/${endpoint.replace(/^\/+/, '')}`, options);
        return this._handleResponse(response);
    }

    async _handleResponse(response) {
        if (response.status === 401) {
            // Optional: Handle global 401 redirects if needed later
            // window.location.href = '/login';
        }
        
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const data = await response.json();
            // Unwrap standard ApiResponse<T> if present
            if (data && data.hasOwnProperty('success') && data.hasOwnProperty('data')) {
                return { ok: response.ok, status: response.status, data: data.data, message: data.message };
            }
            return { ok: response.ok, status: response.status, data };
        }
        return { ok: response.ok, status: response.status, data: null };
    }
}

export default new ApiClient();
