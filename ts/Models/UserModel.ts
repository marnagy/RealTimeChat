import { Entity, PrimaryGeneratedColumn, Column, EntityManager, Repository } from "typeorm"
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

@Entity()
export class UserModel {
    @PrimaryGeneratedColumn('uuid')
    Id: string | undefined

    @Column({
        unique: true,
        length: 255
    })
    Email: string

    @Column({
        length: 50,
        unique: true
    })
    Username: string

    @Column({
        length: 60
    })
    PasswordHash: string

    private constructor(email: string, username: string, passwordHash: string, id?: string){
        this.Email = email
        this.Username = username
        this.PasswordHash = passwordHash

        if (id !== null)
            this.Id = id
    }

    public async CheckPassword(password: string): Promise<boolean> {
        return await bcrypt.compare(password, this.PasswordHash)
    }

    public static async CreateUser(email: string, username: string, password: string, dbManager: Repository<UserModel>): Promise<UserModel | null> {
        // values validated in UserRouter
        
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

        let user = new UserModel(
            email,
            username,
            passwordHash
        )
        console.log('Created user')
        console.log(user)
        
        try{
            user = await dbManager.save(user)
            console.log('User saved')
            return user
        }
        catch {
            return null
        }
    }
}