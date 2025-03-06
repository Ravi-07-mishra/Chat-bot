import { Avatar, Box, Typography } from '@mui/material';
import React from 'react';
import { useAuth } from '../../assets/context/AuthContext';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coldarkCold } from 'react-syntax-highlighter/dist/esm/styles/prism';

const Codeextracter = (message) => {
    if (message.includes("'''")) {
        const blocks = message.split("'''");
        return blocks;
    }
};

const Chatitem = ({ content, role }) => {
    const auth = useAuth();

    return (
        <div>
            {role === "model" ? ( // Updated role from "assistant" to "model"
                <Box sx={{ display: "flex", p: 2, bgcolor: "#004d56", gap: 2 }}>
                    <Avatar sx={{ ml: "0" }}>
                        <img src="gemini.png" alt="gemini" width={"30px"} /> {/* Update image to Gemini logo */}
                    </Avatar>
                    <Box>
                        <Typography color='white' fontSize={"20px"}>{content}</Typography>
                    </Box>
                </Box>
            ) : (
                <Box sx={{ display: "flex", p: 2, bgcolor: "#004d5612", my: 2, gap: 2 }}>
                    <Avatar sx={{ ml: "0", bgcolor: "black", color: "white" }}>
                        {auth?.user?.name ? auth?.user?.name[0] : ''}
                    </Avatar>
                    <Box>
                        <Typography color='white' fontSize={"20px"}>{content}</Typography>
                    </Box>
                </Box>
            )}
        </div>
    );
};

export default Chatitem;