import Client from "../api/Client";

// A generic interface for the standard API response structure
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
}

export interface PatternData {
    patternId?: string; // Optional for creation
    patternName: string;
    description: string;
}

export const OrdinanceService = {
    // Fetches all patterns
    getPatterns: async (): Promise<PatternData[]> => {
        try {
            const response = await Client.get<ApiResponse<PatternData[]>>("/Ordinance/Patterns");
            if (response.data.success && response.data.data) {
                return response.data.data;
            }
            throw new Error(response.data.message || "Failed to fetch patterns.");
        } catch (error) {
            console.error("Error fetching patterns:", error);
            throw error;
        }
    },

    // Saves a new pattern
    savePattern: async (pattern: PatternData): Promise<ApiResponse<PatternData>> => {
        try {
            const response = await Client.post<ApiResponse<PatternData>>("/Ordinance/Patterns", pattern);
            return response.data;
        } catch (error) {
            console.error("Error saving pattern:", error);
            throw error;
        }
    },

    // Updates an existing pattern
    updatePattern: async (pattern: PatternData): Promise<ApiResponse<object>> => {
        try {
            const response = await Client.put<ApiResponse<object>>(`/Ordinance/Patterns/${pattern.patternId}`, pattern);
            return response.data;
        } catch (error) {
            console.error("Error updating pattern:", error);
            throw error;
        }
    },

    // Deletes a pattern
    deletePattern: async (patternId: string): Promise<ApiResponse<object>> => {
        try {
            const response = await Client.delete<ApiResponse<object>>(`/Ordinance/Patterns/${patternId}`);
            return response.data;
        } catch (error) {
            console.error("Error deleting pattern:", error);
            throw error;
        }
    },
};
