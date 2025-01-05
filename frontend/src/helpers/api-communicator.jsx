import axios from "axios";

export const loginUser = async (email, password) => {
  try {
    const res = await axios.post("/user/login", { email, password });

    if (res.status !== 200) {
      throw new Error("Unable to login");
    }

    return res.data;
  } catch (error) {
    console.error(error.message);
    throw error;
  }
};


export const checkAuthStatus = async () => {
   try {
     const res = await axios.get("/user/auth-status");
 
     if (res.status !== 200) {
       throw new Error("Unable to authenticate");
     }
 
     return res.data;
   } catch (error) {
     console.error(error.message);
     throw error;
   }
 };
 
export const sendChatRequest = async (message) => {
   try {
     const res = await axios.post("/chat/new",{message});
 
     if (res.status !== 200) {
       throw new Error("Unable to send Chat");
     }
 
     return res.data;
   } catch (error) {
     console.error(error.message);
     throw error;
   }
 };
 