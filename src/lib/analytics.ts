/**
 * Client-side utilities for analytics and error logging
 */

export interface SessionTrackingData {
  template_used?: string;
  feature_used: 'template-enhancer' | 'trainer';
  success: boolean;
}

export interface ErrorTrackingData {
  error_type: string;
  error_message: string;
  stack_trace?: string;
}

// Track a session for analytics
export async function trackSession(data: SessionTrackingData): Promise<boolean> {
  try {
    const response = await fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error('Failed to track session:', response.statusText);
      return false;
    }

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('Error tracking session:', error);
    return false;
  }
}

// Log an error for debugging and monitoring
export async function logClientError(data: ErrorTrackingData): Promise<boolean> {
  try {
    const response = await fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error('Failed to log error:', response.statusText);
      return false;
    }

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('Error logging client error:', error);
    return false;
  }
}

// Get session statistics (for admin/monitoring purposes)
export async function getSessionStats(days: number = 30) {
  try {
    const response = await fetch(`/api/analytics?days=${days}`);

    if (!response.ok) {
      console.error('Failed to get session stats:', response.statusText);
      return null;
    }

    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error('Error getting session stats:', error);
    return null;
  }
}

// Check database health
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const response = await fetch('/api/health');
    
    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return result.status === 'healthy';
  } catch (error) {
    console.error('Error checking database health:', error);
    return false;
  }
}

// Initialize database (for setup/deployment)
export async function initializeDatabase(): Promise<boolean> {
  try {
    const response = await fetch('/api/health', {
      method: 'POST',
    });

    if (!response.ok) {
      console.error('Failed to initialize database:', response.statusText);
      return false;
    }

    const result = await response.json();
    return result.status === 'success';
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}