import { Request } from "express";
import { User } from "models";


// to make the file a module and avoid the TypeScript error
export { };

export interface RequestWithUser extends Request {
    user?: User;
}
declare global {
    namespace Express {
        export interface Request {
            user?: User;
        }
    }
}