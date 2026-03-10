import apiClient from "../api/Client";

export interface CreateCollegePayload{
    name:string;
    collegeCode:string;
    collegeCenter:string;
    address?:string;
    contactEmail:string;
    contactPhone:string;
    logo?:File|null;
    banner?:File|null;
}

const createCollege=async(payload:CreateCollegePayload)=>{
    const formData=new FormData();

    formData.append("Name",payload.name);
    formData.append("CollegeCode",payload.collegeCode);
    formData.append("CollegeCenter",payload.collegeCenter);
    formData.append("Address",payload.address||"");
    formData.append("ContactEmail",payload.contactEmail);
    formData.append("ContactPhone",payload.contactPhone);

    if(payload.logo) formData.append("Logo",payload.logo);
    if(payload.banner) formData.append("Banner",payload.banner);

    const response=await apiClient.post("/CollegeDetail",formData,{
        headers:{"Content-Type":"multipart/form-data"}
    });

    return response.data;

};

const updateCollege=async(id:string,payload:CreateCollegePayload)=>{
    const formData=new FormData();
    formData.append("Name",payload.name);
    formData.append("CollegeCode",payload.collegeCode);
    formData.append("CollegeCenter",payload.collegeCenter);
    formData.append("Address",payload.address||"");
    formData.append("ContactEmail",payload.contactEmail);
    formData.append("ContactPhone",payload.contactPhone);

    if(payload.logo) formData.append("Logo",payload.logo);
    if(payload.banner) formData.append("Banner",payload.banner);

    const response=await apiClient.put(`/CollegeDetail/${id}`,formData,{
        headers:{"Content-Type":"multipart/form-data"}
    });
    return response.data;
};

const getCollege=async()=>{
    const res=await apiClient.get("/CollegeDetail");
    return res.data;
};


export default {createCollege,updateCollege,getCollege};