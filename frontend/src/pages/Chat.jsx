import { Avatar, Box, Button, IconButton, Typography } from '@mui/material';
import React, { useRef, useState } from 'react';
import { useAuth } from '../assets/context/AuthContext';
import { red } from '@mui/material/colors';
import { MdSend } from "react-icons/md";
import Chatitem from '../components/chat/Chatitem';
import { sendGeminiChatRequest } from '../helpers/api-communicator'; // Updated function

const Chat = () => {
    const auth = useAuth();
    const inputRef = useRef(null);
    const [chats, setChats] = useState([]);

    const handleSubmit = async () => {
        const content = inputRef.current?.value;
        if (inputRef && inputRef.current) {
            inputRef.current.value = "";
        }
        const newMessage = { role: "user", content };
        setChats((prev) => [...prev, newMessage]);

        // Send the user message to the Gemini API
        const chatData = await sendGeminiChatRequest(content);
        setChats((prev) => [...prev, { role: "model", content: chatData }]); // Updated role to "model"
    };

    return (
        <Box sx={{ display: "flex", flex: 1, width: "100%", height: "100%", mt: 3, gap: 3 }}>
            <Box sx={{ display: { md: "flex", xs: "none", sm: "none" }, flex: 0.2, flexDirection: 'column' }}>
                <Box sx={{ display: "flex", width: "100%", height: "70vh", bgcolor: "rgb(17,29,39)", borderRadius: 6, flexDirection: "column", mx: 3 }}>
                    <Avatar sx={{ mx: "auto", my: 2, bgcolor: "white", color: "black", fontWeight: 700 }}>
                        {auth?.user?.name ? auth?.user?.name[0] : ''}
                        {auth?.user?.name?.split(" ")[1]?.[0] || ''}
                    </Avatar>
                    <Typography sx={{ mx: "auto", fontFamily: "work sans" }}>
                        You are talking to a ChatBot
                    </Typography>
                    <Typography sx={{ mx: "auto", fontFamily: "work sans", my: 4, p: 3 }}>
                        You can ask some questions related to knowledge, business, advice, education, etc. But avoid sharing personal information.
                    </Typography>
                    <Button sx={{ width: "200px", my: "auto", color: 'white', fontWeight: "700", borderRadius: 3, mx: "auto", bgcolor: red[300], ":hover": { bgcolor: red.A400 } }}>
                        Clear Conversation
                    </Button>
                </Box>
            </Box>
            <Box sx={{ display: "flex", flex: { md: 0.8, xs: 1, sm: 1 }, flexDirection: "column", px: 3 }}>
                <Typography sx={{ textAlign: "center", fontSize: "40px", color: "white", mb: 2, mx: "auto", fontWeight: 550 }}>
                    Model - Gemini Pro
                </Typography>
                <Box sx={{ width: "100%", height: "60vh", borderRadius: 3, mx: 'auto', display: 'flex', flexDirection: "column", overflow: "scroll", overflowX: 'hidden', overflowY: "auto", scrollBehavior: "smooth" }}>
                    {chats.map((chat, index) => (
                        <Chatitem key={index} content={chat.content} role={chat.role} />
                    ))}
                </Box>
                <div style={{ width: "100%", padding: "20px", borderRadius: 0, backgroundColor: "rgb(17,27,39)", display: "flex", marginRight: "auto" }}>
                    <input type="text" style={{ width: "100%", backgroundColor: "transparent", padding: "10px", border: "none", outline: "none", color: "white", fontSize: "22px" }} ref={inputRef} />
                    <IconButton sx={{ ml: "auto", color: "white" }} onClick={handleSubmit}><MdSend /></IconButton>
                </div>
            </Box>
        </Box>
    );
};

export default Chat;