import ComponentCard from "../../../components/common/ComponentCard";
import Input from "../../../components/form/input/InputField";
import { Pencil,ChevronsLeft,ChevronsRight} from "lucide-react";
import { useState, useMemo,  useEffect } from "react";
import Dropzone from "../../../components/form/input/DropZone";
import Button from "../../../components/ui/button/Button";
import Alert from "../../../components/ui/alert/Alert";
import collegedetailService from "../../../services/collegedetailService";
import { Modal } from "../../../components/ui/modal";

const CollegeDetail = () => {
  const [showLogo, setShowLogo] = useState(true);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
const [savedLogo, setSavedLogo] = useState<File | null>(null);
const [savedBanner, setSavedBanner] = useState<File | null>(null);


const [alertData,setAlertData]=useState<{variant:"success" | "error" | "warning" | "info"; title:string; message:string;}|null>(null);
const showAlert = (
  variant: "success" | "error" | "warning" | "info",
  title: string,
  message: string,
  timeout = 3000
) => {
  setAlertData({ variant, title, message });

  setTimeout(() => {
    setAlertData(null);
  }, timeout);
};


const [tempLogoFile, setTempLogoFile] = useState<File | null>(null);
const [tempBannerFile, setTempBannerFile] = useState<File | null>(null);
const [tempLogoUrl, setTempLogoUrl] = useState<string | null>(null);
const [tempBannerUrl, setTempBannerUrl] = useState<string | null>(null);

const tempLogoPreview = useMemo(
  () => tempLogoFile ? URL.createObjectURL(tempLogoFile) : tempLogoUrl,
  [tempLogoFile, tempLogoUrl]
);

const tempBannerPreview = useMemo(
  () => tempBannerFile ? URL.createObjectURL(tempBannerFile) : tempBannerUrl,
  [tempBannerFile, tempBannerUrl]
);


  const [name,setName]=useState("");
  const [code,setCode]=useState("");
  const [center,setCenter]=useState("");
  const [email,setEmail]=useState("");
  const [phone,setPhone]=useState("");
  const [address,setAddress]=useState("");

  const [isModalOpen,setIsModalOpen]=useState(false);
  const [isEditting,setIsEditting]=useState(true);
  const [isSaved,setIsSaved]=useState(false);
  const [collegeId,setCollegeId]=useState<string | null>(null);

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
const [bannerUrl, setBannerUrl] = useState<string | null>(null);


  const logoPreview = useMemo(() => logoFile ? URL.createObjectURL(logoFile) : logoUrl, [logoFile,logoUrl]);
  const bannerPreview = useMemo(() => bannerFile ? URL.createObjectURL(bannerFile) : bannerUrl, [bannerFile,bannerUrl]);


  const [logoDZKey, setLogoDZKey] = useState(0);
const [bannerDZKey, setBannerDZKey] = useState(0);

  const MAX_IMAGE_SIZE_MB=2;
  const MAX_IMAGE_SIZE_BYTES=MAX_IMAGE_SIZE_MB*1024*1024;

  const allowedImageTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp"
];

const handleImageSelect = (
  file: File | null,
  type: "logo" | "banner"
) => {
  if (!file) return;

  if (!allowedImageTypes.includes(file.type)) {
    showAlert("error","Invalid File Format","Only JPG, JPEG, PNG and WEBP images are allowed.");
    if (type === "logo") setLogoDZKey(prev => prev + 1);
    if (type === "banner") setBannerDZKey(prev => prev + 1);
    return;
  }

  if(file.size>MAX_IMAGE_SIZE_BYTES){
    showAlert("warning","Image Too Large","Image size must be less than 2 MB.");
  }

  if (type === "logo") setLogoFile(file);
  if (type === "banner") setBannerFile(file);
};

     const validateForm=()=>{
    if(!name.trim())  return "Name is required";
    if(!code.trim())  return "College Code is required";
    if(!center.trim()) return "Center Name is required";
    if(!email.trim()) return "Email ID is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Invalid Email format";
    if(!phone.trim()) return "Phone Number is required";
    if(!address.trim()) return "Address is required";

    if (!logoFile && !logoUrl) return "Logo Image is required";
  if (!bannerFile && !bannerUrl) return "Banner Image is required";
  };

  const handleSubmit=async()=>{
    const error=validateForm();
    if(error){
      showAlert("error", "Required Field", error);
      return;
    }
    try{
      const payload={
        name,
        collegeCode:code,
        collegeCenter:center,
        address,
        contactEmail:email,
        contactPhone:phone,
        logo:logoFile,
        banner:bannerFile
      };

      let res;

      if(!collegeId){
      res=await collegedetailService.createCollege(payload);

  setSavedLogo(logoFile);
  setSavedBanner(bannerFile);
      setCollegeId(res.collegeId);
      showAlert(
        "success",
        "Success",
        "College added successfully"
      );
      }else{
        res=await collegedetailService.updateCollege(collegeId,payload);
          setSavedLogo(logoFile);
  setSavedBanner(bannerFile);
        showAlert(
        "info",
        "Updated",
        "College updated successfully"
      );
      }
          setIsSaved(true);
    setIsEditting(false);

    }catch(err){
      console.error(err);
    showAlert("error", "Failed", "Failed to add College Details");

    }
  };

     const handleRefresh = () => {
  setIsEditting(false);
  setLogoFile(savedLogo);
  setBannerFile(savedBanner);
};

useEffect(()=>{
  const fetchCollege=async()=>{
    try{
      const data=await collegedetailService.getCollege();

      if(data && data.isDeleted===false){
        setCollegeId(data.collegeId);
        setName(data.name);
        setCode(data.collegeCode);
        setCenter(data.collegeCenter);
        setAddress(data.address);
        setEmail(data.contactEmail);
        setPhone(data.contactPhone);

        setLogoUrl(data.logoUrl);
        setBannerUrl(data.bannerUrl);

        setIsSaved(true);
        setIsEditting(false);
      }
    }catch(err){
      console.error("Failed to fetch college Details",err);
    }
  };
  fetchCollege();
},[]);

  return (

    <ComponentCard title="College Detail">
      {alertData && (
  <Alert
    variant={alertData.variant}
    title={alertData.title}
    message={alertData.message}
  />
)}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">

    <div className="col-span-1 md:col-span-2">
      <Input label="Name" disabled={!isEditting} value={name} onChange={(e)=>{const value=e.target.value; const regex=/^[A-Za-z'&,()\[\]\- ]*$/; if(value.length<=50 && regex.test(value)){setName(value)}}}/>
    </div>

    <Input label="Code" disabled={isSaved || !isEditting} value={code} onChange={(e)=>{if(e.target.value.length<=20){setCode(e.target.value)}}}/>
    <Input label="Center" disabled={!isEditting} value={center} onChange={(e)=>{const value=e.target.value; const regex=/^[A-Za-z'&,()\[\]\- ]*$/; if(value.length<=100 && regex.test(value)){setCenter(e.target.value)}}}/>

    <Input label="Email" disabled={!isEditting} type="email" value={email} onChange={(e)=>setEmail(e.target.value)} error={(!email.includes("@") || !email.includes(".")) && email.length > 0}
  hint={(!email.includes("@") || !email.includes(".")) && email.length > 0 ? "Invalid email format" : ""} />
    <Input label="Phone" disabled={!isEditting} type="text" value={phone} onChange={(e)=> {const val=e.target.value;if(/^\d{0,10}$/.test(val)){setPhone(val)}}}/>

    <div className="col-span-1 md:col-span-2">
      <Input label="Address" disabled={!isEditting} value={address} onChange={(e)=>{if(e.target.value.length<=500){setAddress(e.target.value)}}}/>
    </div>
  </div>

        <div className="lg:col-span-2 relative border rounded-md p-4 flex flex-col items-center justify-center gap-4 min-h-55">

          <button
  disabled={!(isSaved && isEditting)}
  className={`absolute top-2 right-2 p-2 rounded-full text-white
    ${(isSaved && isEditting) ? "bg-blue-500" : "bg-gray-400 cursor-not-allowed"}`}
    onClick={()=>{setTempLogoFile(logoFile);
  setTempBannerFile(bannerFile);
  setTempLogoUrl(logoUrl);
  setTempBannerUrl(bannerUrl);
  setIsModalOpen(true);}}
>
  <Pencil size={22}/>
</button>

{showLogo ? (
  logoPreview ? (
    <img
      src={logoPreview}
      alt="Logo Preview"
      className="w-full h-47 object-contain rounded-md cursor-pointer"
      onClick={() => {
        if (!isSaved) setLogoFile(null);
      }}
    />
  ) : (
    <Dropzone key={logoDZKey}
      label="Upload Logo"
      onFileSelect={(file) => handleImageSelect(file, "logo")}
    />
  )
) : (
  bannerPreview ? (
    <img
      src={bannerPreview}
      alt="Banner Preview"
      className="w-full h-47 object-contain rounded-md cursor-pointer"
      onClick={() => {
        if (!isSaved) setBannerFile(null);
      }}
    />
  ) : (
    <Dropzone key={bannerDZKey}
      label="Upload Banner"
      onFileSelect={(file) => handleImageSelect(file, "banner")}
    />
    
  )
)}

          <button
            className="absolute bottom-2 right-2 bg-blue-500 p-1 rounded-full text-white"
            onClick={() => setShowLogo(prev => !prev)}
          >
            {showLogo ? <ChevronsRight size={26} /> : <ChevronsLeft size={26} />}
          </button>
        </div>
      </div>
  <div className="flex gap-3 mt-4">

{!isSaved && !isEditting && (
          <Button onClick={handleSubmit}>Save</Button>
        )}


  {!isSaved && isEditting &&(
    <Button onClick={handleSubmit}>
      Add
    </Button>
  )}

  {isSaved && !isEditting && (
    <>
      <Button onClick={() => setIsEditting(true)}>
        Edit
      </Button>
    </>
  )}
   {isSaved && isEditting && (
          <>
            <Button onClick={handleSubmit}>Update</Button>
            <Button onClick={handleRefresh}>Refresh</Button>
          </>
        )}

</div>

<Modal isOpen={isModalOpen} onClose={() => {
  setLogoFile(savedLogo);
  setBannerFile(savedBanner);
  setIsModalOpen(false);
}}>
  <div className="p-6 space-y-5">
    <h2 className="text-lg font-semibold">Update College Logo & Banner</h2>

    <div className="flex flex-col sm:flex-row gap-5 w-full">

      <div className="flex-1 space-y-2">
        <p className="font-medium">Logo</p>
        {tempLogoPreview ? (
  <img
    src={tempLogoPreview}
    className="w-full h-47 object-contain border rounded-md cursor-pointer"
    onClick={() => {
      setTempLogoFile(null);
      setTempLogoUrl(null);
    }}
  />
) : (
  <Dropzone
    label="Upload Logo"
    onFileSelect={(file) => setTempLogoFile(file)}
  />
)}
      </div>

      <div className="flex-1 space-y-2">
        <p className="font-medium">Banner</p>
        {tempBannerPreview ? (
  <img
    src={tempBannerPreview}
    className="w-full h-47 object-contain border rounded-md cursor-pointer"
    onClick={() => {
      setTempBannerFile(null);
      setTempBannerUrl(null);
    }}
  />
) : (
  <Dropzone
    label="Upload Banner"
    onFileSelect={(file) => setTempBannerFile(file)}
  />
)}

      </div>

    </div>

    <div className="flex justify-center gap-3 pt-3">
      <Button onClick={() => {
        setIsModalOpen(false);
      }}>
        Cancel
      </Button>

      <Button onClick={() => {
        setLogoFile(tempLogoFile);
  setBannerFile(tempBannerFile);
  setLogoUrl(tempLogoUrl);
  setBannerUrl(tempBannerUrl);
        setIsModalOpen(false);
      }}>
        Save
      </Button>
    </div>
  </div>
</Modal>



    </ComponentCard>
  );
};

export default CollegeDetail;
