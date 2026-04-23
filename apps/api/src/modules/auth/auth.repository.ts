import type { PrismaClient } from "../../generated/prisma/client.js";

export class AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email
      }
    });
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: {
        id
      }
    });
  }

  async listProfilesForLogin(userId: string, role: string) {
    if (role === "admin") {
      return this.prisma.profile.findMany({
        orderBy: {
          displayName: "asc"
        }
      });
    }

    return this.prisma.profile.findMany({
      orderBy: {
        displayName: "asc"
      },
      where: {
        userId
      }
    });
  }
}
