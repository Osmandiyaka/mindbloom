export class Student {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly email: string,
        public readonly phone?: string,
        public readonly dob?: Date,
        public readonly classId?: string,
        public readonly rollNo?: string,
        public readonly status: string = 'Active',
        public readonly createdAt: Date = new Date(),
        public readonly updatedAt: Date = new Date(),
    ) { }

    isActive(): boolean {
        return this.status === 'Active';
    }

    static create(data: {
        id?: string;
        name: string;
        email: string;
        phone?: string;
        dob?: Date;
        classId?: string;
        rollNo?: string;
        status?: string;
    }): Student {
        return new Student(
            data.id || crypto.randomUUID(),
            data.name,
            data.email,
            data.phone,
            data.dob,
            data.classId,
            data.rollNo,
            data.status || 'Active',
        );
    }

    update(data: Partial<Omit<Student, 'id' | 'createdAt'>>): Student {
        return new Student(
            this.id,
            data.name ?? this.name,
            data.email ?? this.email,
            data.phone ?? this.phone,
            data.dob ?? this.dob,
            data.classId ?? this.classId,
            data.rollNo ?? this.rollNo,
            data.status ?? this.status,
            this.createdAt,
            new Date(),
        );
    }
}
