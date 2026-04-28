export default class User {
    userId: number;
    email: string;
    password: string;

    constructor(userId: number, email: string, password: string) {
        this.userId = userId;
        this.email = email;
        this.password = password;
    }
}