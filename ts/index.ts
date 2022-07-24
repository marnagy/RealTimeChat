import express from "express";
import cors from "cors";
import { DataSource, EntityManager } from "typeorm";
import { UserModel } from "./Models/UserModel";
import userRouter from "./Routes/UserRouter";

const PORT = 8000
const HOSTNAME = 'localhost'


const myDataSource = new DataSource({
    type: 'sqlite',
    database: 'test.sqlite',
    synchronize: true,
    entities: [UserModel]
})
const corsOptions = {
    origin: `http://${HOSTNAME}:${PORT}`
}

async function isAuthorized(auth: string | undefined, db: EntityManager): Promise<boolean> {
    if (!auth){
        return false
    }

    const authParts = auth.split(' ')
    if (!authParts || authParts.length !== 2 || authParts[0] !== 'Bearer'){
        return false
    }

    const tokenValidationResult = await userRouter.isTokenValid(authParts[1], db)

    console.log(`TokenValidationResult: ${tokenValidationResult}`)
    
    return tokenValidationResult
}

// const email = 'test@test.com'
// const username = 'test1'
// const password = 'myPassword1'

// const user = await UserModel.CreateUser(
//     email, username, password, DBSource.manager
// )
    
// if (user){
//     console.log(`Created user:`)
//     console.log(user)
// }
// else{
//     console.log('Failed to save user')
// }

async function main() {
    const DBSource = await myDataSource.initialize()
    const app = express()
    app.use(cors(corsOptions))

    // add UserRouter
    {
        userRouter.init(DBSource.manager)
        // add endpoint for register/login
        const uRouter = userRouter.getRouter()
        if (uRouter === null)
            throw new Error(`Failed to retrieve UserRouter.`)
    
        app.use(`/api${userRouter.BASE_ROUTE}`, uRouter)
    }

    app.get('/api/test', (_, res) => {
        res.send({
            'Hello': 'world'
        })
    })

    app.get('/api/validated', async (req, resp) => {
        if (!await isAuthorized(req.headers.authorization, DBSource.manager)){
            resp.status(400).send({
                success: false
            })
            return
        }
        
        resp.status(200).send({
            success: true
        })

    })
    
    app.listen(PORT, HOSTNAME, () => {
        console.log(`Server is now listening on ${HOSTNAME}:${PORT}`)    
    })
    
}
main()

