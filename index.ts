
import Express from "@/services/Express"
import Mongo from "@/services/Mongo"

import log from "@/util/log"
require("dotenv").config()
log(process.env.NODE_ENV == "dev")

//
// makes the services public
// 
// incase of future use, where there might be a need to 
// access services from different parts of the code
//
export const expressService = new Express(process.env.WEB_PORT)
export const databaseService = new Mongo(String(process.env.MONGODB_CONNECTION_STRING))
