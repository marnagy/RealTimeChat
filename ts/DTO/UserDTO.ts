import { UserModel } from "../Models/UserModel"

export class UserDTO{
    Id: string | undefined
    Username: string
    Email: string
    private constructor(user?: UserModel, id?: string, email?: string, username?: string){
        if (user){
            this.Id = user.Id
            this.Email = user.Email
            this.Username = user.Username
        }
        else{
            if (!id || !email || !username)
                throw new Error('Invalid constructor')

            this.Id = id
            this.Email = email
            this.Username = username
        }
    }
    public static From(user: UserModel): UserDTO {
        return new UserDTO(user)
    }
    public static Parse(json: string): UserDTO{
        const parsed = JSON.parse(json)
        return new UserDTO(undefined, parsed.Id, parsed.Email, parsed.Username)
    }
}