
import DatabaseService from "./src/database/DatabaseService"
import ExpressService from "./src/express/ExpressService"
import createLogger from "./src/util/logging"

//
// makes the services public
// 
// incase of future use, where there might be a need to 
// access services from different parts of the code
//
export const konsole = createLogger()
export const expressService = new ExpressService()
export const databaseService = new DatabaseService()
