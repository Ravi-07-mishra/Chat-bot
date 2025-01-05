const app = require('./app.js')
const { connecttoDatabase } = require('./db/connect.js')


const port = process.env.PORT || 4000
connecttoDatabase().then(()=>{
    app.listen(port,()=>{
        console.log(`Server running on port ${port}`)
    })
}).catch((err)=>console.log(err))
