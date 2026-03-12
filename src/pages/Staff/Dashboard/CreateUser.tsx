import ComponentCard from "../../../components/common/ComponentCard";
import Input from "../../../components/form/input/InputField";
import Select from "../../../components/form/Select";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Eye, EyeClosed } from "lucide-react";
import { useState, useEffect } from "react";
import Button from "../../../components/ui/button/Button";
import {
  createUser,
  getUsers,
  deleteUser,
  UserListResponse,
  getUserById,
  updateUser,
} from "../../../services/CreateUserService";
import {
  RoleMasterResponse,
  RoleMasterService,
} from "../../../services/Role_masterService";
import { Pencil, Trash2 } from "lucide-react";
import DataTable from "../../../components/ui/table/DataTable";
import Alert from "../../../components/ui/alert/Alert";
import { Modal } from "../../../components/ui/modal";

const CreateUser = () => {
  const [alertData, setAlertData] = useState<{
    variant: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
  } | null>(null);
  const showAlert = (
    variant: "success" | "error" | "warning" | "info",
    title: string,
    message: string,
    timeout = 3000,
  ) => {
    setAlertData({ variant, title, message });
    setTimeout(() => {
      setAlertData(null);
    }, timeout);
  };

  const [showPassword, setShowPassword] = useState(false);
  const [showconfirmPassword, setShowConfirmPassword] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editingUserID, setEditingUserID] = useState<string | null>(null);

  const [roles, setRoles] = useState<RoleMasterResponse[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");

  const [username, setUserName] = useState("");
  const [firstname, setFirstName] = useState("");
  const [lastname, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [users, setUsers] = useState<UserListResponse[]>([]);
  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  const roleOptions = roles.map((role) => ({
    value: role.roleId,
    label: role.name,
  }));

  const variants: Variants = {
    initial: (isOpen: boolean) => ({
      y: isOpen ? 5 : -5,
      opacity: 0,
      scale: 0.8,
    }),
    animate: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 20 },
    },
    exit: (isOpen: boolean) => ({
      y: isOpen ? -5 : 5,
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.15 },
    }),
  };

  const handleResetPassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      showAlert("warning", "Required", "All fields are required");
      return;
    }

    if (newPassword.length < 8) {
      showAlert(
        "warning",
        "Weak Password",
        "New password must be at least 8 characters",
      );
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showAlert(
        "error",
        "Mismatch",
        "New password and confirm password must match",
      );
      return;
    }

    try {
      // await resetPasswordAPI({
      //   userId: editingUserID,
      //   currentPassword,
      //   newPassword,
      // });

      showAlert("success", "Success", "Password updated successfully");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setIsResetModalOpen(false);
    } catch (error: any) {
      showAlert(
        "error",
        "Failed",
        error.response?.data?.message || "Password reset failed",
      );
    }
  };

  const handleRefresh = () => {
    setEditingUserID(null);
    setUserName("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setSelectedRole("");
    setIsEditing(false);
  };

  const handleUpdate = async () => {
    // console.log("The Update tries is made");
    if (!isEditing) return;

    if (!username || !firstname || !lastname || !email) {
      // alert("All fields are required");
      showAlert("error", "Required Fields", "All fields are required.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert(
        "warning",
        "Invalid Email",
        "Please enter a valid email address",
      );
      return;
    }

    try {
      await updateUser({
        userId: editingUserID,
        username,
        firstname,
        lastname,
        email,
        roleid: selectedRole || null,
      });
      showAlert("success", "Success", "User Updated Successfully");
      fetchUsers();
      handleRefresh();
    } catch (error: any) {
      console.error(error);
      showAlert("error", "Failed", "Update Failed");
    }
  };

  const handleSubmit = async () => {
    if (
      !username ||
      !firstname ||
      !lastname ||
      !password ||
      !confirmPassword ||
      !email
    ) {
      showAlert("warning", "Required Fields", "All Fields are required");
      return;
    }
    if (password.length < 8) {
      showAlert(
        "warning",
        "Weak Password",
        "Password must be at least 8 characters",
      );
      return;
    }
    if (password !== confirmPassword) {
      showAlert(
        "info",
        "Password Mismatch",
        "Password does not match to Confirm Password",
      );
      return;
    }
    if (!selectedRole) {
      showAlert("warning", "Role Required", "Please select a role");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert(
        "warning",
        "Invalid Email",
        "Please enter a valid email address",
      );
      return;
    }

    try {
      await createUser({
        username,
        password,
        email,
        firstname,
        lastname,
        roleId: selectedRole || null,
        collegeId: null,
      });
      fetchUsers();
      showAlert("success", "Success", "User Created Successfully");
      setUserName("");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setSelectedRole("");
    } catch (error: any) {
      console.log("FULL ERROR:", error.response?.data);
      showAlert("error", "Failed", JSON.stringify(error.response?.data));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await deleteUser(id);
      fetchUsers();
    } catch (error) {
      console.error(error);
      showAlert("error", "Fail", "Failed to delete user");
    }
  };

  const handleEdit = async (id: string) => {
    try {
      const user = await getUserById(id);
      setIsEditing(true);
      setEditingUserID(user.userId);
      setUserName(user.username);
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setSelectedRole(user.roleId ?? "");
      setEmail(user.email);
    } catch (error) {
      console.error("Failed to fetch user details", error);
    }
  };

  const columns = [
    {
      key: "username",
      label: "Username",
      sortable: true,
    },
    {
      key: "fullName",
      label: "Name",
      sortable: true,
      render: (row: UserListResponse) => ({
        content: `${row.firstName} ${row.lastName}`,
      }),
    },
    {
      key: "edit",
      label: "Edit",
      sortable: false,
      render: (row: UserListResponse) => ({
        content: (
          <div className="flex justify-center">
            <button
              className="text-blue-600 hover:text-blue-800 transition"
              onClick={() => handleEdit(row.userId)}
            >
              <Pencil size={18} />
            </button>
          </div>
        ),
      }),
    },
    {
      key: "delete",
      label: "Delete",
      sortable: false,
      render: (row: UserListResponse) => ({
        content: (
          <div className="flex justify-center">
            <button
              onClick={() => handleDelete(row.userId)}
              className="text-red-600 hover:text-red-800 transition"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ),
      }),
    },
  ];

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const data = await RoleMasterService.GetRoles();
        setRoles(data);

        const usersData = await getUsers();
        setUsers(usersData);
      } catch (error) {
        console.error("Failed to fetch roles", error);
      }
    };
    fetchRoles();
  }, []);

  return (
    <div>
      <ComponentCard title="Create User">
        {alertData && (
          <Alert
            variant={alertData.variant}
            title={alertData.title}
            message={alertData.message}
          />
        )}
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <div className="w-full sm:w-1/4">
            <Input
              placeholder="User Name"
              label="User Name"
              value={username}
              onChange={(e) => {
                const value = e.target.value;
                const regex = /^[A-Za-z0-9'$,()\-_@]*$/;
                if (value.length <= 50 && regex.test(value)) {
                  setUserName(value);
                }
              }}
            ></Input>
          </div>
          <div className="w-full sm:w-1/4">
            <Input
              placeholder="First Name"
              label="First Name"
              value={firstname}
              onChange={(e) => {
                const value = e.target.value;
                const regex = /^[A-Za-z ]*$/;
                if (value.length <= 50 && regex.test(value)) {
                  setFirstName(value);
                }
              }}
            ></Input>
          </div>
          <div className="w-full sm:w-1/4">
            <Input
              placeholder="Last Name"
              label="Last Name"
              value={lastname}
              onChange={(e) => {
                const value = e.target.value;
                const regex = /^[A-Za-z' ]*$/;
                if (value.length <= 50 && regex.test(value)) {
                  setLastName(value);
                }
              }}
            ></Input>
          </div>
          <div className="w-full sm:w-1/4">
            <Input
              placeholder="E-Mail"
              label="E-Mail"
              value={email}
              onChange={(e) => {
                const value = e.target.value;
                const regex = /^[A-Za-z0-9@.]*$/;
                if (value.length <= 50 && regex.test(value)) {
                  setEmail(e.target.value);
                }
              }}
              error={
                (!email.includes("@") || !email.includes(".")) &&
                email.length > 0
              }
              hint={
                (!email.includes("@") || !email.includes(".")) &&
                email.length > 0
                  ? "Invalid email format"
                  : ""
              }
            ></Input>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          {!isEditing && (
            <>
              <div className="w-full sm:w-1/4 relative">
                <Input
                  placeholder="Password"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 40) {
                      setPassword(value);
                    }
                  }}
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2 flex items-center justify-center w-6 h-6"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={showPassword ? "open" : "closed"}
                      variants={variants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      {showPassword ? (
                        <EyeClosed className="text-gray-500 size-5" />
                      ) : (
                        <Eye className="text-gray-500 size-5" />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </span>
              </div>

              <div className="w-full sm:w-1/4 relative">
                <Input
                  placeholder="Confirm Password"
                  label="Confirm Password"
                  type={showconfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 40) {
                      setConfirmPassword(value);
                    }
                  }}
                />
                <span
                  onClick={() => setShowConfirmPassword(!showconfirmPassword)}
                  className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2 flex items-center justify-center w-6 h-6"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={showconfirmPassword ? "open" : "closed"}
                      variants={variants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      {showconfirmPassword ? (
                        <EyeClosed className="text-gray-500 size-5" />
                      ) : (
                        <Eye className="text-gray-500 size-5" />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </span>
              </div>
            </>
          )}
          <div className="w-full sm:w-1/4">
            <Select
              options={roleOptions}
              value={selectedRole}
              onChange={setSelectedRole}
              placeholder="Select Role"
            />
          </div>
          {!isEditing ? (
            <div className="w-full sm:w-1/4">
              <Button onClick={handleSubmit}>Add User</Button>
            </div>
          ) : (
            <div className="w-full sm:w-1/4 flex gap-3">
              <Button onClick={handleUpdate}>Update</Button>
              <Button onClick={handleRefresh}>Refresh</Button>
              <Button onClick={() => setIsResetModalOpen(true)}>
                Reset Password
              </Button>
            </div>
          )}
        </div>
        <div className="w-full">
          <DataTable
            data={users}
            columns={columns}
            searchKeys={["username", "firstname", "lastname"]}
            pageSizeOptions={[5, 10, 20, 50]}
          />
        </div>
        <Modal
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
          className="max-w-md p-6"
        >
          <h2 className="text-xl font-semibold mb-4">Reset Password</h2>

          <div className="flex flex-col gap-4">
            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />

            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <Input
              label="Confirm New Password"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
            />

            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => setIsResetModalOpen(false)}
              >
                Cancel
              </Button>

              <Button onClick={handleResetPassword}>Update Password</Button>
            </div>
          </div>
        </Modal>
      </ComponentCard>
    </div>
  );
};

export default CreateUser;
