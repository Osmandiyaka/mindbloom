export class DuplicateEditionNameException extends Error {
    constructor(name: string) {
        super(`Edition name must be unique. '${name}' is already in use.`);
        this.name = 'DuplicateEditionNameException';
    }
}
