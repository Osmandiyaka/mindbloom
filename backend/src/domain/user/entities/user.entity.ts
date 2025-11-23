export class User {
    constructor(
        public readonly id: string,
        public readonly email: string,
        public readonly name: string,
        public readonly role: string = 'user',
        public readonly createdAt: Date = new Date(),
        public readonly updatedAt: Date = new Date(),
    ) { }

    isAdmin(): boolean {
        return this.role === 'admin';
    }

    static create(data: {
        id?: string;
        email: string;
        name: string;
        role?: string;
    }): User {
        return new User(
            data.id || crypto.randomUUID(),
            data.email,
            data.name,
            data.role || 'user',
        );
    }
}
