import { EntityManager } from "typeorm";
import express, { Router } from 'express';
import bodyParser from "body-parser";
import { UserModel } from "../Models/UserModel";
import { UserDTO } from "../DTO/UserDTO";
import jwt, { JwtPayload } from 'jsonwebtoken'

let isRouterInitialized = false
const ROUTER = express.Router();
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/

const JWT_SECRET = 'secret' //'=OBbaaKV7qXC):?cg]<|}_cd|bvemt6[+0+%=I6-lI.l^l|Fh6>UBo1b][YwHOeF'
const JWT_EXPIRATION_MINUTES = 60
const JWT_ALG = 'HS256'

export const BASE_ROUTE = '/users'


function validateUsername(username: string): boolean {
    return Boolean(username) && username.length >= 4
}

function validatePassword(password: string): boolean {
    // TODO: improve validation
    return Boolean(password) && password.length >= 4
}

function getExpiration(minutes: number): number {
    return Math.floor(Date.now() / 1000) + (minutes * 60)
}

function getToken(user: UserModel): string {
    return jwt.sign({
        exp: getExpiration(JWT_EXPIRATION_MINUTES),
        data: JSON.stringify(UserDTO.From(user))
    },
    JWT_SECRET
    , {
        algorithm: JWT_ALG
        }
        )
}

// parse FORM
// ROUTER.use(bodyParser.urlencoded({ extended: false }))
// parse JSON
ROUTER.use(express.json())


export async function isTokenValid(token: string, db: EntityManager): Promise<boolean> {
    if (token.length !== 275)
        return false

    try{
        // JwtPayload but cannot get rid of the "string | JwtPayload" type
        const decoded: any = jwt.verify(token, JWT_SECRET, {
            algorithms: [JWT_ALG]
        })
        const data: UserDTO = UserDTO.Parse(decoded.data)

        console.log(`Verifying ${data}`)
        
        const user = await db
            .createQueryBuilder()
            .select('user')
            .from(UserModel, 'user')
            .where('user.Username = :username', {username: data.Username})
            .getOne()
        
        console.log(`Validating ${data.Username} and got:`)
        console.log(user)
        
        return user !== null
    }
    catch {
        return false
    }

    
}
export function init(db: EntityManager){
    ROUTER.post('/register', async (req, res) => {        
        const email = req.body.email
        const username = req.body.username
        const password = req.body.password
        
        //console.log(`Received for registration ${email}<=>${username}<=>${password}`)
        
        // validate
        if (! (email && username && password && 
            EMAIL_REGEX.test(email) &&
            validateUsername(username) &&
            validatePassword(password)) ){
                res.send({
                    success: false,
                    message: 'Unable to validate email, username (length >= 4) or password (length >= 4)'
                })
            return    
        }

        //console.log(`Validated`)
        
        const user = await UserModel.CreateUser(email, username, password, db)
        if (user === null){
            res.send({
                success: false,
                message: 'Failed to save user.'
            })
            return 
        }

        console.log(`Created and saved user ${user.Username} to DB`)

        // const token = getToken(user)

        // console.log(`Generated JWT: ${token}`)

        res.send({
            success: true
            // token: token
        })
    })

    ROUTER.post('/login', async (req, res) => {
        const username = req.body.username
        const password = req.body.password

        const user = await db
            .createQueryBuilder()
            .select('user')
            .from(UserModel, 'user')
            .where('user.Username = :username', {username: username})
            .getOne()

        if (!user){
            res.send({
                success: false,
                message: 'Username not found.'
            })
            return
        }

        if (!user.CheckPassword(password)){
            res.send({
                success: false,
                message: 'Unable to login.'
            })
            return
        }

        const token = getToken(user)

        res.send({
            success: true,
            token: token
        })
    })

    isRouterInitialized = true
}

export function getRouter(): Router | null {
    if (!isRouterInitialized)
        return null
    else
        return ROUTER
}

export default {
    init: init,
    getRouter: getRouter,
    isTokenValid: isTokenValid,
    BASE_ROUTE: BASE_ROUTE
}