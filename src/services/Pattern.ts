import apiClient from "../api/Client";

export interface PatternApiResponse{
    patternId:string;
    patternName:string;
}

/** @deprecated Use usePatterns() from src/data. Kept with its API endpoint for team branches (T-19 D). */
export const PatternService={
async getpattern():Promise<PatternApiResponse[]>{
    const response=await apiClient.get<PatternApiResponse[]>("/PatternService");
    return response.data;
}
}