import apiClient from "../api/Client";

export interface PatternApiResponse{
    patternId:string;
    patternName:string;
}

export const PatternService={
async getpattern():Promise<PatternApiResponse[]>{
    const response=await apiClient.get<PatternApiResponse[]>("/PatternService");
    return response.data;
}
}