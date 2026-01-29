import Client from "../api/Client.ts";

// A generic interface for the standard API response structure
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
}

export interface PatternData {
    patternId?: string;
    patternName: string;
    description: string;
}

export interface RuleSetData {
    ruleSetId?: string;
    name: string;
    isActive: boolean;
    patternId: string;
}

export const OrdinanceService = {
    // === Pattern Methods ===
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
    savePattern: async (pattern: PatternData): Promise<ApiResponse<PatternData>> => {
        try {
            const response = await Client.post<ApiResponse<PatternData>>("/Ordinance/Patterns", pattern);
            return response.data;
        } catch (error) {
            console.error("Error saving pattern:", error);
            throw error;
        }
    },
    updatePattern: async (pattern: PatternData): Promise<ApiResponse<object>> => {
        try {
            const response = await Client.put<ApiResponse<object>>(`/Ordinance/Patterns/${pattern.patternId}`, pattern);
            return response.data;
        } catch (error) {
            console.error("Error updating pattern:", error);
            throw error;
        }
    },
    deletePattern: async (patternId: string): Promise<ApiResponse<object>> => {
        try {
            const response = await Client.delete<ApiResponse<object>>(`/Ordinance/Patterns/${patternId}`);
            return response.data;
        } catch (error) {
            console.error("Error deleting pattern:", error);
            throw error;
        }
    },

    // === RuleSet Methods ===
    getRuleSets: async (patternId: string): Promise<RuleSetData[]> => {
        try {
            const response = await Client.get<ApiResponse<RuleSetData[]>>(`/Ordinance/RuleSets/ByPattern/${patternId}`);
            if (response.data.success && response.data.data) {
                return response.data.data;
            }
            throw new Error(response.data.message || "Failed to fetch rule sets.");
        } catch (error) {
            console.error("Error fetching rule sets:", error);
            throw error;
        }
    },
    saveRuleSet: async (ruleSet: RuleSetData): Promise<ApiResponse<RuleSetData>> => {
        try {
            const response = await Client.post<ApiResponse<RuleSetData>>("/Ordinance/RuleSets", ruleSet);
            return response.data;
        } catch (error) {
            console.error("Error saving rule set:", error);
            throw error;
        }
    },
    updateRuleSet: async (ruleSet: RuleSetData): Promise<ApiResponse<object>> => {
        try {
            const response = await Client.put<ApiResponse<object>>(`/Ordinance/RuleSets/${ruleSet.ruleSetId}`, ruleSet);
            return response.data;
        } catch (error) {
            console.error("Error updating rule set:", error);
            throw error;
        }
    },
    deleteRuleSet: async (ruleSetId: string): Promise<ApiResponse<object>> => {
        try {
            const response = await Client.delete<ApiResponse<object>>(`/Ordinance/RuleSets/${ruleSetId}`);
            return response.data;
        } catch (error) {
            console.error("Error deleting rule set:", error);
            throw error;
        }
    }
};
