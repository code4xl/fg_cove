//These repository files will be responsible for the flow of loaders and then sending the data to the connector along with the specific endpoint.
//i.e frontend pages will call the functions from thsese repo and then pass data to this and this function will decide the further actions/
//i.e enabling the loader, which endpoint should be called, after receiving the response what to do, toasting the required messages and at last defusing loaders.
import { toast } from "react-hot-toast";
import { apiConnector } from "../Connector";
import {
  setAccount,
  setAccountAfterRegister,
  setDFeature,
} from "../../app/DashboardSlice";
import { authEndpoints, userEndpoints } from "../Apis";
import { setMetadata } from "../../app/MetadataSlice";
const { LOGIN_API, ADMIN_LOGIN_API } = authEndpoints;
const { SELF_INFO_API } = userEndpoints;

export function login(email, password, login_role, navigate) {
  return async (dispatch) => {
    const loadingToast = toast.loading("Letting you in...");

    try {
      const response =
        login_role === "user"
          ? await apiConnector("POST", LOGIN_API, { email, password })
          : await apiConnector("POST", ADMIN_LOGIN_API, { email, password });

      console.log("Login API response : ", response);
      if (response.status === 200) {
        toast.success(response.data.msg || "Login Successful!");

        if (login_role === "user") {
          // Handle user login flow
          try {
            const userInfoResponse = await apiConnector("GET", SELF_INFO_API);
            console.log("User Info API response: ", userInfoResponse);

            // Set user account info
            const userAccount = {
              id: userInfoResponse.data._id,
              uname: userInfoResponse.data.name,
              uemail: email, // Use email from login
              userId: userInfoResponse.data.userId,
              roleIdentifier: userInfoResponse.data.roleIdentifier,
            };
            dispatch(setAccount(userAccount));

            // Set user metadata (allowedAccess)
            dispatch(
              setMetadata({ metadata: userInfoResponse.data.allowedAccess })
            );
          } catch (error) {
            console.error("Error fetching user info: ", error);
            toast.error("Failed to fetch user information.");
            return;
          }
        } else {
          // Handle admin login flow
          try {
            // Set admin account info from login response
            const adminAccount = {
              id: response.data.data.u_id,
              uemail: email,
              role: login_role,
              roleIdentifier: "admin",
            };
            dispatch(setAccount(adminAccount));

            // Fetch all metadata for admin
            const metadataResponse = await apiConnector(
              "GET",
              FETCH_ALL_METAS_API
            );
            console.log("Metadata API response: ", metadataResponse);
            dispatch(setMetadata({ metadata: metadataResponse.data }));
          } catch (error) {
            console.error("Error fetching admin metadata: ", error);
            toast.error("Failed to fetch metadata.");
            return;
          }
        }

        // Navigate to appropriate dashboard
        dispatch(setDFeature({ dashboardFeature: "Home" }));
        navigate(login_role === "user" ? "/sheets" : "/sheets");
      } else {
        throw new Error(response.data.msg);
      }
    } catch (error) {
      console.log("Login API Error....", error);
      console.log("Login API Error....", error.response?.data?.message);

      // Development fallback (remove in production)
      // const fallbackAccount = {
      //   id: 1,
      //   uname: "Haresh Kurade",
      //   uemail: "kuradeharesh4002@gmail.com",
      //   role_id: 1,
      //   role: "admin",
      //   roleIdentifier: "admin",
      // };
      // dispatch(setAccount(fallbackAccount));
      // dispatch(setDFeature({ dashboardFeature: "Home" }));
      // navigate("/sheets");

      toast.error(
        error.response?.data?.msg || "Login failed. Please try again."
      );
    }

    toast.dismiss(loadingToast);
  };
}

export function register(name, email, password, mobile, navigate) {
  return async (dispatch) => {
    const loadingToast = toast.loading("Registering you...");
    try {
      const response = await apiConnector("POST", REGISTER, {
        name,
        email_id,
        mobile,
        password,
      });
      console.log("Register API response : ", response.data.data);
      if (response.data.success) {
        toast.success("Registration Successful..");
        const temp = {
          id: response.data.data.u_id,
          uname: response.data.data.name,
          uemail: response.data.data.email,
        };
        console.log(temp);
        dispatch(setAccountAfterRegister(temp));
        navigate("/verify-email");
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.log("Register API Error....", error);
      toast.error(error.response?.data?.message);
    }
    toast.dismiss(loadingToast);
  };
}
