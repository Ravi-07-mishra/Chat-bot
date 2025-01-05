const mongoose = require('mongoose');


const connecttoDatabase =   async()=>{
    try {
        await mongoose.connect(process.env.MONGO_URI)
    } catch (error) {
        console.log(error);
        throw new Error("Cannot Connect to Mongodb")
    }
}
const DisconnecttoDatabase= async ()=>{
    try {
        await mongoose.disconnect();
    } catch (error) {
        console.log(error);
       
    }
}

module.exports = {connecttoDatabase,DisconnecttoDatabase}