
import DatabaseService from "./services/Mongo"
import ExpressService from "./services/Express"
import createLogger from "./util/log"

//
// makes the services public
// 
// incase of future use, where there might be a need to 
// access services from different parts of the code
//
export const konsole = createLogger()
export const expressService = new ExpressService()
export const databaseService = new DatabaseService()
