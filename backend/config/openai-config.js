const {Configuration} =  require('openai')

const configureOpenAi = ()=>{


   const config = new Configuration({
apiKey: process.env.OPEN_AI_SECRET,
organization : process.env.OPENAI_ORGANIZATION_ID,
   })
}

module.exports = {configureOpenAi}