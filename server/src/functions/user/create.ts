import { randomUUID } from "crypto";
import { userPrisma } from "../../../prisma/clients.js";

export default async function create(body: {
    name: string,
    descriptor: string,
    photo_path: string,
}) {
    return await userPrisma.create({
        data: {
            id: randomUUID(),
            // username: body.name,
            // descrip: body.descriptor,
            // profile: body.photo_path
        }
    });
}
