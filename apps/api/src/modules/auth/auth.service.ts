import type { Role } from "@homeflix/domain";
import type {
  AuthLoginPayload,
  AuthMePayload,
  AuthProfileSummary,
  AuthUserSummary
} from "@homeflix/contracts";
import bcrypt from "bcryptjs";
import { ApiError } from "../../errors/api-error.js";
import type { ApiRuntimeConfig } from "../../env.js";
import { signHomeflixAccessToken } from "./auth.jwt.js";
import { AuthRepository } from "./auth.repository.js";

function toUserSummary(user: {
  id: string;
  email: string;
  role: string;
}): AuthUserSummary {
  if (user.role !== "admin" && user.role !== "viewer") {
    throw new ApiError(500, "internal_error", "User role is invalid in database.");
  }

  return {
    email: user.email,
    id: user.id,
    role: user.role
  };
}

function toProfileSummary(profile: {
  id: string;
  displayName: string;
}): AuthProfileSummary {
  return {
    displayName: profile.displayName,
    id: profile.id
  };
}

export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly config: ApiRuntimeConfig
  ) {}

  async login(email: string, password: string): Promise<AuthLoginPayload> {
    const normalized = email.trim().toLowerCase();
    const user = await this.repository.findUserByEmail(normalized);

    if (user === null) {
      throw new ApiError(401, "unauthorized", "Invalid email or password.");
    }

    const matches = await bcrypt.compare(password, user.passwordHash);

    if (!matches) {
      throw new ApiError(401, "unauthorized", "Invalid email or password.");
    }

    const role = user.role as Role;
    const profiles = await this.repository.listProfilesForLogin(user.id, user.role);
    const token = await signHomeflixAccessToken(this.config.jwtSecret, {
      role,
      sub: user.id
    });

    return {
      profiles: profiles.map(toProfileSummary),
      token,
      user: toUserSummary(user)
    };
  }

  async me(userId: string): Promise<AuthMePayload> {
    const fullUser = await this.repository.findUserById(userId);

    if (fullUser === null) {
      throw new ApiError(401, "unauthorized", "User no longer exists.");
    }

    const profiles = await this.repository.listProfilesForLogin(
      fullUser.id,
      fullUser.role
    );

    return {
      profiles: profiles.map(toProfileSummary),
      user: toUserSummary(fullUser)
    };
  }
}
